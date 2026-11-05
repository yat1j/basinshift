"""
Hydrological Performance Metrics: NSE, KGE, MAE, RMSE, and High-Flow Detection.
Strictly vectorized and numerically stable implementations.
"""

from typing import List, Union, Dict, Any, Optional
import math
import numpy as np


def compute_nse(obs: Union[List[float], np.ndarray], pred: Union[List[float], np.ndarray]) -> float:
    """
    Computes Nash-Sutcliffe Efficiency (NSE):
    NSE = 1 - [ sum((Q_obs - Q_pred)^2) / sum((Q_obs - mean(Q_obs))^2) ]
    
    Returns -inf if denominator is zero (constant observations).
    """
    y_true = np.asarray(obs, dtype=np.float64)
    y_pred = np.asarray(pred, dtype=np.float64)

    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    y_true = y_true[mask]
    y_pred = y_pred[mask]

    if len(y_true) < 2:
        return float("nan")

    denom = np.sum((y_true - np.mean(y_true)) ** 2)
    if denom == 0.0:
        return -float("inf") if np.sum((y_true - y_pred) ** 2) > 0 else 1.0

    numer = np.sum((y_true - y_pred) ** 2)
    return float(1.0 - (numer / denom))


def compute_kge(obs: Union[List[float], np.ndarray], pred: Union[List[float], np.ndarray]) -> float:
    """
    Computes Kling-Gupta Efficiency (KGE - Gupta et al., 2009):
    KGE = 1 - sqrt( (r - 1)^2 + (alpha - 1)^2 + (beta - 1)^2 )
    where:
    - r: Pearson correlation coefficient
    - alpha: ratio of standard deviations (sigma_pred / sigma_obs)
    - beta: ratio of means (mu_pred / mu_obs)
    """
    y_true = np.asarray(obs, dtype=np.float64)
    y_pred = np.asarray(pred, dtype=np.float64)

    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    y_true = y_true[mask]
    y_pred = y_pred[mask]

    if len(y_true) < 2:
        return float("nan")

    std_obs = np.std(y_true)
    std_pred = np.std(y_pred)
    mean_obs = np.mean(y_true)
    mean_pred = np.mean(y_pred)

    if std_obs == 0.0 or std_pred == 0.0 or mean_obs == 0.0:
        return float("nan")

    r = float(np.corrcoef(y_true, y_pred)[0, 1])
    alpha = float(std_pred / std_obs)
    beta = float(mean_pred / mean_obs)

    ed = math.sqrt((r - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2)
    return float(1.0 - ed)


def compute_mae(obs: Union[List[float], np.ndarray], pred: Union[List[float], np.ndarray]) -> float:
    """Computes Mean Absolute Error (MAE) in mm/day."""
    y_true = np.asarray(obs, dtype=np.float64)
    y_pred = np.asarray(pred, dtype=np.float64)

    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    if not np.any(mask):
        return float("nan")

    return float(np.mean(np.abs(y_true[mask] - y_pred[mask])))


def compute_rmse(obs: Union[List[float], np.ndarray], pred: Union[List[float], np.ndarray]) -> float:
    """Computes Root Mean Squared Error (RMSE) in mm/day."""
    y_true = np.asarray(obs, dtype=np.float64)
    y_pred = np.asarray(pred, dtype=np.float64)

    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    if not np.any(mask):
        return float("nan")

    return float(np.sqrt(np.mean((y_true[mask] - y_pred[mask]) ** 2)))


def compute_high_flow_metrics(
    obs: Union[List[float], np.ndarray],
    pred_probs: Union[List[float], np.ndarray],
    threshold: float,
    tau: float = 0.50
) -> Dict[str, float]:
    """
    Computes binary event detection metrics for Q >= Q95 exceedances.
    Returns: precision, recall, f1, accuracy.
    """
    y_true = (np.asarray(obs, dtype=np.float64) >= threshold).astype(int)
    y_prob = np.asarray(pred_probs, dtype=np.float64)
    y_pred = (y_prob >= tau).astype(int)

    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    accuracy = (tp + tn) / len(y_true) if len(y_true) > 0 else 0.0

    return {
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn,
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "accuracy": float(accuracy),
    }
