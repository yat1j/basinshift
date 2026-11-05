"""
FastAPI Production Backend for BASINSHIFT.
Endpoints:
- GET /         : API root and documentation links
- GET /health   : Service health and model status
- POST /predict : Hydrology-informed inference pipeline
"""

import time
import os
import sys
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from basinshift.schemas import PredictRequest, PredictResponse
from backend.service import ForecastService

app = FastAPI(
    title="BASINSHIFT Hydrological Forecasting API",
    description="Operational inference engine for river-discharge forecasting and PUB regional generalization.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for Next.js frontend
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

START_TIME = time.time()
service = ForecastService()


@app.get("/", tags=["Root"])
def read_root():
    """Service status and quick links."""
    return {
        "service": "BASINSHIFT Hydrological Inference Engine",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs",
        "endpoints": {
            "health": "/health",
            "predict": "/predict"
        },
        "operating_modes": ["gauged", "ungauged"],
        "horizons": [1, 3, 7],
    }


@app.get("/health", tags=["Monitoring"])
def health_check():
    """System uptime and inference readiness."""
    uptime_sec = round(time.time() - START_TIME, 2)
    return {
        "status": "healthy",
        "uptime_seconds": uptime_sec,
        "model_family": "Two-Stage Conceptual Linear Reservoirs + Ridge + Residual Corrector (Variant A)",
        "model_loaded": True,
        "default_horizons": [1, 3, 7],
    }


@app.post(
    "/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    tags=["Inference"]
)
def predict_discharge(request: PredictRequest):
    """
    Ingests sequential daily meteorological and flow records,
    validates chronological ordering and leakage boundaries,
    routes inputs through 4 linear reservoirs,
    and returns multi-horizon discharge and Q95 exceedance risk.
    """
    try:
        response = service.generate_prediction(request)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Validation error in input forcing records: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hydrological inference engine error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
