"""
Unit tests for BASINSHIFT Pydantic schemas and data contracts.
"""

import unittest
from pydantic import ValidationError
from basinshift.schemas import DailyRecord, PredictRequest, PredictResponse, DataQualityInfo, ModelMetadataInfo


class TestSchemas(unittest.TestCase):

    def test_daily_record_valid(self):
        record = DailyRecord(
            date="2023-05-15",
            precipitation_mm_day=14.5,
            temperature_2m_degC=18.2,
            observed_discharge_mm_day=4.2,
            soil_moisture_proxy=0.72,
        )
        self.assertEqual(record.date, "2023-05-15")
        self.assertEqual(record.precipitation_mm_day, 14.5)
        self.assertEqual(record.soil_moisture_proxy, 0.72)

    def test_daily_record_rejects_negative_precip(self):
        with self.assertRaises(ValidationError):
            DailyRecord(date="2023-05-15", precipitation_mm_day=-5.0)

    def test_daily_record_rejects_invalid_soil_moisture(self):
        with self.assertRaises(ValidationError):
            DailyRecord(date="2023-05-15", soil_moisture_proxy=1.5)

    def test_predict_request_origin_validation(self):
        valid_row = DailyRecord(date="2023-05-15", precipitation_mm_day=5.0)
        
        # Valid request
        req = PredictRequest(
            catchment_id="01434000",
            forecast_origin="2023-05-15",
            operating_mode="gauged",
            csv_rows=[valid_row]
        )
        self.assertEqual(req.catchment_id, "01434000")

        # Invalid origin date format
        with self.assertRaises(ValidationError):
            PredictRequest(
                catchment_id="01434000",
                forecast_origin="15/05/2023",
                operating_mode="gauged",
                csv_rows=[valid_row]
            )

    def test_predict_response_validation(self):
        resp = PredictResponse(
            catchment_id="01434000",
            catchment_name="Neversink River",
            forecast_origin="2023-05-15",
            operating_mode="gauged",
            forecast_horizons_days=[1, 3, 7],
            predicted_discharge_mm_day=[4.5, 5.2, 3.8],
            high_flow_probability=[0.12, 0.25, 0.08],
            high_flow_threshold_mm_day=14.82,
            data_quality=DataQualityInfo(
                historical_days_supplied=90,
                historical_discharge_available=True,
                missing_values_count=0
            ),
            model_metadata=ModelMetadataInfo(
                regression_model_family="Variant A",
                regression_artifact_ids={},
                classifier_artifact_ids={},
                data_version="CAMELS-US v1.2"
            ),
            limitations_statement="Test statement"
        )
        self.assertEqual(len(resp.predicted_discharge_mm_day), 3)
        self.assertFalse(resp.is_historical_replay)


if __name__ == "__main__":
    unittest.main()
