"""
BASINSHIFT: Brier Reference and Calibration Terminology Audit
Author: Technical Data Auditor & Lead ML Engineer (Member 1: Model & Training)
Authoritative Reference: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Calculates:
1. Exact training prevalence p_train by horizon (global and region-conditioned).
2. Correct fixed-baseline operational reference Brier score:
       BS_reference = (1 - p_eval) * p_train^2 + p_eval * (1 - p_train)^2
       = mean((p_train - y_eval)^2)
3. Corrected operational Brier Skill Score:
       BSS_oper = 1 - BS_model / BS_reference
4. Compares with retrospective sample reference:
       BS_ref_eval = p_eval * (1 - p_eval)
       BSS_eval = 1 - BS_model / BS_ref_eval
5. Outputs reports/brier_reference_audit.csv and updates final_classifier_reconciliation.csv/md.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import pandas as pd
from sklearn.metrics import brier_score_loss, average_precision_score, roc_auc_score

DATA_PATH = Path("data/processed/pilot_150_catchments.parquet")
SPLIT_PATH = Path("docs/split_manifest.csv")
THRESH_PATH = Path("reports/high_flow_thresholds.csv")
PREDS_PATH = Path("reports/predictions/classifier_full_predictions.parquet")
OUT_AUDIT_CSV = Path("reports/brier_reference_audit.csv")

def run_audit():
    print("Loading data and prediction archive...")
    df_raw = pd.read_parquet(DATA_PATH)
    split_df = pd.read_csv(SPLIT_PATH)
    thresh_df = pd.read_csv(THRESH_PATH)
    preds_df = pd.read_parquet(PREDS_PATH)

    dev_ids = set(split_df[split_df['partition'] == 'Development']['catchment_id'])
    q95_map = {r['source_collection']: float(r['threshold_q95_mm_per_day']) for _, r in thresh_df.iterrows()}
    df_raw['regional_q95'] = df_raw['source_collection'].map(q95_map)

    # 1. Compute exact training-only event prevalence
    # We need future targets in training set:
    df_raw = df_raw.sort_values(['catchment_id', 'date']).reset_index(drop=True)
    
    training_stats = {}
    for h in [1, 3, 7]:
        t_col = f'target_h{h}'
        df_raw[t_col] = df_raw.groupby('catchment_id')['streamflow'].shift(-h)
        b_col = f'target_hf_h{h}'
        df_raw[b_col] = np.where(df_raw[t_col].isna(), np.nan, (df_raw[t_col] > df_raw['regional_q95']).astype(float))

        eff_train_end = pd.Timestamp('2012-12-31') - pd.Timedelta(days=h)
        tr_mask = (
            df_raw['catchment_id'].isin(dev_ids) &
            (df_raw['date'] >= pd.Timestamp('2005-01-01')) &
            (df_raw['date'] <= eff_train_end) &
            df_raw[b_col].notna()
        )
        
        y_tr = df_raw.loc[tr_mask, b_col].values
        c_tr = df_raw.loc[tr_mask, 'source_collection'].values
        
        p_glob = float(np.mean(y_tr))
        p_aus = float(np.mean(y_tr[c_tr == 'CAMELS-AUS']))
        p_us = float(np.mean(y_tr[c_tr == 'CAMELS-US']))
        
        training_stats[h] = {
            'n_train': len(y_tr),
            'n_pos_train': int(np.sum(y_tr)),
            'p_train_global': p_glob,
            'p_train_aus': p_aus,
            'p_train_us': p_us
        }
        print(f"[Horizon h={h}d] Training N={len(y_tr):,} | Global p_train={p_glob:.6f} | AUS p_train={p_aus:.6f} | US p_train={p_us:.6f}")

    # 2. Audit all 12 evaluation regimes from classifier_full_predictions.parquet
    audit_rows = []

    # Map catchment_id to source_collection
    cid_to_coll = df_raw[['catchment_id', 'source_collection']].drop_duplicates().set_index('catchment_id')['source_collection'].to_dict()
    preds_df['source_collection'] = preds_df['catchment_id'].map(cid_to_coll)

    regimes = [
        (1, 'Ungauged', 'Temporal_Val_Test_A'),
        (1, 'Ungauged_PUB', 'Geographic_Val_Test_B'),
        (1, 'Gauged', 'Temporal_Val_Test_A'),
        (1, 'Gauged_Transfer', 'Geographic_Val_Test_B'),
        (3, 'Ungauged', 'Temporal_Val_Test_A'),
        (3, 'Ungauged_PUB', 'Geographic_Val_Test_B'),
        (3, 'Gauged', 'Temporal_Val_Test_A'),
        (3, 'Gauged_Transfer', 'Geographic_Val_Test_B'),
        (7, 'Ungauged', 'Temporal_Val_Test_A'),
        (7, 'Ungauged_PUB', 'Geographic_Val_Test_B'),
        (7, 'Gauged', 'Temporal_Val_Test_A'),
        (7, 'Gauged_Transfer', 'Geographic_Val_Test_B'),
    ]

    for h, mode, part in regimes:
        sub = preds_df[
            (preds_df['horizon'] == h) &
            (preds_df['feature_mode'] == mode) &
            (preds_df['partition'] == part)
        ].copy()

        y_true = sub['actual_high_flow_event'].values.astype(int)
        y_prob = sub['predicted_probability'].values.astype(float)
        colls = sub['source_collection'].values

        n_eval = len(y_true)
        n_pos_eval = int(np.sum(y_true))
        p_eval = float(n_pos_eval / n_eval)

        # Model Brier score
        bs_model = float(np.mean((y_prob - y_true)**2))

        # A. Retrospective Sample Reference (Oracle)
        bs_ref_eval = float(p_eval * (1.0 - p_eval))
        bss_eval = float(1.0 - (bs_model / bs_ref_eval))

        # B. Primary Operational Reference: Fixed Global Training Climatology
        p_tr_glob = training_stats[h]['p_train_global']
        # Compute exact Brier score of constant prediction p_tr_glob on evaluation labels:
        # Direct mean squared error:
        bs_ref_oper_glob_direct = float(np.mean((p_tr_glob - y_true)**2))
        # Equivalent analytic formula:
        bs_ref_oper_glob_formula = float((1.0 - p_eval) * (p_tr_glob**2) + p_eval * ((1.0 - p_tr_glob)**2))
        assert abs(bs_ref_oper_glob_direct - bs_ref_oper_glob_formula) < 1e-10, "Formula discrepancy in operational Brier"
        
        bss_oper_glob = float(1.0 - (bs_model / bs_ref_oper_glob_direct))

        # Old flawed operational reference (from previous erroneous formula):
        old_bs_ref_flawed = float(p_tr_glob * (1.0 - p_tr_glob))
        old_bss_flawed = float(1.0 - (bs_model / old_bs_ref_flawed))

        # C. Supplementary Operational Reference: Region-Conditioned Training Climatology
        p_tr_aus = training_stats[h]['p_train_aus']
        p_tr_us = training_stats[h]['p_train_us']
        p_tr_region = np.where(colls == 'CAMELS-AUS', p_tr_aus, p_tr_us)
        bs_ref_oper_reg = float(np.mean((p_tr_region - y_true)**2))
        bss_oper_reg = float(1.0 - (bs_model / bs_ref_oper_reg))

        audit_rows.append({
            'horizon_days': h,
            'feature_mode': mode,
            'partition': part,
            'n_eval_samples': n_eval,
            'n_eval_positive_events': n_pos_eval,
            'p_eval_prevalence': round(p_eval, 5),
            'p_train_global': round(p_tr_glob, 5),
            'bs_model': round(bs_model, 5),
            # Corrected Operational Global Baseline (PRIMARY)
            'bs_ref_oper_global': round(bs_ref_oper_glob_direct, 5),
            'bss_oper_global_corrected': round(bss_oper_glob, 4),
            # Old Flawed Reference
            'bs_ref_oper_flawed_old': round(old_bs_ref_flawed, 5),
            'bss_oper_flawed_old': round(old_bss_flawed, 4),
            'bss_oper_delta': round(bss_oper_glob - old_bss_flawed, 4),
            # Retrospective Sample Reference (Oracle)
            'bs_ref_eval_sample': round(bs_ref_eval, 5),
            'bss_eval_sample': round(bss_eval, 4),
            # Supplementary Regional Baseline
            'bs_ref_oper_regional': round(bs_ref_oper_reg, 5),
            'bss_oper_regional_supp': round(bss_oper_reg, 4)
        })

    audit_df = pd.DataFrame(audit_rows)
    audit_df.to_csv(OUT_AUDIT_CSV, index=False)
    print(f"\nSaved audit results to {OUT_AUDIT_CSV}")
    print(audit_df[['horizon_days', 'feature_mode', 'partition', 'bs_model', 'bs_ref_oper_global', 'bss_oper_global_corrected', 'bss_oper_flawed_old', 'bss_eval_sample']])

if __name__ == "__main__":
    run_audit()

