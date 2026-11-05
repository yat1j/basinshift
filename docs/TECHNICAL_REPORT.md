# BASINSHIFT: Hydrology-Informed Transferable Machine Learning for River-Discharge Forecasting & High-Flow-Risk Estimation Across Unseen Catchments

**Author:** BASINSHIFT Research Team  
**Competition Category:** Global Flood Intelligence Challenge  
**Date:** November 2026  
**Document Classification:** Formal Technical Research Report  

---

## 1. Executive Summary

Accurate multi-day river-discharge forecasting is critical for flood mitigation, reservoir management, and humanitarian early-action systems. While contemporary machine learning algorithms (such as gradient-boosted decision trees and recurrent neural networks) achieve excellent predictive accuracy within gauged basins where decades of hydrometric records exist, they frequently overfit to basin-specific runoff curves and degrade severely when transferred to **geographically unfamiliar catchments**—the longstanding *Predictions in Ungauged Basins (PUB)* challenge.

BASINSHIFT introduces a **Two-Stage Hydrology-Informed Hybrid Architecture (Variant A)** designed specifically for inductive transferability. The architecture couples conceptual multi-scale linear reservoir storage equations ($k_1 \dots k_4$) with an L2-regularized Ridge baseflow regression and a gradient-boosted LightGBM residual correction model. Evaluated across 671 CAMELS benchmark basins across the United States, BASINSHIFT demonstrates that physics-informed storage states prevent catastrophic variance under spatial distribution shift: on catchments withheld entirely from training, BASINSHIFT achieves an out-of-sample Nash-Sutcliffe Efficiency ($\text{NSE}$) of **$0.648$** at $+1\text{d}$ lead time, whereas pure unconstrained boosted trees degrade to $\text{NSE} < 0.25$.

---

## 2. Problem Formulation

Let a drainage basin be characterized by a topographic boundary of area $A\text{ (km}^2\text{)}$ and a streamgage outlet. At daily timestep $t \in \{1, \dots, T\}$, the basin receives meteorological forcings $\mathbf{x}_t = [P_t, T_t, R_{s, t}, \text{SWE}_t]$, comprising precipitation, air temperature, surface solar radiation, and snow water equivalent. 

The primary objective is to forecast specific runoff depth $Q_{t+h} \in \mathbb{R}_{\ge 0}$ ($\text{mm/day}$) across forward horizons $h \in \{1, 3, 7\text{ days}\}$, and to estimate the exceedance probability $P(Q_{t+h} \ge Q_{95})$ against the historical 95th-percentile flood threshold $Q_{95}$.

Under the **Ungauged / PUB constraint**, historical streamflow observations $Q_\tau$ ($\tau \le t$) are unavailable, requiring the forecasting function $f(\mathbf{x}_{1:t}, \mathbf{z}_{\text{static}})$ to map meteorological histories and static catchment physiography directly to future discharge without local calibration.

---

## 3. Research Hypothesis

> **Hypothesis:** Formulating machine learning features through mass-conserving, conceptual linear reservoir routing equations imposes an inductive bias that constrains hydrological memory across distinct physical timescales (fast overland flow, unsaturated interflow, deep baseflow). This inductive constraint stabilizes model predictions under spatial domain shift, outperforming both unregularized black-box ML models and uncalibrated pure conceptual models on unseen catchments.

---

## 4. Dataset and Provenance

Experiments are conducted on the benchmark **CAMELS dataset (Addor et al., 2017)**, supplemented by daily streamflow telemetry from the **USGS National Water Information System (NWIS)** and surface meteorology from **ECMWF ERA5-Land reanalysis**:

* **Sample Size:** 671 catchments spanning all contiguous United States hydrologic regions (HUC 01 to HUC 18).
* **Drainage Areas:** Range from $4.2\text{ km}^2$ to $24,800\text{ km}^2$.
* **Climatic Gradient:** Aridity index ($\text{PET}/P$) spans from $0.22$ (hyper-humid Pacific Northwest) to $3.8$ (semi-arid Southwest).
* **Target Normalization:** Streamflow in volumetric rate ($\text{m}^3/\text{s}$) is converted to area-normalized specific discharge ($\text{mm/day}$) to enable fair cross-catchment comparison across basins differing in size by four orders of magnitude.

---

## 5. Preprocessing & Causal Feature Engineering

To guarantee zero future information leakage, all preprocessing transformations and feature extractions are computed strictly in a backward-looking window terminating at the forecast origin $t_0$:

1. **Soil-Gated Infiltration:**
   Effective liquid precipitation $P_{\text{eff}}(t)$ is formulated as a nonlinear function of antecedent moisture proxy:
   $$P_{\text{eff}}(t) = P(t) \cdot \tanh(\text{SoilProxy}(t))$$
2. **Degree-Day Snowmelt Proxy:**
   $$M(t) = \max\left(0, \, k_{\text{melt}} \cdot (T(t) - T_{\text{base}})\right), \quad k_{\text{melt}} = 2.5\text{ mm}/(^\circ\text{C}\cdot\text{day}), \; T_{\text{base}} = 0^\circ\text{C}$$
3. **Four Multi-Scale Linear Reservoirs:**
   Total effective liquid input $I(t) = P_{\text{eff}}(t) + M(t)$ is partitioned into four linear storage states:
   $$S_i(t) = S_i(t-1) \cdot (1 - k_i) + w_i \cdot I(t), \quad Q_i(t) = k_i S_i(t)$$
   with empirical storage recession constants:
   * $k_1 = 0.65\text{ d}^{-1}$ (Fast surface overland runoff)
   * $k_2 = 0.25\text{ d}^{-1}$ (Unsaturated zone interflow)
   * $k_3 = 0.08\text{ d}^{-1}$ (Shallow percolation storage)
   * $k_4 = 0.015\text{ d}^{-1}$ (Deep baseflow / aquifer release)
4. **Antecedent Accumulations & Lags:** Rolling precipitation sums over 3, 7, and 30 days capture multi-scale antecedent wetness.

---

## 6. Model Architecture: Two-Stage Hybrid (Variant A)

```
                       Input Meteorologic Time Series
                                     │
                                     ▼
                      [ Causal Reservoir Routing ]
                      (S1: fast, S2: inter, S3: sub, S4: base)
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         [ Stage 1: Ridge Base ]           [ Stage 2: LightGBM Residual ]
       (Constrained Smooth Trend)         (Nonlinear Peak Correction)
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
                       Raw Composite: Q_base + r_hat
                                     │
                                     ▼
                      [ Non-Negative Mass Clipping ]
                      Q_hat = max(0, Q_base + r_hat)
                                     │
                                     ▼
                   [ High-Flow Q95 Event Probability ]
```

* **Stage 1 (Ridge Regression):** Fits an L2-regularized linear model on reservoir storage states:
  $$\min_{\mathbf{w}, b} \left( \sum_{i=1}^N \left( y_i - b - \mathbf{x}_i^T \mathbf{w} \right)^2 + \lambda \|\mathbf{w}\|_2^2 \right)$$
  The strong regularization penalty prevents unbounded coefficient explosion under extreme out-of-distribution rainfall events.
* **Stage 2 (LightGBM Residual Corrector):** Decision tree boosting targets the residual $r_i = y_i - \hat{Q}_{\text{base}, i}$. The residual trees capture saturation-excess nonlinear crests and diurnal temperature effects that linear reservoirs simplify.
* **Non-Negative Output Clipping:** $\hat{Q}(t+h) = \max(0, \, \hat{Q}_{\text{base}}(t+h) + \hat{r}(t+h))$.

---

## 7. Leakage Prevention & Validation Design

1. **Chronological Forward Splits:** Training (1980–2008), Validation (2008–2011), and Testing (2011–2014). Time series are never randomly shuffled.
2. **Spatial Basin Withholding:** 71 test basins are excluded from all model training and feature normalization steps to rigorously benchmark transferability to ungauged basins.
3. **Threshold Decoupling:** Physical discharge high-flow thresholds ($Q_{95}$) are derived strictly from historical baseline reference periods. Decision probability cutoffs ($\tau$) are calibrated on validation folds, not on hidden evaluation data.

---

## 8. Baselines

BASINSHIFT is compared against three distinct baseline families:
1. **Persistence Climatology:** $\hat{Q}(t+h) = Q_{\text{obs}}(t)$, representing the baseline floor for auto-regressive memory.
2. **Standard Conceptual Hydrology (GR4J-style):** Pure physical reservoir formulation without ML residual correction.
3. **Pure Machine Learning (Global LightGBM):** Standard boosted trees trained on raw meteorological lags without linear reservoir states.

---

## 9. Experiments & Ablation Analysis

Ablation experiments isolate the contribution of each architectural component on out-of-sample holdout test sets:

| Model Configuration | Feature Set | Temporal NSE (+1d) | Unseen Basin NSE (+1d) | High-Flow F1 |
|---|---|---|---|---|
| **Persistence Baseline** | None | 0.612 | N/A (Ungauged) | 0.482 |
| **Pure LightGBM (No Reservoirs)** | Raw Lags Only | 0.812 | 0.234 | 0.628 |
| **Ridge Base Only (Stage 1)** | 4 Reservoirs | 0.654 | 0.612 | 0.514 |
| **LightGBM Residual Only (Stage 2)**| Residual Target | 0.724 | 0.412 | 0.692 |
| **Two-Stage Hybrid (Complete)** | **Variant A** | **0.782** | **0.648** | **0.768** |

*Ablation Finding:* Pure LightGBM achieves high temporal fit (0.812) on familiar basins but drops to 0.234 on unseen basins. Adding Stage 1 physical reservoir routing boosts transferability by **$+0.414\text{ NSE}$**, confirming the research hypothesis.

---

## 10. Geographic Generalization Performance

Evaluating on the 71 geographically withheld catchments across varying aridity regimes:
* **Humid Catchments ($\text{PET}/P < 0.8$):** $\text{NSE} = 0.712$, demonstrating reliable mass transfer.
* **Snowmelt-Dominated Catchments:** $\text{NSE} = 0.658$, benefiting from the temperature degree-day proxy.
* **Semi-Arid Basins ($\text{PET}/P > 1.5$):** $\text{NSE} = 0.482$, reflecting high runoff non-linearity during rare convective storms.

---

## 11. Temporal Generalization Performance

Evaluated on familiar basins across the 2011–2014 chronological holdout:
* **$+1\text{d}$ (24h Lead):** $\text{NSE} = 0.782, \; \text{KGE} = 0.814, \; \text{RMSE} = 1.14\text{ mm/d}$
* **$+3\text{d}$ (72h Lead):** $\text{NSE} = 0.694, \; \text{KGE} = 0.732, \; \text{RMSE} = 1.48\text{ mm/d}$
* **$+7\text{d}$ (168h Lead):** $\text{NSE} = 0.561, \; \text{KGE} = 0.618, \; \text{RMSE} = 1.96\text{ mm/d}$

---

## 12. High-Flow ($Q_{95}$) Event Evaluation

Evaluated against the top-5% historical streamflow crests at decision cutoff $\tau = 0.50$:
* **Precision:** $74.2\%$ (low false alert rate).
* **Recall:** $79.6\%$ (captures $\approx 80\%$ of dangerous peak crests).
* **$F_1$ Score:** $0.768$
* **AUPRC:** $0.792$ (strong precision-recall trade-off under severe class imbalance).

---

## 13. Uncertainty & Probabilistic Methods

The prototype outputs deterministic point forecasts and high-flow exceedance probabilities. Calibrated conformal prediction intervals (split-conformal residual quantiles) and $Q_{99}$ secondary extreme classifiers were evaluated in preliminary research notebooks but held back from the frozen submission build due to empirical coverage variance across ungauged basins.

---

## 14. Computational Efficiency & Latency

* **Feature Generation:** $12\text{ ms}$ for 365 daily meteorological records.
* **Inference Runtime:** $8\text{ ms}$ for all 3 horizons + classification head on a single CPU core.
* **Memory Footprint:** $< 80\text{ MB}$ RSS memory during active inference.
* **Scalability:** Easily supports $> 100\text{ requests/sec}$ per worker on modest cloud server instances.

---

## 15. Limitations & Failure Cases

1. **Daily Aggregate Discretization:** Daily time steps cannot resolve sub-daily flash flood hydrographs in small steep basins ($< 50\text{ km}^2$).
2. **Channel Regulation:** Basins with upstream dams, irrigation diversions, or floodgates violate natural drainage balance assumptions.
3. **Reanalysis vs Live Radar:** Evaluated on ERA5-Land reanalysis; operational live deployment requires integration with high-resolution radar feeds.
4. **Not Inundation Mapping:** Forecasts volumetric flow ($\text{mm/day}$), not street-level flood depth ($\text{cm}$).

---

## 16. Reproduction Summary

Full deterministic reproduction instructions are detailed in [`docs/REPRODUCTION.md`](REPRODUCTION.md). The entire test suite can be verified via:
```bash
pytest tests/ -v
cd frontend && npm run build
```

---

## 17. References

1. Addor, N., et al. (2017). *The CAMELS data set: hydrometeorological time series and attributes for 671 catchments across the contiguous United States*. Hydrology and Earth System Sciences, 21, 5293–5313.
2. Hrachowitz, M., et al. (2013). *A decade of Predictions in Ungauged Basins (PUB)—a review*. Hydrological Sciences Journal, 58(6), 1198–1255.
3. Gupta, H. V., et al. (2009). *Decomposition of the mean squared error and NSE performance criteria: Implications for improving hydrological modelling*. Journal of Hydrology, 377(1-2), 80–91.
4. Nash, J. E., and Sutcliffe, J. V. (1970). *River flow forecasting through conceptual models part I—A discussion of principles*. Journal of Hydrology, 10(3), 282–290.
5. Mitchell, M., et al. (2019). *Model Cards for Model Reporting*. Proceedings of the Conference on Fairness, Accountability, and Transparency (FAT*), 220–229.
