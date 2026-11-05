"""
Prediction Service Layer for BASINSHIFT FastAPI Backend.
Integrates validation, feature extraction, hybrid inference, and response assembly.
"""

from typing import Dict, Any, List
from basinshift.schemas import (
    PredictRequest,
    PredictResponse,
    DataQualityInfo,
    ModelMetadataInfo,
    HydrographPoint,
)
from basinshift.features import extract_hydrological_features
from basinshift.hybrid import HybridPredictor
from basinshift.validation import (
    validate_chronological_sequence,
    validate_no_future_leakage,
    validate_spinup_history,
)

# Reference benchmark Q95 thresholds (mm/day) for CAMELS basins
CATCHMENT_METADATA = {
    "01434000": {"name": "Neversink River near Claryville NY", "q95": 14.82},
    "01435000": {"name": "Neversink River at Neversink NY", "q95": 12.45},
    "01439500": {"name": "Bush Kill at Shohola PA", "q95": 15.60},
    "01440000": {"name": "Flat Brook near Flatbrookville NJ", "q95": 11.20},
    "01440200": {"name": "Paulins Kill at Blairstown NJ", "q95": 10.85},
    "02143000": {"name": "Davidson River near Brevard NC", "q95": 18.40},
    "03451500": {"name": "French Broad River at Rosman NC", "q95": 16.90},
    "08167500": {"name": "Guadalupe River near Spring Branch TX", "q95": 8.75},
    "09110000": {"name": "Taylor River at Almont CO", "q95": 9.30},
    "11475500": {"name": "Navarro River near Navarro CA", "q95": 22.10},
    "12048000": {"name": "Dungeness River near Sequim WA", "q95": 13.50},
    "14301000": {"name": "Nehalem River near Foss OR", "q95": 24.30},
}

DEFAULT_Q95 = 12.0
LIMITATIONS_STATEMENT = (
    "BASINSHIFT forecasts river discharge (runoff in mm/day) and relative high-flow exceedance risk "
    "at regional catchment outlets. Predictions are research prototypes and DO NOT constitute official "
    "flood inundation boundaries, street-level water depths, or automated civil evacuation warnings. "
    "Always consult authorized national meteorological and hydrological agency advisories."
)


class ForecastService:
    def __init__(self):
        self.predictor = HybridPredictor()

    def generate_prediction(self, request: PredictRequest) -> PredictResponse:
        rows_dict = [r.model_dump() for r in request.csv_rows]

        # 1. Scientific validation checks
        dates = [r["date"] for r in rows_dict]
        is_seq_valid, seq_warnings = validate_chronological_sequence(dates)
        is_leak_valid, leak_warnings = validate_no_future_leakage(rows_dict, request.forecast_origin)
        is_spinup_valid, spinup_msg = validate_spinup_history(rows_dict, min_days=90)

        all_warnings = []
        if not is_seq_valid:
            all_warnings.extend(seq_warnings)
        if not is_leak_valid:
            all_warnings.extend(leak_warnings)
        if not is_spinup_valid:
            all_warnings.append(spinup_msg)

        # 2. Extract causal hydrological features
        feat_result = extract_hydrological_features(
            records=rows_dict,
            forecast_origin=request.forecast_origin,
            operating_mode=request.operating_mode,
            min_history_days=90,
        )
        features = feat_result["feature_vector"]
        all_warnings.extend(feat_result["warnings"])

        # 3. Lookup catchment Q95 threshold
        basin_meta = CATCHMENT_METADATA.get(
            request.catchment_id,
            {"name": f"Catchment {request.catchment_id}", "q95": DEFAULT_Q95}
        )
        q95_val = basin_meta["q95"]

        # 4. Run two-stage hybrid inference across +1d, +3d, +7d
        multi_pred = self.predictor.predict_multi_horizon(
            features=features,
            horizons=[1, 3, 7],
            operating_mode=request.operating_mode,
            q95_threshold=q95_val,
        )

        # 5. Build hydrograph history slice (last 60 days before origin)
        filtered_recs = feat_result["filtered_records"]
        history_slice = filtered_recs[-60:] if len(filtered_recs) > 60 else filtered_recs
        hydrograph = [
            HydrographPoint(
                date=r["date"],
                observed_discharge_mm_day=r.get("observed_discharge_mm_day"),
                precipitation_mm_day=float(r.get("precipitation_mm_day") or 0.0),
                is_forecast_origin=(r["date"] == request.forecast_origin),
            )
            for r in history_slice
        ]

        has_obs = any(r.get("observed_discharge_mm_day") is not None for r in rows_dict)

        data_quality = DataQualityInfo(
            historical_days_supplied=len(rows_dict),
            historical_discharge_available=has_obs,
            missing_values_count=0,
            warnings=all_warnings,
        )

        model_metadata = ModelMetadataInfo(
            regression_model_family="Two-Stage Conceptual Linear Reservoirs + Ridge + Residual Corrector (Variant A)",
            regression_artifact_ids={
                "ridge_baseflow_1d": "checkpoints/ridge_v1_h1.joblib",
                "residual_corrector_1d": "checkpoints/lgb_residual_v1_h1.bin",
                "ridge_baseflow_3d": "checkpoints/ridge_v1_h3.joblib",
                "residual_corrector_3d": "checkpoints/lgb_residual_v1_h3.bin",
                "ridge_baseflow_7d": "checkpoints/ridge_v1_h7.joblib",
                "residual_corrector_7d": "checkpoints/lgb_residual_v1_h7.bin",
            },
            classifier_artifact_ids={
                "classifier_q95_1d": "checkpoints/lgb_q95_v1_h1.bin",
                "classifier_q95_3d": "checkpoints/lgb_q95_v1_h3.bin",
                "classifier_q95_7d": "checkpoints/lgb_q95_v1_h7.bin",
            },
            data_version="CAMELS-US v1.2 (Addor et al. 2017) + ERA5-Land",
        )

        return PredictResponse(
            catchment_id=request.catchment_id,
            catchment_name=basin_meta["name"],
            forecast_origin=request.forecast_origin,
            operating_mode=request.operating_mode,
            forecast_horizons_days=[1, 3, 7],
            predicted_discharge_mm_day=multi_pred["predicted_discharge_mm_day"],
            high_flow_probability=multi_pred["high_flow_probability"],
            high_flow_threshold_mm_day=q95_val,
            classifier_decision_threshold=0.50,
            extreme_flow_probability=None,
            prediction_intervals=None,
            data_quality=data_quality,
            model_metadata=model_metadata,
            limitations_statement=LIMITATIONS_STATEMENT,
            is_historical_replay=False,
            hydrograph_history=hydrograph,
        )
