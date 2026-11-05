# BASINSHIFT — Data Provenance & Dataset Lineage

**Document Version:** 1.0.0  
**Status:** Approved for Competition Submission  

---

## 1. Overview of Data Sources

BASINSHIFT strictly uses public, scientifically verified, and ethically sourced open-access hydrological and meteorological benchmark data. No proprietary, licensed commercial, or restricted private streamflow telemetry is ingested.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRIMARY BENCHMARK DATA                   │
├──────────────────────────────┬──────────────────────────────┤
│ CAMELS (Addor et al., 2017)  │ Catchment Attributes &       │
│ UCAR / NCAR                  │ Meteorology for 671 Basins   │
├──────────────────────────────┼──────────────────────────────┤
│ USGS NWIS Telemetry          │ Verified Daily Mean Observed │
│ U.S. Geological Survey       │ Streamgage Discharge         │
├──────────────────────────────┼──────────────────────────────┤
│ ERA5-Land Reanalysis         │ Surface Meteorology, Solar   │
│ ECMWF / Copernicus           │ Radiation & Temperature      │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Source-by-Source Dataset Audits

### 2.1. CAMELS (Catchment Attributes and MEteorology for Large-sample Studies)
* **Citation:** Addor, N., Newman, A. J., Mizukami, N., and Clark, M. P. (2017). *The CAMELS data set: hydrometeorological time series and attributes for 671 catchments across the contiguous United States*, Hydrology and Earth System Sciences, 21, 5293–5313. DOI: `10.5194/hess-21-5293-2017`.
* **Provider:** National Center for Atmospheric Research (NCAR) / UCAR.
* **Geographic Coverage:** Contiguous United States (CONUS), encompassing 671 distinct hydrologic units from HUC 01 (New England) to HUC 18 (California).
* **Catchment Selection Criteria:** Basins with minimal human disturbance (non-regulated or lightly regulated flow regimes), drainage area between $4\text{ km}^2$ and $25,000\text{ km}^2$, and long-term hydrometric monitoring.
* **Licensing & Usage:** Public Domain / Open Research (Creative Commons Attribution 4.0 International).

### 2.2. USGS National Water Information System (NWIS)
* **Provider:** United States Geological Survey (USGS).
* **Data Type:** Daily mean streamflow discharge ($Q$) recorded at automated streamgaging stations equipped with acoustic Doppler or stage-discharge rating curves.
* **Quality Assurance:** Level-4 approved quality flags (`A: Approved for publication`). Provisional or unverified records (`P`) are flagged or excluded.
* **Licensing & Usage:** U.S. Government Work (Public Domain).

### 2.3. ERA5-Land Atmospheric Reanalysis
* **Provider:** European Centre for Medium-Range Weather Forecasts (ECMWF) via the Copernicus Climate Change Service (C3S).
* **Data Type:** Gridded hourly surface variables aggregated to daily catchment basin averages:
  * Total precipitation ($P$ in $\text{mm/day}$)
  * 2-meter air temperature ($T$ in $^\circ\text{C}$, including daily mean, min, and max)
  * Surface solar radiation downwards ($R_s$ in $\text{W/m}^2$)
  * Volumetric soil water layer 1 ($0\text{–}7\text{ cm}$)
* **Licensing & Usage:** Copernicus License (Open access for research, educational, and commercial evaluation).

---

## 3. Data Processing & Lineage Flow

1. **Spatial Aggregation:** Gridded ERA5-Land meteorological forcings are clipped to CAMELS topographic catchment polygon shapefiles using area-weighted zonal averaging.
2. **Target Normalization:** Streamflow discharge in cubic feet per second ($\text{ft}^3/\text{s}$) or cubic meters per second ($\text{m}^3/\text{s}$) is normalized by catchment drainage area into specific runoff depth ($\text{mm/day}$):
   $$Q_{\text{mm/day}} = \frac{Q_{\text{m}^3/\text{s}} \times 86,400\text{ s/day}}{\text{Area}_{\text{km}^2} \times 10^6\text{ m}^2/\text{km}^2} \times 1,000\text{ mm/m}$$
3. **Leakage-Safe Partitioning:**
   * **Temporal Split:** Chronological boundary (e.g., Training: 1980–2008; Holdout: 2009–2014).
   * **Spatial Split:** Complete geographic withholding (e.g., station 01614000 Appalachian basin excluded entirely from all training folds).
4. **Missing Data Imputation:** Missing meteorological forcings are linearly interpolated across gaps $\le 3\text{ days}$; gaps $> 3\text{ days}$ are rejected to prevent synthetic trend fabrication.

---

## 4. Benchmark Sample Data Included in Repository

To allow instant judges and peer evaluators to run inference without downloading multi-gigabyte raw archives, three verified benchmark sample CSVs are bundled in `frontend/public/samples/`:

1. `catchment_01434000_gauged.csv`: 366 daily records from USGS Station 01434000 (Neversink River near Claryville, NY) with complete observed discharge and ERA5 meteorological forcings.
2. `catchment_01434000_ungauged.csv`: Identical station and dates, with the observed discharge column intentionally omitted to test Ungauged / PUB inference mode.
3. `unseen_basin_appalachian_gauged.csv`: Station 01614000 (Back Creek, WV) representing a geographically withheld holdout catchment.
