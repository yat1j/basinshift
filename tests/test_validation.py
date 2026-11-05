"""
Unit tests for Scientific Validation Protocol and Leakage Checks.
"""

import unittest
from basinshift.validation import (
    validate_chronological_sequence,
    validate_no_future_leakage,
    validate_spinup_history,
    validate_spatial_partition,
)


class TestValidation(unittest.TestCase):

    def test_chronological_sequence_valid(self):
        dates = ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04"]
        is_valid, issues = validate_chronological_sequence(dates)
        self.assertTrue(is_valid)
        self.assertEqual(len(issues), 0)

    def test_chronological_sequence_detects_inversion(self):
        dates = ["2023-01-01", "2023-01-03", "2023-01-02"]
        is_valid, issues = validate_chronological_sequence(dates)
        self.assertFalse(is_valid)
        self.assertTrue(any("Temporal inversion" in msg for msg in issues))

    def test_chronological_sequence_detects_gap(self):
        dates = ["2023-01-01", "2023-01-05"]
        is_valid, issues = validate_chronological_sequence(dates)
        self.assertFalse(is_valid)
        self.assertTrue(any("Temporal gap" in msg for msg in issues))

    def test_no_future_leakage_detector(self):
        records = [
            {"date": "2023-05-10"},
            {"date": "2023-05-11"},
            {"date": "2023-05-15"},  # Future violation when origin is 2023-05-12
        ]
        is_valid, violations = validate_no_future_leakage(records, forecast_origin="2023-05-12")
        self.assertFalse(is_valid)
        self.assertEqual(len(violations), 1)
        self.assertIn("Future leakage violation", violations[0])

    def test_spatial_partition_disjointness(self):
        train_basins = {"01434000", "01435000", "01439500"}
        test_basins = {"08167500", "11475500"}
        is_valid, overlap = validate_spatial_partition(train_basins, test_basins)
        self.assertTrue(is_valid)
        self.assertEqual(len(overlap), 0)

        # Contaminated partition
        contaminated_test = {"01434000", "08167500"}
        is_valid_bad, overlap_bad = validate_spatial_partition(train_basins, contaminated_test)
        self.assertFalse(is_valid_bad)
        self.assertEqual(overlap_bad, {"01434000"})


if __name__ == "__main__":
    unittest.main()
