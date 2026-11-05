# BASINSHIFT · Comprehensive Missing-Data Audit & Quality Report
**Role:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 5, 2026  
**Authoritative Plan:** `BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html` (Version 2.0)  
**Primary Dataset:** `data/processed/pilot_150_catchments.parquet` (16.39 MB, 547,800 rows)  
**Associated Artifacts:**
- Catchment Manifest: `docs/pilot_catchment_manifest.csv`
- Split Manifest: `reports/split_manifest.csv`
- Catchment Missingness Table: `reports/missingness_by_catchment.csv`
- Horizon Sample Coverage Table: `reports/horizon_sample_coverage.csv`
- Automated Test Suite: `tests/test_data_quality.py` (8/8 tests passing)

---

## 1. Executive Summary & Core Metrics

Before initiating feature engineering and model training, a rigorous missing-data investigation and quality audit was conducted on the integrated 150-catchment benchmark dataset. The dataset contains 10 continuous years of synchronized daily observations (2005-01-01 to 2014-12-31; 3,652 dates per catchment) spanning 75 Australian catchments (CAMELS-AUS) and 75 United States catchments (CAMELS-US).

### Key Audit Findings
1. **Low Overall Target Missingness:** Across 547,800 total station-day records, exactly **3,994 records** have missing streamflow labels (**0.729%** overall missingness). Streamflow completeness across the benchmark is **99.271%**.
2. **Dynamic Weather Forcing is 100% Complete:** All 6 dynamic meteorological variables sourced from Caravan-MultiMet ERA5-Land Cloud Zarr (`total_precipitation`, `temperature_2m`, `dewpoint_temperature_2m`, `potential_evaporation`, `volumetric_soil_water_layer_1`, `snow_depth_water_equivalent`) exhibit **0.000% missingness** (zero NaNs across 547,800 records).
3. **Pronounced Asymmetry Between Continents:** Streamflow missingness is almost exclusively concentrated in CAMELS-AUS (**3,939 missing values; 1.438%**), whereas CAMELS-US records from USGS NWIS exhibit near-perfect continuity (**55 missing values; 0.020%**).
4. **Physical Zeroes vs. Missing Observations:** Exactly **49,416 records** represent authentic physical zero streamflow ($q = 0.0\text{ mm/day}$, **9.021%** of all observations). Under strict hydrological principles, authentic zero-flow is distinct from sensor missingness (`NaN`).
5. **Supervised Sample Coverage Exceeds 98.4% Across All Horizons:** When evaluating multi-step forecasting horizons $h \in \{1, 3, 7\}$ days with target masking:
   - **Development Training:** 347,424 to 348,141 valid training examples (**99.32% coverage**).
   - **Temporal Validation (Test A):** 85,862 to 86,574 valid evaluation examples (**98.96% coverage**).
   - **Geographic Validation (Test B Full):** 108,642 to 108,822 valid evaluation examples (**99.35% coverage**).

---

## 2. Missingness Distribution (Task 1)

### 2.1 Catchment-Level Distribution
- **100% Complete Catchments:** 93 out of 150 catchments (62.0%) have zero missing records over the entire 10-year period (73 US catchments, 20 Australian catchments).
- **Catchments with Missing Data:** 57 out of 150 catchments (38.0%) have at least one missing record:
  - CAMELS-AUS: 55 catchments (ranging from 0.03% to 8.02% missing).
  - CAMELS-US: 2 catchments (`camels_02300700` with 1 missing record [0.03%], `camels_11274500` with 54 missing records [1.48%]).
- **Distribution Quartiles for Missingness (Catchments with > 0 missing):**
  - Minimum: 1 day (0.027%)
  - 25th Percentile: 13 days (0.356%)
  - Median: 48 days (1.314%)
  - 75th Percentile: 104 days (2.848%)
  - Maximum: 293 days (8.023%, `camelsaus_116013A`)

### 2.2 Source Collection Comparison

| Source Collection | Country | Catchment Count | Total Records | Missing Streamflow | Missing % | Authentic Zeros | Zero % | Completeness % |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CAMELS-AUS** | Australia | 75 | 273,900 | 3,939 | 1.4381% | 39,183 | 14.3056% | 98.5619% |
| **CAMELS-US** | United States | 75 | 273,900 | 55 | 0.0201% | 10,233 | 3.7360% | 99.9799% |
| **Combined Benchmark** | Global | 150 | 547,800 | 3,994 | 0.7291% | 49,416 | 9.0208% | 99.2709% |

### 2.3 Temporal Breakdown by Calendar Year

| Year | Total Station-Days | Missing Count | Missing % | Zero-Discharge Count | Zero-Discharge % |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **2005** | 54,750 | 283 | 0.5169% | 4,313 | 7.8776% |
| **2006** | 54,750 | 431 | 0.7872% | 6,531 | 11.9288% |
| **2007** | 54,750 | 502 | 0.9169% | 6,893 | 12.5900% |
| **2008** | 54,900 | 345 | 0.6284% | 4,638 | 8.4481% |
| **2009** | 54,750 | 357 | 0.6521% | 5,810 | 10.6119% |
| **2010** | 54,750 | 367 | 0.6703% | 2,967 | 5.4192% |
| **2011** | 54,750 | 233 | 0.4256% | 2,772 | 5.0630% |
| **2012** | 54,900 | 225 | 0.4098% | 4,217 | 7.6812% |
| **2013** | 54,750 | 477 | 0.8712% | 5,082 | 9.2822% |
| **2014** | 54,750 | 774 | 1.4137% | 6,193 | 11.3114% |

### 2.4 Temporal Breakdown by Calendar Month

| Month | Month Name | Total Station-Days | Missing Count | Missing % | Zero-Discharge Count | Zero-Discharge % | Hydrological Driver |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | January | 46,500 | 387 | 0.8323% | 4,864 | 10.4602% | Austral Summer Wet / Monsoonal High Flow |
| **2** | February | 42,300 | 231 | 0.5461% | 4,418 | 10.4444% | Tropical Cyclones & Monsoon Troughs |
| **3** | March | 46,500 | 240 | 0.5161% | 4,519 | 9.7183% | Receding Wet Season / Autumn Transition |
| **4** | April | 45,000 | 223 | 0.4956% | 3,953 | 8.7844% | Dry Transition |
| **5** | May | 46,500 | 260 | 0.5591% | 4,003 | 8.6086% | Stable Baseflow Season |
| **6** | June | 45,000 | 256 | 0.5689% | 3,337 | 7.4156% | Boreal Summer / Austral Winter |
| **7** | July | 46,500 | 338 | 0.7269% | 3,408 | 7.3290% | Southern Winter Rains / Northern High Convection |
| **8** | August | 46,500 | 332 | 0.7140% | 3,774 | 8.1161% | Late Winter / Early Spring |
| **9** | September | 45,000 | 354 | 0.7867% | 3,850 | 8.5556% | Spring Transition |
| **10** | October | 46,500 | 362 | 0.7785% | 4,318 | 9.2860% | Build-up Season in Australia |
| **11** | November | 45,000 | 485 | 1.0778% | 4,561 | 10.1356% | Early Monsoon Wet Season Onset |
| **12** | December | 46,500 | 526 | 1.1312% | 4,411 | 9.4860% | Peak Summer Storms & Flood Stage Disruption |

> [!NOTE]
> **Seasonal Missingness Observation:** In CAMELS-AUS, missing records are statistically higher in November (1.08%) and December (1.13%) compared to other months (which average ~0.5–0.7%). In CAMELS-US, missingness remains uniformly low across all months (<= 0.03%). Per project guidelines, no speculative physical cause (such as gauge washout or equipment submersion) is asserted for seasonal missingness, as source archives provide the numerical sentinel (-99.99) without station-level maintenance failure narratives.

### 2.5 Gap Morphology: Isolated vs. Contiguous Dropouts
- **Isolated Missing Observations ($L = 1$ day):** 28 catchments exhibit isolated 1-day dropouts.
- **Contiguous Missing Gaps ($L > 1$ day):** 51 catchments exhibit contiguous runs of missing data.
- **Maximum Consecutive Missing Period:**
  - Median maximum gap: 0 days (for 93 complete catchments) / 18 days (for catchments with gaps).
  - Maximum contiguous gap across the entire dataset: **247 days** (`camelsaus_410061`).
  - Gaps longer than 30 days are present in 19 Australian catchments. In USGS records, only 1 catchment (`camels_11274500`) has a multi-day gap (54 days).

### 2.6 Distribution of Authentic Zero-Streamflow Observations
- **Hydrological Ephemerality:** 49,416 records (9.02% of the dataset) have authentic streamflow $q = 0.0\text{ mm/day}$.
- **Continental Difference:** 39,183 zero records occur in CAMELS-AUS (14.31% of Australian station-days), reflecting the dry interior and Mediterranean climate of south-eastern/western Australia where ephemeral streams regularly dry up completely during summer. In CAMELS-US, 10,233 zero records (3.74%) occur, concentrated in arid Western and Southwestern basins (e.g. Arizona, New Mexico, Texas).
- **Physical Distinction:** Zero streamflow is a crucial physical state indicating zero surface runoff and depleted baseflow. It must never be confused with missing data (`NaN`).

---

## 3. Root-Cause Investigation of Missing Values (Task 2)

An audit of `src/basinshift/ingest.py` and upstream data sources confirmed the origins of all missing values:

1. **Original Source Archival Gaps:**
   - **CAMELS-AUS:** Sourced from the official Australian Bureau of Meteorology (BoM) / PANGAEA repository. The BoM streamflow archives assign `-99.99` to days with missing or unvalidated discharge. Ingestion code strictly parsed this sentinel value and mapped it to IEEE floating-point `NaN`. No valid zero measurements were altered.
   - **CAMELS-US:** Sourced directly from USGS NWIS REST API (parameter code `00060`, daily mean discharge). USGS NWIS records negative values (such as `-999999`) for periods affected by river ice jams, equipment malfunctions, or gauge reconstruction. Ingestion code strictly mapped negative values to `NaN`. All positive discharges and authentic zeros ($0.0\text{ cfs} = 0.0\text{ mm/day}$) were preserved intact.
2. **Quality Flag Handling:**
   - In USGS NWIS, qualification codes (`A` = Approved, `P` = Provisional, `e` = Estimated) accompany streamflow data. In accordance with hydrological forecasting standards, approved and estimated discharge records were retained as valid physical approximations; only genuine missing dates or negative error flags were coerced to `NaN`.
3. **No Artifacts from Alignment or Date Joins:**
   - The date index was generated as a strict, complete daily sequence spanning exactly 3,652 dates from 2005-01-01 to 2014-12-31 for all 150 basins.
   - Dynamic weather forcing was extracted from Caravan-MultiMet ERA5-Land Zarr on the exact same daily timestamps.
   - Merging meteorological forcing with observed streamflow was performed via exact date matching; no calendar skips or temporal misalignments occurred.
4. **Machine Precision Clamping in Weather Forcings:**
   - In ERA5-Land, three isolated instances of machine-precision numerical underflow ($-5.55 \times 10^{-14}\text{ mm}$) occurred in cumulative total precipitation. These were clamped to $0.0\text{ mm}$ in `src/basinshift/ingest.py` during ingestion, ensuring zero negative precipitation values exist in the dataset.

---

## 4. Horizon Supervised Sample Coverage & Impact (Task 3)

In multi-step time series forecasting, predicting streamflow $h$ days into the future requires an observation target at timestamp $t + h$. If the observation at $t + h$ is missing (`NaN`), the sample $(X_t, y_{t+h})$ cannot be used for supervised loss calculation or metric evaluation.

Furthermore, for autoregressive models and persistence reference baselines ($\hat{y}_{t+h} = q_t$), both the current observation $q_t$ and the future observation $q_{t+h}$ must be non-missing.

The table below summarizes the exact valid sample counts and coverage percentages computed from `reports/horizon_sample_coverage.csv`:

### Supervised Sample Coverage Across Horizons ($h \in \{1, 3, 7\}$ days)

| Partition | Horizon ($h$) | Catchments | Origin Date Window | Total Possible Samples | Valid Targets ($y_{t+h} \ne \text{NaN}$) | Missing Targets | Target Coverage % | Authentic Zero Targets | Valid Persistence Pairs ($q_t \land y_{t+h}$) | Persistence Coverage % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Development Training** | **1 day** | 120 | 2005-01-01 to 2012-12-30 | 350,520 | **348,141** | 2,379 | **99.32%** | 30,910 (8.88%) | 348,008 | 99.28% |
| **Development Training** | **3 days** | 120 | 2005-01-01 to 2012-12-28 | 350,280 | **347,901** | 2,379 | **99.32%** | 30,894 (8.88%) | 347,609 | 99.24% |
| **Development Training** | **7 days** | 120 | 2005-01-01 to 2012-12-24 | 349,800 | **347,424** | 2,376 | **99.32%** | 30,862 (8.88%) | 346,876 | 99.16% |
| **Temporal Val (Test A)** | **1 day** | 120 | 2013-01-01 to 2014-12-30 | 87,480 | **86,574** | 906 | **98.96%** | 9,772 (11.29%) | 86,544 | 98.93% |
| **Temporal Val (Test A)** | **3 days** | 120 | 2013-01-01 to 2014-12-28 | 87,240 | **86,336** | 904 | **98.96%** | 9,737 (11.28%) | 86,263 | 98.88% |
| **Temporal Val (Test A)** | **7 days** | 120 | 2013-01-01 to 2014-12-24 | 86,760 | **85,862** | 898 | **98.96%** | 9,665 (11.26%) | 85,729 | 98.81% |
| **Geographic Val (Test B Full)** | **1 day** | 30 | 2005-01-01 to 2014-12-30 | 109,530 | **108,822** | 708 | **99.35%** | 8,707 (8.00%) | 108,778 | 99.31% |
| **Geographic Val (Test B Full)** | **3 days** | 30 | 2005-01-01 to 2014-12-28 | 109,470 | **108,762** | 708 | **99.35%** | 8,701 (8.00%) | 108,666 | 99.27% |
| **Geographic Val (Test B Full)** | **7 days** | 30 | 2005-01-01 to 2014-12-24 | 109,350 | **108,642** | 708 | **99.35%** | 8,693 (8.00%) | 108,465 | 99.19% |
| **Geographic Val (Test B 2013–14)**| **1 day** | 30 | 2013-01-01 to 2014-12-30 | 21,870 | **21,526** | 344 | **98.43%** | 1,485 (6.90%) | 21,518 | 98.39% |
| **Geographic Val (Test B 2013–14)**| **3 days** | 30 | 2013-01-01 to 2014-12-28 | 21,810 | **21,466** | 344 | **98.42%** | 1,481 (6.90%) | 21,446 | 98.33% |
| **Geographic Val (Test B 2013–14)**| **7 days** | 30 | 2013-01-01 to 2014-12-24 | 21,690 | **21,346** | 344 | **98.41%** | 1,472 (6.90%) | 21,307 | 98.23% |

### Key Training Implications
1. **Exceptional Supervised Sample Volume:** In the Development Training fold (2005–2012), over **347,000 valid supervised samples** are available for each horizon. This extensive volume is more than sufficient to train robust gradient boosted tree ensembles and baseline regressors without sample starvation.
2. **Stable Coverage Across Horizons:** Target coverage remains virtually constant across $h=1$, $h=3$, and $h=7$ days (~99.32% in training, ~98.96% in temporal validation). The slight reduction in total samples as $h$ increases is solely due to the natural $h$-day boundary offset at the end of the partition window.
3. **Sufficient Persistence Baseline Support:** Over **98.8%** of samples have valid pairs of current and future streamflow $(q_t, q_{t+h})$, allowing the persistence reference baseline to be computed reliably on matched subsets.

---

## 5. Formal Missing-Data Handling Protocol (Task 4)

To prevent data leakage, preserve physical fidelity, and ensure reproducible benchmark evaluations, the following rules are established for the BASINSHIFT pipeline:

### 1. Target Value Masking (Loss & Metrics)
- **Zero-Imputation Prohibition:** Missing streamflow targets must **NEVER** be replaced with zero or imputed synthetically. In hydrology, setting missing values to zero creates false drought events and severely distorts extreme high-flow training.
- **Dynamic Masking:** When computing loss functions (MSE, RMSE, Huber) and hydrological metrics (NSE, KGE, High-Flow Peak Error), filter samples using the boolean mask:
  $$\text{valid\_mask} = \neg \text{isnan}(y_{t+h})$$
- **Catchment Retention:** A catchment must never be dropped from the dataset or evaluation suite simply because it contains missing timesteps. All catchments are retained, and masking is applied row-wise per timestep.

### 2. Meteorological Feature Completeness
- Dynamic weather forcing variables from ERA5-Land are 100% complete across all 150 basins and 3,652 dates. No imputation, interpolation, or filling is required for meteorological inputs.

### 3. Autoregressive Feature Handling (Lags & Rolling Metrics)
- For models incorporating historical streamflow features (such as lag $q_{t-1}$, 7-day rolling mean, antecedent baseflow):
  - **Gradient Boosted Decision Trees (LightGBM / XGBoost):** Use native NaN branching. Modern tree algorithms find the optimal split direction for missing values during node partitioning, naturally handling sensor outages without synthetic distortion.
  - **Linear / Ridge / Neural Baselines:** If imputation is required for linear models, imputers (e.g. median or rolling median) must be **fit strictly on the Development Training partition** ($t \le 2012\text{-}12\text{-}31$). Never fit or calibrate imputers using validation or holdout data.

### 4. Persistence Reference Baseline Protocol
- The naive persistence forecast is defined as:
  $$\hat{y}_{t+h}^{\text{persist}} = q_t$$
- To ensure valid, unskewed comparisons, the persistence baseline must be evaluated strictly on samples where both $q_t$ and $y_{t+h}$ are valid:
  $$\text{mask}_{\text{persist}} = (\neg \text{isnan}(q_t)) \land (\neg \text{isnan}(y_{t+h}))$$

### 5. Strict Partition Isolation
- Test B Geographic Holdout catchments (30 basins) and Test A Temporal Validation periods (2013–2014) must remain strictly quarantined from all statistical estimators, imputers, scalers, and parameter training.

---

## 6. Automated Data Quality Verification Suite

To guarantee continuous dataset integrity, an automated test suite was constructed in [`tests/test_data_quality.py`](file:///d:/hackathon/basinshift/tests/test_data_quality.py). The suite executes using Python's built-in `unittest` runner and verifies 8 core physical and data-engineering contracts:

1. `test_catchment_inventory_and_counts`: Verifies exactly 150 unique catchments (75 CAMELS-AUS, 75 CAMELS-US) and 547,800 rows.
2. `test_no_duplicate_keys_and_continuous_calendar`: Confirms zero duplicate `(catchment_id, date)` records and continuous daily sequences with 1-day step increments.
3. `test_missing_streamflow_preserved_as_nan`: Verifies exactly 3,994 missing streamflow values are stored as `NaN`, with zero negative streamflow or legacy sentinel values (`-99.99`, `-999999`).
4. `test_genuine_zeros_preserved`: Confirms all 49,416 authentic zero-flow days are preserved and distinct from NaNs.
5. `test_weather_completeness_and_physical_bounds`: Asserts 0.00% missingness and physical plausibility in ERA5-Land variables (non-negative precipitation, PET, snow depth, and soil moisture $\le 1.0$).
6. `test_partition_isolation_and_disjointness`: Validates complete disjointness between Development (120 catchments) and Test B Geographic Holdout (30 catchments), ensuring zero leakage.
7. `test_target_masking_without_catchment_dropping`: Confirms target shifting across horizons $h \in \{1, 3, 7\}$ masks missing observations without dropping any of the 150 catchments.
8. `test_horizon_sample_coverage_csv`: Validates that supervised sample coverage exceeds 98% across all partitions and horizons.

### Test Execution Output
```text
Ran 8 tests in 0.545s
OK
```

All 8 tests pass with 100% compliance.

