import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import time
import pandas as pd
import numpy as np
from src.basinshift.features import compute_features, get_feature_columns

def verify_feature_pipeline():
    start_t = time.time()
    print("Loading raw processed parquet...")
    raw_df = pd.read_parquet("data/processed/pilot_150_catchments.parquet")
    print(f"Loaded raw data: {raw_df.shape} in {time.time() - start_t:.2f}s")
    
    t0 = time.time()
    feat_df = compute_features(raw_df)
    t_feat = time.time() - t0
    print(f"Features computed in {t_feat:.2f}s, output shape: {feat_df.shape}")
    
    ungauged_cols, gauged_cols = get_feature_columns()
    print(f"Ungauged features count: {len(ungauged_cols)}")
    print(f"Gauged features count: {len(gauged_cols)}")
    
    # Assertions
    # 1. Total rows preserved
    assert len(feat_df) == 547800, f"Expected 547,800 rows, got {len(feat_df)}"
    # 2. Genuine zeros preserved in q_obs_t
    zeros_q = (feat_df['q_obs_t'] == 0.0).sum()
    assert zeros_q == 49416, f"Expected 49,416 zeros in q_obs_t, got {zeros_q}"
    # 3. Missing count preserved in q_obs_t
    nans_q = feat_df['q_obs_t'].isna().sum()
    assert nans_q == 3994, f"Expected 3,994 NaNs in q_obs_t, got {nans_q}"
    # 4. is_flow_missing_t matches nans_q
    missing_flags = feat_df['is_flow_missing_t'].sum()
    assert missing_flags == 3994, f"Expected 3,994 missing flags, got {missing_flags}"
    # 5. Check targets
    for h in [1, 3, 7]:
        t_col = f'target_h{h}'
        assert t_col in feat_df.columns
        print(f"Target h={h}: valid={feat_df[t_col].notna().sum():,}, NaN={feat_df[t_col].isna().sum():,}")
        
    # Check that ungauged features have 0 NaNs (except maybe diff(7) on first 7 days)
    for c in ungauged_cols:
        n_nan = feat_df[c].isna().sum()
        if n_nan > 0:
            print(f"Feature '{c}' has {n_nan} NaNs (first 7 days of basin history)")
            
    print("\nFeature pipeline verification successful!")

if __name__ == '__main__':
    verify_feature_pipeline()
