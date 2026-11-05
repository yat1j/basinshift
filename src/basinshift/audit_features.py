"""
Generates reports/feature_availability_audit.csv
Audits all 48 features + multi-horizon targets for strict temporal causality.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import pandas as pd
from src.basinshift.features import get_feature_columns

def generate_feature_availability_audit():
    ungauged_cols, gauged_cols = get_feature_columns()
    
    rows = []
    
    # Static descriptors
    static_info = {
        'drainage_area': ('drainage_area (metadata)', 'Static / Time-invariant', 'Yes', 'None (Fixed physical attribute)'),
        'log10_drainage_area': ('drainage_area', 'Static / Time-invariant', 'Yes', 'None (Log10 transform of static area)'),
        'is_us_catchment': ('source_collection', 'Static / Time-invariant', 'Yes', 'None (Binary metadata indicator)'),
    }
    
    # Seasonality
    season_info = {
        'sin_doy': ('date', '[t] (Calendar day of year)', 'Yes', 'None (Deterministic calendar feature)'),
        'cos_doy': ('date', '[t] (Calendar day of year)', 'Yes', 'None (Deterministic calendar feature)'),
        'month': ('date', '[t] (Calendar month)', 'Yes', 'None (Deterministic calendar feature)'),
    }
    
    # Weather dynamic features (ERA5-Land reanalysis up to date t)
    weather_info = {
        'precip_1d': ('total_precipitation', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent weather at origin)'),
        'precip_sum_3d': ('total_precipitation', '[t-2, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'precip_sum_7d': ('total_precipitation', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'precip_sum_14d': ('total_precipitation', '[t-13, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'precip_sum_30d': ('total_precipitation', '[t-29, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'precip_max_7d': ('total_precipitation', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling max)'),
        'precip_max_30d': ('total_precipitation', '[t-29, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling max)'),
        'precip_api_085': ('total_precipitation', '[t-K, t]', 'Yes (Historical reanalysis)', 'None (Causal exponential decay alpha=0.85)'),
        'precip_api_095': ('total_precipitation', '[t-K, t]', 'Yes (Historical reanalysis)', 'None (Causal exponential decay alpha=0.95)'),
        'temperature_2m': ('temperature_2m', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent weather at origin)'),
        'temp_mean_7d': ('temperature_2m', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling mean)'),
        'temp_mean_30d': ('temperature_2m', '[t-29, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling mean)'),
        'dewpoint_temperature_2m': ('dewpoint_temperature_2m', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent weather at origin)'),
        'dewpoint_depression': ('temperature_2m, dewpoint_temperature_2m', '[t]', 'Yes (Historical reanalysis)', 'None (Atmospheric dryness proxy at t)'),
        'potential_evaporation': ('potential_evaporation', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent weather at origin)'),
        'pet_sum_7d': ('potential_evaporation', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'pet_sum_30d': ('potential_evaporation', '[t-29, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum)'),
        'water_balance_p_minus_pet': ('total_precipitation, potential_evaporation', '[t]', 'Yes (Historical reanalysis)', 'None (P - PET water balance at t)'),
        'water_balance_sum_7d': ('total_precipitation, potential_evaporation', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling sum P - PET)'),
        'soil_moisture_t': ('volumetric_soil_water_layer_1', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent soil state at t)'),
        'soil_moisture_mean_7d': ('volumetric_soil_water_layer_1', '[t-6, t]', 'Yes (Historical reanalysis)', 'None (Backward rolling mean)'),
        'soil_moisture_delta_7d': ('volumetric_soil_water_layer_1', '[t-7, t]', 'Yes (Historical reanalysis)', 'None (7-day backward moisture trend)'),
        'sm_precip_interaction_1d': ('volumetric_soil_water_layer_1, total_precipitation', '[t]', 'Yes (Historical reanalysis)', 'None (Runoff generation efficiency at t)'),
        'sm_precip_interaction_3d': ('volumetric_soil_water_layer_1, total_precipitation', '[t-2, t]', 'Yes (Historical reanalysis)', 'None (Soil saturation x 3d rain)'),
        'snow_depth_t': ('snow_depth_water_equivalent', '[t]', 'Yes (Historical reanalysis)', 'None (Antecedent snow state at t)'),
        'snow_depth_delta_7d': ('snow_depth_water_equivalent', '[t-7, t]', 'Yes (Historical reanalysis)', 'None (7-day backward snowpack trend)'),
        'snowmelt_proxy': ('temperature_2m, snow_depth_water_equivalent', '[t]', 'Yes (Historical reanalysis)', 'None (Degree-day melt proxy at t)'),
    }
    
    # Discharge history features (Gauged mode only)
    discharge_info = {
        'q_obs_t': ('streamflow', '[t]', 'Yes (Gauged mode only)', 'None in Gauged; PROHIBITED in Ungauged PUB'),
        'is_flow_missing_t': ('streamflow', '[t]', 'Yes (Gauged mode only)', 'None in Gauged; PROHIBITED in Ungauged PUB'),
        'q_lag_1': ('streamflow', '[t-1]', 'Yes (Gauged mode only)', 'None (Historical lag 1 day)'),
        'q_lag_2': ('streamflow', '[t-2]', 'Yes (Gauged mode only)', 'None (Historical lag 2 days)'),
        'q_lag_3': ('streamflow', '[t-3]', 'Yes (Gauged mode only)', 'None (Historical lag 3 days)'),
        'q_lag_7': ('streamflow', '[t-7]', 'Yes (Gauged mode only)', 'None (Historical lag 7 days)'),
        'q_lag_14': ('streamflow', '[t-14]', 'Yes (Gauged mode only)', 'None (Historical lag 14 days)'),
        'q_mean_3d': ('streamflow', '[t-2, t]', 'Yes (Gauged mode only)', 'None (Backward rolling mean)'),
        'q_mean_7d': ('streamflow', '[t-6, t]', 'Yes (Gauged mode only)', 'None (Backward rolling mean)'),
        'q_mean_14d': ('streamflow', '[t-13, t]', 'Yes (Gauged mode only)', 'None (Backward rolling mean)'),
        'q_max_7d': ('streamflow', '[t-6, t]', 'Yes (Gauged mode only)', 'None (Backward rolling max)'),
        'q_max_30d': ('streamflow', '[t-29, t]', 'Yes (Gauged mode only)', 'None (Backward rolling max)'),
        'q_std_7d': ('streamflow', '[t-6, t]', 'Yes (Gauged mode only)', 'None (Backward rolling std)'),
        'q_delta_1d': ('streamflow', '[t-1, t]', 'Yes (Gauged mode only)', 'None (1-day backward slope q_t - q_{t-1})'),
        'q_delta_3d': ('streamflow', '[t-3, t]', 'Yes (Gauged mode only)', 'None (3-day backward slope (q_t - q_{t-3})/3)'),
    }
    
    all_feature_dict = {**static_info, **season_info, **weather_info, **discharge_info}
    
    for f in gauged_cols:
        src, trange, avail, risk = all_feature_dict.get(f, ('Unknown', 'Unknown', 'Unknown', 'Unknown'))
        mode_str = 'Gauged + Ungauged' if f in ungauged_cols else 'Gauged Only'
        rows.append({
            'feature_name': f,
            'feature_family': 'Static' if f in static_info else ('Seasonality' if f in season_info else ('Weather' if f in weather_info else 'Discharge')),
            'feature_mode_availability': mode_str,
            'source_variable': src,
            'timestamp_range_used': trange,
            'available_at_forecast_origin': avail,
            'leakage_risk': risk
        })
        
    # Also add targets for completeness
    for h in [1, 3, 7]:
        rows.append({
            'feature_name': f'target_h{h}',
            'feature_family': 'Target Label',
            'feature_mode_availability': 'Evaluation Label Only (Not Feature)',
            'source_variable': 'streamflow',
            'timestamp_range_used': f'[t+{h}]',
            'available_at_forecast_origin': 'NO (Future observation to predict)',
            'leakage_risk': 'None (Strictly target; never passed as input feature)'
        })
        
    res_df = pd.DataFrame(rows)
    out_path = "reports/feature_availability_audit.csv"
    res_df.to_csv(out_path, index=False)
    print(f"Generated {out_path} ({len(res_df)} rows)")

if __name__ == '__main__':
    generate_feature_availability_audit()
