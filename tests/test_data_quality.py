import unittest
import pandas as pd
import numpy as np
from pathlib import Path

DATA_PARQUET = Path("data/processed/pilot_150_catchments.parquet")
SPLIT_CSV = Path("reports/split_manifest.csv")
MISSING_CSV = Path("reports/missingness_by_catchment.csv")
COVERAGE_CSV = Path("reports/horizon_sample_coverage.csv")

class TestDataQuality(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        assert DATA_PARQUET.exists(), f"Missing dataset: {DATA_PARQUET}"
        assert SPLIT_CSV.exists(), f"Missing split manifest: {SPLIT_CSV}"
        assert MISSING_CSV.exists(), f"Missing missingness report: {MISSING_CSV}"
        assert COVERAGE_CSV.exists(), f"Missing horizon coverage report: {COVERAGE_CSV}"
        
        cls.df_catchments = pd.read_parquet(DATA_PARQUET)
        cls.df_catchments['date'] = pd.to_datetime(cls.df_catchments['date'])
        cls.df_splits = pd.read_csv(SPLIT_CSV)
        cls.df_missingness = pd.read_csv(MISSING_CSV)
        cls.df_coverage = pd.read_csv(COVERAGE_CSV)

    def test_catchment_inventory_and_counts(self):
        """Ensure exactly 150 catchments (75 AUS, 75 US) and 547,800 rows."""
        catchments = self.df_catchments['catchment_id'].unique()
        self.assertEqual(len(catchments), 150)
        self.assertEqual(len(self.df_catchments), 547800)
        
        src_counts = self.df_catchments.groupby('source_collection')['catchment_id'].nunique()
        self.assertEqual(src_counts['CAMELS-AUS'], 75)
        self.assertEqual(src_counts['CAMELS-US'], 75)

    def test_no_duplicate_keys_and_continuous_calendar(self):
        """Ensure (catchment_id, date) is strictly unique and spans continuous 3,652 dates."""
        dup_count = self.df_catchments.duplicated(subset=['catchment_id', 'date']).sum()
        self.assertEqual(dup_count, 0)
        
        expected_start = pd.Timestamp("2005-01-01")
        expected_end = pd.Timestamp("2014-12-31")
        expected_days = 3652
        
        for cid, group in self.df_catchments.groupby('catchment_id'):
            self.assertEqual(len(group), expected_days, f"{cid} has {len(group)} dates, expected {expected_days}")
            self.assertEqual(group['date'].min(), expected_start, f"{cid} starts at {group['date'].min()}")
            self.assertEqual(group['date'].max(), expected_end, f"{cid} ends at {group['date'].max()}")
            date_diffs = group['date'].diff().dropna()
            self.assertTrue((date_diffs == pd.Timedelta(days=1)).all(), f"{cid} has discontinuous date steps")

    def test_missing_streamflow_preserved_as_nan(self):
        """Verify that streamflow missingness is preserved as NaN and not imputed to zero or sentinels."""
        total_missing = self.df_catchments['streamflow'].isna().sum()
        self.assertEqual(total_missing, 3994, f"Expected 3,994 missing streamflow values, found {total_missing}")
        
        # Check that sentinel values are not present
        sentinels = [-99.99, -999, -9999, -999999]
        for s in sentinels:
            self.assertFalse((self.df_catchments['streamflow'] == s).any(), f"Sentinel value {s} found in streamflow")
        self.assertFalse((self.df_catchments['streamflow'] < -1e-6).any(), "Negative streamflow values detected")

    def test_genuine_zeros_preserved(self):
        """Verify that authentic zero-streamflow days are preserved and distinct from NaNs."""
        zero_count = (self.df_catchments['streamflow'] == 0.0).sum()
        self.assertEqual(zero_count, 49416, f"Expected 49,416 zero-streamflow records, found {zero_count}")
        
        # Verify zeros exist in both AUS and US
        aus_zeros = ((self.df_catchments['source_collection'] == 'CAMELS-AUS') & (self.df_catchments['streamflow'] == 0.0)).sum()
        us_zeros = ((self.df_catchments['source_collection'] == 'CAMELS-US') & (self.df_catchments['streamflow'] == 0.0)).sum()
        self.assertEqual(aus_zeros, 39183, f"Expected 39,183 AUS zeros, got {aus_zeros}")
        self.assertEqual(us_zeros, 10233, f"Expected 10,233 US zeros, got {us_zeros}")

    def test_weather_completeness_and_physical_bounds(self):
        """Verify 0.00% missingness and physical plausibility in ERA5-Land weather forcing."""
        weather_vars = [
            'total_precipitation',
            'temperature_2m',
            'dewpoint_temperature_2m',
            'potential_evaporation',
            'volumetric_soil_water_layer_1',
            'snow_depth_water_equivalent'
        ]
        for var in weather_vars:
            missing_count = self.df_catchments[var].isna().sum()
            self.assertEqual(missing_count, 0, f"Found {missing_count} missing values in weather variable {var}")
            
        self.assertTrue((self.df_catchments['total_precipitation'] >= 0.0).all(), "Negative precipitation found")
        self.assertTrue((self.df_catchments['potential_evaporation'] >= 0.0).all(), "Negative potential evaporation found")
        self.assertTrue((self.df_catchments['snow_depth_water_equivalent'] >= 0.0).all(), "Negative snow depth found")
        self.assertTrue((self.df_catchments['volumetric_soil_water_layer_1'] >= 0.0).all(), "Negative soil moisture found")
        self.assertTrue((self.df_catchments['volumetric_soil_water_layer_1'] <= 1.0).all(), "Soil moisture exceeds 1.0 fraction")
        self.assertTrue((self.df_catchments['temperature_2m'] >= -60.0).all() and (self.df_catchments['temperature_2m'] <= 60.0).all(), "Temperature out of range")

    def test_partition_isolation_and_disjointness(self):
        """Verify strict disjointness between Development (120) and Test B Geographic Holdout (30)."""
        self.assertEqual(len(self.df_splits), 150)
        
        dev_ids = set(self.df_splits[self.df_splits['partition'] == 'Development']['catchment_id'])
        holdout_ids = set(self.df_splits[self.df_splits['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
        
        self.assertEqual(len(dev_ids), 120)
        self.assertEqual(len(holdout_ids), 30)
        
        overlap = dev_ids.intersection(holdout_ids)
        self.assertEqual(len(overlap), 0, f"Leakage detected! Overlap between Dev and Holdout: {overlap}")

    def test_target_masking_without_catchment_dropping(self):
        """Verify that shifting for horizons {1, 3, 7} creates valid target masks without dropping catchments."""
        sorted_df = self.df_catchments.sort_values(['catchment_id', 'date']).reset_index(drop=True)
        
        for h in [1, 3, 7]:
            target_series = sorted_df.groupby('catchment_id')['streamflow'].shift(-h)
            valid_mask = target_series.notna()
            
            # Check that valid targets exist for EVERY catchment
            valid_catchments_count = sorted_df[valid_mask]['catchment_id'].nunique()
            self.assertEqual(valid_catchments_count, 150, f"Horizon {h} dropped catchments! Found {valid_catchments_count}/150")
            
            # Verify valid supervised rows exceed 500,000 across the full dataset
            valid_rows = valid_mask.sum()
            self.assertGreater(valid_rows, 500000, f"Horizon {h} has too few valid targets: {valid_rows}")

    def test_horizon_sample_coverage_csv(self):
        """Verify horizon sample coverage report contents and thresholds."""
        self.assertEqual(len(self.df_coverage), 12)
        
        # Coverage percentage should exceed 98% across all partitions and horizons
        self.assertTrue((self.df_coverage['target_coverage_pct'] >= 98.0).all(), "Target coverage fell below 98%")
        self.assertTrue((self.df_coverage['persistence_coverage_pct'] >= 98.0).all(), "Persistence coverage fell below 98%")
        
        # Check that development training has ~348k valid samples
        dev_train = self.df_coverage[self.df_coverage['partition'] == 'Development_Training']
        for _, row in dev_train.iterrows():
            self.assertGreater(row['valid_supervised_samples'], 347000, f"Dev train has fewer valid samples: {row['valid_supervised_samples']}")

if __name__ == '__main__':
    unittest.main()
