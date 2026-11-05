"""
BASINSHIFT Two-Stage Conceptual Hydrology Hybrid
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Architecture:
Stage 1: Base Linear/Ridge model trained on conceptual reservoir states and physical forcings.
Stage 2: LightGBM residual corrector trained on strictly chronological Out-Of-Fold (OOF) residuals.

Zero in-sample leakage:
- Ridge predictions for residual training are generated via expanding-window chronological OOF folds.
- Target horizon purging enforced at every internal fold boundary.
- At final inference, Ridge is refit on full training partition and LightGBM adds residual correction.
- Negative streamflow predictions clipped to 0.0 mm/day.
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
import joblib

from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
import lightgbm as lgb

from src.basinshift.hydrology import HYDRO_FEATURE_COLS

class ConceptualHydrologyHybrid:
    def __init__(
        self,
        horizon: int,
        feature_mode: str = 'Gauged',
        ridge_alpha: float = 100.0,
        lgb_params: Optional[Dict] = None
    ):
        self.horizon = horizon
        self.feature_mode = feature_mode
        self.ridge_alpha = ridge_alpha
        
        self.base_pipeline: Optional[Pipeline] = None
        self.residual_model: Optional[lgb.LGBMRegressor] = None
        
        default_lgb_params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'n_estimators': 120,
            'learning_rate': 0.05,
            'num_leaves': 31,
            'max_depth': 6,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'verbose': -1,
            'n_jobs': -1
        }
        self.lgb_params = lgb_params if lgb_params is not None else default_lgb_params
        self.feature_cols: List[str] = []

    def fit_expanding_oof(
        self,
        df_train: pd.DataFrame,
        feature_cols: List[str],
        target_col: str,
        n_splits: int = 4
    ) -> pd.DataFrame:
        """
        Fits Stage 1 Ridge and Stage 2 LightGBM using expanding-window chronological OOF.
        Enforces horizon boundary purging between folds.
        """
        self.feature_cols = feature_cols
        df = df_train.sort_values('date').reset_index(drop=True)
        
        # Valid target mask
        valid_mask = df[target_col].notna()
        df_valid = df[valid_mask].copy().reset_index(drop=True)
        
        dates = df_valid['date']
        min_date = dates.min()
        max_date = dates.max()
        
        # Generate 4 chronological split dates
        split_years = [2006, 2008, 2010, 2012]
        
        oof_indices = []
        oof_ridge_preds = []
        oof_residual_targets = []
        
        print(f"Generating chronological OOF Ridge predictions across {len(split_years)-1} expanding folds (h={self.horizon}d)...")
        
        for i in range(len(split_years) - 1):
            train_end_year = split_years[i]
            val_end_year = split_years[i+1]
            
            # Enforce horizon purging at fold boundary: origins must stop at train_end_date - h
            fold_train_end = pd.Timestamp(f'{train_end_year}-12-31') - pd.Timedelta(days=self.horizon)
            fold_val_start = pd.Timestamp(f'{train_end_year+1}-01-01')
            fold_val_end = pd.Timestamp(f'{val_end_year}-12-31') - pd.Timedelta(days=self.horizon)
            
            mask_tr = (df_valid['date'] <= fold_train_end)
            mask_val = (df_valid['date'] >= fold_val_start) & (df_valid['date'] <= fold_val_end)
            
            if mask_tr.sum() < 1000 or mask_val.sum() < 500:
                continue
                
            X_tr = df_valid.loc[mask_tr, feature_cols]
            y_tr = df_valid.loc[mask_tr, target_col].values
            
            X_v = df_valid.loc[mask_val, feature_cols]
            y_v = df_valid.loc[mask_val, target_col].values
            val_idx = df_valid.loc[mask_val].index.values
            
            # Fit fold Ridge base model
            pipe = Pipeline([
                ('imputer', SimpleImputer(strategy='median')),
                ('scaler', StandardScaler()),
                ('ridge', Ridge(alpha=self.ridge_alpha))
            ])
            pipe.fit(X_tr, y_tr)
            
            preds_v = pipe.predict(X_v)
            residuals_v = y_v - preds_v
            
            oof_indices.extend(val_idx)
            oof_ridge_preds.extend(preds_v)
            oof_residual_targets.extend(residuals_v)
            
        oof_df = df_valid.loc[oof_indices].copy()
        oof_df['ridge_oof_pred'] = oof_ridge_preds
        oof_df['residual_target'] = oof_residual_targets
        
        print(f"Generated {len(oof_df):,} chronological OOF residual training samples.")
        
        # Train Stage 2: LightGBM on OOF residuals
        print("Training Stage 2 LightGBM on OOF residuals...")
        self.residual_model = lgb.LGBMRegressor(**self.lgb_params)
        self.residual_model.fit(oof_df[feature_cols], oof_df['residual_target'])
        
        # Refit Stage 1 Ridge on the FULL training partition
        print("Refitting Stage 1 Ridge on full Development Training partition...")
        X_full = df_valid[feature_cols]
        y_full = df_valid[target_col].values
        self.base_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
            ('ridge', Ridge(alpha=self.ridge_alpha))
        ])
        self.base_pipeline.fit(X_full, y_full)
        
        return oof_df

    def predict(self, df_eval: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Generates predictions for evaluation:
        Returns: (final_clipped_pred, ridge_base_pred, lgb_residual_pred)
        """
        assert self.base_pipeline is not None, "Hybrid model must be fitted before predict()"
        assert self.residual_model is not None, "Hybrid model must be fitted before predict()"
        
        X_eval = df_eval[self.feature_cols]
        
        ridge_pred = self.base_pipeline.predict(X_eval)
        residual_pred = self.residual_model.predict(X_eval)
        
        combined_pred = ridge_pred + residual_pred
        # Non-negative streamflow physical bound
        final_pred = np.maximum(0.0, combined_pred)
        
        return final_pred, ridge_pred, residual_pred

