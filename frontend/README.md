# BASINSHIFT — Frontend Platform

**Predict Beyond the Basin.**

Hydrology-informed machine learning research platform for river-discharge forecasting and high-flow-risk analysis across geographically unfamiliar catchments.

---

## Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom midnight / river teal palette
- **Scientific Rendering**: KaTeX (for mathematical equations: NSE, KGE, Water Balance, Ridge Objective)
- **Geospatial Mapping**: Leaflet with dynamic client-side rendering, CartoDB Dark Matter, Esri World Imagery, and OpenTopoMap basemaps
- **Data Inspection**: PapaParse for client-side CSV validation and header verification
- **Icons**: Lucide React

---

## Application Route Map

| Route | Page | Purpose |
|---|---|---|
| `/` | Overview / Home | Short, cinematic, editorial introduction with ambient river video and scientific storytelling |
| `/problem` | The Hydrological Challenge | Physical rainfall-runoff mechanisms, antecedent soil storage, and spatial distribution shift |
| `/model` | Our Model | Two-Stage Hybrid Architecture (Linear Reservoirs + Ridge Base + LightGBM Residual Correction) with KaTeX math |
| `/test` | Testing Laboratory | Drag-and-drop CSV validation lab, benchmark catchment presets, and inference execution |
| `/results` | Forecast Results | Member 1 Post-Predict Specification dashboard (+1d, +3d, +7d horizons, hydrograph, Q95 probability, provenance) |
| `/catchments` | Catchment Explorer | Interactive map with verified USGS streamgage stations and CAMELS benchmark basins |
| `/evaluation` | Model Evaluation | Genuine metrics (MAE, RMSE, NSE, KGE, confusion matrix, and runtime latency) |
| `/about` | About & Ethics | Project mission, data provenance (CAMELS & USGS), limitations, and operational scope |
| `/resources` | Resources & Citations | Scientific papers, documentation links, and media asset manifest |

---

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure `NEXT_PUBLIC_API_URL` to point to Member 1's inference backend (default `http://localhost:8000`).

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Member 1 API Integration Contract

The frontend connects to Member 1's FastAPI inference service via `frontend/lib/api.ts`:

- `GET /health`: Health check and latency monitoring.
- `POST /predict`: Sends catchment ID, forecast origin, operating mode (`gauged` or `ungauged`), and historical meteorological time series.
- Returns structured JSON adhering to `BASINSHIFT_Member2_Post_Predict_UI_Spec.md`.

When the backend is offline, the frontend provides an honest offline state and offers verified offline historical benchmark replays for testing and demonstration.
