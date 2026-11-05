"""
BASINSHIFT Ensemble Effectiveness & Degeneracy Audit
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Audits:
1. Complete weight vector for every horizon and feature mode
2. Identifies degenerate cases (weight = 1.0)
3. Compares Ensemble vs Strongest Individual Component on Test A and Test B
4. Saves reports/ensemble_effectiveness_audit.csv
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pandas as pd
import numpy as np

def run_ensemble_audit():
    weights_path = "reports/ensemble_weights.csv"
    stage_c_reg_path = "reports/stage_c_regression_evaluation.csv"
    stage_b_reg_path = "reports/benchmark_model_evaluation.csv"
    
    weights_df = pd.read_csv(weights_path)
    stage_c_df = pd.read_csv(stage_c_reg_path)
    stage_b_df = pd.read_csv(stage_b_reg_path)
    
    # Combine candidate evaluations
    all_models_df = pd.concat([stage_b_df, stage_c_df], ignore_index=True)
    
    records = []
    
    for _, w_row in weights_df.iterrows():
        h = int(w_row['horizon_days'])
        mode = w_row['feature_mode']
        
        w_lgb = float(w_row['weight_LightGBM'])
        w_xgb = float(w_row['weight_XGBoost'])
        w_rdg = float(w_row['weight_Ridge'])
        w_hyb = float(w_row['weight_Conceptual_Hybrid'])
        
        weights_dict = {
            'LightGBM': w_lgb,
            'XGBoost': w_xgb,
            'Ridge': w_rdg,
            'Conceptual_Hybrid': w_hyb
        }
        
        max_w = max(weights_dict.values())
        dominant_model = [m for m, w in weights_dict.items() if abs(w - max_w) < 1e-4][0]
        is_degenerate = (max_w >= 0.99)
        
        # Check performance on both partitions
        for part in ['Temporal_Val_Test_A', 'Geographic_Val_Test_B']:
            transfer_label = 'Gauged_Transfer' if (mode == 'Gauged' and 'Test_B' in part) else ('Ungauged_PUB' if (mode == 'Ungauged' and 'Test_B' in part) else mode)
            
            # Find ensemble row
            ens_row = all_models_df[
                (all_models_df['model_name'] == 'Constrained_Ensemble') &
                (all_models_df['horizon_days'] == h) &
                (all_models_df['feature_mode'] == transfer_label) &
                (all_models_df['partition'] == part)
            ]
            if len(ens_row) == 0:
                continue
            ens_res = ens_row.iloc[0]
            ens_rmse = ens_res['rmse']
            ens_nse = ens_res['median_nse']
            ens_kge = ens_res['median_kge']
            
            # Find candidate individual models
            cand_results = {}
            for m in ['LightGBM', 'XGBoost', 'Ridge_Regression', 'Conceptual_Hybrid']:
                m_lookup = m
                c_row = all_models_df[
                    (all_models_df['model_name'] == m_lookup) &
                    (all_models_df['horizon_days'] == h) &
                    (all_models_df['feature_mode'] == transfer_label) &
                    (all_models_df['partition'] == part)
                ]
                if len(c_row) > 0:
                    cand_results[m.replace('_Regression', '')] = {
                        'rmse': c_row.iloc[0]['rmse'],
                        'nse': c_row.iloc[0]['median_nse'],
                        'kge': c_row.iloc[0]['median_kge']
                    }
                    
            # Best individual model by RMSE
            best_model_name = min(cand_results.keys(), key=lambda k: cand_results[k]['rmse'])
            best_rmse = cand_results[best_model_name]['rmse']
            best_nse = cand_results[best_model_name]['nse']
            best_kge = cand_results[best_model_name]['kge']
            
            delta_rmse = ens_rmse - best_rmse
            delta_nse = ens_nse - best_nse
            
            if is_degenerate:
                verdict = f"DEGENERATE (Selected {dominant_model} exclusively)"
            elif delta_rmse < -0.001:
                verdict = f"IMPROVEMENT OVER BEST SINGLE (Delta RMSE: {delta_rmse:.4f})"
            elif abs(delta_rmse) <= 0.001:
                verdict = "IDENTICAL TO BEST SINGLE"
            else:
                verdict = f"SLIGHT DEGRADATION VS {best_model_name} (Delta RMSE: +{delta_rmse:.4f})"
                
            records.append({
                'horizon_days': h,
                'feature_mode': transfer_label,
                'partition': part,
                'weight_LightGBM': w_lgb,
                'weight_XGBoost': w_xgb,
                'weight_Ridge': w_rdg,
                'weight_Conceptual_Hybrid': w_hyb,
                'is_degenerate_single_model': is_degenerate,
                'dominant_model': dominant_model,
                'best_individual_model': best_model_name,
                'best_individual_rmse': best_rmse,
                'best_individual_median_nse': best_nse,
                'ensemble_rmse': ens_rmse,
                'ensemble_median_nse': ens_nse,
                'delta_rmse': round(delta_rmse, 4),
                'delta_median_nse': round(delta_nse, 4),
                'audit_verdict': verdict
            })
            print(f"[{part} - {transfer_label} h={h}d] Best: {best_model_name} ({best_rmse:.3f}) | Ens: {ens_rmse:.3f} | Verdict: {verdict}")
            
    out_df = pd.DataFrame(records)
    out_csv = "reports/ensemble_effectiveness_audit.csv"
    out_df.to_csv(out_csv, index=False)
    print(f"\nSaved ensemble effectiveness audit to {out_csv}")
    print(out_df[['horizon_days', 'feature_mode', 'partition', 'dominant_model', 'is_degenerate_single_model', 'delta_rmse', 'audit_verdict']].to_string())

if __name__ == '__main__':
    run_ensemble_audit()

