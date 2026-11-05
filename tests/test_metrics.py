"""
Unit tests for Hydrological Metrics: NSE, KGE, MAE, RMSE, and High-Flow Detection.
"""

import unittest
import numpy as np
from basinshift.metrics import (
    compute_nse,
    compute_kge,
    compute_mae,
    compute_rmse,
    compute_high_flow_metrics,
)


class TestMetrics(unittest.TestCase):

    def test_nse_perfect_match(self):
        obs = [2.0, 4.0, 6.0, 8.0, 10.0]
        pred = [2.0, 4.0, 6.0, 8.0, 10.0]
        nse = compute_nse(obs, pred)
        self.assertAlmostEqual(nse, 1.0, places=5)

    def test_nse_mean_prediction(self):
        obs = [2.0, 4.0, 6.0, 8.0, 10.0]
        mean_val = np.mean(obs)
        pred = [mean_val] * len(obs)
        nse = compute_nse(obs, pred)
        self.assertAlmostEqual(nse, 0.0, places=5)

    def test_kge_perfect_match(self):
        obs = [1.0, 3.0, 5.0, 7.0, 9.0]
        pred = [1.0, 3.0, 5.0, 7.0, 9.0]
        kge = compute_kge(obs, pred)
        self.assertAlmostEqual(kge, 1.0, places=5)

    def test_mae_and_rmse(self):
        obs = [10.0, 20.0, 30.0]
        pred = [12.0, 18.0, 34.0]
        # errors: [2, -2, 4] -> abs: [2, 2, 4] -> mean = 8/3 = 2.6667
        # squared errors: [4, 4, 16] = 24 -> mean = 8 -> sqrt(8) = 2.8284
        self.assertAlmostEqual(compute_mae(obs, pred), 8.0 / 3.0, places=4)
        self.assertAlmostEqual(compute_rmse(obs, pred), np.sqrt(8.0), places=4)

    def test_high_flow_metrics_contingency(self):
        obs = [5.0, 15.0, 8.0, 22.0, 3.0]
        probs = [0.1, 0.85, 0.2, 0.95, 0.4]
        threshold = 12.0  # Events are at index 1 and 3

        res = compute_high_flow_metrics(obs, probs, threshold, tau=0.5)
        # Expected: 2 True Positives, 0 False Positives, 0 False Negatives, 3 True Negatives
        self.assertEqual(res["true_positives"], 2)
        self.assertEqual(res["false_positives"], 0)
        self.assertEqual(res["precision"], 1.0)
        self.assertEqual(res["recall"], 1.0)
        self.assertEqual(res["f1_score"], 1.0)
        self.assertEqual(res["accuracy"], 1.0)


if __name__ == "__main__":
    unittest.main()
