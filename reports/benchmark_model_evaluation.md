# BASINSHIFT · Model Benchmark & Validation Report
**Role:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 5, 2026  
**Authoritative Plan:** `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html` (Version 2.0)  
**Dataset:** `data/processed/pilot_150_catchments.parquet` (150 catchments, 10 continuous years)  

---

## 1. Executive Summary & Verification of Requirements
A multi-model hydrological forecasting benchmark was executed across 3 provisional horizons ($h \in \{1, 3, 7\}$ days) and dual validation folds (Test A Temporal Extrapolation and Test B Geographic Transfer).

### Compliance Checklist
1. **Zero Streamflow Preservation:** All 49,416 genuine zero-streamflow measurements ($0.0\text{ mm/day}$) were strictly preserved.
2. **Zero-Imputation Prohibition:** Missing streamflow targets were NEVER imputed to zero; targets were dynamically masked via $\neg \text{isnan}(y_{t+h})$.
3. **Native Missingness Handling:** LightGBM and XGBoost utilized native NaN split routing without synthetic imputation on flow lags.
4. **Valid Sample Reporting:** Every metric reports exact $N_{\text{valid}}$ counts and target coverage percentages.
5. **Dual Transfer Protocol:** Geographic validation on Test B evaluates both **Gauged Transfer** (past flow available at inference) and **Ungauged Transfer (PUB)** (weather + static attributes only).

---

## 2. Complete Benchmark Evaluation Table

| Horizon | Model | Mode | Partition | Valid Samples ($N_{\text{valid}}$) | Coverage % | RMSE ($mm/d$) | MAE ($mm/d$) | Median NSE | Mean NSE | Median KGE | High-Flow RMSE ($mm/d$) |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **h = 1d** | Persistence | Gauged | Temporal_Val_Test_A | 86,544 | 98.9% | **4.161** | 0.347 | 0.622 | 0.481 | 0.811 | 18.053 |
| **h = 1d** | Persistence | Gauged | Geographic_Val_Test_B | 21,518 | 98.4% | **3.155** | 0.492 | 0.506 | 0.438 | 0.753 | 13.923 |
| **h = 1d** | Climatology | Gauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.994** | 0.788 | 0.017 | -0.824 | -0.041 | 17.331 |
| **h = 1d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,526 | 98.4% | **3.914** | 1.452 | -0.132 | -1.240 | -0.368 | 15.626 |
| **h = 1d** | Ridge_Regression | Ungauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.606** | 0.867 | 0.005 | -2.728 | -0.042 | 15.379 |
| **h = 1d** | Ridge_Regression | Ungauged_PUB | Geographic_Val_Test_B | 21,526 | 98.4% | **2.861** | 1.005 | 0.228 | -1.096 | 0.319 | 11.586 |
| **h = 1d** | Ridge_Regression | Gauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.329** | 0.448 | 0.386 | -1.130 | 0.473 | 14.654 |
| **h = 1d** | Ridge_Regression | Gauged_Transfer | Geographic_Val_Test_B | 21,526 | 98.4% | **2.520** | 0.565 | 0.469 | -0.064 | 0.604 | 11.055 |
| **h = 1d** | LightGBM | Ungauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.333** | 0.645 | 0.248 | -1.597 | 0.196 | 14.315 |
| **h = 1d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,526 | 98.4% | **2.809** | 0.876 | 0.268 | -0.480 | 0.328 | 11.629 |
| **h = 1d** | LightGBM | Gauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.111** | 0.297 | 0.652 | 0.043 | 0.683 | 13.906 |
| **h = 1d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,526 | 98.4% | **2.412** | 0.411 | 0.624 | 0.262 | 0.694 | 10.641 |
| **h = 1d** | XGBoost | Ungauged | Temporal_Val_Test_A | 86,574 | 99.0% | **3.390** | 0.652 | 0.172 | -1.650 | 0.175 | 14.518 |
| **h = 1d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,526 | 98.4% | **2.735** | 0.847 | 0.315 | -0.475 | 0.407 | 11.358 |
| **h = 1d** | XGBoost | Gauged | Temporal_Val_Test_A | 86,574 | 99.0% | **2.968** | 0.293 | 0.644 | -0.005 | 0.682 | 13.240 |
| **h = 1d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,526 | 98.4% | **2.440** | 0.415 | 0.586 | 0.394 | 0.710 | 10.731 |
| **h = 3d** | Persistence | Gauged | Temporal_Val_Test_A | 86,263 | 98.9% | **5.295** | 0.607 | -0.044 | -0.032 | 0.478 | 22.504 |
| **h = 3d** | Persistence | Gauged | Geographic_Val_Test_B | 21,446 | 98.3% | **4.107** | 0.842 | -0.093 | -0.105 | 0.454 | 16.563 |
| **h = 3d** | Climatology | Gauged | Temporal_Val_Test_A | 86,336 | 99.0% | **4.001** | 0.788 | 0.019 | -0.825 | -0.039 | 17.344 |
| **h = 3d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,466 | 98.4% | **3.918** | 1.452 | -0.130 | -1.237 | -0.370 | 15.622 |
| **h = 3d** | Ridge_Regression | Ungauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.996** | 0.896 | -0.099 | -2.414 | -0.119 | 17.350 |
| **h = 3d** | Ridge_Regression | Ungauged_PUB | Geographic_Val_Test_B | 21,466 | 98.4% | **3.362** | 1.064 | -0.005 | -0.814 | 0.107 | 14.100 |
| **h = 3d** | Ridge_Regression | Gauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.900** | 0.619 | 0.067 | -1.275 | 0.185 | 17.250 |
| **h = 3d** | Ridge_Regression | Gauged_Transfer | Geographic_Val_Test_B | 21,466 | 98.4% | **3.165** | 0.799 | 0.205 | -0.247 | 0.314 | 13.717 |
| **h = 3d** | LightGBM | Ungauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.897** | 0.722 | 0.028 | -1.621 | 0.036 | 16.996 |
| **h = 3d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,466 | 98.4% | **3.342** | 0.999 | 0.083 | -0.535 | 0.146 | 14.011 |
| **h = 3d** | LightGBM | Gauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.834** | 0.529 | 0.192 | -0.316 | 0.344 | 16.975 |
| **h = 3d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,466 | 98.4% | **3.139** | 0.731 | 0.224 | -0.075 | 0.364 | 13.598 |
| **h = 3d** | XGBoost | Ungauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.873** | 0.722 | 0.028 | -1.619 | 0.026 | 16.881 |
| **h = 3d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,466 | 98.4% | **3.351** | 1.002 | 0.082 | -0.627 | 0.162 | 14.054 |
| **h = 3d** | XGBoost | Gauged | Temporal_Val_Test_A | 86,336 | 99.0% | **3.853** | 0.528 | 0.205 | -0.368 | 0.323 | 17.050 |
| **h = 3d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,466 | 98.4% | **3.158** | 0.735 | 0.237 | -0.102 | 0.353 | 13.643 |
| **h = 7d** | Persistence | Gauged | Temporal_Val_Test_A | 85,729 | 98.8% | **5.484** | 0.761 | -0.377 | -0.276 | 0.311 | 18.544 |
| **h = 7d** | Persistence | Gauged | Geographic_Val_Test_B | 21,307 | 98.2% | **4.459** | 1.050 | -0.502 | -0.372 | 0.244 | 14.660 |
| **h = 7d** | Climatology | Gauged | Temporal_Val_Test_A | 85,862 | 99.0% | **4.012** | 0.793 | 0.015 | -0.830 | -0.034 | 17.336 |
| **h = 7d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,346 | 98.4% | **3.927** | 1.452 | -0.124 | -1.231 | -0.373 | 15.622 |
| **h = 7d** | Ridge_Regression | Ungauged | Temporal_Val_Test_A | 85,862 | 99.0% | **4.116** | 0.950 | -0.189 | -2.296 | -0.224 | 17.828 |
| **h = 7d** | Ridge_Regression | Ungauged_PUB | Geographic_Val_Test_B | 21,346 | 98.4% | **3.540** | 1.141 | -0.031 | -0.737 | -0.037 | 14.679 |
| **h = 7d** | Ridge_Regression | Gauged | Temporal_Val_Test_A | 85,862 | 99.0% | **4.016** | 0.724 | 0.009 | -1.137 | -0.006 | 17.593 |
| **h = 7d** | Ridge_Regression | Gauged_Transfer | Geographic_Val_Test_B | 21,346 | 98.4% | **3.364** | 0.937 | 0.033 | -0.266 | 0.109 | 14.330 |
| **h = 7d** | LightGBM | Ungauged | Temporal_Val_Test_A | 85,862 | 99.0% | **4.005** | 0.790 | -0.013 | -1.518 | -0.137 | 17.448 |
| **h = 7d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,346 | 98.4% | **3.586** | 1.130 | -0.013 | -0.648 | -0.082 | 14.797 |
| **h = 7d** | LightGBM | Gauged | Temporal_Val_Test_A | 85,862 | 99.0% | **3.981** | 0.663 | 0.042 | -0.457 | 0.118 | 17.434 |
| **h = 7d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,346 | 98.4% | **3.356** | 0.896 | 0.033 | -0.198 | 0.105 | 14.348 |
| **h = 7d** | XGBoost | Ungauged | Temporal_Val_Test_A | 85,862 | 99.0% | **4.043** | 0.802 | -0.026 | -1.564 | -0.143 | 17.503 |
| **h = 7d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,346 | 98.4% | **3.587** | 1.120 | -0.012 | -0.657 | -0.029 | 14.781 |
| **h = 7d** | XGBoost | Gauged | Temporal_Val_Test_A | 85,862 | 99.0% | **3.988** | 0.663 | 0.039 | -0.491 | 0.145 | 17.416 |
| **h = 7d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,346 | 98.4% | **3.348** | 0.909 | 0.026 | -0.201 | 0.115 | 14.252 |

---

## 3. Rigorous Hydrological Findings & Discussion (Audited)

### 3.1 Horizon Decay & the 7-Day Limit Without Future Weather Feeds
- **At h = 1 day (Short-term lead):** River channel storage and soil moisture inertia provide strong physical continuity. Persistence achieves Median NSE of 0.622 on Test A and 0.506 on Test B. GBDT models (LightGBM and XGBoost) outperform persistence by incorporating antecedent precipitation ($API$), 1-day rain, and soil moisture interactions, reducing RMSE from 4.161 to 2.968 mm/day.
- **At h = 3 days (Medium lead):** Autocorrelation in small-to-medium basins decays substantially; Persistence Median NSE drops to near zero / slightly negative (-0.044 on Test A, -0.093 on Test B). Tree models retain modest predictive skill (Median NSE ~0.19–0.24 in gauged mode; ~0.08 in ungauged mode) by leveraging slower soil moisture drainage and catchment storage.
- **At h = 7 days (Synoptic lead):** **Predictive skill is severely constrained without future meteorological forecast feeds.**
  - On Test A (Gauged): LightGBM and XGBoost achieve Median NSE of only **0.039 to 0.042**, which is only a marginal improvement over simple climatology (Median NSE = 0.015).
  - On Test B (Ungauged PUB): Both LightGBM and XGBoost exhibit **negative Median NSE (-0.013 and -0.012)**.
  - **Physical Explanation:** The current dataset provides only historical reanalysis up to forecast origin date $t$. The pipeline does NOT possess an operational numerical weather prediction (NWP) feed for future days $t+1 \dots t+7$. Any precipitation event occurring after origin $t$ is completely unobserved, setting an upper physical bound on 7-day predictability.

### 3.2 Gauged Transfer vs. Genuinely Ungauged (PUB) Transfer on Unseen Basins (Test B)
- **Gauged Transfer (Unseen Catchment, Historical Flow Available at Origin):** When an unseen basin has an active streamflow gauge providing historical discharge up to date $t$, tree models transfer effectively (Median NSE = 0.624 at $h=1$d, beating Persistence at 0.506).
- **Ungauged Transfer / PUB (Unseen Catchment, Zero Historical Flow Available):** When predicting in a basin with NO historical gauge observations, models rely exclusively on static descriptors (`drainage_area`, `latitude/longitude`) and dynamic weather forcing. At $h=1$d, ungauged tree models achieve positive Median NSE (0.268–0.315), demonstrating that meteorological forcing and catchment scaling transfer physical signal. However, at $h=7$d, ungauged models drop to negative Median NSE (-0.013), confirming that long-lead flood forecasting in ungauged basins requires either future weather forecasts or calibrated hydrological reservoir state representations.

### 3.3 High-Flow Extreme Event Detection ($Q_{95}$) & Evaluation Transparency
- High-flow threshold analysis tracks the top 5% peak discharges ($Q_{95}$).
- For Development catchments, $Q_{95}$ is computed strictly on Development Training data ($t \le 2012\text{-}12\text{-}31$).
- In geographic holdout evaluation, per-catchment $Q_{95}$ functions as an *objective ground-truth evaluation filter* (identifying whether the model captured the largest observed discharge events). However, for operational flood forecasting in genuinely ungauged catchments where no gauge exists to establish historical percentiles, regional area-normalized thresholds must be adopted.

### 3.4 Geographic Scope & Pilot Caveat
- The current 150-catchment benchmark covers two continents (CAMELS-AUS and CAMELS-US). While providing valuable cross-continental contrast between arid/ephemeral Australian rivers and temperate/snow-dominated American basins, it represents a pilot evaluation and does not constitute full global coverage across all continents (e.g. Asia, South America, Africa).
