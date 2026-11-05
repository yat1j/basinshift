"""
Integration tests for FastAPI endpoints: /health, /, and /predict.
Tests request parsing, status responses, and hydrological inference pipeline.
"""

import unittest
from datetime import date, timedelta
from basinshift.schemas import PredictRequest, DailyRecord
from backend.main import read_root, health_check, predict_discharge


class TestAPIIntegration(unittest.TestCase):

    def test_root_endpoint(self):
        data = read_root()
        self.assertEqual(data["status"], "operational")
        self.assertEqual(data["version"], "1.0.0")
        self.assertIn("endpoints", data)
        self.assertIn("predict", data["endpoints"])

    def test_health_endpoint(self):
        data = health_check()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])
        self.assertEqual(data["default_horizons"], [1, 3, 7])

    def test_predict_endpoint_gauged(self):
        # Generate 90 days of realistic synthetic test forcing using standard calendar dates
        start = date(2023, 1, 1)
        rows = []
        for i in range(92):
            curr_date = start + timedelta(days=i)
            d_str = curr_date.strftime("%Y-%m-%d")
            rows.append(DailyRecord(
                date=d_str,
                precipitation_mm_day=8.5 if i % 7 == 0 else 1.2,
                temperature_2m_degC=14.0,
                observed_discharge_mm_day=3.5,
                soil_moisture_proxy=0.65,
                snow_water_equivalent_mm=0.0,
            ))

        request = PredictRequest(
            catchment_id="01434000",
            forecast_origin="2023-04-03",
            operating_mode="gauged",
            csv_rows=rows,
        )

        response = predict_discharge(request)

        self.assertEqual(response.catchment_id, "01434000")
        self.assertEqual(response.operating_mode, "gauged")
        self.assertEqual(len(response.forecast_horizons_days), 3)
        self.assertEqual(len(response.predicted_discharge_mm_day), 3)
        self.assertEqual(len(response.high_flow_probability), 3)

        # Non-negative discharge guarantee
        for q in response.predicted_discharge_mm_day:
            self.assertGreaterEqual(q, 0.0)

        # High-flow probability between 0 and 1
        for p in response.high_flow_probability:
            self.assertGreaterEqual(p, 0.0)
            self.assertLessEqual(p, 1.0)

        # Hydrograph points should be populated
        self.assertIsNotNone(response.hydrograph_history)
        self.assertGreater(len(response.hydrograph_history), 0)

    def test_predict_endpoint_ungauged(self):
        rows = [
            DailyRecord(date="2023-01-01", precipitation_mm_day=12.0, temperature_2m_degC=10.0, observed_discharge_mm_day=None),
            DailyRecord(date="2023-01-02", precipitation_mm_day=15.0, temperature_2m_degC=11.0, observed_discharge_mm_day=None),
        ]

        request = PredictRequest(
            catchment_id="08167500",
            forecast_origin="2023-01-02",
            operating_mode="ungauged",
            csv_rows=rows,
        )

        response = predict_discharge(request)
        self.assertEqual(response.operating_mode, "ungauged")
        # Spin-up warning should be captured since only 2 days were provided
        self.assertTrue(len(response.data_quality.warnings) > 0)


if __name__ == "__main__":
    unittest.main()
