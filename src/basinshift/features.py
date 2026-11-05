"""
BASINSHIFT Feature Engineering Pipeline
Author: Technical Data Auditor (Member 1: Model & Training)
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Strict Causality Rules:
- All features at forecast origin date t use ONLY data available at or before t (t' <= t).
- No future weather or future discharge is leaked into origin features.
- Missing streamflow values are preserved as NaN (not zero-filled).
- Authentic zero-streamflow values (0.0 mm/day) are strictly preserved.
- Two explicit feature sets are defined:
    1. GAUGED_FEATURES: Weather + Static + Historical Discharge Lags/Rolling + Missingness flags.
    2. UNGAUGED_FEATURES: Weather + Static only (for Predictions in Ungauged Basins - PUB).
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict

WEATHER_VARS = [
    'total_precipitation',
    'temperature_2m',
    'dewpoint_temperature_2m',
    'potential_evaporation',
    'volumetric_soil_water_layer_1',
    'snow_depth_water_equivalent'
]

STATIC_VARS = [
    'drainage_area',
    'log10_drainage_area',
    'is_us_catchment'
]

def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute causal features and multi-horizon targets grouped by catchment.
    Ensures zero leakage across temporal boundaries.
    """
    print("Sorting data by catchment_id and date...")
    df = df.sort_values(['catchment_id', 'date']).reset_index(drop=True)
    df['date'] = pd.to_datetime(df['date'])

    # Static transformations
    df['log10_drainage_area'] = np.log10(np.maximum(df['drainage_area'], 1e-3))
    df['is_us_catchment'] = (df['source_collection'] == 'CAMELS-US').astype(np.int32)

    # Calendar & Seasonality (Strictly known at forecast origin t)
    doy = df['date'].dt.dayofyear
    df['sin_doy'] = np.sin(2 * np.pi * doy / 365.25)
    df['cos_doy'] = np.cos(2 * np.pi * doy / 365.25)
    df['month'] = df['date'].dt.month

    # Atmospheric Dryness Proxy: Dewpoint Depression (T2m - Tdew)
    df['dewpoint_depression'] = df['temperature_2m'] - df['dewpoint_temperature_2m']
    # Water balance proxy: Precipitation minus PET
    df['water_balance_p_minus_pet'] = df['total_precipitation'] - df['potential_evaporation']

    # Grouped operations per catchment
    grouped = df.groupby('catchment_id', group_keys=False)

    print("Computing antecedent weather features (t' <= t)...")
    # Precipitation Antecedence
    df['precip_1d'] = df['total_precipitation']
    df['precip_sum_3d'] = grouped['total_precipitation'].rolling(3, min_periods=1).sum().reset_index(drop=True)
    df['precip_sum_7d'] = grouped['total_precipitation'].rolling(7, min_periods=1).sum().reset_index(drop=True)
    df['precip_sum_14d'] = grouped['total_precipitation'].rolling(14, min_periods=1).sum().reset_index(drop=True)
    df['precip_sum_30d'] = grouped['total_precipitation'].rolling(30, min_periods=1).sum().reset_index(drop=True)
    df['precip_max_7d'] = grouped['total_precipitation'].rolling(7, min_periods=1).max().reset_index(drop=True)
    df['precip_max_30d'] = grouped['total_precipitation'].rolling(30, min_periods=1).max().reset_index(drop=True)

    # Exponentially Decayed Antecedent Precipitation Index (API)
    # API_t = P_t + alpha * API_{t-1} using standard ewm
    df['precip_api_085'] = grouped['total_precipitation'].apply(
        lambda s: s.ewm(alpha=(1 - 0.85), adjust=False).mean()
    ).reset_index(drop=True)
    df['precip_api_095'] = grouped['total_precipitation'].apply(
        lambda s: s.ewm(alpha=(1 - 0.95), adjust=False).mean()
    ).reset_index(drop=True)

    # Temperature & PET Rolling
    df['temp_mean_7d'] = grouped['temperature_2m'].rolling(7, min_periods=1).mean().reset_index(drop=True)
    df['temp_mean_30d'] = grouped['temperature_2m'].rolling(30, min_periods=1).mean().reset_index(drop=True)
    df['pet_sum_7d'] = grouped['potential_evaporation'].rolling(7, min_periods=1).sum().reset_index(drop=True)
    df['pet_sum_30d'] = grouped['potential_evaporation'].rolling(30, min_periods=1).sum().reset_index(drop=True)
    df['water_balance_sum_7d'] = grouped['water_balance_p_minus_pet'].rolling(7, min_periods=1).sum().reset_index(drop=True)

    # Soil Moisture Dynamics & Runoff Interactions
    df['soil_moisture_t'] = df['volumetric_soil_water_layer_1']
    df['soil_moisture_mean_7d'] = grouped['volumetric_soil_water_layer_1'].rolling(7, min_periods=1).mean().reset_index(drop=True)
    # Soil moisture delta (7-day trend)
    df['soil_moisture_delta_7d'] = grouped['volumetric_soil_water_layer_1'].diff(7).fillna(0.0).reset_index(drop=True)
    # Interaction terms: saturated soil enhances runoff response
    df['sm_precip_interaction_1d'] = df['volumetric_soil_water_layer_1'] * df['total_precipitation']
    df['sm_precip_interaction_3d'] = df['volumetric_soil_water_layer_1'] * df['precip_sum_3d']

    # Snow Dynamics & Snowmelt Proxy
    df['snow_depth_t'] = df['snow_depth_water_equivalent']
    df['snow_depth_delta_7d'] = grouped['snow_depth_water_equivalent'].diff(7).fillna(0.0).reset_index(drop=True)
    # Degree-day snowmelt proxy: positive temperature when snow cover is present
    df['snowmelt_proxy'] = np.maximum(0.0, df['temperature_2m']) * np.minimum(df['snow_depth_water_equivalent'], 1.0)

    print("Computing historical discharge features (Gauged mode)...")
    # Streamflow at forecast origin t
    df['q_obs_t'] = df['streamflow']
    df['is_flow_missing_t'] = df['streamflow'].isna().astype(np.int32)

    # Streamflow lags (strictly t-k, k >= 1)
    for lag in [1, 2, 3, 7, 14]:
        df[f'q_lag_{lag}'] = grouped['streamflow'].shift(lag).reset_index(drop=True)

    # Streamflow rolling stats up to origin t (min_periods=1 handles partial gaps, returns NaN if all missing)
    df['q_mean_3d'] = grouped['streamflow'].rolling(3, min_periods=1).mean().reset_index(drop=True)
    df['q_mean_7d'] = grouped['streamflow'].rolling(7, min_periods=1).mean().reset_index(drop=True)
    df['q_mean_14d'] = grouped['streamflow'].rolling(14, min_periods=1).mean().reset_index(drop=True)
    df['q_max_7d'] = grouped['streamflow'].rolling(7, min_periods=1).max().reset_index(drop=True)
    df['q_max_30d'] = grouped['streamflow'].rolling(30, min_periods=1).max().reset_index(drop=True)
    df['q_std_7d'] = grouped['streamflow'].rolling(7, min_periods=2).std().reset_index(drop=True)

    # Rate of change / Hydrograph slope
    df['q_delta_1d'] = df['q_obs_t'] - df['q_lag_1']
    df['q_delta_3d'] = (df['q_obs_t'] - df['q_lag_3']) / 3.0

    print("Computing multi-horizon targets (h in {1, 3, 7})...")
    # Future targets: streamflow(t + h)
    for h in [1, 3, 7]:
        df[f'target_h{h}'] = grouped['streamflow'].shift(-h).reset_index(drop=True)
        # Note: missing targets evaluate to NaN and will be dynamically masked during training/evaluation

    return df

def get_feature_columns() -> Tuple[List[str], List[str]]:
    """
    Returns lists of column names for UNGAUGED and GAUGED modeling modes.
    """
    ungauged_features = [
        # Static
        'drainage_area',
        'log10_drainage_area',
        'is_us_catchment',
        # Seasonality
        'sin_doy',
        'cos_doy',
        'month',
        # Weather dynamic
        'precip_1d',
        'precip_sum_3d',
        'precip_sum_7d',
        'precip_sum_14d',
        'precip_sum_30d',
        'precip_max_7d',
        'precip_max_30d',
        'precip_api_085',
        'precip_api_095',
        'temperature_2m',
        'temp_mean_7d',
        'temp_mean_30d',
        'dewpoint_temperature_2m',
        'dewpoint_depression',
        'potential_evaporation',
        'pet_sum_7d',
        'pet_sum_30d',
        'water_balance_p_minus_pet',
        'water_balance_sum_7d',
        'soil_moisture_t',
        'soil_moisture_mean_7d',
        'soil_moisture_delta_7d',
        'sm_precip_interaction_1d',
        'sm_precip_interaction_3d',
        'snow_depth_t',
        'snow_depth_delta_7d',
        'snowmelt_proxy'
    ]

    gauged_features = ungauged_features + [
        # Historical streamflow at t and lags
        'q_obs_t',
        'is_flow_missing_t',
        'q_lag_1',
        'q_lag_2',
        'q_lag_3',
        'q_lag_7',
        'q_lag_14',
        'q_mean_3d',
        'q_mean_7d',
        'q_mean_14d',
        'q_max_7d',
        'q_max_30d',
        'q_std_7d',
        'q_delta_1d',
        'q_delta_3d'
    ]

    return ungauged_features, gauged_features
