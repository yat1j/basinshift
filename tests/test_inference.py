"""
BASINSHIFT Unified Python Inference Interface Unit Tests
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Comprehensive test suite verifying the 17 core operational requirements:
1. Loading only the 13 required model artifacts.
2. Gauged inference across all 3 horizons (h in {1, 3, 7}).
3. Ungauged inference across all 3 horizons (h in {1, 3, 7}).
4. Ungauged feature exclusion (zero discharge features).
5. Correct model selection & h=1 Ungauged Ridge blend (0.9249 XGB + 0.0751 Ridge).
6. Exact feature ordering matching model artifact schemas.
7. Variant A conceptual hydrology compatibility (13 hydro features).
8. Strict temporal non-leakage (zero influence of post-origin records).
9. Validation rejection on insufficient antecedent history (< 365 days).
10. Proper handling of missing historical observations (NaN preservation & warnings).
11. Validation rejection on duplicate catchment/date records.
12. Validation rejection on unknown catchment IDs.
13. Validation rejection on unsupported regional collections.
14. Non-negative discharge clipping (max(0.0, y_hat)).
15. Probability bounds ([0, 1]) and training-optimal decision threshold mapping.
16. JSON serialization and repeated prediction consistency.
17. Benchmark prediction reproducibility against saved audited archives.
"""

import unittest
import json
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

from src.basinshift.inference import InferencePipeline, load_demo_history
from src.basinshift.features import get_feature_columns
from src.basinshift.hydrology import HYDRO_FEATURE_COLS


class TestInferencePipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Initializes pipeline once for the test suite."""
        cls.pipeline = InferencePipeline(
            models_dir="models",
            thresholds_path="reports/high_flow_thresholds.csv",
            weights_path="reports/ensemble_weights.csv"
        )
        cls.demo_cid_us = "camels_01047000"
        cls.demo_cid_aus = "camelsaus_105105A"
        cls.origin_date = "2013-05-15"
        cls.demo_history = load_demo_history(cls.demo_cid_us, cls.origin_date, history_days=730)

    # 1. Model Registry & Artifact Loading
    def test_loading_required_model_artifacts(self):
        """Verifies that exactly 13 required model artifacts are loaded, not all 24."""
        self.assertEqual(len(self.pipeline.loaded_artifacts), 13)
        
        # Verify 6 XGBoost models
        for mode in ['gauged', 'ungauged']:
            for h in [1, 3, 7]:
                self.assertIn(f"xgboost_{mode}_h{h}.joblib", self.pipeline.loaded_artifacts)
                self.assertIn(f"xgb_{mode}_h{h}", self.pipeline.models)
        
        # Verify 6 HighFlowClassifier models
        for mode in ['gauged', 'ungauged']:
            for h in [1, 3, 7]:
                self.assertIn(f"classifier_{mode}_h{h}.joblib", self.pipeline.loaded_artifacts)
                self.assertIn(f"clf_{mode}_h{h}", self.pipeline.models)
        
        # Verify 1 Hybrid model for Ridge
        self.assertIn("hybrid_ungauged_h1.joblib", self.pipeline.loaded_artifacts)
        self.assertIn("ridge_ungauged_h1", self.pipeline.models)

        # Verify that unused artifacts are NOT loaded
        unused_samples = [
            "lightgbm_gauged_h1.joblib",
            "lightgbm_ungauged_h1.joblib",
            "hybrid_gauged_h1.joblib",
            "hybrid_ungauged_h3.joblib",
            "hybrid_ungauged_h7.joblib"
        ]
        for unused in unused_samples:
            self.assertNotIn(unused, self.pipeline.loaded_artifacts)

    # 2. Gauged Inference
    def test_gauged_inference_all_horizons(self):
        """Verifies Gauged inference produces forecasts and probabilities for h in {1, 3, 7}."""
        res = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        
        self.assertEqual(res['catchment_id'], self.demo_cid_us)
        self.assertEqual(res['feature_mode'], 'Gauged')
        self.assertEqual(res['forecast_horizons_days'], [1, 3, 7])
        self.assertEqual(res['discharge_unit'], 'mm/day')

        for h in ['1d', '3d', '7d']:
            self.assertIn(h, res['predicted_discharge'])
            self.assertIsInstance(res['predicted_discharge'][h], float)
            self.assertGreaterEqual(res['predicted_discharge'][h], 0.0)

            self.assertIn(h, res['high_flow_probability'])
            self.assertIsInstance(res['high_flow_probability'][h], float)
            self.assertTrue(0.0 <= res['high_flow_probability'][h] <= 1.0)

            self.assertIn(h, res['high_flow_alert'])
            self.assertIsInstance(res['high_flow_alert'][h], bool)

    # 3. Ungauged Inference
    def test_ungauged_inference_all_horizons(self):
        """Verifies Ungauged inference produces forecasts and probabilities for h in {1, 3, 7}."""
        res = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="ungauged")
        
        self.assertEqual(res['catchment_id'], self.demo_cid_us)
        self.assertEqual(res['feature_mode'], 'Ungauged')
        self.assertEqual(res['forecast_horizons_days'], [1, 3, 7])

        for h in ['1d', '3d', '7d']:
            self.assertIn(h, res['predicted_discharge'])
            self.assertIsInstance(res['predicted_discharge'][h], float)
            self.assertGreaterEqual(res['predicted_discharge'][h], 0.0)

            self.assertIn(h, res['high_flow_probability'])
            self.assertIsInstance(res['high_flow_probability'][h], float)
            self.assertTrue(0.0 <= res['high_flow_probability'][h] <= 1.0)

            self.assertIn(h, res['high_flow_alert'])
            self.assertIsInstance(res['high_flow_alert'][h], bool)

    # 4. Ungauged Feature Exclusion
    def test_ungauged_feature_exclusion(self):
        """Verifies that ungauged models strictly exclude all discharge-derived features."""
        discharge_keywords = ['q_obs', 'q_lag', 'q_mean', 'q_max', 'q_std', 'q_delta', 'is_flow_missing', 'streamflow']
        
        # XGBoost ungauged features
        u_cols, _ = get_feature_columns()
        for col in u_cols:
            for kw in discharge_keywords:
                self.assertNotIn(kw, col, f"Discharge leakage in base ungauged feature: {col}")

        # Classifier ungauged features
        clf_u = self.pipeline.models['clf_ungauged_h1']
        for col in clf_u.feature_cols:
            for kw in discharge_keywords:
                self.assertNotIn(kw, col, f"Discharge leakage in classifier ungauged feature: {col}")

        # Ridge pipeline features
        ridge_cols = self.pipeline.ungauged_features_stage_c
        for col in ridge_cols:
            for kw in discharge_keywords:
                self.assertNotIn(kw, col, f"Discharge leakage in Ridge ungauged feature: {col}")

        # Test prediction succeeds even if streamflow column is completely dropped
        hist_no_flow = self.demo_history.drop(columns=['streamflow'])
        res = self.pipeline.predict(hist_no_flow, self.demo_cid_us, self.origin_date, feature_mode="ungauged")
        self.assertIn('1d', res['predicted_discharge'])

    # 5. Production Ensemble & h=1 Ungauged Ridge Blend
    def test_h1_ungauged_ridge_blending(self):
        """Verifies that h=1 Ungauged correctly blends XGBoost (0.9249) and Ridge (0.0751)."""
        res = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="ungauged")
        meta = res['model_metadata']['regression_models']['1d']
        
        self.assertEqual(meta['model_family'], "Ensemble (XGBoost + Ridge)")
        self.assertAlmostEqual(meta['weights']['XGBoost'], 0.9249, places=4)
        self.assertAlmostEqual(meta['weights']['Ridge'], 0.0751, places=4)

        # Manually compute blend
        xgb_raw = meta['raw_predictions']['XGBoost']
        ridge_raw = meta['raw_predictions']['Ridge']
        expected_blend = max(0.0, 0.9249 * xgb_raw + 0.0751 * ridge_raw)
        
        self.assertAlmostEqual(res['predicted_discharge']['1d'], expected_blend, places=3)

    # 6. Feature Ordering Verification
    def test_exact_feature_ordering(self):
        """Verifies that all loaded models match the exact feature names and order."""
        u33, g48 = get_feature_columns()
        u46 = u33 + HYDRO_FEATURE_COLS
        g61 = g48 + HYDRO_FEATURE_COLS

        for h in [1, 3, 7]:
            xgb_g = self.pipeline.models[f"xgb_gauged_h{h}"]
            xgb_u = self.pipeline.models[f"xgb_ungauged_h{h}"]
            clf_g = self.pipeline.models[f"clf_gauged_h{h}"]
            clf_u = self.pipeline.models[f"clf_ungauged_h{h}"]

            self.assertEqual(list(xgb_g.feature_names_in_), g48)
            self.assertEqual(list(xgb_u.feature_names_in_), u33)
            self.assertEqual(list(clf_g.feature_cols), g61)
            self.assertEqual(list(clf_u.feature_cols), u46)

    # 7. Variant A Conceptual Hydrology Compatibility
    def test_variant_a_compatibility(self):
        """Verifies that Variant A hydro features are used, and Variant B features are excluded."""
        self.assertEqual(len(HYDRO_FEATURE_COLS), 13)
        for feat in HYDRO_FEATURE_COLS:
            self.assertTrue(feat.startswith("hydro_"))
            self.assertFalse(feat.startswith("hydro_v2_"))
        
        # Verify metadata documentation
        res = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        self.assertIn("Variant A", res['model_metadata']['hydrological_features'])
        self.assertIn("empirical", res['model_metadata']['hydrological_features'].lower())

    # 8. Strict Temporal Non-Leakage
    def test_no_post_origin_leakage(self):
        """Verifies that records strictly after forecast origin do not alter features or predictions."""
        # Load future data up to 30 days past forecast_origin
        future_origin = "2013-06-15"
        future_hist = load_demo_history(self.demo_cid_us, future_origin, history_days=730)
        
        # Prediction with truncated history
        res_exact = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        
        # Prediction with future history containing post-origin records
        res_future = self.pipeline.predict(future_hist, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        
        self.assertEqual(res_exact['predicted_discharge'], res_future['predicted_discharge'])
        self.assertEqual(res_exact['high_flow_probability'], res_future['high_flow_probability'])
        self.assertEqual(res_exact['high_flow_alert'], res_future['high_flow_alert'])

    # 9. Insufficient Antecedent History Rejection
    def test_insufficient_antecedent_history_error(self):
        """Verifies that providing < 365 days of antecedent history raises a descriptive ValueError."""
        # Truncate to only 180 days before origin
        origin_ts = pd.to_datetime(self.origin_date)
        short_hist = self.demo_history[self.demo_history['date'] >= (origin_ts - pd.Timedelta(days=180))].copy()
        
        with self.assertRaises(ValueError) as ctx:
            self.pipeline.predict(short_hist, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        self.assertIn("Insufficient antecedent history", str(ctx.exception))

    # 10. Missing Historical Observations Handling
    def test_missing_historical_observations_handling(self):
        """Verifies that missing historical discharge (NaN) is handled gracefully with warnings."""
        hist_nan = self.demo_history.copy()
        # Set streamflow at origin to NaN
        hist_nan.loc[hist_nan['date'] == self.origin_date, 'streamflow'] = np.nan
        
        res = self.pipeline.predict(hist_nan, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        self.assertIn('1d', res['predicted_discharge'])
        self.assertTrue(len(res['warnings']) > 0)
        self.assertTrue(any("missing (NaN)" in w for w in res['warnings']))

    # 11. Duplicate Dates Rejection
    def test_duplicate_dates_rejection(self):
        """Verifies that duplicate catchment/date observations raise ValueError."""
        dup_hist = pd.concat([self.demo_history, self.demo_history.iloc[[-1]]], ignore_index=True)
        with self.assertRaises(ValueError) as ctx:
            self.pipeline.predict(dup_hist, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        self.assertIn("Duplicate date records detected", str(ctx.exception))

    # 12. Unknown Catchment ID Rejection
    def test_unknown_catchment_id_error(self):
        """Verifies that an unknown catchment ID raises ValueError."""
        with self.assertRaises(ValueError) as ctx:
            self.pipeline.predict(self.demo_history, "camels_99999999", self.origin_date, feature_mode="gauged")
        self.assertIn("not found in provided history_df", str(ctx.exception))

    # 13. Unsupported Region / Collection Rejection
    def test_unsupported_region_rejection(self):
        """Verifies that an unsupported source collection raises ValueError."""
        bad_hist = self.demo_history.copy()
        bad_hist['source_collection'] = 'UNKNOWN-BASIN'
        with self.assertRaises(ValueError) as ctx:
            self.pipeline.predict(bad_hist, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        self.assertIn("Unsupported source collection", str(ctx.exception))

    # 14. Non-Negative Discharge Outputs
    def test_non_negative_discharge_outputs(self):
        """Verifies that all predicted discharge values are >= 0.0."""
        for mode in ['gauged', 'ungauged']:
            res = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode=mode)
            for h in ['1d', '3d', '7d']:
                self.assertGreaterEqual(res['predicted_discharge'][h], 0.0)

    # 15. Probability Bounds and Decision Threshold Mapping
    def test_probability_bounds_and_decision_thresholds(self):
        """Verifies probability bounds in [0, 1] and correct optimal decision thresholds."""
        res_g = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        res_u = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="ungauged")

        # Threshold mappings
        self.assertEqual(res_g['high_flow_alert_threshold']['1d'], 0.70)
        self.assertEqual(res_g['high_flow_alert_threshold']['3d'], 0.70)
        self.assertEqual(res_g['high_flow_alert_threshold']['7d'], 0.60)

        self.assertEqual(res_u['high_flow_alert_threshold']['1d'], 0.70)
        self.assertEqual(res_u['high_flow_alert_threshold']['3d'], 0.66)
        self.assertEqual(res_u['high_flow_alert_threshold']['7d'], 0.66)

        for res in [res_g, res_u]:
            for h in ['1d', '3d', '7d']:
                prob = res['high_flow_probability'][h]
                tau = res['high_flow_alert_threshold'][h]
                self.assertTrue(0.0 <= prob <= 1.0)
                self.assertEqual(res['high_flow_alert'][h], (prob >= tau))

    # 16. JSON Serialization & Prediction Consistency
    def test_output_json_serialization_and_consistency(self):
        """Verifies that the output dictionary is strictly JSON serializable and deterministic."""
        res1 = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        res2 = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")

        # Deterministic
        self.assertEqual(res1, res2)

        # JSON serializable
        json_str = json.dumps(res1, indent=2)
        self.assertIsInstance(json_str, str)
        reloaded = json.loads(json_str)
        self.assertEqual(reloaded['catchment_id'], self.demo_cid_us)
        self.assertEqual(reloaded['discharge_unit'], "mm/day")
        self.assertIsNone(reloaded['extreme_flow_probability'])
        self.assertIsNone(reloaded['prediction_intervals'])
        self.assertFalse(reloaded['uncertainty_available'])

    # 17. Benchmark Reproducibility Against Saved Archives
    def test_benchmark_reproducibility(self):
        """Verifies exact reproduction of audited benchmark predictions from parquet archives."""
        bench_df = pd.read_parquet('reports/predictions/benchmark_per_sample_predictions.parquet')
        clf_df = pd.read_parquet('reports/predictions/classifier_full_predictions.parquet')

        res_g = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="gauged")
        res_u = self.pipeline.predict(self.demo_history, self.demo_cid_us, self.origin_date, feature_mode="ungauged")

        # Gauged comparison
        for h in [1, 3, 7]:
            b_row = bench_df[(bench_df['catchment_id'] == self.demo_cid_us) & 
                             (bench_df['forecast_origin'] == self.origin_date) & 
                             (bench_df['horizon'] == h) & 
                             (bench_df['feature_mode'] == 'Gauged') & 
                             (bench_df['model'] == 'XGBoost')]
            if not b_row.empty:
                expected_q = b_row['predicted_discharge'].values[0]
                actual_q = res_g['predicted_discharge'][f"{h}d"]
                self.assertAlmostEqual(actual_q, expected_q, places=3)

            c_row = clf_df[(clf_df['catchment_id'] == self.demo_cid_us) & 
                           (clf_df['forecast_origin'] == self.origin_date) & 
                           (clf_df['horizon'] == h) & 
                           (clf_df['feature_mode'] == 'Gauged')]
            if not c_row.empty:
                expected_p = c_row['predicted_probability'].values[0]
                actual_p = res_g['high_flow_probability'][f"{h}d"]
                self.assertAlmostEqual(actual_p, expected_p, places=3)

        # Ungauged comparison (h=3 and h=7 XGBoost 1.0)
        for h in [3, 7]:
            b_row = bench_df[(bench_df['catchment_id'] == self.demo_cid_us) & 
                             (bench_df['forecast_origin'] == self.origin_date) & 
                             (bench_df['horizon'] == h) & 
                             (bench_df['feature_mode'] == 'Ungauged') & 
                             (bench_df['model'] == 'XGBoost')]
            if not b_row.empty:
                expected_q = b_row['predicted_discharge'].values[0]
                actual_q = res_u['predicted_discharge'][f"{h}d"]
                self.assertAlmostEqual(actual_q, expected_q, places=3)

    # 18. Helper function load_demo_history
    def test_load_demo_history_helper(self):
        """Verifies load_demo_history helper behaves properly under valid and invalid conditions."""
        # Valid US
        df_us = load_demo_history(self.demo_cid_us, self.origin_date, history_days=365)
        self.assertEqual(len(df_us), 366)
        self.assertEqual(df_us['date'].max(), pd.to_datetime(self.origin_date))

        # Valid Australia
        df_aus = load_demo_history(self.demo_cid_aus, self.origin_date, history_days=365)
        self.assertEqual(len(df_aus), 366)
        self.assertEqual(df_aus['source_collection'].iloc[0], 'CAMELS-AUS')

        # Invalid catchment
        with self.assertRaises(ValueError):
            load_demo_history("invalid_catchment_xyz", self.origin_date)

        # Invalid origin date
        with self.assertRaises(ValueError):
            load_demo_history(self.demo_cid_us, "invalid-date-format")


if __name__ == '__main__':
    unittest.main()

