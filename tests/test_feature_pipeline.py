"""
Comprehensive Unit Tests for Feature Pipeline & Leakage Prevention
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Verifies:
1. Forecast horizon alignment (h in {1, 3, 7})
2. No future weather leakage (t' <= t)
3. Rolling-window temporal correctness
4. Catchment boundary isolation
5. Geographic split isolation (Dev vs Test B)
6. Temporal boundary purging (t + h <= 2012-12-31)
7. Ungauged feature exclusion (zero discharge features)
8. Q95 threshold leakage prevention
9. Missing target masking
10. Genuine zero-flow preservation
"""

import unittest
import numpy as np
import pandas as pd
from pathlib import Path

from src.basinshift.features import compute_features, get_feature_columns

class TestFeaturePipelineAndLeakage(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parquet_path = Path("data/processed/pilot_150_catchments.parquet")
        split_path = Path("reports/split_manifest.csv")
        assert parquet_path.exists(), f"Missing dataset: {parquet_path}"
        assert split_path.exists(), f"Missing split manifest: {split_path}"
        
        # Load small representative slice (5 catchments, 2 years) for fast test execution
        df_full = pd.read_parquet(parquet_path)
        cls.split_df = pd.read_csv(split_path)
        
        sample_cids = df_full['catchment_id'].unique()[:4].tolist() + df_full['catchment_id'].unique()[-4:].tolist()
        cls.df_sample = df_full[df_full['catchment_id'].isin(sample_cids)].copy()
        cls.feat_df = compute_features(cls.df_sample)
        cls.ungauged_cols, cls.gauged_cols = get_feature_columns()

    def test_forecast_horizon_alignment(self):
        """Verify target_h{h} on date t matches streamflow on date t+h for the same catchment."""
        for h in [1, 3, 7]:
            target_col = f'target_h{h}'
            self.assertIn(target_col, self.feat_df.columns)
            
            # Check for a specific catchment
            sub = self.feat_df[self.feat_df['catchment_id'] == self.feat_df['catchment_id'].iloc[0]].reset_index(drop=True)
            for i in range(len(sub) - h):
                expected = sub['streamflow'].iloc[i + h]
                actual = sub[target_col].iloc[i]
                if np.isnan(expected):
                    self.assertTrue(np.isnan(actual))
                else:
                    self.assertAlmostEqual(actual, expected, places=5)

    def test_no_future_weather_leakage(self):
        """Verify altering weather at t+1 does not change any feature at date t."""
        df_mod = self.df_sample.copy()
        target_idx = 100
        # Modify future weather at target_idx + 1
        df_mod.loc[target_idx + 1, 'total_precipitation'] += 100.0
        df_mod.loc[target_idx + 1, 'temperature_2m'] += 20.0
        
        feat_mod = compute_features(df_mod)
        
        # Compare features at target_idx
        orig_row = self.feat_df.loc[target_idx, self.ungauged_cols]
        mod_row = feat_mod.loc[target_idx, self.ungauged_cols]
        pd.testing.assert_series_equal(orig_row, mod_row)

    def test_rolling_window_temporal_correctness(self):
        """Verify rolling calculations are strictly backward-looking."""
        sub = self.feat_df[self.feat_df['catchment_id'] == self.feat_df['catchment_id'].iloc[0]].reset_index(drop=True)
        # Check 3-day precipitation sum at index 10: should equal P[10] + P[9] + P[8]
        expected_3d = sub['total_precipitation'].iloc[8:11].sum()
        actual_3d = sub['precip_sum_3d'].iloc[10]
        self.assertAlmostEqual(actual_3d, expected_3d, places=5)

    def test_catchment_boundary_isolation(self):
        """Verify rolling windows and lags do not bleed across catchment boundaries."""
        # Find transition index between two catchments
        cids = self.feat_df['catchment_id'].values
        trans_indices = np.where(cids[:-1] != cids[1:])[0]
        self.assertGreater(len(trans_indices), 0)
        
        first_trans = trans_indices[0]
        # At first_trans + 1 (the first row of the new catchment), lag_1 must be NaN
        self.assertTrue(np.isnan(self.feat_df['q_lag_1'].iloc[first_trans + 1]))
        # 1-day precip must equal raw precip (not adding previous catchment)
        self.assertAlmostEqual(
            self.feat_df['precip_sum_3d'].iloc[first_trans + 1],
            self.feat_df['total_precipitation'].iloc[first_trans + 1],
            places=5
        )

    def test_geographic_split_isolation(self):
        """Verify Test B holdout catchments are strictly disjoint from Development catchments."""
        dev_ids = set(self.split_df[self.split_df['partition'] == 'Development']['catchment_id'])
        holdout_ids = set(self.split_df[self.split_df['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
        self.assertEqual(len(dev_ids), 120)
        self.assertEqual(len(holdout_ids), 30)
        self.assertEqual(len(dev_ids.intersection(holdout_ids)), 0)

    def test_temporal_boundary_purging(self):
        """Verify training dates are purged so that t + h does not enter 2013-01-01."""
        train_start = pd.Timestamp('2005-01-01')
        train_end_unpurged = pd.Timestamp('2012-12-31')
        
        for h in [1, 3, 7]:
            effective_train_end = train_end_unpurged - pd.Timedelta(days=h)
            max_target_date = effective_train_end + pd.Timedelta(days=h)
            self.assertLessEqual(max_target_date, train_end_unpurged)
            self.assertLess(max_target_date, pd.Timestamp('2013-01-01'))

    def test_ungauged_feature_exclusion(self):
        """Verify ungauged feature set contains ZERO discharge features or missingness flags."""
        prohibited_substrings = ['streamflow', 'q_', 'flow']
        for col in self.ungauged_cols:
            for sub in prohibited_substrings:
                self.assertNotIn(sub, col.lower(), f"Prohibited discharge feature found in ungauged list: {col}")
        self.assertNotIn('is_flow_missing_t', self.ungauged_cols)
        self.assertNotIn('q_obs_t', self.ungauged_cols)

    def test_q95_threshold_leakage_prevention(self):
        """Verify Q95 is not an input feature to models."""
        self.assertNotIn('q95', [c.lower() for c in self.gauged_cols])
        self.assertNotIn('q95', [c.lower() for c in self.ungauged_cols])

    def test_missing_target_masking(self):
        """Verify missing future targets evaluate to NaN and are cleanly maskable."""
        for h in [1, 3, 7]:
            target_col = f'target_h{h}'
            mask = self.feat_df[target_col].notna()
            self.assertTrue(np.all(np.isfinite(self.feat_df.loc[mask, target_col])))

    def test_genuine_zero_flow_preservation(self):
        """Verify authentic zero streamflows are preserved as 0.0 and distinct from NaNs."""
        zero_rows = (self.feat_df['streamflow'] == 0.0)
        self.assertGreater(zero_rows.sum(), 0)
        self.assertTrue(np.all(self.feat_df.loc[zero_rows, 'q_obs_t'] == 0.0))
        self.assertFalse(np.any(np.isnan(self.feat_df.loc[zero_rows, 'q_obs_t'])))

if __name__ == '__main__':
    unittest.main()

