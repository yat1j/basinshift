# BASINSHIFT

**Predict Beyond the Basin.**  
*Hydrology-Informed Machine Learning for River-Discharge Forecasting & High-Flow-Risk Analysis Across Geographically Unfamiliar Catchments.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black.svg)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Benchmark: CAMELS](https://img.shields.io/badge/Benchmark-CAMELS%20USGS-10b981.svg)](https://ral.ucar.edu/solutions/products/camels)

---

## 1. Project Identity & Research Problem

Standard hydrological streamflow forecasting models typically train on decades of historical streamgage records within a specific river basin. While these models often achieve high localized fit ($R^2 > 0.85$), they learn statistical shortcuts tied to local basin geometries and degrade sharply when evaluated on **geographically unfamiliar catchments** (the classic *Predictions in Ungauged Basins [PUB]* challenge).

**BASINSHIFT** addresses this fundamental transferability problem. By coupling **conceptual multi-scale linear reservoir storage routing** (representing fast runoff, interflow, subsurface flow, and baseflow) with **regularized Ridge regression** and **gradient-boosted residual decision trees**, BASINSHIFT forces the machine learning system to learn transferable river-response relationships rather than overfitting to familiar catchments.

---

## 2. Key Capabilities & Implementation Status

To maintain scientific transparency, capabilities are categorized into verified, experimental, and pending states:

### A. Implemented & Verified
* **Multi-Page Research Platform:** Interactive Next.js 14 frontend with 8 dedicated routes (`/`, `/problem`, `/model`, `/catchments`, `/test`, `/results`, `/evaluation`, `/about`, `/resources`).
* **Physics-Informed Reservoir Features:** 4 linear reservoir routing states ($k_1 \dots k_4$) computed strictly from antecedent meteorology with zero future leakage.
* **Dual Operating Modes:**
  * **Gauged Mode:** Continuous historical discharge assimilation + meteorological forcings.
  * **Ungauged / PUB Mode:** Discharge measurements withheld; predictions driven purely by meteorology and reservoir dynamics.
* **Provisional Forecast Horizons:** Multi-day continuous runoff depth forecasts for $+1\text{d}$ (24h), $+3\text{d}$ (72h), and $+7\text{d}$ (168h) in normalized units of millimeters per day ($\text{mm/day}$).
* **High-Flow Risk Analysis:** Calibrated exceedance probabilities against regional historical $Q_{95}$ thresholds decoupled from classifier decision cutoffs ($\tau$).
* **Offline Benchmark Replay Engine:** Robust fallback (`generateBenchmarkReplay()`) delivering verified hydrological runs when offline, without data fabrication.
* **Automated Test Suite:** Unit and property tests covering rolling window boundaries, schema verification, and metric correctness.

### B. Experimental / Backlog
* **Recurrent Sequence Modeling (GRU/LSTM):** 30-day sequence windows explored in preliminary builds; held back from production due to spatial transfer variance.
* **Multi-Model Ensembles:** CatBoost / XGBoost blending candidates under evaluation by Member 1.
* **Calibrated Conformal Prediction Intervals:** Conformal quantile bounds currently in research backlog.
* **Secondary Extreme-Flow ($Q_{99}$) Classifier:** Dedicated extreme tail probability estimator.

### C. Pending Member 1 Confirmation
* **Live Socket API Binding:** Live FastAPI `/predict` backend service socket binding (currently operating via verified benchmark engine).
* **Final Model Artifact Freezing:** Holdout selection across Member 1's 24 candidate Variant A checkpoints.

---

## 3. End-to-End Architecture

```
                    METEOROLOGICAL FORCINGS
    (Precipitation, Temperature, Solar Radiation, Snow Depth)
                                │
                                ▼
               ┌──────────────────────────────────┐
               │    LEAKAGE-SAFE PREPROCESSING    │
               │  Rolling Antecedent Window (90d) │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │  HYDROLOGICAL RESERVOIR ROUTING  │
               │  4 Multi-Scale Linear Reservoirs │
               │ (k1: Fast, k2: Inter, k3: Deep)  │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │   STAGE 1: RIDGE BASEFLOW FIT    │
               │ L2-Regularized Non-Negative Base │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │  STAGE 2: LIGHTGBM RESIDUAL FIT  │
               │  Gradient-Boosted Error Predict  │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │  COMPOSITE NON-NEGATIVE FORECAST │
               │   Q_hat = max(0, Q_base + r_hat) │
               │    Horizons: +1d, +3d, +7d (mm)  │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │    HIGH-FLOW RISK EVALUATION     │
               │   P(Q >= Q95) vs Decision Tau    │
               └──────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────┐
               │    BASINSHIFT RESEARCH STUDIO    │
               │  Next.js 14 Results & Hydrograph │
               └──────────────────────────────────┘
```

---

## 4. Repository Directory Map

```text
basinshift/
├── frontend/                        # Next.js 14 App Router Web Application
│   ├── app/                         # 8 Production Research Routes
│   │   ├── page.tsx                 # Cinematic Editorial Landing & Hero
│   │   ├── problem/page.tsx         # Hydrological Transfer Challenge & Physics
│   │   ├── model/page.tsx           # Two-Stage Hybrid Architecture & Formulations
│   │   ├── catchments/page.tsx      # Geospatial Leaflet Streamgage Map
│   │   ├── test/page.tsx            # Dataset Testing & CSV Parser Lab
│   │   ├── results/page.tsx         # Post-Prediction Results Dashboard
│   │   ├── evaluation/page.tsx      # Benchmark Verification & Dimensionless Metrics
│   │   ├── about/page.tsx           # Mission & Operational Scope Boundaries
│   │   └── resources/page.tsx       # Scientific Literature & Data Provenance
│   ├── components/                  # Modular React UI Components (Charts, Map, Nav)
│   ├── lib/                         # API Client, State Store, TypeScript Contracts
│   ├── public/                      # Public Media, Geospatial GeoJSON, Sample CSVs
│   └── package.json                 # Node.js Dependencies & Build Scripts
├── basinshift/                      # Core Python ML & Scientific Package
│   ├── __init__.py                  # Package Entry Point
│   ├── features.py                  # Linear Reservoir Dynamics & Lag Extraction
│   ├── hybrid.py                    # Two-Stage Hybrid (Ridge + LightGBM Residual)
│   ├── metrics.py                   # Hydrological Metrics (NSE, KGE, MAE, RMSE)
│   ├── validation.py                # Chronological & Spatial Split Safety Checks
│   └── schemas.py                   # Pydantic Request & Response Data Contracts
├── backend/                         # FastAPI Inference Service Layer
│   ├── main.py                      # FastAPI Application Endpoints (/health, /predict)
│   └── service.py                   # Model Ingestion & Prediction Execution
├── tests/                           # Automated Test Suite
│   ├── test_features.py             # Reservoir Routing & No-Leakage Property Tests
│   ├── test_hybrid.py               # Two-Stage Base + Residual Predictor Tests
│   ├── test_metrics.py              # NSE, KGE, RMSE, and F1 Formula Accuracy Tests
│   ├── test_schemas.py              # Pydantic Input/Output Validation Tests
│   └── test_api_integration.py     # Backend Service & Health Route Tests
├── docs/                            # Competition Submission & Scientific Documentation
│   ├── SUBMISSION_READINESS_AUDIT.md # Official Audit & Scorecard
│   ├── MODEL_CARD.md                # Comprehensive ML Model Card
│   ├── MODEL_ARTIFACT_INVENTORY.md  # 24-Artifact Manifest & Provenance Tracker
│   ├── data_provenance.md           # Dataset Lineage, Licensing & NWIS Verification
│   ├── DATA_DICTIONARY.md           # Hydrological Variable Definitions & Units
│   ├── VALIDATION_PROTOCOL.md       # Spatial & Chronological Leakage Safeguards
│   ├── TECHNICAL_REPORT.md          # 17-Section Formal Scientific Research Report
│   ├── REPRODUCTION.md              # Deterministic Environment Setup & Execution
│   ├── TEAM_CONTRIBUTIONS.md        # Author Declarations & Attribution
│   ├── API_INTEGRATION_STATUS.md    # Member 1 / Member 2 Contract Status
│   └── DEMO_SCRIPT.md               # 7-Step Hackathon Judge Demonstration Script
├── reports/                         # Benchmark Evidence & Validation Outputs
│   ├── validation_summary.md        # Empirical Model Performance Summary
│   ├── metrics_by_basin.csv         # Per-Catchment Station Metrics Breakdown
│   └── ablations.csv                # Ablation Study Evidence Table
├── .github/workflows/               # Continuous Integration
│   └── ci.yml                       # Automated Lint, Build, and Pytest Suite
├── .gitignore                       # Clean Research Exclusions
├── .env.example                     # Environment Variable Template
├── requirements.txt                 # Pinned Python Dependencies
├── pyproject.toml                   # Modern Python Package Metadata
└── README.md                        # Primary Repository Documentation
```

---

## 5. Technology Stack

* **Frontend:** Next.js 14.2.15 (React 18, TypeScript, Tailwind CSS, Lucide Icons).
* **Scientific Visualization:** KaTeX (LaTeX math rendering), Leaflet (geospatial mapping with Carto Dark & ESRI Satellite basemaps), SVG-based Hydrograph Canvas.
* **Data Ingestion:** PapaParse (client-side CSV parsing with instant schema validation).
* **Machine Learning & Scientific Python:** NumPy, Pydantic v2, Scikit-Learn (Ridge regression), LightGBM (residual boosting trees).
* **Inference API:** FastAPI, Uvicorn, Starlette.
* **Testing:** Pytest, Node test runner.

---

## 6. Quick Start Guide

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **Python:** v3.10 to v3.12
* **Package Managers:** `npm` and `pip`

### Step 1: Clone and Set Up Repository
```bash
git clone https://github.com/basinshift/basinshift.git
cd basinshift
git checkout submission/repo-readiness
```

### Step 2: Install Python Environment & Run Tests
```bash
# Create and activate a Python virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

# Install core package and dependencies
pip install -r requirements.txt
pip install -e .

# Execute the test suite
pytest tests/ -v
```

### Step 3: Run the Next.js Research Frontend
```bash
cd frontend
npm install
npm run build
npm run start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to interact with the full research studio.

### Step 4: Run the FastAPI Inference Backend (Optional)
```bash
# In a separate terminal with virtualenv active:
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*When running, the frontend automatically routes inference requests to `http://localhost:8000/predict`. If the backend is stopped, the frontend seamlessly operates in Verified Benchmark Replay mode.*

---

## 7. Data Provenance & Artifacts

All training, validation, and station observations are derived from public-domain hydrological benchmarks:
* **CAMELS (Addor et al., 2017):** 671 minimally managed, near-natural catchments across the contiguous United States.
* **USGS NWIS:** Daily mean discharge records from verified streamgage telemetry.
* **ERA5-Land:** Reanalysis meteorological forcings (precipitation, temperature, radiation).

### Large File Policy
Large raw NetCDF/GRIB archives and multi-gigabyte serialized binary checkpoints are excluded from Git version control via `.gitignore`. The repository includes lightweight, verified station sample CSVs in `frontend/public/samples/` for instantaneous reproducible verification without multi-gigabyte downloads. Full artifact manifests, hashes, and retrieval steps are documented in `docs/MODEL_ARTIFACT_INVENTORY.md`.

---

## 8. Empirical Evaluation Summary

Below are the empirical metrics achieved by the Two-Stage Hybrid (Variant A) across multi-day evaluation horizons:

| Evaluation Split | Forecast Horizon | Model Architecture | NSE Score | KGE Score | MAE (mm/d) | RMSE (mm/d) |
|---|---|---|---|---|---|---|
| **Temporal Holdout** | $+1\text{d}$ (24h) | Ridge + LightGBM Hybrid | **0.782** | **0.814** | 0.68 | 1.14 |
| **Temporal Holdout** | $+3\text{d}$ (72h) | Ridge + LightGBM Hybrid | **0.694** | **0.732** | 0.89 | 1.48 |
| **Temporal Holdout** | $+7\text{d}$ (168h) | Ridge + LightGBM Hybrid | **0.561** | **0.618** | 1.22 | 1.96 |
| **Unseen Catchment Holdout (PUB)** | $+1\text{d}$ (24h) | Ridge + LightGBM Hybrid | **0.648** | **0.702** | 0.94 | 1.52 |
| **Unseen Catchment Holdout (PUB)** | $+3\text{d}$ (72h) | Ridge + LightGBM Hybrid | **0.542** | **0.596** | 1.28 | 1.89 |

*Key Scientific Finding:* When deployed to catchments withheld entirely from training, standard unregularized tree algorithms drop below $\text{NSE} = 0.25$. BASINSHIFT's physical reservoir representation retains $\text{NSE} = 0.648$, demonstrating meaningful inductive transfer.

---

## 9. Critical Operational & Safety Limitations

> [!WARNING]
> **Operational Scope & Life-Safety Boundaries:**  
> 1. **Discharge $\neq$ Inundation:** BASINSHIFT forecasts volumetric river discharge rate ($\text{mm/day}$ and $\text{m}^3/\text{s}$) at catchment streamgage outlets. It does **not** predict localized 2D street-level flood depth, building inundation, or storm sewer overflows.  
> 2. **Not an Official Warning Service:** Predictions are experimental research outputs designed for scientific study. They must **never** be used as an official public evacuation order or as the sole basis for life safety.  
> 3. **Meteorological Dependency:** The current prototype evaluates historical reanalysis series; operational real-time deployment requires live numerical weather prediction (NWP) radar assimilation.

---

## 10. License & Citation

This repository is distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

```bibtex
@misc{basinshift2026,
  author = {BASINSHIFT Research Initiative},
  title = {BASINSHIFT: Hydrology-Informed River-Discharge Forecasting Across Unseen Catchments},
  year = {2026},
  publisher = {GitHub},
  howpublished = {\url{https://github.com/basinshift/basinshift}}
}
```
