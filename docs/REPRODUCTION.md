# BASINSHIFT — End-to-End Reproduction Guide

**Document Version:** 1.0.0  
**Target Environment:** Windows 10/11 (PowerShell) or Linux/macOS (Bash)  
**Estimated Time to Run:** ~5–10 minutes for full environment setup, test suite, and local server startup.  

---

## 1. Environment Requirements

* **Python:** Version `3.10`, `3.11`, or `3.12`
* **Node.js:** Version `18.x`, `20.x`, or `22.x`
* **Git:** Version `2.30+`

---

## 2. Step-by-Step Reproduction Instructions

### Step 2.1: Clone and Check Out Submission Branch
```bash
git clone https://github.com/basinshift/basinshift.git
cd basinshift
git checkout submission/repo-readiness
```

### Step 2.2: Configure Python Virtual Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate on Windows (PowerShell):
.venv\Scripts\Activate.ps1
# OR on Windows (Command Prompt):
# .venv\Scripts\activate.bat
# OR on Linux / macOS (Bash):
# source .venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies and local package in editable mode
pip install -r requirements.txt
pip install -e .
```

### Step 2.3: Execute Automated Test Suite
Run the test suite verifying feature routing, no-leakage constraints, metric formulas, and schema contracts:
```bash
pytest tests/ -v
```
*Expected Result: All unit and schema tests pass.*

### Step 2.4: Build and Launch Next.js Research Platform
```bash
cd frontend

# Install Node.js dependencies
npm install

# Build static production bundle
npm run build

# Start production server
npm run start
```
*Expected Result: Server is listening on `http://localhost:3000`. Navigate to this URL in any browser.*

### Step 2.5: Run Interactive Dataset Inference (Web UI)
1. Open **[http://localhost:3000/test](http://localhost:3000/test)** in your browser.
2. Under **Select a Verified Benchmark Catchment**, click **USGS 01434000 • Gauged**.
3. Observe that the client-side CSV parser validates:
   * 366 daily records loaded.
   * Date span: `2023-09-16` to `2024-09-15`.
   * Zero missing values detected.
   * Observed flow column confirmed present.
4. Click **Run Predictions**.
5. The platform routes to **[http://localhost:3000/results](http://localhost:3000/results)**, rendering:
   * $+1\text{d}$, $+3\text{d}$, and $+7\text{d}$ continuous discharge forecasts in $\text{mm/day}$.
   * Interactive Hydrograph SVG chart with inverted rainfall hyetograph.
   * Calibrated $Q_{95}$ high-flow exceedance risk probabilities.
   * Input data quality audit and model provenance metadata.

### Step 2.6: Test Ungauged / PUB Mode
1. Return to **[http://localhost:3000/test](http://localhost:3000/test)**.
2. Click **USGS 01434000 • Ungauged / PUB**.
3. Notice that the observed streamflow column is intentionally absent.
4. Click **Run Predictions**.
5. On the results page, confirm that the hydrograph does **not** draw any observed history line and explicitly denotes *Ungauged / PUB Mode: historical observations omitted to prevent data fabrication*.

### Step 2.7: Run FastAPI Inference Service (Optional)
To test the live backend service layer:
```bash
# In a separate terminal with .venv active:
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Then probe the health route:
```bash
curl http://127.0.0.1:8000/health
```
*Expected Output: `{"status":"online","service":"basinshift-inference","version":"1.0.0"}`*

---

## 3. Verification Commands Summary

| Task | Command | Expected Outcome |
|---|---|---|
| **Python Syntax & Imports** | `python -c "import basinshift; print(basinshift.__version__)"` | Prints `1.0.0` |
| **Python Test Suite** | `pytest tests/ -v` | All tests pass |
| **Frontend Build** | `cd frontend && npm run build` | Exits with code `0` (12 routes prerendered) |
| **Frontend Production Server** | `cd frontend && npm run start` | Serves on `http://localhost:3000` |
| **Backend Health Probe** | `curl http://127.0.0.1:8000/health` | Returns HTTP 200 with status JSON |
