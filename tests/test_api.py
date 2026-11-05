"""
BASINSHIFT FastAPI Integration and API Contract Unit Tests
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Comprehensive integration test suite covering:
1. GET /health readiness and model artifact inventory
2. POST /predict with valid Gauged CSV upload
3. POST /predict with valid Ungauged CSV upload (zero streamflow column)
4. Multi-horizon coverage (1d, 3d, 7d) in all forecast payloads
5. Output probability bounds ([0, 1])
6. Non-negative discharge clipping (>= 0.0)
7. Operational decision threshold mapping (tau*)
8. Missing required CSV columns rejection (422)
9. Duplicate timestamp rejection (422)
10. Malformed CSV syntax rejection (400)
11. Empty file and unsupported file extension rejection (400)
12. Insufficient antecedent history rejection (< 365 days) (422)
13. Invalid feature mode rejection (422)
14. Post-origin record filtering and warning generation (200)
15. Unsupported threshold region handling (422 / partial response)
16. Strict JSON serialization of response structures
17. Model loading failure handling (503)
18. GET /metrics offline benchmark contract verification
"""

import unittest
import io
import json
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

from api.main import app
from src.basinshift.inference import load_demo_history


class TestBasinshiftAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Prepares sample test CSVs and initializes TestClient."""
        cls.client = TestClient(app)
        cls.client.__enter__()

        cls.demo_cid_us = "camels_01047000"
        cls.origin_date = "2013-05-15"
        
        # Load 730 days of real antecedent data for integration testing
        cls.real_history = load_demo_history(cls.demo_cid_us, cls.origin_date, history_days=730)
        
        # Create CSV byte buffers
        cls.gauged_csv_bytes = cls.real_history.to_csv(index=False).encode('utf-8')
        
        ungauged_df = cls.real_history.drop(columns=['streamflow'])
        cls.ungauged_csv_bytes = ungauged_df.to_csv(index=False).encode('utf-8')

    @classmethod
    def tearDownClass(cls):
        """Cleans up TestClient."""
        cls.client.__exit__(None, None, None)

    # 1. GET /health
    def test_health_endpoint(self):
        """Verifies /health reports operational readiness and 13 loaded artifacts."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["pipeline_ready"])
        self.assertEqual(data["loaded_models_count"], 13)
        self.assertEqual(len(data["loaded_artifacts"]), 13)
        self.assertEqual(data["supported_horizons_days"], [1, 3, 7])
        self.assertEqual(data["supported_feature_modes"], ["gauged", "ungauged"])
        self.assertEqual(data["version"], "1.0.0")

    # 2. POST /predict (Valid Gauged)
    def test_valid_gauged_csv_prediction(self):
        """Verifies prediction with valid real Gauged time series CSV."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["catchment_id"], self.demo_cid_us)
        self.assertEqual(data["forecast_origin"], self.origin_date)
        self.assertEqual(data["feature_mode"], "Gauged")
        self.assertEqual(data["discharge_unit"], "mm/day")
        self.assertEqual(data["forecast_basis"], "historical_reanalysis_replay")
        self.assertFalse(data["uncertainty_available"])
        self.assertIsNone(data["extreme_flow_probability"])
        self.assertIsNone(data["prediction_intervals"])

    # 3. POST /predict (Valid Ungauged without streamflow)
    def test_valid_ungauged_csv_prediction_without_streamflow(self):
        """Verifies prediction with Ungauged CSV strictly lacking streamflow column."""
        response = self.client.post(
            "/predict",
            files={"file": ("history_ungauged.csv", io.BytesIO(self.ungauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "ungauged"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["feature_mode"], "Ungauged")
        self.assertIn("1d", data["predicted_discharge"])
        self.assertIn("3d", data["predicted_discharge"])
        self.assertIn("7d", data["predicted_discharge"])

    # 4. Multi-Horizon Verification
    def test_all_three_horizons_in_response(self):
        """Verifies all three horizons (1d, 3d, 7d) exist across all forecasting fields."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        for h in ["1d", "3d", "7d"]:
            self.assertIn(h, data["predicted_discharge"])
            self.assertIn(h, data["high_flow_probability"])
            self.assertIn(h, data["high_flow_alert_threshold"])
            self.assertIn(h, data["high_flow_alert"])

    # 5. Probability Bounds
    def test_probability_bounds(self):
        """Verifies high-flow probability outputs lie within [0.0, 1.0]."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        data = response.json()
        for h in ["1d", "3d", "7d"]:
            prob = data["high_flow_probability"][h]
            self.assertGreaterEqual(prob, 0.0)
            self.assertLessEqual(prob, 1.0)

    # 6. Non-Negative Discharge Outputs
    def test_non_negative_discharge_outputs(self):
        """Verifies predicted discharge values are clipped to >= 0.0 mm/day."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        data = response.json()
        for h in ["1d", "3d", "7d"]:
            q = data["predicted_discharge"][h]
            self.assertGreaterEqual(q, 0.0)

    # 7. Operational Decision Thresholds Mapping
    def test_correct_threshold_mapping(self):
        """Verifies training-optimal decision thresholds and binary alert logic."""
        # Gauged test: h1=0.70, h3=0.70, h7=0.60
        res_g = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        ).json()
        self.assertEqual(res_g["high_flow_alert_threshold"]["1d"], 0.70)
        self.assertEqual(res_g["high_flow_alert_threshold"]["3d"], 0.70)
        self.assertEqual(res_g["high_flow_alert_threshold"]["7d"], 0.60)
        for h in ["1d", "3d", "7d"]:
            expected_alert = (res_g["high_flow_probability"][h] >= res_g["high_flow_alert_threshold"][h])
            self.assertEqual(res_g["high_flow_alert"][h], expected_alert)

        # Ungauged test: h1=0.70, h3=0.66, h7=0.66
        res_u = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.ungauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "ungauged"
            }
        ).json()
        self.assertEqual(res_u["high_flow_alert_threshold"]["1d"], 0.70)
        self.assertEqual(res_u["high_flow_alert_threshold"]["3d"], 0.66)
        self.assertEqual(res_u["high_flow_alert_threshold"]["7d"], 0.66)

    # 8. Missing Required Columns (422)
    def test_missing_required_columns(self):
        """Verifies 422 error when uploaded CSV is missing essential meteorological columns."""
        bad_df = self.real_history.drop(columns=["total_precipitation", "temperature_2m"])
        bad_bytes = bad_df.to_csv(index=False).encode('utf-8')

        response = self.client.post(
            "/predict",
            files={"file": ("bad_history.csv", io.BytesIO(bad_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["error_code"], "MISSING_REQUIRED_COLUMNS")
        self.assertIn("total_precipitation", data["message"])

    # 9. Duplicate Timestamps (422)
    def test_duplicate_timestamps(self):
        """Verifies 422 error when duplicate dates are detected for the catchment."""
        dup_df = pd.concat([self.real_history, self.real_history.iloc[[-1]]], ignore_index=True)
        dup_bytes = dup_df.to_csv(index=False).encode('utf-8')

        response = self.client.post(
            "/predict",
            files={"file": ("dup_history.csv", io.BytesIO(dup_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["error_code"], "DUPLICATE_DATES")

    # 10. Malformed CSV (400)
    def test_malformed_csv(self):
        """Verifies 400 error when uploaded file contains malformed/corrupted syntax."""
        malformed_bytes = b"header1,header2\nvalue1,value2,broken_row_extra_commas,1,2,3,4\n"
        response = self.client.post(
            "/predict",
            files={"file": ("corrupt.csv", io.BytesIO(malformed_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        # Should be 400 or 422 missing columns
        self.assertIn(response.status_code, [400, 422])

    # 11. Empty File & Extension Rejection (400)
    def test_empty_file_and_extension_rejection(self):
        """Verifies 400 error when file is empty or lacks .csv extension."""
        # Empty file
        res_empty = self.client.post(
            "/predict",
            files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(res_empty.status_code, 400)
        self.assertEqual(res_empty.json()["error_code"], "EMPTY_FILE")

        # Non-CSV extension
        res_txt = self.client.post(
            "/predict",
            files={"file": ("data.json", io.BytesIO(b"{}"), "application/json")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(res_txt.status_code, 400)
        self.assertEqual(res_txt.json()["error_code"], "INVALID_FILE_FORMAT")

    # 12. Insufficient Antecedent History (422)
    def test_insufficient_antecedent_history(self):
        """Verifies 422 error when uploaded history is shorter than 365 calendar days."""
        origin_ts = pd.to_datetime(self.origin_date)
        short_df = self.real_history[self.real_history['date'] >= (origin_ts - pd.Timedelta(days=120))].copy()
        short_bytes = short_df.to_csv(index=False).encode('utf-8')

        response = self.client.post(
            "/predict",
            files={"file": ("short_history.csv", io.BytesIO(short_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["error_code"], "INSUFFICIENT_HISTORY")
        self.assertIn("at least 365 days", data["message"])

    # 13. Invalid Feature Mode (422)
    def test_invalid_feature_mode(self):
        """Verifies 422 error when an invalid feature_mode is specified."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "satellite_radar"
            }
        )
        self.assertEqual(response.status_code, 422)
        data = response.json()
        self.assertEqual(data["error_code"], "INVALID_FEATURE_MODE")

    # 14. Post-Origin Record Handling (200 with Warning)
    def test_post_origin_record_handling(self):
        """Verifies observations dated after forecast origin are filtered out and generate a warning."""
        future_history = load_demo_history(self.demo_cid_us, "2013-06-15", history_days=730)
        future_bytes = future_history.to_csv(index=False).encode('utf-8')

        response = self.client.post(
            "/predict",
            files={"file": ("future_history.csv", io.BytesIO(future_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,  # earlier than data max
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify warnings include note about filtered post-origin records
        self.assertTrue(len(data["warnings"]) > 0)
        self.assertTrue(any("observations dated after forecast_origin" in w for w in data["warnings"]))

    # 15. Unsupported Threshold Region Handling
    def test_unsupported_threshold_region(self):
        """Verifies rejection or structured partial response when regional collection is unsupported."""
        bad_region_df = self.real_history.copy()
        bad_region_df["source_collection"] = "UNKNOWN-ALPINE-BASIN"
        bad_bytes = bad_region_df.to_csv(index=False).encode('utf-8')

        # Standard request: should fail with 422 UNSUPPORTED_REGION
        res_default = self.client.post(
            "/predict",
            files={"file": ("bad_region.csv", io.BytesIO(bad_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged",
                "allow_unsupported_region": False
            }
        )
        self.assertEqual(res_default.status_code, 422)
        self.assertEqual(res_default.json()["error_code"], "UNSUPPORTED_REGION")

        # Request allowing partial response: should succeed with null classification and warning
        res_partial = self.client.post(
            "/predict",
            files={"file": ("bad_region.csv", io.BytesIO(bad_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged",
                "allow_unsupported_region": True
            }
        )
        self.assertEqual(res_partial.status_code, 200)
        partial_data = res_partial.json()
        self.assertIn("1d", partial_data["predicted_discharge"])
        self.assertIsNone(partial_data["high_flow_probability"])
        self.assertTrue(any("classification is unavailable" in w for w in partial_data["warnings"]))

    # 16. JSON Serialization
    def test_json_serialization(self):
        """Verifies prediction response serializes cleanly to JSON without custom encoders."""
        response = self.client.post(
            "/predict",
            files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
            data={
                "catchment_id": self.demo_cid_us,
                "forecast_origin": self.origin_date,
                "feature_mode": "gauged"
            }
        )
        self.assertEqual(response.status_code, 200)
        text = response.text
        parsed = json.loads(text)
        self.assertEqual(parsed["catchment_id"], self.demo_cid_us)

    # 17. Model Loading Failure Handling (503)
    def test_model_loading_failure(self):
        """Verifies 503 Service Unavailable when the pipeline is not ready."""
        # Temporarily mock pipeline as None in app state
        original_pipeline = app.state.pipeline
        original_ready = app.state.pipeline_ready
        try:
            app.state.pipeline = None
            app.state.pipeline_ready = False
            app.state.init_error = "Mocked model loading failure"

            res_health = self.client.get("/health")
            self.assertEqual(res_health.status_code, 503)
            self.assertFalse(res_health.json()["pipeline_ready"])

            res_predict = self.client.post(
                "/predict",
                files={"file": ("history.csv", io.BytesIO(self.gauged_csv_bytes), "text/csv")},
                data={
                    "catchment_id": self.demo_cid_us,
                    "forecast_origin": self.origin_date,
                    "feature_mode": "gauged"
                }
            )
            self.assertEqual(res_predict.status_code, 503)
            self.assertEqual(res_predict.json()["error_code"], "PIPELINE_NOT_INITIALIZED")
        finally:
            # Restore state
            app.state.pipeline = original_pipeline
            app.state.pipeline_ready = original_ready
            app.state.init_error = None

    # 18. GET /metrics
    def test_get_metrics_endpoint(self):
        """Verifies /metrics returns offline benchmark metrics with appropriate disclaimers."""
        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertEqual(data["status"], "success")
        self.assertIn("offline benchmark evaluation", data["disclaimer"])
        self.assertIn("Temporal_Val_Test_A", data["partitions"])
        self.assertIn("Geographic_Val_Test_B", data["partitions"])
        
        self.assertGreater(len(data["regression_benchmarks"]), 0)
        self.assertGreater(len(data["classification_benchmarks"]), 0)

        # Inspect first regression benchmark record
        reg = data["regression_benchmarks"][0]
        self.assertIn("horizon_days", reg)
        self.assertIn("rmse", reg)
        self.assertIn("mae", reg)

        # Inspect first classification benchmark record
        clf = data["classification_benchmarks"][0]
        self.assertIn("horizon_days", clf)
        self.assertIn("pr_auc", clf)
        self.assertIn("brier_skill_score_operational", clf)


if __name__ == '__main__':
    unittest.main()

