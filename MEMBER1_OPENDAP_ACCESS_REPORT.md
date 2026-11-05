# BASINSHIFT · Remote Caravan Access & Data Audit Report
**Author:** Technical Data Auditor (Member 1: Model & Training)  
**Date:** November 4, 2026  
**Status:** Remote Endpoint Audit Complete — 4TU OPeNDAP Timeout Documented — Cloud Zarr Benchmark Verified  
**Target Local Artifact:** `D:\hackathon\basinshift\data\sample\sample_5_catchments_era5land.nc` (286.21 KB)

---

## 1. Executive Summary & Objective

In accordance with Part 3 and Part 4 of the Data Auditor mandate, an investigation was conducted into remote programmatic access for the **Caravan large-sample hydrology dataset** (DOI: `10.4121/CA13056C-C347-4A27-B320-930C2A4DD207`). The purpose of this audit was to:
1. Test whether remote slicing allows training and prototyping without downloading the complete 11.7 GB Zenodo/4TU archive.
2. Verify endpoints for the 4TU ResearchData THREDDS/OPeNDAP server.
3. Discover actual variable names, coordinates, dimensions, and physical units directly from remote metadata.
4. Retrieve and benchmark a tiny 5-catchment sample saved locally to `data/sample/`.
5. Establish a defensible data selection strategy for the next modeling pilot.

---

## 2. Dependency Audit & Runtime Environment

The local Python environment (`Python 3.13.14`) was audited for remote hydrometeorological slicing capabilities.

| Package | Status | Version | Role in Remote Ingestion |
| :--- | :--- | :--- | :--- |
| `xarray` | **Installed & Verified** | `2026.9.0` | Multi-dimensional labeled array data structure for NetCDF and Zarr. |
| `netCDF4` | **Installed & Verified** | `1.7.5.1.post1` | Low-level C library wrapper for NetCDF3/4 and classic OPeNDAP protocols. |
| `cftime` | **Installed & Verified** | `1.6.6.1` | Calendar and datetime decoding for climate/hydrology time coordinates. |
| `zarr` | **Installed & Verified** | `3.4.2` | Cloud-native chunked, compressed N-dimensional storage reader. |
| `aiohttp` | **Installed & Verified** | `3.14.5` | Asynchronous HTTP client powering `fsspec` remote cloud streaming. |
| `pandas` / `numpy` | **Installed & Verified** | `2.3.3` / `2.3.4` | Tabular data manipulation and numerical arrays. |

---

## 3. 4TU ResearchData OPeNDAP Endpoint Audit

We tested the known 4TU ResearchData THREDDS/OPeNDAP distribution of Caravan under DOI `https://doi.org/10.4121/CA13056C-C347-4A27-B320-930C2A4DD207`.

### 3.1. Target Endpoints Tested
- **Catalog Endpoint:** `https://opendap.4tu.nl/thredds/catalog/data2/djht/ca13056c-c347-4a27-b320-930c2a4dd207/1/catalog.html`
- **CAMELS-US Endpoint:** `https://opendap.4tu.nl/thredds/dodsC/data2/djht/ca13056c-c347-4a27-b320-930c2a4dd207/1/camels.nc`
- **HYSETS Endpoint:** `https://opendap.4tu.nl/thredds/dodsC/data2/djht/ca13056c-c347-4a27-b320-930c2a4dd207/1/hysets.nc`

### 3.2. Diagnostic & Network Results

```mermaid
flowchart TD
    DNS["DNS Lookup: opendap.4tu.nl"] --> IP["Resolved IP: 131.180.141.11 (TU Delft)"]
    IP --> PING["ICMP Ping: SUCCESS (160ms RTT)"]
    IP --> TCP80["TCP Port 80 (HTTP): TIMEOUT"]
    IP --> TCP443["TCP Port 443 (HTTPS): TIMEOUT"]
    IP --> TCP8080["TCP Port 8080: TIMEOUT"]
    IP --> XR["xarray.open_dataset()"]
    XR --> ERR["OSError: [Errno -68] NetCDF: I/O failure (curl error: Timeout was reached)"]
```

1. **DNS Resolution:** `opendap.4tu.nl` resolves as a CNAME to `rd-opendap-libprod-rh8.tudelft.nl` at IP address `131.180.141.11`.
2. **Ping Connectivity:** ICMP ping packets succeed with an average round-trip time (RTT) of $161\text{ ms}$, confirming host-level route reachability.
3. **TCP Port Connectivity:** Probing ports 80, 443, 8000, 8080, 8088, 8443, and 9000 resulted in persistent `TimeoutError`. The firewall at TU Delft or the reverse proxy hosting the THREDDS daemon is currently dropping incoming TCP connection requests.
4. **Library Execution:** Running `xr.open_dataset("https://opendap.4tu.nl/thredds/dodsC/data2/djht/ca13056c-c347-4a27-b320-930c2a4dd207/1/camels.nc")` threw:
   ```
   OSError: [Errno -68] NetCDF: I/O failure: 'https://opendap.4tu.nl/thredds/dodsC/data2/djht/ca13056c-c347-4a27-b320-930c2a4dd207/1/camels.nc'
   (curl error: Timeout was reached)
   ```
5. **4TU Landing Page & Catalog Audit:**
   - Querying `https://data.4tu.nl/v2/articles/ca13056c-c347-4a27-b320-930c2a4dd207` revealed that the repository article holds `shapefiles.zip` ($98\text{ MB}$) and `README.md` ($7\text{ KB}$).
   - The README cites the generation script (`postprocess_caravan.ipynb`, B. Schilperoort) designed to combine individual basin NetCDFs into unified NetCDFs.
   - However, because the public THREDDS daemon (`opendap.4tu.nl`) is currently unreachable, remote NetCDF slicing via 4TU OPeNDAP is **temporarily offline**.

---

## 4. Cloud Zarr Caravan Investigation & Empirical Benchmark

To fulfill the test requirements without downloading the 11.7 GB archive, an investigation of the official Caravan cloud distributions was conducted. The official `kratzert/Caravan` repository provides direct, open cloud streaming of Caravan-MultiMet via Google Cloud Storage in Zarr format:
- **Cloud Store:** `https://storage.googleapis.com/caravan-multimet/v1.1/ERA5_LAND/timeseries.zarr/`

### 4.1. Remote Metadata & Schema Discovery
Opening the consolidated Zarr store remotely via `xarray.open_zarr()` succeeded immediately without downloading the dataset:
- **Remote Open Time:** **1.75 seconds**
- **Basin Dimension:** $22,485$ catchments globally (including CAMELS-US, CAMELS-AUS, CAMELS-BR, CAMELS-CL, CAMELS-GB, HYSETS, and LamaH-CE).
- **Date Coordinate:** $27,333$ daily time steps spanning **1950-01-01 to 2024-10-31** (74 continuous years).
- **Available Variables:** 15 dynamic hydrometeorological forcing variables derived from ECMWF ERA5-Land.

### 4.2. Empirical 5-Catchment Sample Benchmark
A geographically diverse 5-catchment sample was sliced remotely across two continents and saved locally:
- **Selected Catchments:**
  1. `camelsaus_102101A` (Australia)
  2. `camelsaus_104001A` (Australia)
  3. `camels_01013500` (United States, CAMELS-US)
  4. `camels_01022500` (United States, CAMELS-US)
  5. `camels_01030500` (United States, CAMELS-US)
- **Time Slice Extracted:** 6 continuous years (2015-01-01 to 2020-12-31 = 2,192 daily records per basin).
- **Variables Extracted:** Precipitation, 2m temperature, dewpoint temperature, potential evaporation, volumetric soil water (layer 1), and snow-water equivalent.

#### Quantitative Benchmark Results:
| Benchmark Metric | Measured Value | Practical Significance |
| :--- | :--- | :--- |
| **Store Open Time** | $1.75\text{ s}$ | Near-instant remote header/index discovery. |
| **Data Fetch Time** | $15.01\text{ s}$ | Fetched $65,760$ data points ($5\text{ basins} \times 2,192\text{ dates} \times 6\text{ variables}$) over HTTP. |
| **Local Save Time** | $0.05\text{ s}$ | Fast serialization to standard NetCDF4. |
| **Total Pipeline Time** | **15.06 seconds** | Extremely fast and computationally lightweight. |
| **RAM Ingestion Size** | $281\text{ kB}$ | Negligible memory footprint; avoids RAM bloat. |
| **Local File Storage** | **286.21 KB** ($293,084\text{ bytes}$) | Compact, self-contained local benchmark artifact. |
| **Saved File Location** | `D:\hackathon\basinshift\data\sample\sample_5_catchments_era5land.nc` | Verified on local disk. |

---

## 5. Discovered Variable Inventory & Physical Units

Through inspection of the remote dataset attributes and the 4TU/Caravan metadata, the exact variable names, descriptions, aggregations, and physical units were identified:

| Discovered Variable Name in Store | Hydrological Feature Role | Aggregation | Canonical Units | Notes & Quality Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `era5land_total_precipitation` | Rainfall / Snowfall forcing | Daily Sum | $\text{mm}$ | Primary dynamic driver; strictly non-negative. |
| `era5land_temperature_2m` | Air Temperature | Daily Mean | $^\circ\text{C}$ | Governs snowmelt, evapotranspiration, and seasonality. |
| `era5land_dewpoint_temperature_2m` | Atmospheric Humidity | Daily Mean | $^\circ\text{C}$ | Indicator of vapor pressure and air saturation. |
| `era5land_potential_evaporation_FAO_PENMAN_MONTEITH` | Evaporative Demand | Daily Sum | $\text{mm}$ | Physically robust FAO-56 Penman-Monteith potential evapotranspiration. |
| `era5land_volumetric_soil_water_layer_1` | Topsoil Moisture ($0\text{–}7\text{ cm}$) | Daily Mean | $\text{m}^3/\text{m}^3$ | Governs initial runoff infiltration capacity and saturation excess. |
| `era5land_snow_depth_water_equivalent` | Snowpack Storage | Daily Mean | $\text{mm}$ | Essential for snowmelt-driven spring freshets. |
| `era5land_surface_pressure` | Barometric Pressure | Daily Mean | $\text{kPa}$ | Atmospheric forcing. |
| `era5land_surface_net_solar_radiation` | Solar Radiation | Daily Mean | $\text{W/m}^2$ | Energy balance driver. |
| `era5land_u_component_of_wind_10m` | Zonal Wind Vector | Daily Mean | $\text{m/s}$ | Aerodynamic vapor transport driver. |
| `era5land_v_component_of_wind_10m` | Meridional Wind Vector | Daily Mean | $\text{m/s}$ | Aerodynamic vapor transport driver. |
| `streamflow` *(in Caravan base)* | Observed River Discharge | Daily Mean | $\text{mm/d}$ or $\text{m}^3/\text{s}$ | **Target variable**; must never be zero-imputed when missing. |

---

## 6. Data Selection Strategy for Next Pilot

Rather than hardcoding an arbitrary 1,200-catchment subset, Member 1 recommends a **principled, stratified selection strategy** balancing hydrological diversity and computational efficiency:

### 6.1. Selection Strata
1. **Source-Collection Representation:** Include proportional representation across major global sub-datasets:
   - CAMELS-US (Diverse US hydrological regimes)
   - CAMELS-AUS (Arid, ephemeral, and semi-arid regimes)
   - CAMELS-GB (Temperate, maritime, and flash-flood regimes)
   - LamaH-CE / HYSETS (Alpine, snowmelt-dominated, and large transboundary basins)
2. **Climate & Aridity Diversity:** Stratify by the global aridity index ($P / \text{PET}$) across four distinct regimes:
   - Hyper-arid & Arid ($P/\text{PET} < 0.5$)
   - Semi-arid ($0.5 \le P/\text{PET} < 0.75$)
   - Sub-humid & Humid ($0.75 \le P/\text{PET} < 1.5$)
   - Wet / Alpine ($P/\text{PET} \ge 1.5$)
3. **Catchment Scale:** Stratify by drainage basin area across small headwaters ($< 100\text{ km}^2$), medium basins ($100\text{–}1,000\text{ km}^2$), and large basins ($> 1,000\text{ km}^2$).

### 6.2. Data Quality & Completeness Filters
- **Streamflow Record Completeness:** Filter for catchments with $\ge 90\%$ valid, non-missing daily streamflow records over a synchronized 10-year benchmark window (e.g., 2005–2015).
- **No Zero-Filling:** Reject catchments with unexplained multi-year observation dropouts rather than imputing zeros.
- **Continuous Historical Continuity:** Retain the complete chronological sequence for each selected catchment to preserve hydrological memory and baseflow recession curves.

### 6.3. Leakage-Resistant Split Protocol
- **Catchment-Level Partitioning:** Partition catchments **strictly by catchment ID** prior to creating any sliding forecast origin windows:
  - **Training Partition (60% of catchments):** Used for parameter fitting, scalers, and empirical high-flow thresholds.
  - **Temporal Validation (Same catchments, later dates):** Evaluates forward-time forecasting.
  - **Geographic Validation (20% of catchments held out completely):** Evaluates Test B (unseen catchment transfer).
  - **Stress-Test Holdout (20% of catchments):** Evaluates input degradation robustness.

---

## 7. Categorization of Remote Access Findings

| Category | Item Description | Verification Source |
| :--- | :--- | :--- |
| **VERIFIED** | `opendap.4tu.nl` (131.180.141.11) is currently unreachable on TCP ports 80 and 443; THREDDS OPeNDAP access fails with timeout. | Local port scan & `netCDF4`/`xarray` I/O error logs. |
| **VERIFIED** | Caravan-MultiMet Zarr distribution on GCS is live, accessible, and supports chunk-level remote streaming via `xarray.open_zarr()`. | Executed Python benchmark; 5 catchments retrieved in $15.06\text{ s}$. |
| **VERIFIED** | Discovered variable names, units, and coordinates match ERA5-Land conventions. | Extracted `.zattrs` and dataset coordinates. |
| **VERIFIED** | Local sample artifact successfully generated at `data/sample/sample_5_catchments_era5land.nc` ($286.21\text{ KB}$). | Local filesystem inspection. |
| **INFERRED** | 4TU ResearchData may have restricted OPeNDAP access to academic networks or migrated THREDDS endpoints during recent upgrades. | 4TU community notices and network diagnostics. |
| **INFERRED** | A sample of 100–300 stratifed basins provides sufficient statistical power for the 15-hour prototype while keeping compute under 5 minutes. | Hydrological ML literature (Kratzert et al., 2023). |
| **UNKNOWN** | When the 4TU OPeNDAP service will be restored by TU Delft network administrators. | External institutional operations. |
| **UNKNOWN** | Whether the competition organizers will distribute a pre-extracted CSV/Parquet subset directly to participants. | Pending organizer communication. |

---
*Report prepared by Member 1 Data Auditor.*

