"""
Unit tests for Two-Stage Hybrid Predictor (Variant A).
"""

import unittest
from basinshift.hybrid import HybridPredictor


class TestHybridPredictor(unittest.TestCase):

    def setUp(self):
        self.predictor = HybridPredictor()
        self.dummy_features = {
            "s1_fast": 4.5,
            "s2_inter": 6.2,
            "s3_sub": 8.1,
            "s4_base": 12.0,
            "precip_today": 12.0,
            "precip_roll_3d": 25.0,
            "precip_roll_7d": 45.0,
            "precip_roll_30d": 110.0,
            "flow_lag_1d": 3.4,
            "flow_lag_2d": 2.8,
            "flow_roll_7d": 3.1,
        }

    def test_multi_horizon_prediction(self):
        res = self.predictor.predict_multi_horizon(
            features=self.dummy_features,
            horizons=[1, 3, 7],
            operating_mode="gauged",
            q95_threshold=14.82,
        )

        preds = res["predicted_discharge_mm_day"]
        probs = res["high_flow_probability"]

        self.assertEqual(len(preds), 3)
        self.assertEqual(len(probs), 3)

        # Non-negative mass conservation check
        for q in preds:
            self.assertGreaterEqual(q, 0.0)

        # Calibrated probability range check [0, 1]
        for p in probs:
            self.assertGreaterEqual(p, 0.0)
            self.assertLessEqual(p, 1.0)

    def test_ungauged_vs_gauged_mode(self):
        res_gauged = self.predictor.predict_multi_horizon(
            features=self.dummy_features,
            horizons=[1],
            operating_mode="gauged",
            q95_threshold=14.82,
        )

        res_ungauged = self.predictor.predict_multi_horizon(
            features=self.dummy_features,
            horizons=[1],
            operating_mode="ungauged",
            q95_threshold=14.82,
        )

        # Both modes produce valid predictions
        self.assertGreaterEqual(res_gauged["predicted_discharge_mm_day"][0], 0.0)
        self.assertGreaterEqual(res_ungauged["predicted_discharge_mm_day"][0], 0.0)

    def test_extreme_rainfall_trigger(self):
        # Storm pulse condition
        storm_features = self.dummy_features.copy()
        storm_features["precip_today"] = 65.0
        storm_features["s1_fast"] = 30.0

        q_storm, p_storm = self.predictor.predict_horizon(
            features=storm_features,
            horizon=1,
            operating_mode="gauged",
            q95_threshold=14.82,
        )

        # A severe storm should elevate high-flow exceedance probability
        self.assertGreater(p_storm, 0.50)


if __name__ == "__main__":
    unittest.main()
