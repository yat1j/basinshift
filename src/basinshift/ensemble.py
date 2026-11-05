"""
BASINSHIFT Constrained Non-Negative Regression Ensemble
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Implements mathematically constrained convex blending:
    min_w || y_true - sum_k (w_k * y_pred_k) ||_2^2
    subject to: w_k >= 0, sum_k w_k = 1.0

Strict Protocol:
- Weights optimized strictly on Chronological Out-Of-Fold (OOF) Development Training predictions.
- Zero tuning on Test A (Temporal Validation) or Test B (Geographic Holdout).
- Separate optimization for Gauged and Ungauged PUB modes across horizons h in {1, 3, 7}.
- Non-negative physical clipping at 0.0 mm/day.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from scipy.optimize import minimize

class ConstrainedEnsemble:
    def __init__(self, model_names: List[str]):
        self.model_names = model_names
        self.weights: Optional[np.ndarray] = None
        self.oof_rmse_individual: Dict[str, float] = {}
        self.oof_rmse_blended: Optional[float] = None

    def fit_weights(self, y_true_oof: np.ndarray, preds_oof_matrix: np.ndarray) -> np.ndarray:
        """
        Solves constrained QP via SLSQP on out-of-fold training predictions.
        preds_oof_matrix: shape (N, K)
        y_true_oof: shape (N,)
        """
        valid_mask = (~np.isnan(y_true_oof)) & (~np.any(np.isnan(preds_oof_matrix), axis=1))
        y = y_true_oof[valid_mask]
        P = preds_oof_matrix[valid_mask]
        
        K = len(self.model_names)
        assert P.shape[1] == K, f"Expected {K} columns in prediction matrix, got {P.shape[1]}"
        
        # Calculate individual OOF RMSEs
        for idx, m_name in enumerate(self.model_names):
            rmse_k = float(np.sqrt(np.mean((y - P[:, idx]) ** 2)))
            self.oof_rmse_individual[m_name] = round(rmse_k, 4)
            
        def objective(w):
            pred_blend = np.dot(P, w)
            return np.mean((y - pred_blend) ** 2)

        # Initial guess: equal weighting
        w0 = np.ones(K) / K
        # Bounds: 0 <= w_k <= 1
        bounds = [(0.0, 1.0) for _ in range(K)]
        # Constraint: sum(w_k) = 1.0
        constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})

        res = minimize(
            objective,
            w0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'ftol': 1e-9, 'maxiter': 500}
        )

        raw_weights = res.x
        # Clean precision rounding and re-normalize
        clean_weights = np.maximum(0.0, raw_weights)
        clean_weights /= np.sum(clean_weights)
        
        self.weights = clean_weights
        blend_pred = np.dot(P, self.weights)
        self.oof_rmse_blended = round(float(np.sqrt(np.mean((y - blend_pred) ** 2))), 4)
        
        return self.weights

    def predict(self, preds_matrix: np.ndarray) -> np.ndarray:
        """Computes blended prediction and clips to non-negative physical bound."""
        assert self.weights is not None, "Ensemble weights must be fit before predict()"
        blend = np.dot(preds_matrix, self.weights)
        return np.maximum(0.0, blend)

