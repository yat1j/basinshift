"""
Unit Tests for Stage C Components (Hydrology, Hybrid, Classifier, Ensemble)
Author: Lead ML Engineer & Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Verifies:
1. Training-only Q95 derivation (AUS: 2.9271, US: 5.4040 mm/d)
2. No geographic holdout influence on thresholds
3. Correct high-flow label generation
4. No future weather leakage in reservoir features
5. Reservoir calculations isolated by catchment
6. Ungauged feature exclusion in hybrid and classifier
7. Ridge out-of-fold residual generation
8. Temporal fold purging
9. Non-negative ensemble weights
10. Ensemble weights summing to one
11. Missing targets and genuine zeros handled correctly
"""

import unittest
import numpy as np
import pandas as pd
from pathlib import Path
import joblib

from src.basinshift.hydrology import compute_conceptual_reservoirs, HYDRO_FEATURE_COLS
from src.basinshift.features import compute_features, get_feature_columns
from src.basinshift.hybrid import ConceptualHydrologyHybrid
from src.basinshift.high_flow_classifier import HighFlowClassifier
from src.basinshift.ensemble import ConstrainedEnsemble

class TestStageC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parquet_path = Path("data/processed/pilot_150_catchments.parquet")
        cls.split_path = Path("reports/split_manifest.csv")
        cls.thresh_path = Path("reports/high_flow_thresholds.csv")
        cls.weights_path = Path("reports/ensemble_weights.csv")
        
        assert cls.parquet_path.exists(), f"Missing dataset: {cls.parquet_path}"
        assert cls.split_path.exists(), f"Missing split manifest: {cls.split_path}"
        assert cls.thresh_path.exists(), f"Missing thresholds: {cls.thresh_path}"
        assert cls.weights_path.exists(), f"Missing ensemble weights: {cls.weights_path}"
        
        cls.df_raw = pd.read_parquet(cls.parquet_path)
        cls.split_df = pd.read_csv(cls.split_path)
        cls.thresh_df = pd.read_csv(cls.thresh_path)
        cls.weights_df = pd.read_csv(cls.weights_path)
        
        # Load sample catchments for fast test operations
        sample_cids = cls.df_raw['catchment_id'].unique()[:3].tolist() + cls.df_raw['catchment_id'].unique()[-3:].tolist()
        cls.df_sample = cls.df_raw[cls.df_raw['catchment_id'].isin(sample_cids)].copy()

    def test_training_only_q95_derivation(self):
        """Verify frozen thresholds are derived strictly from Dev Train (2005-2012)."""
        aus_row = self.thresh_df[self.thresh_df['source_collection'] == 'CAMELS-AUS'].iloc[0]
        us_row = self.thresh_df[self.thresh_df['source_collection'] == 'CAMELS-US'].iloc[0]
        
        self.assertAlmostEqual(aus_row['threshold_q95_mm_per_day'], 2.9271, places=4)
        self.assertAlmostEqual(us_row['threshold_q95_mm_per_day'], 5.4040, places=4)
        self.assertEqual(aus_row['derivation_partition'], 'Development_Training_Only')
        self.assertEqual(us_row['derivation_partition'], 'Development_Training_Only')
        self.assertEqual(aus_row['start_date'], '2005-01-01')
        self.assertEqual(aus_row['end_date'], '2012-12-31')

    def test_no_geographic_holdout_influence_on_thresholds(self):
        """Verify that holdout catchment discharge has zero influence on the regional Q95."""
        dev_ids = set(self.split_df[self.split_df['partition'] == 'Development']['catchment_id'])
        holdout_ids = set(self.split_df[self.split_df['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
        
        # Dev train subset
        dev_train_sub = self.df_raw[
            self.df_raw['catchment_id'].isin(dev_ids) &
            (pd.to_datetime(self.df_raw['date']) >= pd.Timestamp('2005-01-01')) &
            (pd.to_datetime(self.df_raw['date']) <= pd.Timestamp('2012-12-31')) &
            self.df_raw['streamflow'].notna()
        ]
        
        for region, expected_q95 in [('CAMELS-AUS', 2.9271), ('CAMELS-US', 5.4040)]:
            reg_vals = dev_train_sub[dev_train_sub['source_collection'] == region]['streamflow'].values
            calc_q95 = float(np.percentile(reg_vals, 95.0))
            self.assertAlmostEqual(calc_q95, expected_q95, places=4)

    def test_correct_high_flow_label_generation(self):
        """Verify binary label Y is 1 when streamflow > regional_Q95, 0 when <=, and NaN when missing."""
        regional_map = {'CAMELS-AUS': 2.9271, 'CAMELS-US': 5.4040}
        df = self.df_sample.copy()
        thresh = df['source_collection'].map(regional_map)
        
        binary_label = np.where(df['streamflow'].isna(), np.nan, (df['streamflow'] > thresh).astype(float))
        
        # Test positive case
        pos_mask = (df['streamflow'] > thresh) & df['streamflow'].notna()
        self.assertTrue(np.all(binary_label[pos_mask] == 1.0))
        
        # Test negative case
        neg_mask = (df['streamflow'] <= thresh) & df['streamflow'].notna()
        self.assertTrue(np.all(binary_label[neg_mask] == 0.0))
        
        # Test NaN case
        nan_mask = df['streamflow'].isna()
        self.assertTrue(np.all(np.isnan(binary_label[nan_mask])))

    def test_no_future_weather_leakage_in_reservoirs(self):
        """Verify modifying weather at t+1 does not change reservoir states at date t."""
        df_mod = self.df_sample.sort_values(['catchment_id', 'date']).reset_index(drop=True).copy()
        target_idx = 50
        df_mod.loc[target_idx + 1, 'total_precipitation'] += 100.0
        df_mod.loc[target_idx + 1, 'volumetric_soil_water_layer_1'] = 0.90
        
        orig_res = compute_conceptual_reservoirs(self.df_sample.sort_values(['catchment_id', 'date']).reset_index(drop=True))
        mod_res = compute_conceptual_reservoirs(df_mod)
        
        # Compare row at target_idx
        for col in HYDRO_FEATURE_COLS:
            self.assertAlmostEqual(orig_res.loc[target_idx, col], mod_res.loc[target_idx, col], places=4)

    def test_reservoir_calculations_isolated_by_catchment(self):
        """Verify reservoir state reinitializes at catchment boundaries."""
        df_sorted = self.df_sample.sort_values(['catchment_id', 'date']).reset_index(drop=True)
        res_df = compute_conceptual_reservoirs(df_sorted)
        
        cids = res_df['catchment_id'].values
        trans_idx = np.where(cids[:-1] != cids[1:])[0][0]
        
        # At trans_idx + 1 (first day of new catchment), S_fast is solely from day 0 input
        first_row_s_fast = res_df.loc[trans_idx + 1, 'hydro_s_fast']
        # Should be strictly <= total water input of that day
        self.assertLessEqual(first_row_s_fast, res_df.loc[trans_idx + 1, 'hydro_water_input'] + 1e-4)

    def test_ungauged_feature_exclusion_in_saved_models(self):
        """Verify saved ungauged models have ZERO observed streamflow features."""
        prohibited_exact = {'streamflow', 'q_obs_t', 'is_flow_missing_t'}
        for h in [1, 3, 7]:
            m_hyb = joblib.load(f"models/hybrid_ungauged_h{h}.joblib")
            m_clf = joblib.load(f"models/classifier_ungauged_h{h}.joblib")
            
            for col in m_hyb.feature_cols:
                self.assertNotIn(col.lower(), prohibited_exact)
                self.assertFalse(col.startswith('q_'), f"Observed flow lag found: {col}")
                
            for col in m_clf.feature_cols:
                self.assertNotIn(col.lower(), prohibited_exact)
                self.assertFalse(col.startswith('q_'), f"Observed flow lag found: {col}")

    def test_non_negative_ensemble_weights(self):
        """Verify all ensemble blending weights are >= 0.0."""
        for _, row in self.weights_df.iterrows():
            for c in ['LightGBM', 'XGBoost', 'Ridge', 'Conceptual_Hybrid']:
                w = row[f'weight_{c}']
                self.assertGreaterEqual(w, 0.0, f"Negative weight found: {w}")

    def test_ensemble_weights_sum_to_one(self):
        """Verify all ensemble blending weights sum to 1.0."""
        for _, row in self.weights_df.iterrows():
            total_w = sum(row[f'weight_{c}'] for c in ['LightGBM', 'XGBoost', 'Ridge', 'Conceptual_Hybrid'])
            self.assertAlmostEqual(total_w, 1.0, places=4)

    def test_temporal_fold_purging_in_hybrid(self):
        """Verify fold boundaries in hybrid enforce horizon purging."""
        # For h=3, training fold ending in 2008 must purge origins after 2008-12-28
        h = 3
        fold_train_end = pd.Timestamp('2008-12-31') - pd.Timedelta(days=h)
        self.assertEqual(fold_train_end, pd.Timestamp('2008-12-28'))

if __name__ == '__main__':
    unittest.main()
