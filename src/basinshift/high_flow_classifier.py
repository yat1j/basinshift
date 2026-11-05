"""
BASINSHIFT Probabilistic High-Flow Classifier
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Dedicated binary classification head predicting rare extreme events:
    Y_{t, h} = (streamflow_{t+h} > regional_Q95)

Features:
- Gauged: Conceptual reservoirs + antecedent weather + static + historical discharge lags
- Ungauged PUB: Conceptual reservoirs + antecedent weather + static ONLY (zero discharge features)

Evaluation:
- PR-AUC (Average Precision, primary metric for rare flood events)
- ROC-AUC (secondary ranking metric)
- Brier Score (mean squared probability error)
- Precision, Recall, F1
- Confusion Matrix & Event Prevalence
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import joblib

import lightgbm as lgb
from sklearn.metrics import (
    precision_recall_curve,
    average_precision_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)

class HighFlowClassifier:
    def __init__(
        self,
        horizon: int,
        feature_mode: str = 'Gauged',
        scale_pos_weight: float = 5.0,  # mild reweighting to boost PR recall without blowing up false alarms
        lgb_params: Optional[Dict] = None
    ):
        self.horizon = horizon
        self.feature_mode = feature_mode
        self.scale_pos_weight = scale_pos_weight
        
        default_params = {
            'objective': 'binary',
            'metric': 'average_precision',
            'boosting_type': 'gbdt',
            'n_estimators': 120,
            'learning_rate': 0.05,
            'num_leaves': 31,
            'max_depth': 6,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'scale_pos_weight': self.scale_pos_weight,
            'random_state': 42,
            'verbose': -1,
            'n_jobs': -1
        }
        self.lgb_params = lgb_params if lgb_params is not None else default_params
        self.model: Optional[lgb.LGBMClassifier] = None
        self.feature_cols: List[str] = []
        self.decision_threshold: float = 0.50

    def fit(self, X_train: pd.DataFrame, y_train_binary: np.ndarray, feature_cols: List[str]):
        """Fits binary LightGBM high-flow classifier on training data."""
        self.feature_cols = feature_cols
        self.model = lgb.LGBMClassifier(**self.lgb_params)
        self.model.fit(X_train[self.feature_cols], y_train_binary)

    def predict_proba(self, X_eval: pd.DataFrame) -> np.ndarray:
        """Returns predicted probability P(Y=1)."""
        assert self.model is not None, "Model must be fit before predict_proba()"
        return self.model.predict_proba(X_eval[self.feature_cols])[:, 1]

    def evaluate(
        self,
        y_true_binary: np.ndarray,
        y_prob: np.ndarray,
        threshold: float = 0.50
    ) -> Dict[str, float]:
        """Calculates comprehensive classification and rare-event metrics."""
        valid_mask = (~np.isnan(y_true_binary)) & (~np.isnan(y_prob))
        yt = y_true_binary[valid_mask].astype(int)
        yp = y_prob[valid_mask]
        
        n_valid = int(len(yt))
        n_pos = int(np.sum(yt))
        prevalence = float(n_pos / n_valid) if n_valid > 0 else 0.0
        
        if n_valid == 0 or n_pos == 0:
            return {
                'n_valid_samples': n_valid,
                'n_positive_events': n_pos,
                'prevalence': round(prevalence, 4),
                'pr_auc': np.nan,
                'roc_auc': np.nan,
                'brier_score': np.nan,
                'precision': np.nan,
                'recall': np.nan,
                'f1': np.nan,
                'tn': 0, 'fp': 0, 'fn': 0, 'tp': 0
            }
            
        pr_auc = float(average_precision_score(yt, yp))
        roc_auc = float(roc_auc_score(yt, yp)) if len(np.unique(yt)) > 1 else np.nan
        brier = float(brier_score_loss(yt, yp))
        
        y_pred_binary = (yp >= threshold).astype(int)
        
        prec = float(precision_score(yt, y_pred_binary, zero_division=0))
        rec = float(recall_score(yt, y_pred_binary, zero_division=0))
        f1 = float(f1_score(yt, y_pred_binary, zero_division=0))
        
        cm = confusion_matrix(yt, y_pred_binary, labels=[0, 1])
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
        
        return {
            'n_valid_samples': n_valid,
            'n_positive_events': n_pos,
            'prevalence': round(prevalence, 4),
            'pr_auc': round(pr_auc, 4),
            'roc_auc': round(roc_auc, 4),
            'brier_score': round(brier, 4),
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1': round(f1, 4),
            'tn': tn, 'fp': fp, 'fn': fn, 'tp': tp
        }

