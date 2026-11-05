# BASINSHIFT: FastAPI Backend API Specification & Contract

**Author:** Lead ML Engineer  
**Date:** November 5, 2026  
**Status:** PRODUCTION-READY & INDEPENDENTLY TESTED  
**Execution Plan Alignment:** BASINSHIFT Master Plan Rubric-Aligned v2.0, Section 5 (FastAPI Integration)  
**Base URL:** `http://127.0.0.1:8000`  
**Interactive Documentation (Swagger):** `http://127.0.0.1:8000/docs`  

---

## 1. Architectural Overview & Design Principles

The BASINSHIFT API connects frontend user interfaces and data workflows to the underlying machine learning pipeline (`InferencePipeline`) implementing multi-horizon streamflow forecasting and probabilistic flood classification across gauged and ungauged catchments.

### Key Architectural Guarantees:
1. **Singleton Inference Lifecycle:** All 13 production model artifacts (6 XGBoost regressors, 6 LightGBM high-flow classifiers, 1 embedded Ridge pipeline) are initialized once during server startup (`@asynccontextmanager lifespan`) and shared across incoming requests. Models are never reloaded per request.
2. **Dual-Regime Support:**
   - **Gauged Mode:** Utilizes antecedent meteorological observations, static catchment attributes, historical discharge lags, and Variant A conceptual reservoirs.
   - **Ungauged Mode (PUB):** Strictly excludes all historical streamflow observations and discharge-derived features (`q_obs_t`, `is_flow_missing_t`, `q_lag_*`, `q_mean_*`, `q_max_*`, `q_std_*`, `q_delta_*`). The `streamflow` column may be entirely absent from uploaded time series.
3. **Strict Temporal Causality:** Any observation in an uploaded CSV with a timestamp strictly greater than `forecast_origin` ($t' > t$) is completely filtered out prior to feature generation and reservoir state calculation. A structured warning is returned to notify the client.
4. **Standardized Error Handling:** All errors return structured JSON payloads with HTTP 400 (malformed input/file), 422 (data validation/schema failure), 503 (pipeline unavailable), or 500 (internal error). Internal Python tracebacks are strictly suppressed.
5. **CORS Security:** Configured via `CORS_ORIGINS` environment variable (defaulting to standard React/Vite development origins: `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080`). Wildcard `*` is prohibited when credentials are enabled.

---

## 2. HTTP Endpoints

### 2.1 GET `/health`
Returns operational health, pipeline readiness, and loaded model artifact inventory.

- **Method:** `GET`
- **Path:** `/health`
- **Authentication:** None
- **Response Status Codes:**
  - `200 OK`: Pipeline is initialized and ready.
  - `503 Service Unavailable`: Pipeline initialization failed or is not ready.

#### Response Body (`200 OK`):
```json
{
  "status": "healthy",
  "pipeline_ready": true,
  "loaded_models_count": 13,
  "loaded_artifacts": [
    "xgboost_gauged_h1.joblib",
    "xgboost_gauged_h3.joblib",
    "xgboost_gauged_h7.joblib",
    "xgboost_ungauged_h1.joblib",
    "xgboost_ungauged_h3.joblib",
    "xgboost_ungauged_h7.joblib",
    "classifier_gauged_h1.joblib",
    "classifier_gauged_h3.joblib",
    "classifier_gauged_h7.joblib",
    "classifier_ungauged_h1.joblib",
    "classifier_ungauged_h3.joblib",
    "classifier_ungauged_h7.joblib",
    "hybrid_ungauged_h1.joblib"
  ],
  "supported_horizons_days": [1, 3, 7],
  "supported_feature_modes": ["gauged", "ungauged"],
  "version": "1.0.0",
  "message": "BASINSHIFT inference engine is initialized and ready."
}
```

---

### 2.2 POST `/predict`
Generates multi-horizon streamflow forecasts and flood alert classifications from an uploaded historical daily time-series CSV.

- **Method:** `POST`
- **Path:** `/predict`
- **Content-Type:** `multipart/form-data`
- **Request Form Fields:**

| Field Name | Type | Required | Description | Example |
|---|---|---|---|---|
| `file` | File (`.csv`) | **Yes** | Daily time-series CSV containing antecedent weather and static attributes. Max size: 25 MB. | `history.csv` |
| `catchment_id` | `string` | **Yes** | Target catchment identifier. Must match `catchment_id` column in CSV. | `"camels_01047000"` |
| `forecast_origin` | `string` | **Yes** | Forecast issue timestamp ($t$) in `YYYY-MM-DD` format. Must be present in CSV. | `"2013-05-15"` |
| `feature_mode` | `string` | No (default `"gauged"`) | Operating mode: `"gauged"` or `"ungauged"`. Case-insensitive. | `"gauged"` |
| `allow_unsupported_region` | `boolean` | No (default `false`) | If `true`, returns regression forecasts with `null` classification if region lacks a frozen $Q_{95}$ threshold. | `false` |

---

### 2.3 GET `/metrics`
Exposes precomputed, audited offline benchmark validation metrics across temporal holdout (Test A) and regional holdout (Test B) partitions.

- **Method:** `GET`
- **Path:** `/metrics`
- **Response Status Codes:** `200 OK`
- **Disclaimer:** Offline evaluation metrics only. Live forecast evaluation is strictly prohibited at inference time because future ground truth streamflow is unavailable.

---

## 3. Uploaded CSV Schema & Variable Contract

The uploaded CSV file must contain continuous antecedent daily observations up to and including `forecast_origin`.

### 3.1 Required Columns

| Column Name | Data Type | Units | Mode Requirement | Description |
|---|---|---|---|---|
| `catchment_id` | String | None | Both | Unique basin identifier (e.g. `camels_01047000`, `camelsaus_105105A`). |
| `date` | String / Date | `YYYY-MM-DD` | Both | Daily calendar date. Must be strictly unique per catchment. |
| `total_precipitation` | Float | $\text{mm/day}$ | Both | Total daily surface precipitation. |
| `temperature_2m` | Float | $^\circ\text{C}$ | Both | Mean 2-meter air temperature. |
| `dewpoint_temperature_2m` | Float | $^\circ\text{C}$ | Both | Mean 2-meter dewpoint temperature. |
| `potential_evaporation` | Float | $\text{mm/day}$ | Both | Daily potential evapotranspiration (PET). |
| `volumetric_soil_water_layer_1` | Float | $\text{m}^3/\text{m}^3$ | Both | Volumetric root-zone soil water content ($0\text{--}7\text{ cm}$). |
| `snow_depth_water_equivalent` | Float | $\text{mm}$ | Both | Snow water equivalent depth. |
| `drainage_area` | Float | $\text{km}^2$ | Both | Upstream catchment contributing drainage area. |
| `source_collection` | String | None | Both | Regional dataset identifier (`CAMELS-US` or `CAMELS-AUS`). |
| `streamflow` | Float | $\text{mm/day}$ | **Gauged only** | Observed daily specific discharge. Missing measurements should be preserved as `NaN` (never 0-filled). **Not required for Ungauged mode.** |

### 3.2 Antecedent History Length Rule
To calculate 365-day rolling statistics (`precip_api_095`, rolling means, annual extrema), the uploaded CSV **must provide at least 365 continuous calendar days** of historical observations strictly on or prior to `forecast_origin`. If $< 365$ days are provided, the API rejects the request with HTTP 422 (`INSUFFICIENT_HISTORY`).

---

## 4. Response Payloads

### 4.1 Successful Response Example (Gauged Mode)
```json
{
  "catchment_id": "camels_01047000",
  "forecast_origin": "2013-05-15",
  "feature_mode": "Gauged",
  "forecast_horizons_days": [1, 3, 7],
  "discharge_unit": "mm/day",
  "predicted_discharge": {
    "1d": 1.8448,
    "3d": 1.9941,
    "7d": 2.0006
  },
  "high_flow_probability": {
    "1d": 0.0153,
    "3d": 0.1105,
    "7d": 0.2775
  },
  "high_flow_alert_threshold": {
    "1d": 0.70,
    "3d": 0.70,
    "7d": 0.60
  },
  "high_flow_alert": {
    "1d": false,
    "3d": false,
    "7d": false
  },
  "extreme_flow_probability": null,
  "prediction_intervals": null,
  "uncertainty_available": false,
  "model_metadata": {
    "regional_q95_threshold_mm_per_day": 5.4040,
    "source_collection": "CAMELS-US",
    "hydrological_features": "Variant A (empirical conceptual interaction features; not physically mass-balanced)",
    "probability_calibration": "Raw model predicted probabilities from LightGBM logistic sigmoid outputs (no post-hoc calibration layer applied)",
    "regression_models": {
      "1d": {
        "model_family": "XGBoost",
        "artifacts": ["xgboost_gauged_h1.joblib"],
        "weights": {"XGBoost": 1.0},
        "raw_predictions": {"XGBoost": 1.8448},
        "post_processing": "max(0.0, raw_prediction)"
      },
      "3d": {
        "model_family": "XGBoost",
        "artifacts": ["xgboost_gauged_h3.joblib"],
        "weights": {"XGBoost": 1.0},
        "raw_predictions": {"XGBoost": 1.9941},
        "post_processing": "max(0.0, raw_prediction)"
      },
      "7d": {
        "model_family": "XGBoost",
        "artifacts": ["xgboost_gauged_h7.joblib"],
        "weights": {"XGBoost": 1.0},
        "raw_predictions": {"XGBoost": 2.0006},
        "post_processing": "max(0.0, raw_prediction)"
      }
    },
    "classifier_models": {
      "1d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_gauged_h1.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.70,
        "target_definition": "streamflow(t+1d) > 5.4040 mm/day"
      },
      "3d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_gauged_h3.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.70,
        "target_definition": "streamflow(t+3d) > 5.4040 mm/day"
      },
      "7d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_gauged_h7.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.60,
        "target_definition": "streamflow(t+7d) > 5.4040 mm/day"
      }
    }
  },
  "forecast_basis": "historical_reanalysis_replay",
  "warnings": []
}
```

### 4.2 Successful Response Example (Ungauged Mode with Ridge Blend)
```json
{
  "catchment_id": "camels_01047000",
  "forecast_origin": "2013-05-15",
  "feature_mode": "Ungauged",
  "forecast_horizons_days": [1, 3, 7],
  "discharge_unit": "mm/day",
  "predicted_discharge": {
    "1d": 0.8637,
    "3d": 1.1861,
    "7d": 0.9960
  },
  "high_flow_probability": {
    "1d": 0.0455,
    "3d": 0.1094,
    "7d": 0.2100
  },
  "high_flow_alert_threshold": {
    "1d": 0.70,
    "3d": 0.66,
    "7d": 0.66
  },
  "high_flow_alert": {
    "1d": false,
    "3d": false,
    "7d": false
  },
  "extreme_flow_probability": null,
  "prediction_intervals": null,
  "uncertainty_available": false,
  "model_metadata": {
    "regional_q95_threshold_mm_per_day": 5.4040,
    "source_collection": "CAMELS-US",
    "hydrological_features": "Variant A (empirical conceptual interaction features; not physically mass-balanced)",
    "probability_calibration": "Raw model predicted probabilities from LightGBM logistic sigmoid outputs (no post-hoc calibration layer applied)",
    "regression_models": {
      "1d": {
        "model_family": "Ensemble (XGBoost + Ridge)",
        "artifacts": ["xgboost_ungauged_h1.joblib", "hybrid_ungauged_h1.joblib"],
        "weights": {"XGBoost": 0.9249, "Ridge": 0.0751},
        "raw_predictions": {"XGBoost": 0.8920, "Ridge": 0.5147},
        "post_processing": "max(0.0, blended_prediction)"
      },
      "3d": {
        "model_family": "XGBoost",
        "artifacts": ["xgboost_ungauged_h3.joblib"],
        "weights": {"XGBoost": 1.0},
        "raw_predictions": {"XGBoost": 1.1861},
        "post_processing": "max(0.0, raw_prediction)"
      },
      "7d": {
        "model_family": "XGBoost",
        "artifacts": ["xgboost_ungauged_h7.joblib"],
        "weights": {"XGBoost": 1.0},
        "raw_predictions": {"XGBoost": 0.9960},
        "post_processing": "max(0.0, raw_prediction)"
      }
    },
    "classifier_models": {
      "1d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_ungauged_h1.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.70,
        "target_definition": "streamflow(t+1d) > 5.4040 mm/day"
      },
      "3d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_ungauged_h3.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.66,
        "target_definition": "streamflow(t+3d) > 5.4040 mm/day"
      },
      "7d": {
        "model_family": "LightGBM Classifier",
        "artifact": "classifier_ungauged_h7.joblib",
        "scale_pos_weight": 5.0,
        "decision_threshold_tau_star": 0.66,
        "target_definition": "streamflow(t+7d) > 5.4040 mm/day"
      }
    }
  },
  "forecast_basis": "historical_reanalysis_replay",
  "warnings": []
}
```

---

## 5. Standardized Error Contracts & Examples

When an API request fails validation, a structured JSON response is returned:

```json
{
  "status": "error",
  "error_code": "ERROR_CODE_STRING",
  "message": "Human readable explanation of the failure.",
  "field": "file | catchment_id | forecast_origin | feature_mode | null",
  "details": null
}
```

### 5.1 HTTP 400: Malformed File or Format Errors
- **Non-CSV File Upload (`INVALID_FILE_FORMAT`):**
  ```json
  {
    "status": "error",
    "error_code": "INVALID_FILE_FORMAT",
    "message": "Uploaded file 'data.json' is not a CSV. File must have a .csv extension.",
    "field": "file",
    "details": null
  }
  ```
- **Empty File Upload (`EMPTY_FILE`):**
  ```json
  {
    "status": "error",
    "error_code": "EMPTY_FILE",
    "message": "Uploaded CSV file is empty.",
    "field": "file",
    "details": null
  }
  ```
- **Malformed CSV Syntax (`MALFORMED_CSV`):**
  ```json
  {
    "status": "error",
    "error_code": "MALFORMED_CSV",
    "message": "Failed to parse uploaded CSV file: Error tokenizing data. C error: Expected 2 fields in line 3, saw 4",
    "field": "file",
    "details": null
  }
  ```

### 5.2 HTTP 422: Data Validation Failures
- **Insufficient Antecedent History (`INSUFFICIENT_HISTORY`):**
  ```json
  {
    "status": "error",
    "error_code": "INSUFFICIENT_HISTORY",
    "message": "Insufficient antecedent history for catchment 'camels_01047000': requires at least 365 days prior to forecast origin 2013-05-15, but found 99 days (100 records).",
    "field": "file",
    "details": null
  }
  ```
- **Missing Required Meteorological Columns (`MISSING_REQUIRED_COLUMNS`):**
  ```json
  {
    "status": "error",
    "error_code": "MISSING_REQUIRED_COLUMNS",
    "message": "Uploaded CSV is missing required column(s): ['total_precipitation', 'temperature_2m'].",
    "field": "file",
    "details": null
  }
  ```
- **Duplicate Observation Dates (`DUPLICATE_DATES`):**
  ```json
  {
    "status": "error",
    "error_code": "DUPLICATE_DATES",
    "message": "Duplicate date records detected for catchment 'camels_01047000' in uploaded CSV.",
    "field": "file",
    "details": null
  }
  ```
- **Catchment Not Found in Upload (`CATCHMENT_NOT_FOUND`):**
  ```json
  {
    "status": "error",
    "error_code": "CATCHMENT_NOT_FOUND",
    "message": "Requested catchment_id 'camels_99999999' not found in uploaded CSV.",
    "field": "catchment_id",
    "details": null
  }
  ```
- **Unsupported Regional Collection (`UNSUPPORTED_REGION`):**
  ```json
  {
    "status": "error",
    "error_code": "UNSUPPORTED_REGION",
    "message": "Unsupported source_collection 'UNKNOWN-ALPINE-BASIN' for catchment 'camels_01047000'. Supported collections: ['CAMELS-AUS', 'CAMELS-US']. High-flow regional thresholds are not calibrated for other regions.",
    "field": "file",
    "details": null
  }
  ```

### 5.3 HTTP 503: Model Pipeline Not Ready
- **Uninitialized Pipeline (`PIPELINE_NOT_INITIALIZED`):**
  ```json
  {
    "status": "error",
    "error_code": "PIPELINE_NOT_INITIALIZED",
    "message": "Inference pipeline is not ready: Required XGBoost model artifact missing.",
    "field": null,
    "details": null
  }
  ```

---

## 6. Known Operational Boundaries & Limitations

1. **Specific Discharge Units:** All predicted discharges are expressed as **specific runoff in millimeters per day ($\text{mm/day}$)**, normalized by catchment area.
2. **Forecast Basis:** Forecasts represent a **reanalysis replay** using observed ERA5 meteorological forcings up to origin date $t$. Future weather forecasts (NWP) are not simulated.
3. **Regional Threshold Scope:** High-flow classification is calibrated specifically for `CAMELS-US` ($Q_{95} = 5.4040\text{ mm/d}$) and `CAMELS-AUS` ($Q_{95} = 2.9271\text{ mm/d}$). For uncalibrated regions, requests without `allow_unsupported_region=true` are rejected.
4. **Probability Calibration:** Reported probabilities are raw model predicted outputs from LightGBM logistic sigmoid functions trained with positive-class weighting (`scale_pos_weight=5.0`). They do not incorporate post-hoc isotonic calibration.
5. **Extreme Flow and Uncertainty Bounds:** `extreme_flow_probability` and `prediction_intervals` are explicitly set to `null` (`uncertainty_available: false`) because extreme value modeling ($Q_{99.5}$) and conformal prediction intervals have not yet undergone Stage C validation.

