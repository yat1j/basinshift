import pandas as pd
import numpy as np

def run_coverage_audit():
    # Load processed data
    parquet_path = "data/processed/pilot_150_catchments.parquet"
    print(f"Loading {parquet_path}...")
    df = pd.read_parquet(parquet_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Load split manifest
    split_df = pd.read_csv("reports/split_manifest.csv")
    dev_ids = set(split_df[split_df['partition'] == 'Development']['catchment_id'])
    holdout_ids = set(split_df[split_df['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
    
    print(f"Total rows: {len(df):,}")
    print(f"Development catchments: {len(dev_ids)}")
    print(f"Geographic holdout catchments: {len(holdout_ids)}")
    
    # Sort for time series shifting
    df = df.sort_values(['catchment_id', 'date']).reset_index(drop=True)
    
    # Create target columns for h in [1, 3, 7]
    for h in [1, 3, 7]:
        df[f'target_h{h}'] = df.groupby('catchment_id')['streamflow'].shift(-h)
    
    # Define partitions
    # 1. Dev Training: dev_ids, date <= 2012-12-31, and date + h <= 2012-12-31
    # 2. Temporal Val (Test A): dev_ids, date >= 2013-01-01, date + h <= 2014-12-31
    # 3. Geographic Val (Test B - Full): holdout_ids, date + h <= 2014-12-31
    # 4. Geographic Val (Test B - 2013-2014): holdout_ids, date >= 2013-01-01, date + h <= 2014-12-31
    
    results = []
    
    horizons = [1, 3, 7]
    
    partitions = [
        ("Development_Training", dev_ids, "2005-01-01", "2012-12-31", True),
        ("Temporal_Val_Test_A", dev_ids, "2013-01-01", "2014-12-31", True),
        ("Geographic_Val_Test_B_Full", holdout_ids, "2005-01-01", "2014-12-31", True),
        ("Geographic_Val_Test_B_2013_2014", holdout_ids, "2013-01-01", "2014-12-31", True),
    ]
    
    for part_name, id_set, start_str, end_str, enforce_target_in_window in partitions:
        start_date = pd.to_datetime(start_str)
        end_date = pd.to_datetime(end_str)
        
        part_df = df[df['catchment_id'].isin(id_set)]
        
        for h in horizons:
            target_col = f'target_h{h}'
            
            if enforce_target_in_window:
                # Origin must allow target within window
                effective_end = end_date - pd.Timedelta(days=h)
            else:
                effective_end = end_date
                
            mask = (part_df['date'] >= start_date) & (part_df['date'] <= effective_end)
            sub = part_df[mask]
            
            total_samples = len(sub)
            valid_targets = sub[target_col].notna().sum()
            missing_targets = sub[target_col].isna().sum()
            target_coverage_pct = (valid_targets / total_samples * 100.0) if total_samples > 0 else 0.0
            
            # Zero target count
            zero_targets = (sub[target_col] == 0.0).sum()
            zero_target_pct = (zero_targets / valid_targets * 100.0) if valid_targets > 0 else 0.0
            
            # Valid pairs for persistence baseline (q_t notna and q_{t+h} notna)
            valid_persistence = ((sub['streamflow'].notna()) & (sub[target_col].notna())).sum()
            persistence_coverage_pct = (valid_persistence / total_samples * 100.0) if total_samples > 0 else 0.0
            
            num_catchments = len(id_set)
            days_per_catchment = (effective_end - start_date).days + 1
            
            results.append({
                'partition': part_name,
                'horizon_days': h,
                'num_catchments': num_catchments,
                'start_origin_date': start_str,
                'end_origin_date': str(effective_end.date()),
                'days_per_catchment': days_per_catchment,
                'total_possible_samples': total_samples,
                'valid_supervised_samples': valid_targets,
                'missing_target_samples': missing_targets,
                'target_coverage_pct': round(target_coverage_pct, 4),
                'zero_target_samples': zero_targets,
                'zero_target_pct': round(zero_target_pct, 4),
                'valid_persistence_samples': valid_persistence,
                'persistence_coverage_pct': round(persistence_coverage_pct, 4)
            })
            
    res_df = pd.DataFrame(results)
    out_path = "reports/horizon_sample_coverage.csv"
    res_df.to_csv(out_path, index=False)
    print(f"Saved {out_path}")
    print(res_df.to_string())

if __name__ == '__main__':
    run_coverage_audit()

