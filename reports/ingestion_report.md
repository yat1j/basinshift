# BASINSHIFT · Data Ingestion & Integration Report (150-Catchment Benchmark)
**Author:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 5, 2026  
**Authoritative Plan:** `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html`  
**Output Dataset:** `D:/hackathon/basinshift/data/processed/pilot_150_catchments.parquet` (16.39 MB)  
**Execution Runtime:** 59.97 seconds  

---

## 1. Executive Summary

A reproducible multi-continental ingestion pipeline was executed to construct the 150-catchment training and evaluation benchmark for BASINSHIFT. The dataset couples:
1. **Streamflow Ground Truth:** Sourced from official regional archives (PANGAEA for Australia, USGS NWIS for the United States).
2. **Dynamic Meteorological Forcing:** Sourced directly from the Caravan-MultiMet ERA5-Land Cloud Zarr repository.
3. **Harmonized Units & Timeline:** Standardized to specific discharge ($mm/day$) across a 10-year synchronized window (**2005-01-01 to 2014-12-31**).

All 150 selected catchments passed strict data quality and completeness thresholds (>= 90%).

---

## 2. Ingestion & Catchment Inventory

| Metric | Measured Value | Verification Status |
| :--- | :--- | :--- |
| **Total Catchments Selected** | **150 catchments** | **100% Passed Quality Filter** |
| **CAMELS-AUS Catchments** | 75 catchments | Pan-Australian coverage across 8 drainage divisions |
| **CAMELS-US Catchments** | 75 catchments | Pan-US coverage across 14 HUC hydrologic regions |
| **Synchronized Benchmark Window** | 2005-01-01 to 2014-12-31 | 10 continuous years (3,652 daily steps per basin) |
| **Total Observation Rows** | **547,800 rows** (150 basins × 3,652 dates) | Zero duplicate `(catchment_id, date)` keys |
| **Total Ingestion & Export Time** | **59.97 seconds** | Fast, cloud-native streaming; no 11.7 GB download |
| **Parquet Storage Footprint** | **16.39 MB** | Compressed with Snappy |

---

## 3. Missingness & Data Quality Audit

| Variable Name | Missing Observations | Missing Percentage | Integrity Assessment |
| :--- | :--- | :--- | :--- |
| `catchment_id` | 0 | 0.000% |
| `date` | 0 | 0.000% |
| `streamflow` | 3,994 | 0.729% |
| `total_precipitation` | 0 | 0.000% |
| `temperature_2m` | 0 | 0.000% |
| `dewpoint_temperature_2m` | 0 | 0.000% |
| `potential_evaporation` | 0 | 0.000% |
| `volumetric_soil_water_layer_1` | 0 | 0.000% |
| `snow_depth_water_equivalent` | 0 | 0.000% |
| `drainage_area` | 0 | 0.000% |
| `source_collection` | 0 | 0.000% |
| `country` | 0 | 0.000% |

> [!NOTE]
> **Zero-Imputation Prohibition Enforced:**
> Streamflow missingness (0.73%) reflects authentic sensor downtime and ice/flood disruptions. Missing values are retained strictly as `NaN` and are **never filled with zero**. Meteorological forcings from ERA5-Land possess 0.000% missingness.

---

## 4. Leakage-Safe Validation Split Design

To satisfy Section 7 of `BASINSHIFT_Full_Challenge_Documentation.pdf` and Section 3 of `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html`, catchments were partitioned **prior to feature windowing**:

| Partition | Catchment Count | Percentage | Temporal Span | Purpose in Evaluation |
| :--- | :--- | :--- | :--- | :--- |
| **Development Fold** | **120 catchments** (60 US, 60 AUS) | 80% | Train: 2005–2012<br>Val (Test A): 2013–2014 | Parameter fitting and forward-time extrapolation. |
| **Geographic Holdout (Test B)** | **30 catchments** (15 US, 15 AUS) | 20% | Full 10 Years (2005–2014) | **Unseen Catchment Generalization**. Zero leakage into training. |

The split manifest is frozen at:
- `docs/split_manifest.csv`
- `reports/split_manifest.csv`

---

## 5. Readiness for Next Implementation Step

With the 150-catchment dataset integrated and frozen at `data/processed/pilot_150_catchments.parquet`:
- **Readiness:** **FULLY READY FOR CAUSAL FEATURE ENGINEERING**.
- **Next Action:** Member 1 will implement `src/basinshift/features.py` to extract past-only rolling and lag features ($t' \le t$) and fit the persistence reference baseline.
