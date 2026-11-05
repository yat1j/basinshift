import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pandas as pd
import numpy as np

def compute_regional_q95():
    parquet_path = "data/processed/pilot_150_catchments.parquet"
    split_path = "reports/split_manifest.csv"
    
    df = pd.read_parquet(parquet_path)
    split_df = pd.read_csv(split_path)
    
    dev_ids = set(split_df[split_df['partition'] == 'Development']['catchment_id'])
    
    # Filter strictly to Development Training: 2005-01-01 to 2012-12-31 and non-NaN streamflow
    dev_train_mask = (
        df['catchment_id'].isin(dev_ids) &
        (pd.to_datetime(df['date']) >= pd.Timestamp('2005-01-01')) &
        (pd.to_datetime(df['date']) <= pd.Timestamp('2012-12-31')) &
        df['streamflow'].notna()
    )
    dev_train_df = df[dev_train_mask].copy()
    
    print(f"Total valid dev train records: {len(dev_train_df):,}")
    
    # Group by source_collection (CAMELS-US and CAMELS-AUS)
    records = []
    for region in ['CAMELS-AUS', 'CAMELS-US']:
        reg_df = dev_train_df[dev_train_df['source_collection'] == region]
        q_vals = reg_df['streamflow'].values
        
        q50 = float(np.percentile(q_vals, 50.0))
        q90 = float(np.percentile(q_vals, 90.0))
        q95 = float(np.percentile(q_vals, 95.0))
        q99 = float(np.percentile(q_vals, 99.0))
        mean_val = float(np.mean(q_vals))
        std_val = float(np.std(q_vals))
        max_val = float(np.max(q_vals))
        n_obs = len(q_vals)
        n_catchments = reg_df['catchment_id'].nunique()
        
        print(f"\nRegion: {region}")
        print(f"Catchments: {n_catchments}")
        print(f"Valid records: {n_obs:,}")
        print(f"Mean: {mean_val:.4f} mm/day | Std: {std_val:.4f} mm/day")
        print(f"Median (Q50): {q50:.4f} mm/day")
        print(f"Q90: {q90:.4f} mm/day")
        print(f"Q95 (Frozen Regional Threshold): {q95:.4f} mm/day")
        print(f"Q99: {q99:.4f} mm/day")
        print(f"Max: {max_val:.4f} mm/day")
        
        records.append({
            'source_collection': region,
            'region_name': 'Australia' if region == 'CAMELS-AUS' else 'United States',
            'derivation_partition': 'Development_Training_Only',
            'start_date': '2005-01-01',
            'end_date': '2012-12-31',
            'num_catchments': n_catchments,
            'valid_observations_count': n_obs,
            'threshold_q95_mm_per_day': round(q95, 4),
            'threshold_q90_mm_per_day': round(q90, 4),
            'median_q50_mm_per_day': round(q50, 4),
            'mean_discharge_mm_per_day': round(mean_val, 4),
            'std_discharge_mm_per_day': round(std_val, 4),
            'max_discharge_mm_per_day': round(max_val, 4),
            'units': 'mm/day (specific discharge)',
            'status': 'FROZEN_REGIONAL_EXPERIMENTAL_THRESHOLD',
            'notes': 'Derived strictly from Development Training catchments (2005-2012). Zero holdout or test discharge used.'
        })
        
    out_df = pd.DataFrame(records)
    out_path = "reports/high_flow_thresholds.csv"
    out_df.to_csv(out_path, index=False)
    print(f"\nSaved frozen regional thresholds to {out_path}")

if __name__ == '__main__':
    compute_regional_q95()

