"""
Hydrological Feature Extraction & Multi-Scale Linear Reservoir Routing.
Variant A Pipeline: Soil-gated infiltration + 4-reservoir routing with zero future leakage.
"""

from typing import List, Dict, Any, Tuple
import math
import numpy as np


def compute_effective_precipitation(precipitation: float, soil_moisture_proxy: float) -> float:
    """
    Computes soil-gated infiltration: saturated soils route rain directly to runoff,
    while dry soils absorb precipitation into soil matrix storage.
    """
    p = max(0.0, float(precipitation))
    sm = max(0.0, min(1.0, float(soil_moisture_proxy)))
    return p * math.tanh(sm * 2.0)


def compute_snowmelt_proxy(
    temperature_2m: float,
    swe: float = 0.0,
    k_melt: float = 2.5,
    t_base: float = 0.0
) -> float:
    """Degree-day snowmelt proxy active when temperatures exceed melting threshold."""
    if swe <= 0.0 or temperature_2m <= t_base:
        return 0.0
    melt_potential = k_melt * (temperature_2m - t_base)
    return min(melt_potential, swe)


def simulate_linear_reservoirs(
    effective_inputs: List[float],
    k_constants: Tuple[float, float, float, float] = (0.65, 0.25, 0.08, 0.015),
    weights: Tuple[float, float, float, float] = (0.40, 0.30, 0.20, 0.10)
) -> Dict[str, List[float]]:
    """
    Simulates continuous storage and outflow across four conceptual linear reservoirs:
    - S1: Fast storm overland runoff (k1 = 0.65 d^-1, half-life ~1 day)
    - S2: Unsaturated interflow (k2 = 0.25 d^-1, half-life ~2.8 days)
    - S3: Subsurface percolation (k3 = 0.08 d^-1, half-life ~8.7 days)
    - S4: Deep regional aquifer baseflow (k4 = 0.015 d^-1, half-life ~46 days)
    """
    n = len(effective_inputs)
    s1, s2, s3, s4 = 0.0, 0.0, 0.0, 0.0
    k1, k2, k3, k4 = k_constants
    w1, w2, w3, w4 = weights

    out_s1, out_s2, out_s3, out_s4 = [], [], [], []
    out_q1, out_q2, out_q3, out_q4 = [], [], [], []

    for inp in effective_inputs:
        # Route partitioned fraction of effective rain + melt into each reservoir
        s1 = s1 * (1.0 - k1) + inp * w1
        s2 = s2 * (1.0 - k2) + inp * w2
        s3 = s3 * (1.0 - k3) + inp * w3
        s4 = s4 * (1.0 - k4) + inp * w4

        out_s1.append(s1)
        out_s2.append(s2)
        out_s3.append(s3)
        out_s4.append(s4)

        out_q1.append(k1 * s1)
        out_q2.append(k2 * s2)
        out_q3.append(k3 * s3)
        out_q4.append(k4 * s4)

    return {
        "s1": out_s1, "s2": out_s2, "s3": out_s3, "s4": out_s4,
        "q1": out_q1, "q2": out_q2, "q3": out_q3, "q4": out_q4,
    }


def extract_hydrological_features(
    records: List[Dict[str, Any]],
    forecast_origin: str,
    operating_mode: str = "gauged",
    min_history_days: int = 90
) -> Dict[str, Any]:
    """
    Extracts causal hydrological feature vector terminating strictly at forecast origin.
    Ensures zero future leakage.
    """
    # 1. Filter records strictly at or before forecast origin
    valid_records = []
    for r in records:
        rec_date = r.get("date")
        if rec_date and rec_date <= forecast_origin:
            valid_records.append(r)

    # Sort chronologically by date
    valid_records.sort(key=lambda x: str(x.get("date")))

    n_days = len(valid_records)
    warnings = []
    if n_days < min_history_days:
        warnings.append(
            f"History contains {n_days} days. Hydrological reservoir spin-up requires ≥ {min_history_days} days."
        )

    # 2. Extract series
    precip_series = []
    temp_series = []
    flow_series = []
    eff_inputs = []

    for r in valid_records:
        p = float(r.get("precipitation_mm_day") or 0.0)
        t = float(r.get("temperature_2m_degC") or 12.0)
        sm = float(r.get("soil_moisture_proxy") if r.get("soil_moisture_proxy") is not None else 0.5)
        swe = float(r.get("snow_water_equivalent_mm") or 0.0)

        # In ungauged mode, streamflow is strictly masked
        obs_q = None
        if operating_mode == "gauged" and r.get("observed_discharge_mm_day") is not None:
            try:
                obs_q = float(r.get("observed_discharge_mm_day"))
            except (ValueError, TypeError):
                obs_q = None

        precip_series.append(p)
        temp_series.append(t)
        flow_series.append(obs_q)

        eff_p = compute_effective_precipitation(p, sm)
        melt = compute_snowmelt_proxy(t, swe)
        eff_inputs.append(eff_p + melt)

    # 3. Simulate multi-scale reservoirs
    res = simulate_linear_reservoirs(eff_inputs)

    # 4. Compute rolling accumulations at forecast origin (latest record)
    idx = -1 if n_days > 0 else 0
    p_roll_3d = sum(precip_series[-3:]) if n_days >= 3 else sum(precip_series)
    p_roll_7d = sum(precip_series[-7:]) if n_days >= 7 else sum(precip_series)
    p_roll_30d = sum(precip_series[-30:]) if n_days >= 30 else sum(precip_series)

    # 5. Observed flow autoregressive lags (Gauged only)
    flow_lag_1d = 0.0
    flow_lag_2d = 0.0
    flow_roll_7d = 0.0

    if operating_mode == "gauged" and n_days > 0:
        valid_flows = [q for q in flow_series if q is not None]
        if len(valid_flows) >= 1:
            flow_lag_1d = valid_flows[-1]
        if len(valid_flows) >= 2:
            flow_lag_2d = valid_flows[-2]
        if len(valid_flows) >= 7:
            flow_roll_7d = float(np.mean(valid_flows[-7:]))
        elif len(valid_flows) > 0:
            flow_roll_7d = float(np.mean(valid_flows))

    feature_vector = {
        "s1_fast": res["s1"][idx] if n_days > 0 else 0.0,
        "s2_inter": res["s2"][idx] if n_days > 0 else 0.0,
        "s3_sub": res["s3"][idx] if n_days > 0 else 0.0,
        "s4_base": res["s4"][idx] if n_days > 0 else 0.0,
        "q1_fast": res["q1"][idx] if n_days > 0 else 0.0,
        "q2_inter": res["q2"][idx] if n_days > 0 else 0.0,
        "q3_sub": res["q3"][idx] if n_days > 0 else 0.0,
        "q4_base": res["q4"][idx] if n_days > 0 else 0.0,
        "precip_today": precip_series[-1] if n_days > 0 else 0.0,
        "precip_roll_3d": p_roll_3d,
        "precip_roll_7d": p_roll_7d,
        "precip_roll_30d": p_roll_30d,
        "temp_today": temp_series[-1] if n_days > 0 else 12.0,
        "flow_lag_1d": flow_lag_1d,
        "flow_lag_2d": flow_lag_2d,
        "flow_roll_7d": flow_roll_7d,
    }

    return {
        "feature_vector": feature_vector,
        "history_length": n_days,
        "warnings": warnings,
        "reservoir_simulation": res,
        "filtered_records": valid_records,
    }
