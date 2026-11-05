# BASINSHIFT — Hackathon Evaluation Demonstration Script

**Presentation Time:** 5–7 Minutes  
**Target Audience:** Competition Judges & Technical Evaluation Panel  
**Theme:** *Predict Beyond the Basin: Generalizable Hydrological Forecasting*  

---

## 1. Introduction: The Unseen Catchment Challenge (0:00 – 1:00)

* **Hook:** "Floods cause billions in damages every year, yet over 90% of global river basins are completely ungauged. Standard ML models memorize local historical river gages and collapse when transferred to unfamiliar basins."
* **The Research Question:** "Can a hydrology-informed ML system learn transferable physical relationships rather than memorizing local gage patterns?"
* **Action:** Open **[http://localhost:3000](http://localhost:3000)**. Show the cinematic river hero and scroll through the human reality photography and Google layered hydrology visual.

---

## 2. Scientific Architecture & Physics Formulation (1:00 – 2:00)

* **Key Message:** "We don't feed raw lags to a black box. We route soil-gated effective precipitation through four multi-scale linear reservoirs representing fast surface runoff, interflow, percolation, and baseflow."
* **Two-Stage Hybrid:**
  * **Stage 1:** L2-regularized Ridge regression fits a stable baseflow that cannot explode under covariate shift.
  * **Stage 2:** LightGBM residual decision trees learn the nonlinear crests and saturation dynamics.
  * **Non-Negative Clipping:** Mass conservation is preserved.
* **Action:** Navigate to **[http://localhost:3000/model](http://localhost:3000/model)**. Walk the judges through the 5-step pipeline and KaTeX mathematical formulations.

---

## 3. Interactive Geospatial Catchment Explorer (2:00 – 3:00)

* **Key Message:** "Our platform monitors and benchmarks against 671 USGS streamgage stations across diverse climate zones."
* **Action:** Navigate to **[http://localhost:3000/catchments](http://localhost:3000/catchments)**.
  1. Demonstrate the interactive Leaflet map in dark mode.
  2. Toggle to **Satellite** basemap.
  3. Click on **Station 01434000** (Neversink River, NY). The station drawer slides open showing drainage area ($172.5\text{ km}^2$), mean elevation ($680\text{ m}$), and historical $Q_{95}$ ($14.82\text{ mm/d}$).
  4. Point out the orange pins representing geographically withheld holdouts (e.g., Station 01614000 in West Virginia).
  5. Click **Load into Forecast Lab**.

---

## 4. Dataset Ingestion & Dual-Mode Inference (3:00 – 4:30)

* **Key Message:** "Our client parser enforces strict causal data integrity: minimum 90-day antecedent history, zero missing date timestamps, and distinct Gauged vs Ungauged operating modes."
* **Action:** On **[http://localhost:3000/test](http://localhost:3000/test)**:
  1. Select preset: **USGS 01434000 • Gauged**.
  2. Highlight the validation summary table: 366 daily records, 0 missing cells, observed flow column detected.
  3. Click **Run Predictions**.
  4. On the Results Dashboard (**[http://localhost:3000/results](http://localhost:3000/results)**):
     * Show the 3 forecast cards: $+1\text{d}$ ($5.24\text{ mm/d}$), $+3\text{d}$ ($4.46\text{ mm/d}$), $+7\text{d}$ ($3.59\text{ mm/d}$).
     * Hover over the interactive SVG Hydrograph and point out the inverted rainfall hyetograph and dashed orange $Q_{95}$ threshold ($14.82\text{ mm/d}$).
     * Explain the high-flow probability indicator ($42\%$ risk of exceeding $Q_{95}$).
     * Show the expandable Model Provenance Drawer and Data Quality Audit.
  5. Demonstrate **Ungauged / PUB Mode**:
     * Return to `/test`, select **USGS 01434000 • Ungauged / PUB**.
     * Run predictions. Point out that the hydrograph does **not** invent historical flow, transparently maintaining scientific integrity.

---

## 5. Generalization Evidence & Ablation Defense (4:30 – 5:30)

* **Key Message:** "Does the physics actually help? Yes. On familiar basins, pure LightGBM scores 0.812 while our hybrid scores 0.782. But on unseen catchments withheld from training, pure ML collapses to 0.234 while BASINSHIFT retains 0.648 NSE."
* **Action:** Navigate to **[http://localhost:3000/evaluation](http://localhost:3000/evaluation)**. Walk judges through the comparison table and high-flow classification metrics (F1 = 0.768, AUPRC = 0.792).

---

## 6. Safety Boundaries & Responsible-Use Q&A (5:30 – 6:30)

* **Key Defense:**
  * "BASINSHIFT forecasts volumetric river discharge rate ($\text{mm/day}$ and $\text{m}^3/\text{s}$). It does not claim to predict street-level flood depth."
  * "Our prototype is evaluated on historical reanalysis records. It is an advisory tool for hydrologists, not an autonomous public evacuation warning service."
* **Action:** Show the responsible-use notice anchored across the footer and result panels.

---

## 7. Conclusion & Repository Inspection (6:30 – 7:00)

* Point judges to the root `README.md`, `docs/MODEL_CARD.md`, and automated test suite (`pytest tests/`).
* Thank the judges and invite technical questions.
