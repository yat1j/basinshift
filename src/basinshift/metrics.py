"""
BASINSHIFT Hydrological Metrics Module
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Implements standard hydrological evaluation metrics:
- NSE (Nash-Sutcliffe Efficiency)
- KGE (Kling-Gupta Efficiency 2009)
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)
- High-Flow Peak RMSE (Top 5% of flows, Q95)
- Valid sample counts reported for every metric slice
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

def compute_nse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Nash-Sutcliffe Efficiency."""
    denom = np.sum((y_true - np.mean(y_true)) ** 2)
    if denom < 1e-8:
        return np.nan
    return float(1.0 - np.sum((y_true - y_pred) ** 2) / denom)

def compute_kge(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Kling-Gupta Efficiency (Gupta et al., 2009)."""
    std_true = np.std(y_true)
    std_pred = np.std(y_pred)
    mean_true = np.mean(y_true)
    mean_pred = np.mean(y_pred)

    if std_true < 1e-8 or std_pred < 1e-8 or abs(mean_true) < 1e-8:
        return np.nan

    # Pearson correlation r
    r = float(np.corrcoef(y_true, y_pred)[0, 1])
    # Alpha (variability ratio)
    alpha = float(std_pred / std_true)
    # Beta (bias ratio)
    beta = float(mean_pred / mean_true)

    kge = 1.0 - np.sqrt((r - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2)
    return float(kge)

def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    catchment_ids: np.ndarray = None,
    q95_thresholds: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Compute comprehensive hydrological and machine learning metrics on valid samples.
    Always returns valid sample count N.
    """
    # Enforce non-negativity constraint on physical predictions
    y_pred_clipped = np.maximum(0.0, y_pred)

    # Valid mask (both true and pred are not NaN)
    valid_mask = (~np.isnan(y_true)) & (~np.isnan(y_pred_clipped))
    n_valid = int(np.sum(valid_mask))
    n_total = len(y_true)

    if n_valid == 0:
        return {
            'n_valid_samples': 0,
            'n_total_samples': n_total,
            'coverage_pct': 0.0,
            'rmse': np.nan,
            'mae': np.nan,
            'median_nse': np.nan,
            'mean_nse': np.nan,
            'median_kge': np.nan,
            'mean_kge': np.nan,
            'high_flow_rmse': np.nan,
            'n_high_flow_samples': 0
        }

    y_t = y_true[valid_mask]
    y_p = y_pred_clipped[valid_mask]

    # Pooled errors
    rmse = float(np.sqrt(np.mean((y_t - y_p) ** 2)))
    mae = float(np.mean(np.abs(y_t - y_p)))

    # Per-catchment hydrological metrics
    nse_list = []
    kge_list = []

    high_flow_errors = []
    n_high_flow = 0

    if catchment_ids is not None:
        c_ids = catchment_ids[valid_mask]
        unique_catchments = np.unique(c_ids)

        for cid in unique_catchments:
            mask_c = (c_ids == cid)
            yt_c = y_t[mask_c]
            yp_c = y_p[mask_c]

            if len(yt_c) >= 10:
                nse_val = compute_nse(yt_c, yp_c)
                if not np.isnan(nse_val) and nse_val > -10.0:  # clamp extreme negative outliers for mean
                    nse_list.append(nse_val)
                elif not np.isnan(nse_val):
                    nse_list.append(-10.0)

                kge_val = compute_kge(yt_c, yp_c)
                if not np.isnan(kge_val) and kge_val > -10.0:
                    kge_list.append(kge_val)
                elif not np.isnan(kge_val):
                    kge_list.append(-10.0)

            # High flow evaluation
            if q95_thresholds is not None and cid in q95_thresholds:
                thresh = q95_thresholds[cid]
                hf_mask = (yt_c >= thresh)
                if np.any(hf_mask):
                    high_flow_errors.extend((yt_c[hf_mask] - yp_c[hf_mask]) ** 2)
                    n_high_flow += int(np.sum(hf_mask))

    median_nse = float(np.median(nse_list)) if len(nse_list) > 0 else np.nan
    mean_nse = float(np.mean(nse_list)) if len(nse_list) > 0 else np.nan
    median_kge = float(np.median(kge_list)) if len(kge_list) > 0 else np.nan
    mean_kge = float(np.mean(kge_list)) if len(kge_list) > 0 else np.nan

    high_flow_rmse = float(np.sqrt(np.mean(high_flow_errors))) if len(high_flow_errors) > 0 else np.nan

    return {
        'n_valid_samples': n_valid,
        'n_total_samples': n_total,
        'coverage_pct': round(n_valid / n_total * 100.0, 3),
        'rmse': round(rmse, 4),
        'mae': round(mae, 4),
        'median_nse': round(median_nse, 4) if not np.isnan(median_nse) else np.nan,
        'mean_nse': round(mean_nse, 4) if not np.isnan(mean_nse) else np.nan,
        'median_kge': round(median_kge, 4) if not np.isnan(median_kge) else np.nan,
        'mean_kge': round(mean_kge, 4) if not np.isnan(mean_kge) else np.nan,
        'high_flow_rmse': round(high_flow_rmse, 4) if not np.isnan(high_flow_rmse) else np.nan,
        'n_high_flow_samples': n_high_flow
    }

