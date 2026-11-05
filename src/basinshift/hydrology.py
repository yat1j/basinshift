"""
BASINSHIFT Conceptual Hydrology Module
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Implements physically-based conceptual reservoir dynamics:
1. Soil-moisture-gated effective rainfall (P_eff)
2. Snowmelt generation (M_t)
3. Three-tier linear reservoir cascade:
   - Fast reservoir (surface runoff / overland flow, alpha = 0.50)
   - Medium reservoir (shallow subsurface stormflow, alpha = 0.80)
   - Slow reservoir (groundwater baseflow, alpha = 0.95)
   - Deep memory reservoir (multi-month storage, alpha = 0.98)
4. Outflow routing and hydrograph limb diagnostics
5. Strictly causal: t' <= t. Zero future weather or target leakage.
"""

import numpy as np
import pandas as pd
from typing import List, Tuple

HYDRO_FEATURE_COLS = [
    'hydro_p_eff',
    'hydro_snowmelt',
    'hydro_water_input',
    'hydro_s_fast',
    'hydro_s_med',
    'hydro_s_slow',
    'hydro_s_deep',
    'hydro_q_fast',
    'hydro_q_med',
    'hydro_q_slow',
    'hydro_q_routed_total',
    'hydro_fast_slow_ratio',
    'hydro_storage_total'
]

def compute_conceptual_reservoirs(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes conceptual hydrology reservoir states grouped per catchment.
    Requires df to be sorted by ['catchment_id', 'date'].
    """
    df = df.copy()
    
    # Pre-allocate arrays
    n = len(df)
    p_eff_arr = np.zeros(n, dtype=np.float32)
    melt_arr = np.zeros(n, dtype=np.float32)
    win_arr = np.zeros(n, dtype=np.float32)
    
    s_fast_arr = np.zeros(n, dtype=np.float32)
    s_med_arr = np.zeros(n, dtype=np.float32)
    s_slow_arr = np.zeros(n, dtype=np.float32)
    s_deep_arr = np.zeros(n, dtype=np.float32)
    
    # Recession parameters (dimensionless decay constants for daily step)
    alpha_fast = 0.50   # k ~ 1.4 days
    alpha_med = 0.80    # k ~ 4.5 days
    alpha_slow = 0.95   # k ~ 19.5 days
    alpha_deep = 0.98   # k ~ 49.5 days
    
    cids = df['catchment_id'].values
    precip = df['total_precipitation'].values
    temp = df['temperature_2m'].values
    sm = df['volumetric_soil_water_layer_1'].values
    snow = df['snow_depth_water_equivalent'].values
    
    # Process catchment by catchment
    unique_cids, starts = np.unique(cids, return_index=True)
    ends = np.append(starts[1:], n)
    
    for start, end in zip(starts, ends):
        p_c = precip[start:end]
        t_c = temp[start:end]
        sm_c = sm[start:end]
        sn_c = snow[start:end]
        
        # 1. Soil gating factor phi in [0, 1]
        # Soil moisture in ERA5-Land layer 1 (0-7cm) typically ranges 0.05 (dry) to 0.45 (saturated)
        phi_c = np.clip((sm_c - 0.05) / 0.40, 0.05, 1.0)
        
        # 2. Effective liquid precipitation
        p_eff_c = p_c * phi_c
        
        # 3. Snowmelt proxy (positive degree-days when snow is present)
        # snow depth water equivalent in meters -> convert to mm (x 1000)
        melt_c = np.maximum(0.0, t_c) * np.minimum(sn_c * 1000.0, 10.0)
        
        # 4. Total liquid water input
        win_c = p_eff_c + melt_c
        
        # 5. Reservoir loop
        s_fast = 0.0
        s_med = 0.0
        s_slow = 0.0
        s_deep = 0.0
        
        m_len = end - start
        sf = np.zeros(m_len, dtype=np.float32)
        sm_res = np.zeros(m_len, dtype=np.float32)
        ss = np.zeros(m_len, dtype=np.float32)
        sd = np.zeros(m_len, dtype=np.float32)
        
        for i in range(m_len):
            w = win_c[i]
            phi = phi_c[i]
            
            # Partitioning:
            # When soil is saturated (phi high), more water enters fast overland reservoir
            in_fast = w * phi
            # Subsurface percolation enters medium and slow reservoirs
            in_sub = w * (1.0 - phi)
            in_med = in_sub * 0.65
            in_slow = in_sub * 0.35
            
            # Linear reservoir state update: S_t = S_{t-1} * alpha + Input
            s_fast = s_fast * alpha_fast + in_fast
            s_med = s_med * alpha_med + in_med
            s_slow = s_slow * alpha_slow + in_slow
            s_deep = s_deep * alpha_deep + (in_slow * 0.20)
            
            sf[i] = s_fast
            sm_res[i] = s_med
            ss[i] = s_slow
            sd[i] = s_deep
            
        p_eff_arr[start:end] = p_eff_c
        melt_arr[start:end] = melt_c
        win_arr[start:end] = win_c
        s_fast_arr[start:end] = sf
        s_med_arr[start:end] = sm_res
        s_slow_arr[start:end] = ss
        s_deep_arr[start:end] = sd

    df['hydro_p_eff'] = p_eff_arr
    df['hydro_snowmelt'] = melt_arr
    df['hydro_water_input'] = win_arr
    df['hydro_s_fast'] = s_fast_arr
    df['hydro_s_med'] = s_med_arr
    df['hydro_s_slow'] = s_slow_arr
    df['hydro_s_deep'] = s_deep_arr
    
    # Discharge releases (Q = S * (1 - alpha))
    df['hydro_q_fast'] = df['hydro_s_fast'] * (1.0 - alpha_fast)
    df['hydro_q_med'] = df['hydro_s_med'] * (1.0 - alpha_med)
    df['hydro_q_slow'] = df['hydro_s_slow'] * (1.0 - alpha_slow)
    df['hydro_q_routed_total'] = df['hydro_q_fast'] + df['hydro_q_med'] + df['hydro_q_slow']
    
    # Diagnostic ratios
    df['hydro_fast_slow_ratio'] = df['hydro_q_fast'] / np.maximum(df['hydro_q_slow'], 1e-4)
    df['hydro_storage_total'] = df['hydro_s_fast'] + df['hydro_s_med'] + df['hydro_s_slow'] + df['hydro_s_deep']
    
    return df

