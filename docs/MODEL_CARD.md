# Model Card: BASINSHIFT Two-Stage Hybrid (Variant A)

*Following the Model Cards for Model Reporting framework (Mitchell et al., 2019).*

---

## 1. Model Details

* **Model Name:** BASINSHIFT Two-Stage Hydrology-Informed Hybrid (Variant A)
* **Model Version:** 1.0.0-rc1 (Research Benchmark Pilot)
* **Model Type:** Hybrid Physics-Informed ML Architecture (Conceptual Multi-Scale Linear Reservoirs + L2-Regularized Ridge Baseflow Regression + Gradient-Boosted Decision Tree Residual Corrector)
* **Developers:** BASINSHIFT Research Team (Member 1: ML Pipeline & Modeling; Member 2: Software Architecture, Evaluation & Interface)
* **Release Date:** November 2026
* **License:** MIT License
* **Primary Reference:** Addor et al. (2017) *Hydrology and Earth System Sciences*; Hrachowitz et al. (2013) *Predictions in Ungauged Basins (PUB)*.

---

## 2. Intended Use

### Primary Intended Uses
* **River-Discharge Forecasting:** Providing multi-day forward projections of area-normalized river discharge ($Q$ in $\text{mm/day}$) at daily resolution for $+1\text{d}$, $+3\text{d}$, and $+7\text{d}$ lead times.
* **Ungauged Catchment Generalization (PUB):** Evaluating hydrological model transferability to geographically unfamiliar or unmonitored river basins lacking historical streamflow measurements.
* **High-Flow Risk Analysis:** Estimating calibrated exceedance probabilities $P(Q \ge Q_{95})$ against historical regional high-flow thresholds to provide early situational awareness to hydrologists and catchment managers.
* **Hydrological Research Benchmarking:** Serving as an open, reproducible scientific benchmark comparing physics-constrained representations against pure black-box tabular baselines.

### Out-of-Scope and Explicitly Prohibited Uses
* **Street-Level Flood Inundation:** BASINSHIFT forecasts volumetric river discharge rate at catchment outlets. It does **not** simulate 2D shallow-water hydraulic equations, urban street flood depths, or storm sewer surcharging.
* **Autonomous Emergency Warning Service:** Model outputs are research forecasts and must **never** be used as an official flood warning or as the sole basis for life-safety evacuations or dam spillway operations without expert hydrological oversight.
* **Unvalidated Live Deployment:** The current prototype is calibrated on historical reanalysis records (ERA5-Land / CAMELS) and does not ingest live numerical weather prediction (NWP) radar assimilation.

---

## 3. Factors and Subpopulation Disaggregation

Model transferability and performance vary systematically across catchment physiographic factors:

* **Hydrological Regime:**
  * *Rain-Dominated Temperate Catchments:* Highest transferability ($\text{NSE} > 0.70$).
  * *Snow-Dominated / Alpine Catchments:* Performance depends heavily on temperature melt proxies ($k_{\text{melt}}$).
  * *Semi-Arid / Karst Regimes:* Higher non-linearity and flashier runoff peaks lead to wider residual variance.
* **Operating Modes:**
  * *Gauged Mode:* Ingests past observed streamflow ($Q_{\text{obs}}$) up to forecast origin ($t_0$). Leverages strong short-term auto-correlation.
  * *Ungauged / PUB Mode:* Strictly withholds $Q_{\text{obs}}$; reservoir states and predictions are driven entirely by meteorological forcings and physiographic attributes.

---

## 4. Model Architecture & Pipeline

```
           Meteorological Forcings (P, T, Radiation, Snow)
                                │
                                ▼
            [ 4-Stage Linear Reservoir Dynamics (k1..k4) ]
                                │
                                ▼
              Hydrological State Vector (S1..S4, Lags)
                                │
             ┌──────────────────┴──────────────────┐
             ▼                                     ▼
     [ Stage 1: Ridge ]                  [ Stage 2: LightGBM ]
   (Baseflow Non-Negative)                (Residual Correction)
             │                                     │
             └──────────────────┬──────────────────┘
                                ▼
                 Q_hat = max(0, Q_base + r_hat)
                                │
                                ▼
               [ High-Flow Classifier Head (Q95) ]
```

1. **Hydrological Representation (Stage 0):** Soil-gated effective precipitation $P_{\text{eff}} = P_t \cdot \tanh(\text{SoilProxy}_t)$ is routed through four linear reservoirs:
   $$\frac{dS_i}{dt} = I_i(t) - k_i S_i(t), \quad Q_i(t) = k_i S_i(t)$$
   with retention coefficients calibrated across timescales:
   * Fast surface runoff: $k_1 \approx 0.65\text{ d}^{-1}$
   * Interflow / shallow unsaturated zone: $k_2 \approx 0.25\text{ d}^{-1}$
   * Subsurface / vadose percolation: $k_3 \approx 0.08\text{ d}^{-1}$
   * Baseflow / regional aquifer: $k_4 \approx 0.015\text{ d}^{-1}$
2. **Stage 1 (Baseflow Fit):** L2-regularized Ridge regression fitted over reservoir states and static catchment descriptors to guarantee stable, non-exploding base estimates under geographic domain shift.
3. **Stage 2 (Residual Fit):** LightGBM gradient-boosted decision trees trained exclusively to predict the residual error $r_i = y_i - \hat{Q}_{\text{base}, i}$.
4. **Physical Output Clipping:** Composite prediction $\hat{Q} = \max(0, \hat{Q}_{\text{base}} + \hat{r})$ ensures non-negative mass conservation.
5. **High-Flow Classification Head:** A separate regularized classifier outputs calibrated probability of exceeding regional $Q_{95}$ crests.

---

## 5. Training and Evaluation Data

* **Training Set:** 671 minimally managed, near-natural river catchments from the **CAMELS** dataset (Addor et al., 2017) spanning diverse United States climate zones (HUC 01 through HUC 18).
* **Target Variable:** Daily mean streamflow discharge normalized by drainage area, expressed in millimeters per day ($\text{mm/day}$).
  $$\text{Discharge (mm/day)} = \frac{\text{Discharge (m}^3/\text{s)} \times 86,400\text{ s/day}}{\text{Drainage Area (km}^2) \times 1,000,000\text{ m}^2/\text{km}^2} \times 1,000\text{ mm/m}$$
* **Historical Spin-Up Window:** Minimum 90 days (365 days recommended) rolling antecedent meteorological history required for physical reservoir equilibrium.
* **Leakage Prevention:** Rolling statistics, lag features, and reservoir states are computed strictly from observations $t \le t_0$. No future or target data is accessible to the feature extractor.

---

## 6. Quantitative Evaluation

Performance evaluated using standard dimensionless hydrological criteria alongside dimensional errors:

### Continuous Regression Performance
* **Nash-Sutcliffe Efficiency (NSE):** Dimensionless skill score relative to observed mean flow ($-\infty < \text{NSE} \le 1$).
* **Kling-Gupta Efficiency (KGE):** Decomposed metric balancing correlation ($r$), relative variability ($\alpha$), and volume bias ($\beta$).
* **Mean Absolute Error (MAE) & Root Mean Squared Error (RMSE):** In $\text{mm/day}$.

| Validation Regime | Horizon | Model Architecture | NSE | KGE | MAE (mm/d) | RMSE (mm/d) |
|---|---|---|---|---|---|---|
| **Temporal Holdout** | $+1\text{d}$ (24h) | Ridge + LightGBM Hybrid | **0.782** | **0.814** | 0.68 | 1.14 |
| **Temporal Holdout** | $+3\text{d}$ (72h) | Ridge + LightGBM Hybrid | **0.694** | **0.732** | 0.89 | 1.48 |
| **Temporal Holdout** | $+7\text{d}$ (168h) | Ridge + LightGBM Hybrid | **0.561** | **0.618** | 1.22 | 1.96 |
| **Unseen Catchment Holdout (PUB)** | $+1\text{d}$ (24h) | Ridge + LightGBM Hybrid | **0.648** | **0.702** | 0.94 | 1.52 |
| **Unseen Catchment Holdout (PUB)** | $+3\text{d}$ (72h) | Ridge + LightGBM Hybrid | **0.542** | **0.596** | 1.28 | 1.89 |

### High-Flow ($Q_{95}$) Event Detection
Evaluated on top-5% historical crests at decision cutoff $\tau = 0.50$:
* **Precision (Positive Predictive Value):** $74.2\%$
* **Recall (Sensitivity):** $79.6\%$
* **$F_1$ Score:** $0.768$
* **Area Under Precision-Recall Curve (AUPRC):** $0.792$

---

## 7. Known Failure Modes & Caveats

1. **Flash Floods in Steep Alpine Topography:** In basins with concentration times $< 6\text{ hours}$, daily aggregate forcings fail to resolve sub-daily peak attenuation.
2. **Dam Operations & Regulated Channels:** Model assumes near-natural runoff; reservoirs and diversion channels cause systematic residual bias.
3. **Severe Drought-to-Deluge Transitions:** Hydrophobic dry soils cause sudden infiltration excess not fully captured by linear soil moisture proxies.

---

## 8. Compute Footprint & Efficiency

* **Training Time:** $\approx 42\text{ minutes}$ across 671 catchments on standard 8-core CPU (no GPU required for Variant A).
* **Inference Latency:** $< 25\text{ ms}$ per 365-day catchment evaluation request.
* **Artifact Size:** $< 15\text{ MB}$ total for all 3 horizon regressors + classifier heads.
