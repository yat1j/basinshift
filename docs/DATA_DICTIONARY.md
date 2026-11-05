# BASINSHIFT — Hydrological Data Dictionary

**Document Version:** 1.0.0  
**Domain:** Catchment Hydrology & Time-Series Meteorological Forcings  

---

## 1. Primary Time-Series Observation Variables

All daily time-series records ingest calendar dates in ISO 8601 format (`YYYY-MM-DD`) defined at Coordinated Universal Time (UTC) or local solar hydrological midnight.

| Variable Name | Field Identifier | Standard Units | Data Type | Physical Definition & Bounds |
|---|---|---|---|---|
| **Date** | `date` | ISO 8601 (`YYYY-MM-DD`) | String / Date | Hydrological calendar date. Strict daily spacing ($\Delta t = 1\text{ day}$). |
| **Observed Streamflow** | `observed_discharge_mm_day` / `q_obs` | $\text{mm/day}$ | Float ($\ge 0$) | Daily mean catchment streamflow discharge normalized by drainage area. In Gauged mode only; `null` in Ungauged/PUB mode. |
| **Precipitation** | `precipitation_mm_day` / `precip` | $\text{mm/day}$ | Float ($\ge 0$) | Total daily liquid-equivalent precipitation aggregated over catchment drainage boundary. |
| **Air Temperature** | `temperature_2m_degC` / `t_mean` | $^\circ\text{C}$ | Float | Mean daily 2-meter atmospheric surface temperature. |
| **Max Air Temperature** | `temperature_2m_max_degC` / `t_max` | $^\circ\text{C}$ | Float | Maximum diurnal 2-meter air temperature. Used for snowmelt proxy activation. |
| **Min Air Temperature** | `temperature_2m_min_degC` / `t_min` | $^\circ\text{C}$ | Float | Minimum diurnal 2-meter air temperature. Used for precipitation phase gating (rain vs snow). |
| **Surface Solar Radiation** | `solar_radiation_w_m2` / `sw_rad` | $\text{W/m}^2$ | Float ($\ge 0$) | Downward shortwave solar radiation at surface. Governs potential evapotranspiration. |
| **Soil Moisture Proxy** | `soil_moisture_proxy` / `sm_proxy` | Dimensionless $[0, 1]$ | Float $[0, 1]$ | Antecedent soil moisture saturation ratio from reanalysis topsoil layer ($0\text{–}7\text{ cm}$) or antecedent precipitation index (API). |
| **Snow Depth / SWE** | `snow_water_equivalent_mm` / `swe` | $\text{mm}$ | Float ($\ge 0$) | Liquid-equivalent water stored in catchment snowpack. |

---

## 2. Derived Hydrological Features (Variant A)

Computed strictly at or before the forecast origin timestamp $t_0$ with zero future leakage:

| Feature Identifier | Formula / Mathematical Definition | Physical Role in Inductive Bias |
|---|---|---|
| `effective_precip_mm` | $P_{\text{eff}}(t) = P(t) \cdot \tanh(\text{SoilProxy}(t))$ | Soil-saturation gating: Dry soils infiltrate rain; saturated soils route rain to surface overland runoff. |
| `snowmelt_proxy_mm` | $M(t) = \max\left(0, k_{\text{melt}} \cdot (T(t) - T_{\text{base}})\right)$ | Degree-day snowpack melting active when $T > 0^\circ\text{C}$ and $\text{SWE} > 0$. |
| `reservoir_fast_s1` | $S_1(t) = S_1(t-1) \cdot (1 - k_1) + P_{\text{fast}}(t)$ | Fast surface storm runoff storage ($k_1 \approx 0.65\text{ d}^{-1}$, half-life $\approx 1.0\text{ day}$). |
| `reservoir_inter_s2` | $S_2(t) = S_2(t-1) \cdot (1 - k_2) + P_{\text{inter}}(t)$ | Unsaturated interflow storage ($k_2 \approx 0.25\text{ d}^{-1}$, half-life $\approx 2.8\text{ days}$). |
| `reservoir_sub_s3` | $S_3(t) = S_3(t-1) \cdot (1 - k_3) + P_{\text{sub}}(t)$ | Shallow subsurface percolation storage ($k_3 \approx 0.08\text{ d}^{-1}$, half-life $\approx 8.7\text{ days}$). |
| `reservoir_base_s4` | $S_4(t) = S_4(t-1) \cdot (1 - k_4) + P_{\text{base}}(t)$ | Deep regional aquifer baseflow storage ($k_4 \approx 0.015\text{ d}^{-1}$, half-life $\approx 46\text{ days}$). |
| `precip_roll_sum_3d` | $\sum_{i=0}^2 P(t-i)$ | 3-day antecedent rainfall accumulation pulse. |
| `precip_roll_sum_7d` | $\sum_{i=0}^6 P(t-i)$ | 7-day antecedent catchment wetting pulse. |
| `precip_roll_sum_30d`| $\sum_{i=0}^{29} P(t-i)$ | 30-day seasonal soil saturation index. |
| `flow_lag_1d` | $Q_{\text{obs}}(t-1)$ | Previous day observed discharge (Gauged mode only; zero/null in Ungauged mode). |
| `flow_lag_2d` | $Q_{\text{obs}}(t-2)$ | 2-day antecedent observed discharge (Gauged mode only). |
| `flow_roll_mean_7d` | $\frac{1}{7}\sum_{i=1}^7 Q_{\text{obs}}(t-i)$ | 7-day rolling discharge baseline (Gauged mode only). |

---

## 3. Static Catchment Physiographic Descriptors

| Attribute Name | Identifier | Standard Units | Physical Description |
|---|---|---|---|
| **Catchment Gauge ID** | `catchment_id` | 8-digit USGS string | Unique streamgage station identifier (e.g., `"01434000"`). |
| **Catchment Name** | `catchment_name` | String | Official river and geographic landmark identifier. |
| **Drainage Area** | `drainage_area_km2` | $\text{km}^2$ | Upstream topographic watershed boundary area contributing to gauge. |
| **Mean Elevation** | `elevation_mean_m` | $\text{m}$ (above sea level)| Hypsometric mean catchment surface elevation. |
| **HUC2 Region** | `huc2_region` | 2-digit code (`01`–`18`) | Major hydrologic basin region (e.g., `02`: Mid-Atlantic). |
| **Aridity Index** | `aridity_index` | Dimensionless | Ratio of mean potential evapotranspiration to mean annual precipitation ($\text{PET} / P$). |
| **Historical Q95** | `q95_threshold_mm_day` | $\text{mm/day}$ | 95th percentile historical daily streamflow rate. Defines rare high-flow crest event. |

---

## 4. Missingness & Quality Sentinel Protocols

* **Missing Numeric Sentinel:** Missing cells in uploaded CSV files are represented as empty string (`""`), `null`, `NaN`, or `-999.0`.
* **Short Gap Imputation ($\le 3\text{ days}$):** Forward-filled linearly for continuous meteorological forcings.
* **Long Gap Rejection ($> 3\text{ days}$):** Triggers input validation warning. If $> 10\%$ of historical spin-up window is missing, the request is rejected with a structured schema error.
* **Physical Bound Checks:** Negative precipitation values ($P < 0$) or non-finite numbers ($\pm \infty$) are caught during CSV parsing and rejected before feature extraction.
