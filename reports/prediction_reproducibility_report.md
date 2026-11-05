# BASINSHIFT · Prediction Reproducibility & Benchmark Audit Report
**Role:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 5, 2026  
**Authoritative Plan:** `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html` (Version 2.0)  
**Predictions Artifact:** `reports/predictions/benchmark_per_sample_predictions.parquet` (1,961,100 rows)  
**Reproducibility Match Rate:** **100.00%**  

---

## 1. Executive Summary
All 12 saved tree model artifacts and 2 baseline models were re-loaded from disk and executed against Test A (Temporal Validation) and Test B (Geographic Validation) partitions.
Every individual forecast prediction was recorded into an immutable per-sample audit log.
All summary evaluation metrics (RMSE, MAE, NSE, KGE, High-Flow RMSE, N_valid) were independently recalculated and confirmed to match the original benchmark report with **100.00% exact numerical identity**.

---

## 2. Saved Predictions Inventory
| Property | Value | Description |
| :--- | :--- | :--- |
| **Total Prediction Records** | **1,961,100 rows** | Comprehensive station-day forecasts |
| **Unique Catchments Covered** | 150 catchments | 120 Test A + 30 Test B |
| **Forecast Horizons** | h = 1, 3, 7 days | Synchronized multi-lead evaluation |
| **Models Audited** | Persistence, Climatology, LightGBM, XGBoost | 4 model families |
| **Feature Modes** | Gauged, Ungauged (PUB), Gauged Transfer | Dual transfer evaluation |
| **Temporal Span** | 2013-01-01 to 2014-12-30 | Strict 2-year forward evaluation |

---

## 3. High-Flow Threshold ($Q_{95}$) Audit Findings
1. **Status in Model Training:** $Q_{95}$ is **NEVER passed as an input feature** to LightGBM, XGBoost, or Ridge regression. Tree models predict continuous discharge directly without threshold leakage.
2. **Status in Test A (Temporal Validation):** $Q_{95}$ was derived strictly from the Development Training window ($2005	ext{--}2012$). Zero leakage into Test A evaluation.
3. **Status in Test B (Geographic Holdout):** In the original benchmark script, $Q_{95}$ for the 30 holdout basins was calculated using their full 10-year ground-truth records. This acted as an *evaluation ground-truth mask* (defining what objectively constitutes the top 5% of flow in reality).
4. **Recommendation for Stage C:** For truly ungauged catchments (PUB) in operational deployment, no gauge exists to compute $Q_{95}$. Regional specific discharge thresholds must be used for operational alerting.

---

## 4. Benchmark Metric Comparison & Verification Table

| Horizon | Model | Mode | Partition | Valid Samples | RMSE (Orig / Repro) | Med-NSE (Orig / Repro) | Med-KGE (Orig / Repro) | High-Flow RMSE | Status |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **h = 1d** | Persistence | Gauged | Temporal_Val_Test_A | 86,544 | 4.161 / 4.161 | 0.622 / 0.622 | 0.811 / 0.811 | 18.053 | **VERIFIED MATCH** |
| **h = 1d** | Persistence | Gauged | Geographic_Val_Test_B | 21,518 | 3.155 / 3.155 | 0.506 / 0.506 | 0.753 / 0.753 | 13.923 | **VERIFIED MATCH** |
| **h = 1d** | Climatology | Gauged | Temporal_Val_Test_A | 86,574 | 3.994 / 3.994 | 0.017 / 0.017 | -0.041 / -0.041 | 17.331 | **VERIFIED MATCH** |
| **h = 1d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,526 | 3.914 / 3.914 | -0.132 / -0.132 | -0.368 / -0.368 | 15.626 | **VERIFIED MATCH** |
| **h = 1d** | LightGBM | Ungauged | Temporal_Val_Test_A | 86,574 | 3.333 / 3.333 | 0.248 / 0.248 | 0.196 / 0.196 | 14.315 | **VERIFIED MATCH** |
| **h = 1d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,526 | 2.809 / 2.809 | 0.268 / 0.268 | 0.328 / 0.328 | 11.629 | **VERIFIED MATCH** |
| **h = 1d** | LightGBM | Gauged | Temporal_Val_Test_A | 86,574 | 3.111 / 3.111 | 0.652 / 0.652 | 0.683 / 0.683 | 13.906 | **VERIFIED MATCH** |
| **h = 1d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,526 | 2.412 / 2.412 | 0.624 / 0.624 | 0.694 / 0.694 | 10.641 | **VERIFIED MATCH** |
| **h = 1d** | XGBoost | Ungauged | Temporal_Val_Test_A | 86,574 | 3.390 / 3.390 | 0.172 / 0.172 | 0.175 / 0.175 | 14.518 | **VERIFIED MATCH** |
| **h = 1d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,526 | 2.735 / 2.735 | 0.315 / 0.315 | 0.407 / 0.407 | 11.358 | **VERIFIED MATCH** |
| **h = 1d** | XGBoost | Gauged | Temporal_Val_Test_A | 86,574 | 2.968 / 2.968 | 0.644 / 0.644 | 0.682 / 0.682 | 13.240 | **VERIFIED MATCH** |
| **h = 1d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,526 | 2.440 / 2.440 | 0.586 / 0.586 | 0.710 / 0.710 | 10.731 | **VERIFIED MATCH** |
| **h = 3d** | Persistence | Gauged | Temporal_Val_Test_A | 86,263 | 5.295 / 5.295 | -0.044 / -0.044 | 0.478 / 0.478 | 22.504 | **VERIFIED MATCH** |
| **h = 3d** | Persistence | Gauged | Geographic_Val_Test_B | 21,446 | 4.107 / 4.107 | -0.093 / -0.093 | 0.454 / 0.454 | 16.563 | **VERIFIED MATCH** |
| **h = 3d** | Climatology | Gauged | Temporal_Val_Test_A | 86,336 | 4.001 / 4.001 | 0.019 / 0.019 | -0.039 / -0.039 | 17.344 | **VERIFIED MATCH** |
| **h = 3d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,466 | 3.918 / 3.918 | -0.130 / -0.130 | -0.370 / -0.370 | 15.622 | **VERIFIED MATCH** |
| **h = 3d** | LightGBM | Ungauged | Temporal_Val_Test_A | 86,336 | 3.897 / 3.897 | 0.028 / 0.028 | 0.036 / 0.036 | 16.996 | **VERIFIED MATCH** |
| **h = 3d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,466 | 3.342 / 3.342 | 0.083 / 0.083 | 0.146 / 0.146 | 14.011 | **VERIFIED MATCH** |
| **h = 3d** | LightGBM | Gauged | Temporal_Val_Test_A | 86,336 | 3.834 / 3.834 | 0.192 / 0.192 | 0.344 / 0.344 | 16.975 | **VERIFIED MATCH** |
| **h = 3d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,466 | 3.139 / 3.139 | 0.224 / 0.224 | 0.364 / 0.364 | 13.598 | **VERIFIED MATCH** |
| **h = 3d** | XGBoost | Ungauged | Temporal_Val_Test_A | 86,336 | 3.873 / 3.873 | 0.028 / 0.028 | 0.026 / 0.026 | 16.881 | **VERIFIED MATCH** |
| **h = 3d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,466 | 3.351 / 3.351 | 0.082 / 0.082 | 0.162 / 0.162 | 14.054 | **VERIFIED MATCH** |
| **h = 3d** | XGBoost | Gauged | Temporal_Val_Test_A | 86,336 | 3.853 / 3.853 | 0.205 / 0.205 | 0.323 / 0.323 | 17.050 | **VERIFIED MATCH** |
| **h = 3d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,466 | 3.158 / 3.158 | 0.237 / 0.237 | 0.353 / 0.353 | 13.643 | **VERIFIED MATCH** |
| **h = 7d** | Persistence | Gauged | Temporal_Val_Test_A | 85,729 | 5.484 / 5.484 | -0.377 / -0.377 | 0.311 / 0.311 | 18.544 | **VERIFIED MATCH** |
| **h = 7d** | Persistence | Gauged | Geographic_Val_Test_B | 21,307 | 4.459 / 4.459 | -0.502 / -0.502 | 0.244 / 0.244 | 14.660 | **VERIFIED MATCH** |
| **h = 7d** | Climatology | Gauged | Temporal_Val_Test_A | 85,862 | 4.012 / 4.012 | 0.015 / 0.015 | -0.034 / -0.034 | 17.336 | **VERIFIED MATCH** |
| **h = 7d** | Climatology | Ungauged | Geographic_Val_Test_B | 21,346 | 3.927 / 3.927 | -0.124 / -0.124 | -0.373 / -0.373 | 15.622 | **VERIFIED MATCH** |
| **h = 7d** | LightGBM | Ungauged | Temporal_Val_Test_A | 85,862 | 4.005 / 4.005 | -0.013 / -0.013 | -0.137 / -0.137 | 17.448 | **VERIFIED MATCH** |
| **h = 7d** | LightGBM | Ungauged_PUB | Geographic_Val_Test_B | 21,346 | 3.586 / 3.586 | -0.013 / -0.013 | -0.082 / -0.082 | 14.797 | **VERIFIED MATCH** |
| **h = 7d** | LightGBM | Gauged | Temporal_Val_Test_A | 85,862 | 3.981 / 3.981 | 0.042 / 0.042 | 0.118 / 0.118 | 17.434 | **VERIFIED MATCH** |
| **h = 7d** | LightGBM | Gauged_Transfer | Geographic_Val_Test_B | 21,346 | 3.356 / 3.356 | 0.033 / 0.033 | 0.105 / 0.105 | 14.348 | **VERIFIED MATCH** |
| **h = 7d** | XGBoost | Ungauged | Temporal_Val_Test_A | 85,862 | 4.043 / 4.043 | -0.026 / -0.026 | -0.143 / -0.143 | 17.503 | **VERIFIED MATCH** |
| **h = 7d** | XGBoost | Ungauged_PUB | Geographic_Val_Test_B | 21,346 | 3.587 / 3.587 | -0.012 / -0.012 | -0.029 / -0.029 | 14.781 | **VERIFIED MATCH** |
| **h = 7d** | XGBoost | Gauged | Temporal_Val_Test_A | 85,862 | 3.988 / 3.988 | 0.039 / 0.039 | 0.145 / 0.145 | 17.416 | **VERIFIED MATCH** |
| **h = 7d** | XGBoost | Gauged_Transfer | Geographic_Val_Test_B | 21,346 | 3.348 / 3.348 | 0.026 / 0.026 | 0.115 / 0.115 | 14.252 | **VERIFIED MATCH** |