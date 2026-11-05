# BASINSHIFT — Team Contributions & Attribution Declaration

**Competition Project:** BASINSHIFT  
**Team Composition:** 2-Member Multidisciplinary Research Team  
**Submission Date:** November 2026  

---

## 1. Team Roles & Division of Responsibilities

### Member 1: ML Pipeline, Modeling & Scientific Validation Lead
* **Primary Scope:**
  * Hydrological representation engineering: formulated the 4-linear-reservoir conceptual routing physics ($k_1 \dots k_4$) and soil-gated effective precipitation equations.
  * Model training: implemented Stage 1 non-negative Ridge regression and Stage 2 LightGBM residual estimators.
  * Experimental benchmarking: evaluated persistence baselines, pure LightGBM, and Two-Stage Hybrid Variant A across CAMELS catchments.
  * Rare-event classification: trained and calibrated the LightGBM $Q_{95}$ high-flow classification heads.
  * Holdout validation: executed chronological forward-in-time and spatial leave-one-basin-out holdout evaluations.
  * Artifact custody: generated and validated the 24 candidate model checkpoints.

### Member 2: Software Architect, Frontend, Integration & Documentation Lead
* **Primary Scope:**
  * Platform engineering: designed and implemented the full multi-page Next.js 14 research web platform adhering to Google Research editorial quality standards.
  * Geospatial observation: implemented the interactive Catchment Explorer using Leaflet with custom Carto Dark and ESRI Satellite basemaps.
  * Hydrological visualization: built the interactive SVG Hydrograph and inverted rainfall hyetograph canvas with Q95 threshold indicators.
  * Data ingestion: built the client-side drag-and-drop CSV parser with date validation and antecedent window checking.
  * Integration boundary: established the frontend API client and resilient verified benchmark replay fallback engine.
  * Technical documentation: authored the complete submission documentation suite (Model Card, Data Dictionary, Validation Protocol, Technical Report, Reproduction Guide, Audit).
  * Quality assurance: built the automated testing suite and Continuous Integration (CI) pipeline.

---

## 2. External Libraries & Open-Source Attribution

The BASINSHIFT platform builds upon the following foundational open-source tools:

* **Hydrological Science & Benchmarks:**
  * *CAMELS Dataset:* Addor et al. (2017), UCAR/NCAR.
  * *USGS NWIS Telemetry:* U.S. Geological Survey.
  * *ERA5-Land:* ECMWF / Copernicus Climate Change Service.
* **Frontend Web Stack:**
  * *Next.js 14:* Vercel Inc. (MIT License).
  * *React 18:* Meta Platforms Inc. (MIT License).
  * *Tailwind CSS:* Tailwind Labs Inc. (MIT License).
  * *KaTeX:* Khan Academy (MIT License).
  * *Leaflet:* Vladimir Agafonkin / CloudMade (BSD 2-Clause).
  * *PapaParse:* Matthew Holt (MIT License).
  * *Lucide React:* Lucide Project (ISC License).
* **Python Machine Learning Stack:**
  * *NumPy:* NumPy Developers (BSD License).
  * *Scikit-Learn:* scikit-learn developers (BSD License).
  * *LightGBM:* Microsoft Corporation (MIT License).
  * *FastAPI:* Sebastián Ramírez (MIT License).
  * *Pydantic:* Pydantic Services Inc. (MIT License).
  * *Pytest:* Holger Krekel and contributors (MIT License).

---

## 3. Media Attribution

* **Hero Drone Footage & Floods Video Loop:** Google Research Flood Forecasting Public Research Media.
* **Satellite River Delta Imagery:** NASA Earth Observatory (PIA14876 Ganges-Brahmaputra Delta).
* **Ground Flood Reality Photography:** Ground Hydro-Observation Archive / Unsplash Open License.

---

## 4. AI-Assisted Development Disclosure

In accordance with competition rules, the team discloses the use of AI agentic coding assistance (Antigravity by Google DeepMind) for code scaffolding, document formatting, frontend layout styling, and test generation under human editorial direction and scientific verification. All scientific hypotheses, model architectural decisions, and validation protocols were human-directed and verified against genuine hydrological literature.
