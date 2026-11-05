"""
BASINSHIFT Unified Python Inference Pipeline
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Provides a production-grade, leak-free inference pipeline for streamflow forecasting
and flood alert classification across multiple horizons (h in {1, 3, 7} days).

Key Architectural Guarantees:
1. Strict Causality: Filters all records > forecast_origin before any feature engineering.
2. Dual Operating Modes:
   - Gauged mode: Antecedent weather + static + historical discharge lags + Variant A conceptual reservoirs.
   - Ungauged mode (PUB): Antecedent weather + static + Variant A conceptual reservoirs (strictly ZERO discharge features).
3. Production Ensembling:
   - Uses frozen weights from reports/ensemble_weights.csv:
     * h=1 Gauged: XGBoost (1.0)
     * h=1 Ungauged: XGBoost (0.9249) + Ridge (0.0751)
     * h=3 Gauged/Ungauged: XGBoost (1.0)
     * h=7 Gauged/Ungauged: XGBoost (1.0)
   - The h=1 Ungauged Ridge model is extracted directly from the verified hybrid artifact's base_pipeline.
4. Dedicated Probabilistic Classifiers:
   - HighFlowClassifier heads for each horizon and mode.
   - Outputs raw model predicted probabilities P(Y=1) from LightGBM logistic sigmoid outputs.
   - Binary alerts mapped via training-derived optimal decision thresholds (tau*).
5. Strict Validation:
   - Rejects duplicate catchment/date observations.
   - Enforces >= 365 days of antecedent history for 365-day rolling statistics.
   - Preserves authentic zero-streamflow and missing-flow values (NaN).
   - Post-processes discharge predictions with non-negative lower bound (max(0.0, y_hat)).
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import numpy as np
import pandas as pd
import joblib

from src.basinshift.features import compute_features, get_feature_columns
from src.basinshift.hydrology import compute_conceptual_reservoirs, HYDRO_FEATURE_COLS


class InferencePipeline:
    """
    Production inference engine for BASINSHIFT streamflow forecasting and flood warning.
    Loads and reuses the 13 required production model artifacts across horizons and modes.
    """

    # Training-derived optimal decision thresholds (tau*)
    OPTIMAL_DECISION_THRESHOLDS = {
        'Gauged': {
            1: 0.70,
            3: 0.70,
            7: 0.60
        },
        'Ungauged': {
            1: 0.70,
            3: 0.66,
            7: 0.66
        }
    }

    def __init__(
        self,
        models_dir: str = "models",
        thresholds_path: str = "reports/high_flow_thresholds.csv",
        weights_path: str = "reports/ensemble_weights.csv"
    ):
        """
        Initializes the inference pipeline, loading the required 13 model artifacts
        and operational threshold / ensemble weight configurations once for reuse.
        """
        self.models_dir = Path(models_dir)
        self.thresholds_path = Path(thresholds_path)
        self.weights_path = Path(weights_path)

        if not self.models_dir.exists():
            raise FileNotFoundError(f"Models directory not found: {self.models_dir}")

        # 1. Load regional high-flow Q95 thresholds
        self.regional_q95_map: Dict[str, float] = self._load_thresholds()

        # 2. Load frozen ensemble weights
        self.ensemble_weights: Dict[str, Dict[int, Dict[str, float]]] = self._load_ensemble_weights()

        # 3. Feature schemas
        self.base_ungauged_cols, self.base_gauged_cols = get_feature_columns()
        self.ungauged_features_stage_c = self.base_ungauged_cols + HYDRO_FEATURE_COLS
        self.gauged_features_stage_c = self.base_gauged_cols + HYDRO_FEATURE_COLS

        # 4. Model Registry: Load ONLY the 13 required artifacts
        #    - 6 XGBoost regressors
        #    - 6 High-flow classifiers
        #    - 1 Ridge component (extracted from hybrid_ungauged_h1.joblib base_pipeline)
        self.loaded_artifacts: List[str] = []
        self.models: Dict[str, Any] = {}
        self._load_production_models()

    def _load_thresholds(self) -> Dict[str, float]:
        """Loads regional Q95 streamflow thresholds from CSV."""
        if not self.thresholds_path.exists():
            raise FileNotFoundError(f"High-flow thresholds file not found: {self.thresholds_path}")
        
        df_thresh = pd.read_csv(self.thresholds_path)
        q95_map = {}
        for _, row in df_thresh.iterrows():
            q95_map[str(row['source_collection']).strip()] = float(row['threshold_q95_mm_per_day'])
        return q95_map

    def _load_ensemble_weights(self) -> Dict[str, Dict[int, Dict[str, float]]]:
        """Loads frozen ensemble weights for all horizons and modes."""
        if not self.weights_path.exists():
            raise FileNotFoundError(f"Ensemble weights file not found: {self.weights_path}")
        
        df_weights = pd.read_csv(self.weights_path)
        weights_dict: Dict[str, Dict[int, Dict[str, float]]] = {
            'Gauged': {},
            'Ungauged': {}
        }
        for _, row in df_weights.iterrows():
            mode = str(row['feature_mode']).strip().capitalize()
            h = int(row['horizon_days'])
            weights_dict[mode][h] = {
                'XGBoost': float(row['weight_XGBoost']),
                'Ridge': float(row['weight_Ridge']),
                'LightGBM': float(row['weight_LightGBM']),
                'Conceptual_Hybrid': float(row['weight_Conceptual_Hybrid'])
            }
        return weights_dict

    def _load_production_models(self) -> None:
        """
        Loads the exact 13 serialized artifacts required for frozen production inference:
        - 6 XGBoost regressors
        - 6 HighFlowClassifier heads
        - 1 Ridge pipeline (from hybrid_ungauged_h1.joblib)
        """
        # A. Load XGBoost regressors (6 artifacts)
        for mode in ['gauged', 'ungauged']:
            for h in [1, 3, 7]:
                fname = f"xgboost_{mode}_h{h}.joblib"
                path = self.models_dir / fname
                if not path.exists():
                    raise FileNotFoundError(f"Required XGBoost model artifact missing: {path}")
                model = joblib.load(path)
                
                # Schema validation
                expected_cols = self.base_gauged_cols if mode == 'gauged' else self.base_ungauged_cols
                if hasattr(model, 'feature_names_in_'):
                    actual_cols = list(model.feature_names_in_)
                    if actual_cols != expected_cols:
                        raise ValueError(f"Feature column mismatch in {fname}. Expected {len(expected_cols)}, got {len(actual_cols)}")
                
                key = f"xgb_{mode}_h{h}"
                self.models[key] = model
                self.loaded_artifacts.append(fname)

        # B. Load HighFlowClassifiers (6 artifacts)
        for mode in ['gauged', 'ungauged']:
            for h in [1, 3, 7]:
                fname = f"classifier_{mode}_h{h}.joblib"
                path = self.models_dir / fname
                if not path.exists():
                    raise FileNotFoundError(f"Required HighFlowClassifier artifact missing: {path}")
                clf = joblib.load(path)
                
                # Schema validation
                expected_cols = self.gauged_features_stage_c if mode == 'gauged' else self.ungauged_features_stage_c
                if list(clf.feature_cols) != expected_cols:
                    raise ValueError(f"Feature column mismatch in {fname}. Expected {len(expected_cols)}, got {len(clf.feature_cols)}")
                
                key = f"clf_{mode}_h{h}"
                self.models[key] = clf
                self.loaded_artifacts.append(fname)

        # C. Load h=1 Ungauged Ridge component from hybrid_ungauged_h1.joblib (1 artifact)
        hybrid_fname = "hybrid_ungauged_h1.joblib"
        hybrid_path = self.models_dir / hybrid_fname
        if not hybrid_path.exists():
            raise FileNotFoundError(f"Required hybrid artifact for Ridge component missing: {hybrid_path}")
        hybrid_model = joblib.load(hybrid_path)
        
        # Verify embedded base_pipeline
        if not hasattr(hybrid_model, 'base_pipeline') or hybrid_model.base_pipeline is None:
            raise ValueError(f"Hybrid artifact {hybrid_fname} does not contain an embedded base_pipeline")
        
        # Verify schema
        if list(hybrid_model.feature_cols) != self.ungauged_features_stage_c:
            raise ValueError(f"Feature column mismatch in hybrid Ridge pipeline. Expected {len(self.ungauged_features_stage_c)}, got {len(hybrid_model.feature_cols)}")
        
        self.models["ridge_ungauged_h1"] = hybrid_model.base_pipeline
        self.loaded_artifacts.append(hybrid_fname)

    def predict(
        self,
        history_df: pd.DataFrame,
        catchment_id: str,
        forecast_origin: Union[str, pd.Timestamp],
        feature_mode: str = "gauged",
        allow_unsupported_region: bool = False
    ) -> Dict[str, Any]:
        """
        Executes leak-free inference for a single catchment at a specified forecast origin date.

        Parameters:
        - history_df: pd.DataFrame containing daily historical observations for the catchment.
        - catchment_id: string identifier of the catchment (e.g. 'camels_01047000', 'camelsaus_105105A').
        - forecast_origin: timestamp string (YYYY-MM-DD) or pd.Timestamp representing prediction issue date t.
        - feature_mode: 'gauged' or 'ungauged' (case-insensitive).
        - allow_unsupported_region: if True, returns regression-only forecasts with null classification
                                    when source_collection has no regional Q95 threshold.

        Returns:
        - Structured JSON-serializable dictionary with forecasts, alert probabilities, thresholds, and metadata.
        """
        # 1. Validate inputs
        if not isinstance(history_df, pd.DataFrame):
            raise TypeError("history_df must be a pandas DataFrame")

        if not isinstance(catchment_id, str) or not catchment_id.strip():
            raise ValueError("catchment_id must be a non-empty string")
        cid_clean = catchment_id.strip()

        mode_clean = feature_mode.strip().capitalize()
        if mode_clean not in ['Gauged', 'Ungauged']:
            raise ValueError(f"Invalid feature_mode '{feature_mode}'. Must be 'gauged' or 'ungauged'.")

        try:
            origin_ts = pd.to_datetime(forecast_origin)
        except Exception as e:
            raise ValueError(f"Invalid forecast_origin '{forecast_origin}': could not parse date. Error: {e}")

        # 2. Filter catchment history
        if 'catchment_id' not in history_df.columns:
            raise ValueError("Column 'catchment_id' missing from history_df")
        if 'date' not in history_df.columns:
            raise ValueError("Column 'date' missing from history_df")

        cat_df = history_df[history_df['catchment_id'] == cid_clean].copy()
        if cat_df.empty:
            raise ValueError(f"Catchment '{cid_clean}' not found in provided history_df")

        # 3. Check duplicate dates
        cat_df['date'] = pd.to_datetime(cat_df['date'])
        if cat_df.duplicated(subset=['date']).any():
            raise ValueError(f"Duplicate date records detected for catchment '{cid_clean}' in history_df")

        # 4. Enforce strict causality: filter records strictly on or before forecast_origin
        cat_df = cat_df[cat_df['date'] <= origin_ts].copy()
        if cat_df.empty:
            raise ValueError(f"No antecedent records found for catchment '{cid_clean}' on or before {origin_ts.strftime('%Y-%m-%d')}")

        if not (cat_df['date'] == origin_ts).any():
            raise ValueError(f"Forecast origin date '{origin_ts.strftime('%Y-%m-%d')}' is not present in history_df for catchment '{cid_clean}'")

        # 5. Check antecedent history length (at least 365 calendar days for 365-day rolling statistics)
        cat_df = cat_df.sort_values('date').reset_index(drop=True)
        min_date = cat_df['date'].min()
        day_span = (origin_ts - min_date).days
        if day_span < 365 or len(cat_df) < 365:
            raise ValueError(
                f"Insufficient antecedent history for catchment '{cid_clean}': requires at least 365 days "
                f"prior to forecast origin {origin_ts.strftime('%Y-%m-%d')}, but found {day_span} days ({len(cat_df)} records)."
            )

        warnings: List[str] = []

        # 6. Check source collection and regional threshold
        if 'source_collection' not in cat_df.columns:
            raise ValueError("Column 'source_collection' missing from history_df")
        
        source_col = str(cat_df['source_collection'].iloc[-1]).strip()
        regional_q95 = self.regional_q95_map.get(source_col)
        if regional_q95 is None:
            if not allow_unsupported_region:
                raise ValueError(
                    f"Unsupported source collection '{source_col}' for catchment '{cid_clean}'. "
                    f"Supported collections: {list(self.regional_q95_map.keys())}"
                )
            warnings.append(
                f"High-flow classification is unavailable for regional collection '{source_col}': "
                f"no frozen regional Q95 threshold is defined. Supported collections: {list(self.regional_q95_map.keys())}."
            )

        # 7. Check streamflow column requirements
        if mode_clean == 'Gauged':
            if 'streamflow' not in cat_df.columns:
                raise ValueError("Column 'streamflow' is required in history_df for Gauged feature_mode")
            origin_streamflow = cat_df.loc[cat_df['date'] == origin_ts, 'streamflow'].values[0]
            if pd.isna(origin_streamflow):
                warnings.append("Streamflow observation at forecast origin is missing (NaN); gauged models rely on antecedent lag features.")
        else:
            # Ungauged mode (PUB): If streamflow is absent, fill with NaN to allow feature engineering
            if 'streamflow' not in cat_df.columns:
                cat_df['streamflow'] = np.nan

        # 8. Feature engineering: Base features + Conceptual Reservoirs (Variant A)
        feat_df = compute_features(cat_df)
        feat_df = compute_conceptual_reservoirs(feat_df)

        # Extract origin feature row (strictly at t = origin_ts)
        origin_row = feat_df[feat_df['date'] == origin_ts].iloc[[-1]]

        # 9. Compute multi-horizon forecasts and alert probabilities
        horizons = [1, 3, 7]
        mode_lower = mode_clean.lower()
        
        predicted_discharge: Dict[str, float] = {}
        high_flow_probability: Dict[str, float] = {}
        high_flow_alert_threshold: Dict[str, float] = {}
        high_flow_alert: Dict[str, bool] = {}

        # Track metadata
        reg_metadata: Dict[str, Any] = {}
        clf_metadata: Dict[str, Any] = {}

        for h in horizons:
            h_key = f"{h}d"

            # --- Regression Forecast ---
            xgb_key = f"xgb_{mode_lower}_h{h}"
            xgb_model = self.models[xgb_key]
            xgb_cols = self.base_gauged_cols if mode_clean == 'Gauged' else self.base_ungauged_cols
            xgb_pred = float(xgb_model.predict(origin_row[xgb_cols])[0])

            weights = self.ensemble_weights[mode_clean][h]

            if mode_clean == 'Ungauged' and h == 1 and weights['Ridge'] > 0:
                # Blend with Ridge
                ridge_model = self.models["ridge_ungauged_h1"]
                ridge_cols = self.ungauged_features_stage_c
                ridge_pred = float(ridge_model.predict(origin_row[ridge_cols])[0])

                blended_raw = weights['XGBoost'] * xgb_pred + weights['Ridge'] * ridge_pred
                final_q = float(np.maximum(0.0, blended_raw))
                reg_meta = {
                    "model_family": "Ensemble (XGBoost + Ridge)",
                    "artifacts": ["xgboost_ungauged_h1.joblib", "hybrid_ungauged_h1.joblib"],
                    "weights": {"XGBoost": weights['XGBoost'], "Ridge": weights['Ridge']},
                    "raw_predictions": {"XGBoost": round(xgb_pred, 4), "Ridge": round(ridge_pred, 4)},
                    "post_processing": "max(0.0, blended_prediction)"
                }
            else:
                # Single XGBoost model (weight = 1.0)
                final_q = float(np.maximum(0.0, xgb_pred))
                reg_meta = {
                    "model_family": "XGBoost",
                    "artifacts": [f"xgboost_{mode_lower}_h{h}.joblib"],
                    "weights": {"XGBoost": 1.0},
                    "raw_predictions": {"XGBoost": round(xgb_pred, 4)},
                    "post_processing": "max(0.0, raw_prediction)"
                }

            predicted_discharge[h_key] = round(final_q, 4)
            reg_metadata[h_key] = reg_meta

            # --- High-Flow Classifier ---
            if regional_q95 is not None:
                clf_key = f"clf_{mode_lower}_h{h}"
                clf_model = self.models[clf_key]
                prob = float(clf_model.predict_proba(origin_row)[0])
                prob_clipped = float(np.clip(prob, 0.0, 1.0))

                tau_star = float(self.OPTIMAL_DECISION_THRESHOLDS[mode_clean][h])
                is_alert = bool(prob_clipped >= tau_star)

                high_flow_probability[h_key] = round(prob_clipped, 4)
                high_flow_alert_threshold[h_key] = round(tau_star, 2)
                high_flow_alert[h_key] = is_alert

                clf_metadata[h_key] = {
                    "model_family": "LightGBM Classifier",
                    "artifact": f"classifier_{mode_lower}_h{h}.joblib",
                    "scale_pos_weight": float(clf_model.scale_pos_weight),
                    "decision_threshold_tau_star": tau_star,
                    "target_definition": f"streamflow(t+{h}d) > {regional_q95:.4f} mm/day"
                }

        # If regional threshold is unavailable, represent classification availability as None
        if regional_q95 is None:
            high_flow_probability = None
            high_flow_alert_threshold = None
            high_flow_alert = None
            clf_metadata = None

        # 10. Assemble structured output payload
        response: Dict[str, Any] = {
            "catchment_id": cid_clean,
            "forecast_origin": origin_ts.strftime("%Y-%m-%d"),
            "feature_mode": mode_clean,
            "forecast_horizons_days": horizons,
            "discharge_unit": "mm/day",
            "predicted_discharge": predicted_discharge,
            "high_flow_probability": high_flow_probability,
            "high_flow_alert_threshold": high_flow_alert_threshold,
            "high_flow_alert": high_flow_alert,
            "extreme_flow_probability": None,
            "prediction_intervals": None,
            "uncertainty_available": False,
            "model_metadata": {
                "regional_q95_threshold_mm_per_day": round(regional_q95, 4) if regional_q95 is not None else None,
                "source_collection": source_col,
                "hydrological_features": "Variant A (empirical conceptual interaction features; not physically mass-balanced)",
                "probability_calibration": "Raw model predicted probabilities from LightGBM logistic sigmoid outputs (no post-hoc calibration layer applied)",
                "regression_models": reg_metadata,
                "classifier_models": clf_metadata
            },
            "forecast_basis": "historical_reanalysis_replay",
            "warnings": warnings
        }

        return response


def load_demo_history(
    catchment_id: str,
    forecast_origin: Union[str, pd.Timestamp],
    history_days: Optional[int] = 730,
    data_path: str = "data/processed/pilot_150_catchments.parquet"
) -> pd.DataFrame:
    """
    Helper function to load antecedent historical daily records for a single catchment
    from the local pilot 150-catchment dataset.

    Parameters:
    - catchment_id: string ID of the catchment (e.g. 'camels_01047000' or 'camelsaus_105105A').
    - forecast_origin: timestamp string or pd.Timestamp (records strictly after this date are filtered out).
    - history_days: number of antecedent calendar days to load prior to origin (default 730).
                    If None, loads all available antecedent records up to origin.
    - data_path: path to the processed pilot parquet dataset.

    Returns:
    - pd.DataFrame sorted by date containing antecedent records for the requested catchment.

    Raises:
    - FileNotFoundError if data_path does not exist.
    - ValueError if catchment_id is not found in the dataset or if no antecedent records exist.
    """
    path = Path(data_path)
    if not path.exists():
        raise FileNotFoundError(f"Pilot dataset not found: {path}")

    cid_clean = str(catchment_id).strip()
    try:
        origin_ts = pd.to_datetime(forecast_origin)
    except Exception as e:
        raise ValueError(f"Invalid forecast_origin '{forecast_origin}': {e}")

    # Use pyarrow filter pushdown to load only records for the requested catchment
    df = pd.read_parquet(path, filters=[('catchment_id', '==', cid_clean)])
    if df.empty:
        raise ValueError(f"Catchment ID '{cid_clean}' not found in demo dataset '{data_path}'")

    df['date'] = pd.to_datetime(df['date'])
    # Filter strictly on or before forecast origin
    df = df[df['date'] <= origin_ts]
    if df.empty:
        raise ValueError(f"No antecedent observations found for catchment '{cid_clean}' on or before {origin_ts.strftime('%Y-%m-%d')}")

    if history_days is not None:
        min_date = origin_ts - pd.Timedelta(days=history_days)
        df = df[df['date'] >= min_date]

    return df.sort_values('date').reset_index(drop=True)

