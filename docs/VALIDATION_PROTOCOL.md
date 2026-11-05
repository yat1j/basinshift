# BASINSHIFT — Scientific Validation & Data-Leakage Prevention Protocol

**Document Version:** 1.0.0  
**Compliance Standard:** Reproducible Hydrological ML Benchmarks  

---

## 1. Principles of Validation Integrity

In time-series catchment hydrology and machine learning, data leakage frequently produces artificially inflated performance scores ($R^2 > 0.95$) that fail catastrophically when deployed to unseen basins. BASINSHIFT enforces five strict structural firewalls to eliminate leakage:

```
┌─────────────────────────────────────────────────────────────┐
│                 FIVE STRUCTURAL FIREWALLS                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Strict Chronological Splitting (No Random K-Fold)        │
│ 2. Spatial Basin Withholding (Complete Geographic Holdout)  │
│ 3. Point-in-Time Feature Extraction (Zero Future Knowledge) │
│ 4. Preprocessing Fitted Exclusively on Training Sets        │
│ 5. Threshold Calibration Decoupled from Hidden Tests        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Partitioning Schemes

### 2.1. Temporal Validation Split (Forward-in-Time)
To simulate real-world forecasting where future weather and streamflow are unobserved:
* **Training Window:** 1980-10-01 to 2008-09-30 (28 water years).
* **Validation / Tuning Window:** 2008-10-01 to 2011-09-30 (3 water years).
* **Test Holdout Window:** 2011-10-01 to 2014-09-30 (3 water years).

> [!CAUTION]
> Random K-Fold cross-validation across time series is strictly prohibited. Shuffling daily records destroys auto-regressive autocorrelation and leaks future hydrologic memory into past states.

### 2.2. Spatial Generalization Split (Ungauged Basin / PUB)
To evaluate model transferability across distinct geomorphic and lithologic regimes:
* **Calibration Basins (In-Sample):** 600 CAMELS basins used to train global Ridge baseflow models and LightGBM residual estimators.
* **Geographically Withheld Holdouts (Out-of-Sample):** 71 catchments withheld completely from training and feature scaling.
* *Verification Target:* Evaluates whether physical linear reservoir states generalize to unfamiliar catchments without local streamflow calibration.

---

## 3. Leakage Red-Team Verification Checklist

| Leakage Vector | Potential Risk | Enforced Safeguard in Code | Verification Status |
|---|---|---|---|
| **Future Lookahead** | Computing rolling sums with centered windows ($t-k \dots t+k$) | All rolling sums, means, and extrema use backward-looking windows ($t-k \dots t$) terminating at $t_0$. | **Verified in `basinshift/features.py`** |
| **Reservoir Equilibrium Leakage** | Running reservoir equations across test sets without spin-up | Minimum 90-day spin-up preceding $t_0$ is enforced before evaluating predictions. | **Verified in `basinshift/features.py`** |
| **Scaler Covariate Shift** | Fitting standard scalers or Ridge regularizers on full dataset | Scalers and mean imputers are fit exclusively on training splits and saved as static artifacts. | **Verified in `basinshift/hybrid.py`** |
| **Ungauged Flow Contamination** | Ingesting $Q_{\text{obs}}$ when evaluating in PUB mode | In Ungauged/PUB mode, streamflow columns are zeroed or masked out before feature extraction. | **Verified in `basinshift/hybrid.py`** |
| **Threshold Leakage** | Tuning classifier cutoff $\tau$ on test evaluation crests | $Q_{95}$ discharge levels are computed solely from historical baseline distributions. Cutoff $\tau$ is tuned on validation folds. | **Verified in `basinshift/metrics.py`** |

---

## 4. Evaluation Metrics Specifications

All metrics are evaluated in normalized units of specific discharge ($\text{mm/day}$):

### 4.1. Nash-Sutcliffe Efficiency (NSE)
$$\text{NSE} = 1 - \frac{\sum_{t=1}^N \left(Q_{\text{pred}, t} - Q_{\text{obs}, t}\right)^2}{\sum_{t=1}^N \left(Q_{\text{obs}, t} - \overline{Q}_{\text{obs}}\right)^2}$$
* Interpretation: $\text{NSE} = 1$ is perfect; $\text{NSE} > 0.65$ represents good hydrological transfer; $\text{NSE} < 0$ performs worse than climatological mean flow.

### 4.2. Kling-Gupta Efficiency (KGE)
$$\text{KGE} = 1 - \sqrt{(r - 1)^2 + (\alpha - 1)^2 + (\beta - 1)^2}$$
where:
* $r = \text{Pearson correlation coefficient}$
* $\alpha = \sigma_{\text{pred}} / \sigma_{\text{obs}}$ (variability ratio)
* $\beta = \mu_{\text{pred}} / \mu_{\text{obs}}$ (bias ratio)

### 4.3. Dimensional Errors
* **Mean Absolute Error (MAE):** $\text{MAE} = \frac{1}{N}\sum |Q_{\text{pred}} - Q_{\text{obs}}|$
* **Root Mean Squared Error (RMSE):** $\text{RMSE} = \sqrt{\frac{1}{N}\sum (Q_{\text{pred}} - Q_{\text{obs}})^2}$

### 4.4. High-Flow Detection Classification
For events where $Q_{\text{obs}} \ge Q_{95}$:
* **Precision (PPV):** $\text{TP} / (\text{TP} + \text{FP})$
* **Recall (Sensitivity):** $\text{TP} / (\text{TP} + \text{FN})$
* **$F_1$ Score:** $2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$
* **AUPRC:** Area under Precision-Recall Curve (heavily penalizes false positive alerts under class imbalance).
