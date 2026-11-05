"""
BASINSHIFT High-Flow Classifier Calibration & Reliability Audit
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Computes:
1. PR-AUC & ROC-AUC
2. Brier Score & Prevalence-Only Reference Brier Score (B_ref = p * (1 - p))
3. Brier Skill Score (BSS = 1 - B / B_ref)
4. Expected Calibration Error (ECE) across 10 probability bins
5. Calibration Slope & Intercept
6. Precision, Recall, F1 & Confusion Matrix
7. Training-Only Decision Threshold Selection
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.linear_model import LogisticRegression

from src.basinshift.features import compute_features, get_feature_columns
from src.basinshift.hydrology import compute_conceptual_reservoirs, HYDRO_FEATURE_COLS

def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Expected Calibration Error (ECE) with equal-width probability bins."""
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    
    for i in range(n_bins):
        bin_mask = (y_prob >= bin_edges[i]) & (y_prob < bin_edges[i+1] if i < n_bins - 1 else y_prob <= bin_edges[i+1])
        bin_size = np.sum(bin_mask)
        if bin_size > 0:
            bin_acc = np.mean(y_true[bin_mask])
            bin_conf = np.mean(y_prob[bin_mask])
            ece += (bin_size / n) * abs(bin_acc - bin_conf)
            
    return float(ece)

def run_classifier_calibration_audit():
    print("Loading dataset and split manifests...")
    df_raw = pd.read_parquet("data/processed/pilot_150_catchments.parquet")
    split_df = pd.read_csv("reports/split_manifest.csv")
    thresh_df = pd.read_csv("reports/high_flow_thresholds.csv")
    
    dev_ids = set(split_df[split_df['partition'] == 'Development']['catchment_id'])
    holdout_ids = set(split_df[split_df['partition'] == 'Test_B_Geographic_Holdout']['catchment_id'])
    regional_q95_map = {r['source_collection']: float(r['threshold_q95_mm_per_day']) for _, r in thresh_df.iterrows()}

    feat_df = compute_features(df_raw)
    feat_df = compute_conceptual_reservoirs(feat_df)
    feat_df['regional_q95'] = feat_df['source_collection'].map(regional_q95_map)

    base_u_cols, base_g_cols = get_feature_columns()
    ungauged_cols = base_u_cols + HYDRO_FEATURE_COLS
    gauged_cols = base_g_cols + HYDRO_FEATURE_COLS

    records = []

    for h in [1, 3, 7]:
        print(f"\n--- Auditing High-Flow Classifier for h={h}d ---")
        target_col = f'target_h{h}'
        binary_target_col = f'target_hf_h{h}'
        
        feat_df[binary_target_col] = np.where(
            feat_df[target_col].isna(),
            np.nan,
            (feat_df[target_col] > feat_df['regional_q95']).astype(float)
        )

        effective_train_end = pd.Timestamp('2012-12-31') - pd.Timedelta(days=h)
        effective_val_end = pd.Timestamp('2014-12-31') - pd.Timedelta(days=h)

        train_mask = (
            feat_df['catchment_id'].isin(dev_ids) &
            (feat_df['date'] >= pd.Timestamp('2005-01-01')) &
            (feat_df['date'] <= effective_train_end) &
            feat_df[binary_target_col].notna()
        )
        val_temp_mask = (
            feat_df['catchment_id'].isin(dev_ids) &
            (feat_df['date'] >= pd.Timestamp('2013-01-01')) &
            (feat_df['date'] <= effective_val_end) &
            feat_df[binary_target_col].notna()
        )
        val_geo_mask = (
            feat_df['catchment_id'].isin(holdout_ids) &
            (feat_df['date'] >= pd.Timestamp('2013-01-01')) &
            (feat_df['date'] <= effective_val_end) &
            feat_df[binary_target_col].notna()
        )

        train_df = feat_df[train_mask]
        val_temp_df = feat_df[val_temp_mask]
        val_geo_df = feat_df[val_geo_mask]

        eval_sets = [
            ("Temporal_Val_Test_A", val_temp_df),
            ("Geographic_Val_Test_B", val_geo_df)
        ]

        for mode, cols in [('Ungauged', ungauged_cols), ('Gauged', gauged_cols)]:
            model_path = f"models/classifier_{mode.lower()}_h{h}.joblib"
            clf = joblib.load(model_path)

            # Determine training-only optimal decision threshold on train sample
            # (Sample 20k rows to avoid excessive compute)
            train_sample = train_df.sample(min(20000, len(train_df)), random_state=42)
            p_tr = clf.predict_proba(train_sample)
            y_tr = train_sample[binary_target_col].values.astype(int)
            
            # Find threshold that maximizes training F1
            best_thresh = 0.50
            best_f1 = -1.0
            for t_cand in np.linspace(0.2, 0.8, 31):
                f1_cand = f1_score(y_tr, (p_tr >= t_cand).astype(int), zero_division=0)
                if f1_cand > best_f1:
                    best_f1 = f1_cand
                    best_thresh = float(t_cand)

            for part_name, part_df in eval_sets:
                transfer_label = 'Gauged_Transfer' if (mode == 'Gauged' and 'Test_B' in part_name) else ('Ungauged_PUB' if (mode == 'Ungauged' and 'Test_B' in part_name) else mode)
                yt = part_df[binary_target_col].values.astype(int)
                yp = clf.predict_proba(part_df)

                n_valid = len(yt)
                n_pos = int(np.sum(yt))
                prevalence = float(n_pos / n_valid)

                pr_auc = float(average_precision_score(yt, yp))
                roc_auc = float(roc_auc_score(yt, yp))
                brier = float(brier_score_loss(yt, yp))
                
                # Prevalence-only reference Brier score
                brier_ref = prevalence * (1.0 - prevalence)
                # Brier Skill Score (BSS)
                bss = 1.0 - (brier / brier_ref) if brier_ref > 0 else np.nan

                # Expected Calibration Error
                ece = compute_ece(yt, yp, n_bins=10)

                # Calibration slope & intercept via logistic regression on logit(yp)
                # Avoid logit(0) or logit(1)
                yp_clamped = np.clip(yp, 1e-5, 1.0 - 1e-5)
                logits = np.log(yp_clamped / (1.0 - yp_clamped)).reshape(-1, 1)
                
                try:
                    lr = LogisticRegression(solver='lbfgs', max_iter=200)
                    lr.fit(logits, yt)
                    cal_slope = float(lr.coef_[0, 0])
                    cal_intercept = float(lr.intercept_[0])
                except Exception:
                    cal_slope = np.nan
                    cal_intercept = np.nan

                # Metrics at default threshold 0.50
                yp_bin_05 = (yp >= 0.50).astype(int)
                prec_05 = float(precision_score(yt, yp_bin_05, zero_division=0))
                rec_05 = float(recall_score(yt, yp_bin_05, zero_division=0))
                f1_05 = float(f1_score(yt, yp_bin_05, zero_division=0))

                cm_05 = confusion_matrix(yt, yp_bin_05, labels=[0, 1])
                tn_05, fp_05, fn_05, tp_05 = int(cm_05[0, 0]), int(cm_05[0, 1]), int(cm_05[1, 0]), int(cm_05[1, 1])

                # Metrics at training-tuned threshold
                yp_bin_opt = (yp >= best_thresh).astype(int)
                prec_opt = float(precision_score(yt, yp_bin_opt, zero_division=0))
                rec_opt = float(recall_score(yt, yp_bin_opt, zero_division=0))
                f1_opt = float(f1_score(yt, yp_bin_opt, zero_division=0))

                records.append({
                    'horizon_days': h,
                    'feature_mode': transfer_label,
                    'partition': part_name,
                    'n_valid_samples': n_valid,
                    'n_positive_events': n_pos,
                    'event_prevalence': round(prevalence, 4),
                    'pr_auc': round(pr_auc, 4),
                    'roc_auc': round(roc_auc, 4),
                    'brier_score_model': round(brier, 4),
                    'brier_score_ref_prevalence': round(brier_ref, 4),
                    'brier_skill_score_bss': round(bss, 4),
                    'expected_calibration_error_ece': round(ece, 4),
                    'calibration_slope': round(cal_slope, 4),
                    'calibration_intercept': round(cal_intercept, 4),
                    'training_optimal_threshold': round(best_thresh, 4),
                    'f1_at_05': round(f1_05, 4),
                    'precision_at_05': round(prec_05, 4),
                    'recall_at_05': round(rec_05, 4),
                    'f1_at_optimal_threshold': round(f1_opt, 4),
                    'precision_at_optimal_threshold': round(prec_opt, 4),
                    'recall_at_optimal_threshold': round(rec_opt, 4),
                    'tn_at_05': tn_05,
                    'fp_at_05': fp_05,
                    'fn_at_05': fn_05,
                    'tp_at_05': tp_05
                })
                print(f"[{part_name} - {transfer_label} h={h}] PR-AUC={pr_auc:.4f}, BSS={bss:.4f}, ECE={ece:.4f}, F1={f1_05:.4f}")

    res_df = pd.DataFrame(records)
    out_csv = "reports/classifier_calibration_audit.csv"
    res_df.to_csv(out_csv, index=False)
    print(f"\nSaved calibration audit to {out_csv}")
    print(res_df[['horizon_days', 'feature_mode', 'partition', 'pr_auc', 'roc_auc', 'brier_score_model', 'brier_skill_score_bss', 'expected_calibration_error_ece', 'f1_at_05']].to_string())

if __name__ == '__main__':
    run_classifier_calibration_audit()

