# BASINSHIFT — Empirical Validation & Ablation Summary

**Dataset:** CAMELS (671 Basins)  
**Period:** 1980–2014 (Forward-in-Time Split: Train 1980–2008, Val 2008–2011, Test 2011–2014)  
**Spatial Split:** 600 In-Sample Calibration Basins, 71 Out-of-Sample Holdout Basins  

---

## 1. Multi-Horizon Forecasting Accuracy

All discharge metrics are evaluated in specific runoff depth ($\text{mm/day}$):

| Evaluation Split | Horizon | Model Architecture | Median NSE | Median KGE | Mean MAE (mm/d) | Mean RMSE (mm/d) |
|---|---|---|---|---|---|---|
| **Temporal Holdout** | $+1\text{d}$ (24h) | Two-Stage Hybrid (Variant A) | **0.782** | **0.814** | 0.68 | 1.14 |
| **Temporal Holdout** | $+3\text{d}$ (72h) | Two-Stage Hybrid (Variant A) | **0.694** | **0.732** | 0.89 | 1.48 |
| **Temporal Holdout** | $+7\text{d}$ (168h) | Two-Stage Hybrid (Variant A) | **0.561** | **0.618** | 1.22 | 1.96 |
| **Unseen Catchments (PUB)** | $+1\text{d}$ (24h) | Two-Stage Hybrid (Variant A) | **0.648** | **0.702** | 0.94 | 1.52 |
| **Unseen Catchments (PUB)** | $+3\text{d}$ (72h) | Two-Stage Hybrid (Variant A) | **0.542** | **0.596** | 1.28 | 1.89 |
| **Unseen Catchments (PUB)** | $+7\text{d}$ (168h) | Two-Stage Hybrid (Variant A) | **0.418** | **0.485** | 1.64 | 2.41 |

---

## 2. Model Architecture Ablation Comparison

Evaluated on the 71 geographically withheld catchments at $+1\text{d}$ lead time:

| Model Variant | Key Inductive Bias | In-Sample NSE | Unseen Basin NSE | Transfer Degradation ($\Delta\text{NSE}$) |
|---|---|---|---|---|
| **Persistence Baseline** | Flow Auto-Correlation | 0.612 | N/A (PUB) | N/A |
| **Pure LightGBM (No Reservoirs)** | Pure ML (Lag Trees) | **0.812** | 0.234 | -0.578 (Catastrophic) |
| **Ridge Base Only (Stage 1)** | 4 Linear Reservoirs | 0.654 | 0.612 | -0.042 (Highly Stable) |
| **Two-Stage Hybrid (Complete)** | **Reservoirs + Ridge + Residual Tree** | 0.782 | **0.648** | **-0.134 (Optimal Tradeoff)** |

---

## 3. High-Flow ($Q_{95}$) Detection Metrics

Evaluated across top-5% historical high-flow events:

| Forecast Horizon | Precision (PPV) | Recall (Sensitivity) | F1 Score | AUPRC Score | Decision Cutoff ($\tau$) |
|---|---|---|---|---|---|
| $+1\text{d}$ (24h) | 74.2% | 79.6% | **0.768** | **0.792** | 0.50 |
| $+3\text{d}$ (72h) | 68.5% | 72.1% | **0.702** | **0.718** | 0.50 |
| $+7\text{d}$ (168h) | 59.4% | 63.8% | **0.615** | **0.632** | 0.50 |
