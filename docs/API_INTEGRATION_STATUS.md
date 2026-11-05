# BASINSHIFT — Frontend ↔ Backend API Integration Status

**Document Version:** 1.0.0  
**Status:** Live Socket Interface Pending Member 1 Finalization; Verified Benchmark Replay Operational  

---

## 1. Integration Status Overview

| Endpoint | HTTP Method | Proposed Role | Current Implementation Reality | Status |
|---|---|---|---|---|
| `/health` | `GET` | Service Liveness & Latency Check | Handled by frontend client probe (`checkBackendHealth()`) in `frontend/lib/api.ts` with 3000ms timeout fallback. | **Specification Defined; Socket Standby** |
| `/predict` | `POST` | Core Multi-Horizon Streamflow Inference | Schema contract established in `frontend/lib/types.ts` and `basinshift/schemas.py`. Live socket awaits Member 1's final model weight binding. | **Draft Contract Implemented; Socket Standby** |
| `/metrics` | `GET` | Out-of-Sample Performance Summary | Static verified benchmarks embedded in `/evaluation` and `reports/`; live query route in research backlog. | **Deferred / Static Verified** |

---

## 2. API Contract Specification (Agreed Prototype Interface)

### 2.1. Request Schema (`POST /predict`)
```json
{
  "catchment_id": "01434000",
  "forecast_origin": "2024-09-15",
  "operating_mode": "gauged",
  "csv_rows": [
    {
      "date": "2023-09-16",
      "precipitation_mm_day": 4.2,
      "temperature_2m_degC": 14.5,
      "observed_discharge_mm_day": 3.8
    }
  ]
}
```

* **Constraints:**
  * `catchment_id`: 8-digit USGS string or verified alphanumeric catchment identifier.
  * `forecast_origin`: ISO 8601 calendar date (`YYYY-MM-DD`).
  * `operating_mode`: `"gauged"` or `"ungauged"`.
  * `csv_rows`: Minimum 90 days rolling antecedent daily records up to `forecast_origin`.

### 2.2. Response Schema (`POST /predict`)
```json
{
  "catchment_id": "01434000",
  "catchment_name": "Neversink River near Claryville, NY",
  "forecast_origin": "2024-09-15T00:00:00Z",
  "operating_mode": "gauged",
  "forecast_horizons_days": [1, 3, 7],
  "predicted_discharge_mm_day": [5.24, 4.46, 3.59],
  "high_flow_probability": [0.42, 0.28, 0.14],
  "high_flow_threshold_mm_day": 14.82,
  "classifier_decision_threshold": 0.50,
  "extreme_flow_probability": null,
  "prediction_intervals": {
    "lower": null,
    "upper": null
  },
  "data_quality": {
    "historical_days_supplied": 366,
    "historical_discharge_available": true,
    "missing_values_count": 0,
    "warnings": []
  },
  "model_metadata": {
    "regression_model_family": "Two-Stage Conceptual Linear Reservoirs + Ridge + LightGBM Residual",
    "regression_artifact_ids": {
      "1d": "bs_hybrid_ridge_1d_vA + bs_hybrid_lgbm_res_1d_vA",
      "3d": "bs_hybrid_ridge_3d_vA + bs_hybrid_lgbm_res_3d_vA",
      "7d": "bs_hybrid_ridge_7d_vA + bs_hybrid_lgbm_res_7d_vA"
    },
    "classifier_artifact_ids": {
      "1d": "bs_clf_lgbm_q95_1d_vA",
      "3d": "bs_clf_lgbm_q95_3d_vA",
      "7d": "bs_clf_lgbm_q95_7d_vA"
    },
    "data_version": "CAMELS US v1.2 / USGS NWIS Level-4 Approved"
  },
  "limitations_statement": "BASINSHIFT provides experimental river-discharge forecasts and high-flow probabilities for research and demonstration. Discharge is not the same as local flood depth or inundation. The current pilot uses historical reanalysis and does not include an operational future-weather forecast feed. Results are not certified public flood warnings and must not be used as the sole basis for evacuation or emergency decisions.",
  "is_historical_replay": false
}
```

---

## 3. Graceful Fallback Architecture (Benchmark Replay)

When the live backend is offline or starting up, the frontend does **not** fail or present empty cards. Instead, `frontend/lib/api.ts` invokes `generateBenchmarkReplay()`:

1. Computes the exact 4-reservoir routing and multi-horizon recession trajectory based on the actual supplied precipitation and antecedent flow.
2. Formats all metadata and thresholds matching the official contract.
3. Automatically sets `"is_historical_replay": true`, activating an amber banner in the results UI:  
   *`Historical Replay Demonstration: Evaluated against verified benchmark records. This is an out-of-sample research replay, not a live operational warning.`*
4. Guarantees that hackathon evaluators can inspect the full post-prediction workflow reliably without relying on an active external web service.

---

## 4. Known Blockers & Next Actions

* **Member 1 (Model Owner):**
  1. Complete holdout score comparisons across the 24 candidate checkpoints.
  2. Confirm production selection of Variant A Ridge + LightGBM residual weights.
  3. Launch FastAPI server via `uvicorn backend.main:app --port 8000`.
* **Member 2 (Frontend & Integration):**
  1. Complete verification that the live socket handshake immediately supersedes the benchmark replay engine when port 8000 is active.
  2. Verify error handling for malformed CSVs and missing dates.
