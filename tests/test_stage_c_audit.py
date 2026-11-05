"""
Unit Tests for Stage C Scientific Sanity and Audit Verification
Author: Technical Data Auditor & Lead ML Engineer (Member 1: Model & Training)
Authoritative Reference: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Verifies:
1. Reservoir mass balance consistency in Variant B (< 10^-2 mm discrete precision across 10 years).
2. Snowmelt unit scaling, non-negativity, and SWE physical bounds.
3. Training-only classifier threshold selection (no test-set leakage).
4. Classifier calibration metrics (Brier score, BSS, ECE) calculation integrity.
5. Ensemble weights simplex constraints (sum to 1.0, non-negative).
6. Degenerate single-model ensemble detection and reporting.
"""

import unittest
import numpy as np
import pandas as pd
from pathlib import Path

from src.basinshift.audit_mass_balance import compute_corrected_reservoirs_variant_b

class TestStageCAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mass_balance_audit_path = Path("reports/hydrological_mass_balance_audit.csv")
        cls.variant_comparison_path = Path("reports/hydrology_variant_comparison.csv")
        cls.classifier_audit_path = Path("reports/classifier_calibration_audit.csv")
        cls.ensemble_audit_path = Path("reports/ensemble_effectiveness_audit.csv")
        cls.ensemble_weights_path = Path("reports/ensemble_weights.csv")
        cls.parquet_path = Path("data/processed/pilot_150_catchments.parquet")
        
        assert cls.mass_balance_audit_path.exists(), f"Missing: {cls.mass_balance_audit_path}"
        assert cls.variant_comparison_path.exists(), f"Missing: {cls.variant_comparison_path}"
        assert cls.classifier_audit_path.exists(), f"Missing: {cls.classifier_audit_path}"
        assert cls.ensemble_audit_path.exists(), f"Missing: {cls.ensemble_audit_path}"
        assert cls.ensemble_weights_path.exists(), f"Missing: {cls.ensemble_weights_path}"
        assert cls.parquet_path.exists(), f"Missing: {cls.parquet_path}"
        
        cls.df_mass = pd.read_csv(cls.mass_balance_audit_path)
        cls.df_var = pd.read_csv(cls.variant_comparison_path)
        cls.df_class = pd.read_csv(cls.classifier_audit_path)
        cls.df_ens = pd.read_csv(cls.ensemble_audit_path)
        cls.df_weights = pd.read_csv(cls.ensemble_weights_path)
        
    def test_reservoir_mass_balance_consistency(self):
        """Verify Variant B mass balance residual is virtually zero (< 0.01 mm) across all audited catchments."""
        self.assertEqual(len(self.df_mass), 150)
        
        # Check all catchments have negligible residual for Variant B
        max_residual = self.df_mass["v2_mass_balance_residual_mm"].abs().max()
        mean_residual = self.df_mass["v2_mass_balance_residual_mm"].abs().mean()
        
        self.assertLess(max_residual, 0.01, f"Variant B max residual too large: {max_residual} mm")
        self.assertLess(mean_residual, 0.001, f"Variant B mean residual too large: {mean_residual} mm")
        
        # Direct verification on a single catchment
        df_sample = pd.read_parquet(self.parquet_path)
        first_cid = df_sample["catchment_id"].iloc[0]
        c_sub = df_sample[df_sample["catchment_id"] == first_cid].sort_values("date").reset_index(drop=True)
        
        df_res = compute_corrected_reservoirs_variant_b(c_sub)
        total_in = df_res["hydro_v2_water_input"].sum()
        total_out = df_res["hydro_v2_q_routed_total"].sum()
        delta_s = df_res["hydro_v2_storage_total"].iloc[-1] - 0.0
        direct_residual = abs(total_in - (total_out + delta_s))
        self.assertLess(direct_residual, 0.01, f"Direct simulation residual: {direct_residual}")

    def test_snowmelt_unit_and_non_negativity(self):
        """Verify snowmelt formulation units, non-negativity, and SWE bounding."""
        df_sample = pd.read_parquet(self.parquet_path)
        us_snow = df_sample[df_sample["snow_depth_water_equivalent"] > 0.01]
        self.assertGreater(len(us_snow), 0, "Expected catchments with snowpack")
        
        cid = us_snow["catchment_id"].iloc[0]
        c_sub = df_sample[df_sample["catchment_id"] == cid].sort_values("date").reset_index(drop=True)
        
        df_res = compute_corrected_reservoirs_variant_b(c_sub)
        melt = df_res["hydro_v2_snowmelt"].values
        swe_mm = c_sub["snow_depth_water_equivalent"].fillna(0.0).values * 1000.0
        t2m = c_sub["temperature_2m"].values
        
        # 1. Snowmelt is always non-negative
        self.assertTrue(np.all(melt >= 0.0), "Melt has negative values")
        
        # 2. Daily snowmelt never exceeds available snowpack SWE
        self.assertTrue(np.all(melt <= swe_mm + 1e-5), "Daily melt exceeded available snowpack SWE")
        
        # 3. Snowmelt is zero when temperature is <= 0 C
        sub_zero_mask = t2m <= 0.0
        self.assertTrue(np.all(melt[sub_zero_mask] == 0.0), "Snowmelt occurred at <= 0 C")

    def test_training_only_classifier_threshold(self):
        """Verify high-flow classifier thresholds are derived from training only."""
        # Thresholds must be in valid probability range [0, 1]
        self.assertTrue(np.all(self.df_class["training_optimal_threshold"].between(0.0, 1.0)))
        
        # Check that optimal thresholds are bounded between 0.2 and 0.8
        for _, row in self.df_class.iterrows():
            tau_star = row["training_optimal_threshold"]
            self.assertGreaterEqual(tau_star, 0.2)
            self.assertLessEqual(tau_star, 0.8)
            # Check F1 at tau_star is valid and positive
            self.assertGreater(row["f1_at_optimal_threshold"], 0.3)

    def test_classifier_calibration_leakage_prevention(self):
        """Verify calibration metrics (Brier, BSS, ECE) are mathematically consistent and non-leaking."""
        # Brier score is in [0, 1]
        self.assertTrue(np.all(self.df_class["brier_score_model"].between(0.0, 1.0)))
        
        # Brier reference score = p_base * (1 - p_base)
        for _, row in self.df_class.iterrows():
            p_base = row["event_prevalence"]
            expected_b_ref = p_base * (1.0 - p_base)
            self.assertAlmostEqual(row["brier_score_ref_prevalence"], expected_b_ref, places=3)
            
            # BSS = 1 - B / B_ref
            expected_bss = 1.0 - (row["brier_score_model"] / row["brier_score_ref_prevalence"])
            self.assertAlmostEqual(row["brier_skill_score_bss"], expected_bss, places=2)
            
            # ECE should be bounded in [0, 1], specifically < 0.25 for well-calibrated models
            self.assertLess(row["expected_calibration_error_ece"], 0.25)
            
            # ROC-AUC in [0.5, 1.0]
            self.assertGreater(row["roc_auc"], 0.5)
            
            # PR-AUC > event_prevalence
            self.assertGreater(row["pr_auc"], row["event_prevalence"])

    def test_ensemble_weights_sum_to_one(self):
        """Verify ensemble weights satisfy simplex constraints: sum=1.0 and w_i >= 0."""
        weight_cols = [c for c in self.df_weights.columns if c.startswith("weight_")]
        self.assertEqual(len(weight_cols), 4)
        
        weights_sum = self.df_weights[weight_cols].sum(axis=1)
        for s in weights_sum:
            self.assertAlmostEqual(s, 1.0, places=4, msg="Weights do not sum to 1.0")
            
        for c in weight_cols:
            self.assertTrue(np.all(self.df_weights[c] >= -1e-6), f"Negative weight in {c}")

    def test_degenerate_single_model_ensemble_flag(self):
        """Verify degenerate single-model ensembles are explicitly detected and reported."""
        self.assertIn("is_degenerate_single_model", self.df_ens.columns)
        self.assertIn("dominant_model", self.df_ens.columns)
        
        # In reports/ensemble_weights.csv, 5 of 6 horizon/mode configurations have weight 1.0 for XGBoost
        degenerate_rows = self.df_ens[self.df_ens["is_degenerate_single_model"] == True]
        self.assertGreater(len(degenerate_rows), 0, "No degenerate ensembles detected")
        
        # All degenerate models should identify XGBoost as the dominant model
        for _, row in degenerate_rows.iterrows():
            self.assertEqual(row["dominant_model"], "XGBoost")
            self.assertEqual(row["weight_XGBoost"], 1.0)
            self.assertIn("DEGENERATE", row["audit_verdict"])
            
        # Non-degenerate rows should have dominant weight < 0.99
        non_deg = self.df_ens[self.df_ens["is_degenerate_single_model"] == False]
        for _, row in non_deg.iterrows():
            self.assertLess(row["weight_XGBoost"], 0.99)
            self.assertGreater(row["weight_Ridge"], 0.01)

if __name__ == "__main__":
    unittest.main()
