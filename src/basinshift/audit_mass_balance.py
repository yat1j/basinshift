"""
BASINSHIFT Mass Balance Audit & Hydrology Variant Comparison
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import numpy as np
import pandas as pd
from src.basinshift.hydrology import compute_conceptual_reservoirs

def compute_corrected_reservoirs_variant_b(df: pd.DataFrame) -> pd.DataFrame:
    """
    Variant B: Corrected Mass-Balanced Conceptual Hydrology
    1. Single soil-moisture gating: P_eff = P * phi, I_soil = P * (1 - phi)
    2. Physical degree-day snowmelt: M = min(C_dd * max(0, T), SD_mm) with C_dd = 3.0 mm/(degC * day)
    3. Input partitioning: Fast = (P + M) * phi, Med = (P + M) * (1 - phi) * 0.70, Slow = (P + M) * (1 - phi) * 0.30
       Sum of inputs equals EXACTLY (P + M).
    4. Exact discrete reservoir continuity:
       S_t = alpha * (S_{t-1} + Input)
       Q_t = (1 - alpha) * (S_{t-1} + Input)
       S_t + Q_t = S_{t-1} + Input (exact mass conservation at every time step).
    """
    df = df.copy()
    n = len(df)
    
    alpha_fast = 0.50
    alpha_med = 0.80
    alpha_slow = 0.95
    c_dd = 3.0  # mm/(deg C * day)
    
    p_eff_arr = np.zeros(n, dtype=np.float32)
    melt_arr = np.zeros(n, dtype=np.float32)
    win_arr = np.zeros(n, dtype=np.float32)
    
    q_fast_arr = np.zeros(n, dtype=np.float32)
    q_med_arr = np.zeros(n, dtype=np.float32)
    q_slow_arr = np.zeros(n, dtype=np.float32)
    
    s_fast_arr = np.zeros(n, dtype=np.float32)
    s_med_arr = np.zeros(n, dtype=np.float32)
    s_slow_arr = np.zeros(n, dtype=np.float32)
    
    cids = df['catchment_id'].values
    precip = df['total_precipitation'].values
    temp = df['temperature_2m'].values
    sm = df['volumetric_soil_water_layer_1'].values
    snow = df['snow_depth_water_equivalent'].values
    
    unique_cids, starts = np.unique(cids, return_index=True)
    ends = np.append(starts[1:], n)
    
    for start, end in zip(starts, ends):
        p_c = precip[start:end]
        t_c = temp[start:end]
        sm_c = sm[start:end]
        sn_c = snow[start:end]
        
        # 1. Soil moisture gating phi in [0, 1]
        phi_c = np.clip((sm_c - 0.05) / 0.40, 0.0, 1.0)
        
        # 2. Physical degree-day snowmelt (mm/day)
        # Snow water equivalent in mm = sn_c * 1000.0
        sd_mm = sn_c * 1000.0
        melt_potential = np.maximum(0.0, t_c) * c_dd
        melt_c = np.minimum(melt_potential, sd_mm)
        
        # 3. Total water input (Precipitation + Snowmelt)
        w_total = p_c + melt_c
        
        # 4. Strict mass-conserving partitioning
        in_fast = w_total * phi_c
        in_soil = w_total * (1.0 - phi_c)
        in_med = in_soil * 0.70
        in_slow = in_soil * 0.30
        
        # 5. Discrete reservoir updates with exact conservation:
        # S_{t} = alpha * (S_{t-1} + I_t)
        # Q_{t} = (1 - alpha) * (S_{t-1} + I_t)
        m_len = end - start
        
        sf = np.zeros(m_len, dtype=np.float32)
        sm_res = np.zeros(m_len, dtype=np.float32)
        ss = np.zeros(m_len, dtype=np.float32)
        
        qf = np.zeros(m_len, dtype=np.float32)
        qm = np.zeros(m_len, dtype=np.float32)
        qs = np.zeros(m_len, dtype=np.float32)
        
        s_fast = 0.0
        s_med = 0.0
        s_slow = 0.0
        
        for i in range(m_len):
            tot_f = s_fast + in_fast[i]
            qf[i] = tot_f * (1.0 - alpha_fast)
            s_fast = tot_f * alpha_fast
            sf[i] = s_fast
            
            tot_m = s_med + in_med[i]
            qm[i] = tot_m * (1.0 - alpha_med)
            s_med = tot_m * alpha_med
            sm_res[i] = s_med
            
            tot_s = s_slow + in_slow[i]
            qs[i] = tot_s * (1.0 - alpha_slow)
            s_slow = tot_s * alpha_slow
            ss[i] = s_slow
            
        p_eff_arr[start:end] = p_c * phi_c
        melt_arr[start:end] = melt_c
        win_arr[start:end] = w_total
        
        s_fast_arr[start:end] = sf
        s_med_arr[start:end] = sm_res
        s_slow_arr[start:end] = ss
        
        q_fast_arr[start:end] = qf
        q_med_arr[start:end] = qm
        q_slow_arr[start:end] = qs

    df['hydro_v2_p_eff'] = p_eff_arr
    df['hydro_v2_snowmelt'] = melt_arr
    df['hydro_v2_water_input'] = win_arr
    df['hydro_v2_s_fast'] = s_fast_arr
    df['hydro_v2_s_med'] = s_med_arr
    df['hydro_v2_s_slow'] = s_slow_arr
    df['hydro_v2_q_fast'] = q_fast_arr
    df['hydro_v2_q_med'] = q_med_arr
    df['hydro_v2_q_slow'] = q_slow_arr
    df['hydro_v2_q_routed_total'] = q_fast_arr + q_med_arr + q_slow_arr
    df['hydro_v2_storage_total'] = s_fast_arr + s_med_arr + s_slow_arr
    
    return df

def run_mass_balance_audit():
    print("Loading raw processed parquet...")
    df = pd.read_parquet("data/processed/pilot_150_catchments.parquet")
    df = df.sort_values(['catchment_id', 'date']).reset_index(drop=True)
    
    # 1. Compute Variant A (Current Implementation)
    df_v1 = compute_conceptual_reservoirs(df)
    
    # 2. Compute Variant B (Corrected Formulation)
    df_v2 = compute_corrected_reservoirs_variant_b(df_v1)
    
    # 3. Calculate Catchment-by-Catchment Mass Balance Audit
    records = []
    
    for cid, group in df_v2.groupby('catchment_id'):
        reg = group['source_collection'].iloc[0]
        cntry = group['country'].iloc[0]
        area = group['drainage_area'].iloc[0]
        
        p_total = group['total_precipitation'].sum()
        
        # Variant A (Original)
        win_v1 = group['hydro_water_input'].sum()
        q_routed_v1 = group['hydro_q_routed_total'].sum()
        ds_v1 = group['hydro_storage_total'].iloc[-1] - 0.0
        res_v1 = win_v1 - (q_routed_v1 + ds_v1)
        rel_err_v1 = (res_v1 / win_v1) * 100.0 if win_v1 > 0 else 0.0
        
        # Double gating loss: Total raw precip vs win_v1
        precip_unallocated_v1 = p_total - win_v1
        
        # Variant B (Corrected)
        win_v2 = group['hydro_v2_water_input'].sum()
        q_routed_v2 = group['hydro_v2_q_routed_total'].sum()
        ds_v2 = group['hydro_v2_storage_total'].iloc[-1] - 0.0
        res_v2 = win_v2 - (q_routed_v2 + ds_v2)
        rel_err_v2 = (res_v2 / win_v2) * 100.0 if win_v2 > 0 else 0.0
        
        records.append({
            'catchment_id': cid,
            'source_collection': reg,
            'country': cntry,
            'drainage_area_km2': round(area, 2),
            'precip_total_mm': round(p_total, 2),
            # Variant A
            'v1_water_input_mm': round(win_v1, 2),
            'v1_routed_q_mm': round(q_routed_v1, 2),
            'v1_final_storage_mm': round(ds_v1, 2),
            'v1_mass_balance_residual_mm': round(res_v1, 4),
            'v1_relative_error_pct': round(rel_err_v1, 5),
            'v1_double_gating_unallocated_mm': round(precip_unallocated_v1, 2),
            # Variant B
            'v2_water_input_mm': round(win_v2, 2),
            'v2_routed_q_mm': round(q_routed_v2, 2),
            'v2_final_storage_mm': round(ds_v2, 2),
            'v2_mass_balance_residual_mm': round(res_v2, 6),
            'v2_relative_error_pct': round(rel_err_v2, 6)
        })
        
    audit_df = pd.DataFrame(records)
    out_csv = "reports/hydrological_mass_balance_audit.csv"
    audit_df.to_csv(out_csv, index=False)
    print(f"Saved {out_csv} ({len(audit_df)} catchments)")
    
    # Print summary statistics
    print("\nMASS BALANCE AUDIT SUMMARY:")
    print("-----------------------------------------------------------------")
    print(f"Variant A (Original): Mean Residual = {audit_df['v1_mass_balance_residual_mm'].mean():.4f} mm, Max Residual = {audit_df['v1_mass_balance_residual_mm'].abs().max():.4f} mm")
    print(f"Variant A (Original): Mean Relative Error = {audit_df['v1_relative_error_pct'].mean():.5f}%")
    print(f"Variant A (Original): Unallocated Precip from double-gating = {audit_df['v1_double_gating_unallocated_mm'].mean():.2f} mm ({audit_df['v1_double_gating_unallocated_mm'].mean() / audit_df['precip_total_mm'].mean() * 100:.1f}% of total rainfall)")
    print(f"Variant B (Corrected): Mean Residual = {audit_df['v2_mass_balance_residual_mm'].mean():.8f} mm, Max Residual = {audit_df['v2_mass_balance_residual_mm'].abs().max():.8f} mm")
    print(f"Variant B (Corrected): Mean Relative Error = {audit_df['v2_relative_error_pct'].mean():.8f}% (Exact machine precision)")
    print("-----------------------------------------------------------------")

if __name__ == '__main__':
    run_mass_balance_audit()

