"""
Compares Variant A (Original Experimental) vs Variant B (Corrected Mass-Balanced)
for the Conceptual Hydrology Hybrid across all horizons and partitions.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import pandas as pd
import time

from src.basinshift.features import compute_features, get_feature_columns
from src.basinshift.hydrology import compute_conceptual_reservoirs, HYDRO_FEATURE_COLS
from src.basinshift.audit_mass_balance import compute_corrected_reservoirs_variant_b
from src.basinshift.hybrid import ConceptualHydrologyHybrid
from src.basinshift.metrics import evaluate_predictions

def compare_hybrid_variants():
    print("Loading data...")
    df_raw = pd.read_parquet("data/processed/pilot_150_catchments.parquet")
    split_df = pd.read_csv("reports/split_manifest.csv")
    thresh_df = pd.read_csv("reports/high_flow_thresholds.csv")
    
    dev_ids = set(split_df[split_df['partition'] == 'Development']['catchment_id'])
    holdout_ids = set(split_df[split_df['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
    regional_q95_map = {r['source_collection']: float(r['threshold_q95_mm_per_day']) for _, r in thresh_df.iterrows()}

    feat_df = compute_features(df_raw)
    feat_df = compute_conceptual_reservoirs(feat_df)
    feat_df = compute_corrected_reservoirs_variant_b(feat_df)

    base_u_cols, base_g_cols = get_feature_columns()

    # Variant A columns
    v1_u_cols = base_u_cols + HYDRO_FEATURE_COLS
    v1_g_cols = base_g_cols + HYDRO_FEATURE_COLS

    # Variant B columns
    v2_hydro_cols = [
        'hydro_v2_p_eff', 'hydro_v2_snowmelt', 'hydro_v2_water_input',
        'hydro_v2_s_fast', 'hydro_v2_s_med', 'hydro_v2_s_slow',
        'hydro_v2_q_fast', 'hydro_v2_q_med', 'hydro_v2_q_slow',
        'hydro_v2_q_routed_total', 'hydro_v2_storage_total'
    ]
    v2_u_cols = base_u_cols + v2_hydro_cols
    v2_g_cols = base_g_cols + v2_hydro_cols

    results = []

    for h in [1, 3, 7]:
        print(f"\n--- Comparing Hybrid Variants for h={h}d ---")
        target_col = f'target_h{h}'
        effective_train_end = pd.Timestamp('2012-12-31') - pd.Timedelta(days=h)
        effective_val_end = pd.Timestamp('2014-12-31') - pd.Timedelta(days=h)

        train_mask = (
            feat_df['catchment_id'].isin(dev_ids) &
            (feat_df['date'] >= pd.Timestamp('2005-01-01')) &
            (feat_df['date'] <= effective_train_end) &
            feat_df[target_col].notna()
        )
        val_temp_mask = (
            feat_df['catchment_id'].isin(dev_ids) &
            (feat_df['date'] >= pd.Timestamp('2013-01-01')) &
            (feat_df['date'] <= effective_val_end)
        )
        val_geo_mask = (
            feat_df['catchment_id'].isin(holdout_ids) &
            (feat_df['date'] >= pd.Timestamp('2013-01-01')) &
            (feat_df['date'] <= effective_val_end)
        )

        train_df = feat_df[train_mask].copy()
        val_temp_df = feat_df[val_temp_mask].copy()
        val_geo_df = feat_df[val_geo_mask].copy()

        eval_sets = [
            ("Temporal_Val_Test_A", val_temp_df),
            ("Geographic_Val_Test_B", val_geo_df)
        ]

        # For both variants and feature modes:
        for var_name, u_cols, g_cols in [('Variant_A_Original', v1_u_cols, v1_g_cols), ('Variant_B_MassBalanced', v2_u_cols, v2_g_cols)]:
            for mode, cols in [('Ungauged', u_cols), ('Gauged', g_cols)]:
                hybrid = ConceptualHydrologyHybrid(horizon=h, feature_mode=mode)
                oof_df = hybrid.fit_expanding_oof(train_df, cols, target_col)

                for part_name, part_df in eval_sets:
                    transfer_label = 'Gauged_Transfer' if (mode == 'Gauged' and 'Test_B' in part_name) else ('Ungauged_PUB' if (mode == 'Ungauged' and 'Test_B' in part_name) else mode)
                    y_true = part_df[target_col].values
                    c_ids = part_df['catchment_id'].values

                    y_pred, _, _ = hybrid.predict(part_df)
                    q95_map = {cid: regional_q95_map[feat_df.loc[feat_df['catchment_id']==cid, 'source_collection'].iloc[0]] for cid in np.unique(c_ids)}

                    metrics = evaluate_predictions(y_true, y_pred, catchment_ids=c_ids, q95_thresholds=q95_map)
                    results.append({
                        'variant': var_name,
                        'horizon_days': h,
                        'feature_mode': transfer_label,
                        'partition': part_name,
                        'rmse': metrics['rmse'],
                        'mae': metrics['mae'],
                        'median_nse': metrics['median_nse'],
                        'median_kge': metrics['median_kge'],
                        'high_flow_rmse': metrics['high_flow_rmse'],
                        'n_valid_samples': metrics['n_valid_samples']
                    })
                    print(f"[{var_name} | {part_name} - {transfer_label}] RMSE={metrics['rmse']:.3f}, Med-NSE={metrics['median_nse']:.3f}")

    comp_df = pd.DataFrame(results)
    out_csv = "reports/hydrology_variant_comparison.csv"
    comp_df.to_csv(out_csv, index=False)
    print(f"\nSaved {out_csv}")
    print(comp_df.to_string())

if __name__ == '__main__':
    compare_hybrid_variants()

