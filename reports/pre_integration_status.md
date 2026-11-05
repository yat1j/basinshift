# BASINSHIFT · Pre-Integration Reconnaissance Report

**Auditor:** Technical Data Auditor & Lead ML Engineer (Member 1: Model & Training)  
**Date & Time:** November 5, 2026, 05:10 IST  
**Execution Context:** 4.5 hours remaining before cross-team application integration begins (followed by a protected 2.5-hour buffer).  
**Task Mode:** STRICTLY READ-ONLY reconnaissance snapshot. No code modifications, model retraining, or file deletions performed.

---

## 1. Actual Project Structure

Inspection of `d:\hackathon\basinshift` and sibling directories reveals the following on-disk structure:

```text
d:\hackathon\
├── hackoween/                                        # Challenge specification store
│   ├── BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html  # Authoritative Master Execution Plan (v2.0)
│   └── BASINSHIFT_Full_Challenge_Documentation.pdf       # Challenge Specification
└── basinshift/                                       # Member 1 ML & Data Pipeline
    ├── configs/                                      # [EMPTY] No active config files
    ├── data/
    │   ├── processed/
    │   │   └── pilot_150_catchments.parquet          # 150 catchments, 10 continuous years (547,800 rows, 16.39 MB)
    │   ├── raw/                                      # [EMPTY] Raw files ingested via Cloud Zarr / OpenDAP
    │   └── sample/
    │       ├── integrated_5_catchments_weather_streamflow.nc # Connectivity pilot
    │       └── sample_5_catchments_era5land.nc
    ├── docs/
    │   ├── pilot_catchment_manifest.csv              # 150 catchments (75 CAMELS-AUS, 75 CAMELS-US)
    │   └── split_manifest.csv                        # 120 Development / 30 Geographic Holdout split
    ├── models/                                       # 24 serialized model artifacts (Joblib)
    ├── reports/
    │   ├── predictions/
    │   │   ├── benchmark_per_sample_predictions.parquet # Stage B predictions (5.92 MB)
    │   │   └── stage_c_per_sample_predictions.parquet   # Stage C predictions (1,307,400 rows, 12.31 MB)
    │   ├── benchmark_audit.md
    │   ├── benchmark_model_evaluation.csv
    │   ├── benchmark_model_evaluation.md
    │   ├── classifier_calibration_audit.csv          # 12-regime classifier audit
    │   ├── ensemble_effectiveness_audit.csv          # Simplex QP weights & degeneracy audit
    │   ├── ensemble_weights.csv                      # Learned convex weights
    │   ├── high_flow_thresholds.csv                  # Frozen Q95 (AUS: 2.9271, US: 5.4040 mm/d)
    │   ├── hydrological_mass_balance_audit.csv       # 150-catchment mass balance audit
    │   ├── hydrology_variant_comparison.csv          # Variant A vs Variant B benchmarks
    │   ├── missing_data_audit.md
    │   ├── missingness_by_catchment.csv
    │   ├── prediction_reproducibility_report.md
    │   ├── stage_c_classification_evaluation.csv
    │   ├── stage_c_completion_report.md
    │   ├── stage_c_regression_evaluation.csv
    │   └── stage_c_scientific_validation.md
    ├── src/basinshift/                               # 17 Python pipeline & audit modules
    │   ├── __init__.py
    │   ├── audit_breakdown.py
    │   ├── audit_classifier_calibration.py
    │   ├── audit_coverage.py
    │   ├── audit_ensemble_effectiveness.py
    │   ├── audit_features.py
    │   ├── audit_mass_balance.py
    │   ├── compare_variants.py
    │   ├── compute_thresholds.py
    │   ├── ensemble.py                               # ConstrainedEnsemble QP solver
    │   ├── features.py                               # Rolling & lag feature pipeline
    │   ├── high_flow_classifier.py                   # HighFlowClassifier LightGBM head
    │   ├── hybrid.py                                 # ConceptualHydrologyHybrid (Ridge + LGBM)
    │   ├── hydrology.py                              # Conceptual reservoir simulation (Variant A)
    │   ├── ingest.py                                 # Ingestion & split creation
    │   ├── metrics.py                                # NSE, KGE, evaluate_predictions
    │   ├── reproduce_predictions.py                  # Exact reproducibility audit
    │   ├── train_evaluate.py                         # Stage B benchmark pipeline
    │   ├── train_stage_c.py                          # Stage C orchestration pipeline
    │   └── verify_features.py
    ├── tests/                                        # 4 test suites (33 tests, all passing)
    │   ├── test_data_quality.py                      # 8 tests
    │   ├── test_feature_pipeline.py                  # 10 tests
    │   ├── test_stage_c.py                           # 9 tests
    │   └── test_stage_c_audit.py                     # 6 tests
    ├── MEMBER1_CHALLENGE_DECISIONS.md
    ├── MEMBER1_DATA_AUDIT.md
    ├── MEMBER1_OPENDAP_ACCESS_REPORT.md
    └── MEMBER1_STREAMFLOW_ACCESS_REPORT.md
```

### Frontend & Backend Presence
- **Current Status:** Both frontend and backend application directories are **absent** from the workspace.
- **Specification in Master Plan:** Section 6 defines Member 2's delivery as a **FastAPI backend** (`/health`, `/predict`, `/metrics`) and a **Next.js / React frontend** (6 presentation screens).
- **Integration Implication:** Integration has not started. Member 1 currently maintains the complete modelling, data, and testing foundation, but no HTTP server or UI exists yet in this codebase.

---

## 2. Exact Model Artifact Inventory

Verification of `models/` confirms exactly **24 serialized `.joblib` files** (all created on November 5, 2026).

| # | Artifact Filename | Size (KB) | Model Class | Lead ($h$) | Mode | Expected Features | Hydro Lineage | Decision $\tau$ | Embedded Components |
| :-: | :--- | :-: | :--- | :-: | :--- | :-: | :---: | :-: | :--- |
| 1 | `classifier_gauged_h1.joblib` | 420.4 | `HighFlowClassifier` | 1d | Gauged | 61 | Variant A | 0.50 | LightGBM binary booster |
| 2 | `classifier_gauged_h3.joblib` | 420.0 | `HighFlowClassifier` | 3d | Gauged | 61 | Variant A | 0.50 | LightGBM binary booster |
| 3 | `classifier_gauged_h7.joblib` | 419.6 | `HighFlowClassifier` | 7d | Gauged | 61 | Variant A | 0.50 | LightGBM binary booster |
| 4 | `classifier_ungauged_h1.joblib` | 417.5 | `HighFlowClassifier` | 1d | Ungauged | 46 | Variant A | 0.50 | LightGBM binary booster |
| 5 | `classifier_ungauged_h3.joblib` | 417.3 | `HighFlowClassifier` | 3d | Ungauged | 46 | Variant A | 0.50 | LightGBM binary booster |
| 6 | `classifier_ungauged_h7.joblib` | 417.3 | `HighFlowClassifier` | 7d | Ungauged | 46 | Variant A | 0.50 | LightGBM binary booster |
| 7 | `hybrid_gauged_h1.joblib` | 348.8 | `ConceptualHydrologyHybrid` | 1d | Gauged | 61 | Variant A | N/A | Base Ridge + LGBM Residual |
| 8 | `hybrid_gauged_h3.joblib` | 348.2 | `ConceptualHydrologyHybrid` | 3d | Gauged | 61 | Variant A | N/A | Base Ridge + LGBM Residual |
| 9 | `hybrid_gauged_h7.joblib` | 350.6 | `ConceptualHydrologyHybrid` | 7d | Gauged | 61 | Variant A | N/A | Base Ridge + LGBM Residual |
| 10 | `hybrid_ungauged_h1.joblib` | 354.0 | `ConceptualHydrologyHybrid` | 1d | Ungauged | 46 | Variant A | N/A | Base Ridge + LGBM Residual |
| 11 | `hybrid_ungauged_h3.joblib` | 353.4 | `ConceptualHydrologyHybrid` | 3d | Ungauged | 46 | Variant A | N/A | Base Ridge + LGBM Residual |
| 12 | `hybrid_ungauged_h7.joblib` | 353.1 | `ConceptualHydrologyHybrid` | 7d | Ungauged | 46 | Variant A | N/A | Base Ridge + LGBM Residual |
| 13 | `lightgbm_gauged_h1.joblib` | 339.5 | `LGBMRegressor` | 1d | Gauged | 48 | None (Stage B) | N/A | Single LightGBM model |
| 14 | `lightgbm_gauged_h3.joblib` | 344.3 | `LGBMRegressor` | 3d | Gauged | 48 | None (Stage B) | N/A | Single LightGBM model |
| 15 | `lightgbm_gauged_h7.joblib` | 345.5 | `LGBMRegressor` | 7d | Gauged | 48 | None (Stage B) | N/A | Single LightGBM model |
| 16 | `lightgbm_ungauged_h1.joblib` | 346.7 | `LGBMRegressor` | 1d | Ungauged | 33 | None (Stage B) | N/A | Single LightGBM model |
| 17 | `lightgbm_ungauged_h3.joblib` | 348.6 | `LGBMRegressor` | 3d | Ungauged | 33 | None (Stage B) | N/A | Single LightGBM model |
| 18 | `lightgbm_ungauged_h7.joblib` | 349.2 | `LGBMRegressor` | 7d | Ungauged | 33 | None (Stage B) | N/A | Single LightGBM model |
| 19 | `xgboost_gauged_h1.joblib` | 462.1 | `XGBRegressor` | 1d | Gauged | 48 | None (Stage B) | N/A | Single XGBoost booster |
| 20 | `xgboost_gauged_h3.joblib` | 459.1 | `XGBRegressor` | 3d | Gauged | 48 | None (Stage B) | N/A | Single XGBoost booster |
| 21 | `xgboost_gauged_h7.joblib` | 461.3 | `XGBRegressor` | 7d | Gauged | 48 | None (Stage B) | N/A | Single XGBoost booster |
| 22 | `xgboost_ungauged_h1.joblib` | 477.6 | `XGBRegressor` | 1d | Ungauged | 33 | None (Stage B) | N/A | Single XGBoost booster |
| 23 | `xgboost_ungauged_h3.joblib` | 470.0 | `XGBRegressor` | 3d | Ungauged | 33 | None (Stage B) | N/A | Single XGBoost booster |
| 24 | `xgboost_ungauged_h7.joblib` | 476.2 | `XGBRegressor` | 7d | Ungauged | 33 | None (Stage B) | N/A | Single XGBoost booster |

### Metadata Observations & Missing Artifacts
1. **No Standalone Ridge Artifacts:** Standalone Ridge regressors are not serialized separately in `models/`; they only exist embedded inside `hybrid_*.joblib` as `.base_pipeline`.
2. **No Serialized Ensemble Objects:** Constrained Ensemble instances (`ConstrainedEnsemble`) are not serialized as `.joblib` objects; their learned weights reside solely in `reports/ensemble_weights.csv`.
3. **No Variant B Artifacts:** Zero Variant B hybrid models were saved to `models/`. All saved hybrids strictly require the 13 Variant A feature columns.
4. **Naming Consistency:** Filenames follow strict lowercase conventions: `{family}_{mode}_h{horizon}.joblib`.

---

## 3. Existing Inference Capabilities

### Available Reusable Code
- **Feature Computation:**
  - `src/basinshift/features.py:compute_features(df)`: Computes rolling aggregations (7, 14, 30, 90, 180, 365 days), temporal lags (1, 2, 3, 7, 14, 30 days), and seasonal calendar signals.
  - `src/basinshift/hydrology.py:compute_conceptual_reservoirs(df)`: Generates the 13 Variant A reservoir state and outflow features expected by `hybrid_*.joblib` and `classifier_*.joblib`.
  - `src/basinshift/features.py:get_feature_columns()`: Returns `(ungauged_cols, gauged_cols)`.
- **Component Prediction Methods:**
  - `ConceptualHydrologyHybrid.predict(df)`: Returns `(y_pred, y_base, residual_pred)`.
  - `HighFlowClassifier.predict_proba(df)`: Returns calibrated event probability vector.
  - `ConstrainedEnsemble.predict(candidates_matrix)`: Dot product of candidate predictions with simplex weights.
  - `LGBMRegressor.predict(X)` and `XGBRegressor.predict(X)`.

### Missing Inference Capabilities
- **No Unified Inference Module:** There is no `src/basinshift/inference.py` or entry function that takes a query, loads models, extracts features, blends predictions, and formats the output.
- **No Central Model Registry:** Scripts load artifacts individually with hardcoded paths.
- **No Input Validation / Pydantic Schemas:** No JSON schema or payload validator exists.
- **Single-Sample History Gap:** `compute_features()` requires a historical dataframe of at least 365 days to compute rolling statistics without generating NaNs. There is no lightweight streaming feature generator for single-sample payloads.
- **No Backend Endpoint:** No FastAPI `/predict` route exists.

---

## 4. Important Outstanding Inconsistencies

### A. Classifier Discrepancies (Resolved Root Cause)
- **Observed Difference:** `reports/stage_c_completion_report.md` and `reports/stage_c_classification_evaluation.csv` report sample counts that vary by horizon:
  - $h=1\text{d}$: $N=86,574$ (Temporal Val Test A)
  - $h=3\text{d}$: $N=86,336$ (Temporal Val Test A)
  - $h=7\text{d}$: $N=85,862$ (Temporal Val Test A)
  Whereas an earlier text draft in `reports/stage_c_scientific_validation.md` listed a constant $N=86,574$ across all horizons with different PR-AUC numbers ($0.6010$ vs $0.6463$ at $h=3$d; $0.4632$ vs $0.5473$ at $h=7$d).
- **Diagnosis:** Shifting future target labels $y(t+h)$ leaves the final $h$ days of each catchment record as NaN. Filtering `binary_target.notna()` correctly reduces valid sample counts by $238$ rows ($h=3$) and $712$ rows ($h=7$). The authoritative, mathematically consistent values are those in `reports/stage_c_classification_evaluation.csv` and `reports/classifier_calibration_audit.csv`.

### B. Hybrid Model Lineage
- **Inspection Finding:** Every saved `hybrid_*.joblib` artifact in `models/` uses the **13 Variant A feature columns** (`hydro_p_eff`, `hydro_snowmelt`, `hydro_water_input`, `hydro_s_fast`, `hydro_s_med`, `hydro_s_slow`, `hydro_s_deep`, `hydro_q_fast`, `hydro_q_med`, `hydro_q_slow`, `hydro_q_routed_total`, `hydro_fast_slow_ratio`, `hydro_storage_total`).
- **Audit Context:** Variant B (11 columns, prefixed `hydro_v2_`) was developed and validated in `src/basinshift/audit_mass_balance.py` as a benchmark comparison, but **was never serialized to `models/`**. The inference engine must use `src/basinshift/hydrology.py` (Variant A) to remain compatible with existing saved models.

### C. Model Configuration & Parameters
The following configuration parameters must be inspected and handled during integration:
1. **Regional $Q_{95}$ Thresholds (`reports/high_flow_thresholds.csv`):**
   - CAMELS-AUS: **2.9271 mm/d**
   - CAMELS-US: **5.4040 mm/d**
2. **Decision Thresholds ($\tau$):**
   - Default stored in `HighFlowClassifier`: **$\tau = 0.50$**
   - Optimal training-derived threshold in audit: **$\tau^* = 0.60\text{--}0.70$** (yields higher F1)
3. **Ensemble Weights (`reports/ensemble_weights.csv`):**
   - $h=1\text{d}$ Ungauged: XGBoost = 0.9249, Ridge = 0.0751, LGBM = 0.0, Hybrid = 0.0
   - All other 5 horizon/mode settings: XGBoost = 1.0000 (degenerate single-model selection)
4. **Hydrological Constants (`src/basinshift/hydrology.py`):**
   - Soil moisture clipping: $[0.05, 1.0]$, normalization: $0.40$
   - Linear reservoir decay rates: $\alpha = [0.50, 0.80, 0.95, 0.98]$
   - SWE unit scaling: $\times 1,000.0$ ($m \to mm$)

---

## 5. Existing Test Status

### Test Suite Summary
- **Test Modules:** 4 files in `tests/`
- **Total Test Count:** 33 unit tests
- **Execution Command:** `python -m unittest discover tests`
- **Most Recent Execution Evidence (November 5, 2026, 05:08:22 IST):**
  ```text
  Ran 33 tests in 2.475s
  OK
  ```

### Breakdown of Test Coverage
1. `tests/test_data_quality.py` (8 tests): Validates raw parquet schema, non-negativity of precipitation/drainage area, absence of unexpected NaNs, temporal continuity, and 75/75 catchment split.
2. `tests/test_feature_pipeline.py` (10 tests): Asserts strict feature non-leakage ($t' \le t$), rolling window alignment, and complete exclusion of discharge features in ungauged mode.
3. `tests/test_stage_c.py` (9 tests): Validates training-only threshold derivation, absence of holdout leakage, out-of-fold residual calculation, boundary fold purging, and saved model feature column schemas.
4. `tests/test_stage_c_audit.py` (6 tests): Validates reservoir mass balance (< $0.001\text{ mm}$ error in Variant B), snowmelt physical bounds, non-leaking classifier threshold search, calibration metrics integrity, ensemble simplex constraints, and single-model degeneracy detection.

### Test Scope Limitation
The test suite strictly validates **data quality, mathematical formulas, training logic, and static artifact schemas**. There is currently **zero automated test coverage for live end-to-end inference** (e.g. taking a raw JSON payload, executing feature extraction, running all models, and returning an API response).

---

## 6. The Three Most Important Blockers Before Integration

1. **Blocker 1: Absence of a Unified Inference Facade (`src/basinshift/inference.py`)**  
   *Problem:* The models currently cannot be invoked through a single Python function. A caller must manually load up to 4 models per lead time, compute rolling features, compute hydrological reservoirs, align feature columns, evaluate the models, load `ensemble_weights.csv`, apply simplex blending, and run the classifier.  
   *Requirement:* A dedicated `InferencePipeline` class that exposes a clean method:
   `predict(catchment_id, forecast_origin, history_df) -> Dict[str, Any]` matching the master plan's API contract.

2. **Blocker 2: Antecedent History Dependency for Feature Generation**  
   *Problem:* `features.py` computes rolling aggregations up to 365 days (`roll_mean_365`, `roll_sum_365`) and lags up to 30 days. If the backend or frontend sends only a single day's meteorological record for inference, all rolling features become NaN and model execution fails.  
   *Requirement:* An integration protocol specifying where antecedent history originates. For the demo app, the backend should either query the local `data/processed/pilot_150_catchments.parquet` for the preceding 365 days or accept a historical time-series payload.

3. **Blocker 3: Absence of Backend API Service & Request Validation Schemas**  
   *Problem:* No web framework (FastAPI) or endpoint routing (`/health`, `/predict`, `/metrics`) is present in the workspace. There are no Pydantic data schemas defining valid catchment IDs, bounding boxes, or parameter types.  
   *Requirement:* A lightweight FastAPI application (`src/basinshift/api.py` or `api/main.py`) implementing the illustrative schema from Section 6.2 of the master plan, including offline fallback handling.

