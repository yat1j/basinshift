"""
Unit tests for Hydrological Feature Extraction and Linear Reservoir Simulation.
"""

import unittest
from basinshift.features import (
    compute_effective_precipitation,
    compute_snowmelt_proxy,
    simulate_linear_reservoirs,
    extract_hydrological_features,
)


class TestFeatures(unittest.TestCase):

    def test_effective_precipitation(self):
        # Zero precipitation yields zero runoff
        self.assertEqual(compute_effective_precipitation(0.0, 0.8), 0.0)

        # Saturated soil (sm=1.0) produces higher effective runoff than dry soil (sm=0.1)
        rain = 20.0
        eff_saturated = compute_effective_precipitation(rain, 1.0)
        eff_dry = compute_effective_precipitation(rain, 0.1)
        self.assertGreater(eff_saturated, eff_dry)
        self.assertLessEqual(eff_saturated, rain)

    def test_snowmelt_proxy(self):
        # Temperature below freezing -> zero melt
        self.assertEqual(compute_snowmelt_proxy(-2.0, swe=50.0), 0.0)

        # Zero SWE -> zero melt even if warm
        self.assertEqual(compute_snowmelt_proxy(15.0, swe=0.0), 0.0)

        # Warm temperature with snowpack -> melt capped by SWE
        melt = compute_snowmelt_proxy(5.0, swe=5.0, k_melt=2.5)  # potential = 12.5
        self.assertEqual(melt, 5.0)

    def test_linear_reservoirs_simulation(self):
        inputs = [10.0, 0.0, 0.0, 0.0, 0.0]
        res = simulate_linear_reservoirs(inputs)

        # Storage keys exist
        for key in ["s1", "s2", "s3", "s4", "q1", "q2", "q3", "q4"]:
            self.assertIn(key, res)
            self.assertEqual(len(res[key]), len(inputs))

        # Check that fast reservoir decays faster than deep baseflow reservoir
        # After pulse at t=0, at t=4 fast reservoir S1 should be nearly depleted
        self.assertLess(res["s1"][4], res["s4"][4])

    def test_extract_hydrological_features_no_future_leakage(self):
        # Synthetic records with dates before and after forecast origin
        records = [
            {"date": "2023-01-01", "precipitation_mm_day": 5.0, "observed_discharge_mm_day": 1.2},
            {"date": "2023-01-02", "precipitation_mm_day": 10.0, "observed_discharge_mm_day": 2.5},
            {"date": "2023-01-03", "precipitation_mm_day": 15.0, "observed_discharge_mm_day": 4.1},
            # Leaked future record:
            {"date": "2023-01-04", "precipitation_mm_day": 50.0, "observed_discharge_mm_day": 12.0},
        ]

        result = extract_hydrological_features(
            records=records,
            forecast_origin="2023-01-03",
            operating_mode="gauged",
            min_history_days=2,
        )

        filtered = result["filtered_records"]
        # Future record (2023-01-04) must NOT be present in filtered records
        self.assertEqual(len(filtered), 3)
        self.assertEqual(filtered[-1]["date"], "2023-01-03")
        # Feature vector today precipitation must be 15.0 (origin date), not 50.0
        self.assertEqual(result["feature_vector"]["precip_today"], 15.0)

    def test_extract_features_ungauged_mode_masks_discharge(self):
        records = [
            {"date": "2023-01-01", "precipitation_mm_day": 5.0, "observed_discharge_mm_day": 10.0},
            {"date": "2023-01-02", "precipitation_mm_day": 8.0, "observed_discharge_mm_day": 15.0},
        ]

        result = extract_hydrological_features(
            records=records,
            forecast_origin="2023-01-02",
            operating_mode="ungauged",
            min_history_days=2,
        )

        # In ungauged mode, autoregressive flow features must be strictly zero
        self.assertEqual(result["feature_vector"]["flow_lag_1d"], 0.0)
        self.assertEqual(result["feature_vector"]["flow_lag_2d"], 0.0)
        self.assertEqual(result["feature_vector"]["flow_roll_7d"], 0.0)


if __name__ == "__main__":
    unittest.main()
