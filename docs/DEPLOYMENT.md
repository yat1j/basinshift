# BASINSHIFT Production Deployment & Operations Guide

## 1. System Architecture Overview

BASINSHIFT consists of two decoupled services designed for independent scaling and high-availability evaluation:

```
[ Web Browser ]
      │
      ▼ (Port 3000)
[ Next.js Frontend ] ─── REST POST /predict ───► [ FastAPI Inference Backend ]
  (React 19 / TypeScript)                            (Python 3.12 / Uvicorn, Port 8000)
      │                                                         │
      │ (Fallback if API unavailable)                           ▼
      └─► [ Client-Side Benchmark Replay ]          [ Variant A Two-Stage Hybrid ]
          (Zero-install physics fallback)           (Linear Reservoirs + Ridge + LGBM)
```

---

## 2. Option A: Local Development Setup

### Backend (Python FastAPI)

1. Create a Python 3.12 virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate       # macOS / Linux
   .\venv\Scripts\Activate.ps1    # Windows PowerShell
   ```

2. Install pinned dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run automated tests to verify installation:
   ```bash
   python -m unittest discover -s tests -p "test_*.py" -v
   ```

4. Launch the FastAPI server:
   ```bash
   uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - Swagger Documentation: `http://localhost:8000/docs`
   - Health Check: `http://localhost:8000/health`

### Frontend (Next.js 16 / React 19)

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```

2. Copy `.env.example` to `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. Run development server:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:3000`

4. For production build:
   ```bash
   npm run build
   npm run start
   ```

---

## 3. Option B: Docker Compose Single-Command Orchestration

The repository includes pre-configured production Dockerfiles for both services and a unified `docker-compose.yml`:

```bash
# Build and launch both services in isolated containers
docker compose up --build -d

# View live aggregate logs
docker compose logs -f

# Verify container health
docker compose ps

# Shut down
docker compose down
```

---

## 4. Option C: Cloud Deployment Targets

| Component | Recommended Platform | Deploy Guide |
|---|---|---|
| **Next.js Frontend** | **Vercel** / **Netlify** | Connect GitHub repo, set root directory to `frontend`, set `NEXT_PUBLIC_API_URL` to backend URL. |
| **FastAPI Backend** | **Railway** / **Render** / **Fly.io** | Use `Dockerfile.backend`, expose port `8000`, set health check path to `/health`. |

---

## 5. Environment Variables Reference

| Variable | Service | Default | Purpose |
|---|---|---|---|
| `PORT` | Backend / Frontend | `8000` / `3000` | HTTP port binding |
| `NEXT_PUBLIC_API_URL` | Frontend | `http://localhost:8000` | Target endpoint for inference requests |
| `PYTHONDONTWRITEBYTECODE` | Backend | `1` | Prevents writing `.pyc` files in container |
| `PYTHONUNBUFFERED` | Backend | `1` | Real-time stdout logging in container console |

---

## 6. Resilience & Demo Replay Fallback

If network latency spikes, port 8000 is blocked by corporate firewall, or Member 1's live server is temporarily unreachable, the frontend automatically activates the **Client-Side Benchmark Replay Engine**:
- Evaluates the user's uploaded CSV or preset catchment data client-side.
- Simulates identical 4-reservoir physics and rolling sums in TypeScript.
- Displays an honest badge: `"Historical Benchmark Replay Mode"`.
- Prevents live demo disruption while preserving 100% scientific integrity.
