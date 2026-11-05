"""
BASINSHIFT FastAPI Backend Application
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)

Provides high-performance, validated HTTP endpoints for:
- GET  /health   : Health check, pipeline readiness, and model registry inventory.
- POST /predict  : Multipart/form-data CSV upload for streamflow forecasting & flood alerts.
- GET  /metrics  : Offline benchmark validation results across temporal and geographic partitions.
"""

import os
import io
from pathlib import Path
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from src.basinshift.inference import InferencePipeline
from api.schemas import (
    HealthResponse,
    PredictResponse,
    MetricsResponse,
    ErrorResponse,
    RegressionBenchmark,
    ClassificationBenchmark
)
from api.dependencies import get_pipeline


MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 Megabytes


def _load_cached_metrics() -> Dict[str, Any]:
    """Loads offline benchmark validation results from CSV reports for GET /metrics."""
    reg_path = Path("reports/stage_c_regression_evaluation.csv")
    clf_path = Path("reports/final_classifier_reconciliation.csv")

    reg_benchmarks = []
    if reg_path.exists():
        reg_df = pd.read_csv(reg_path)
        for _, r in reg_df.iterrows():
            reg_benchmarks.append(
                RegressionBenchmark(
                    horizon_days=int(r['horizon_days']),
                    model_name=str(r['model_name']),
                    feature_mode=str(r['feature_mode']),
                    partition=str(r['partition']),
                    n_valid_samples=int(r['n_valid_samples']),
                    rmse=round(float(r['rmse']), 4),
                    mae=round(float(r['mae']), 4),
                    mean_nse=round(float(r['mean_nse']), 4) if pd.notna(r.get('mean_nse')) else None,
                    median_nse=round(float(r['median_nse']), 4) if pd.notna(r.get('median_nse')) else None,
                    mean_kge=round(float(r['mean_kge']), 4) if pd.notna(r.get('mean_kge')) else None,
                    median_kge=round(float(r['median_kge']), 4) if pd.notna(r.get('median_kge')) else None,
                    high_flow_rmse=round(float(r['high_flow_rmse']), 4) if pd.notna(r.get('high_flow_rmse')) else None
                )
            )

    clf_benchmarks = []
    if clf_path.exists():
        clf_df = pd.read_csv(clf_path)
        for _, r in clf_df.iterrows():
            clf_benchmarks.append(
                ClassificationBenchmark(
                    horizon_days=int(r['horizon_days']),
                    feature_mode=str(r['feature_mode']),
                    partition=str(r['partition']),
                    model_artifact=str(r['model_artifact']),
                    n_valid_samples=int(r['n_valid_samples']),
                    n_positive_events=int(r['n_positive_events']),
                    event_prevalence=round(float(r['event_prevalence_eval']), 4),
                    training_optimal_threshold=round(float(r['training_optimal_threshold']), 2),
                    pr_auc=round(float(r['pr_auc']), 4),
                    roc_auc=round(float(r['roc_auc']), 4),
                    brier_score=round(float(r['brier_score_model']), 4),
                    brier_skill_score_operational=round(float(r['brier_skill_score_operational']), 4),
                    f1_at_optimal_tau=round(float(r['f1_at_optimal_tau']), 4),
                    precision_at_optimal_tau=round(float(r['precision_at_optimal_tau']), 4),
                    recall_at_optimal_tau=round(float(r['recall_at_optimal_tau']), 4)
                )
            )

    return {
        "status": "success",
        "disclaimer": (
            "These metrics reflect audited offline benchmark evaluation across development temporal "
            "validation (Test A) and geographic holdout validation (Test B). Live predictions do not "
            "compute real-time accuracy because future ground truth streamflow is strictly unavailable "
            "at forecast issue time."
        ),
        "partitions": {
            "Temporal_Val_Test_A": "120 Development catchments, evaluated over 2013-01-01 to 2014-12-31.",
            "Geographic_Val_Test_B": "30 Regional holdout catchments (PUB), evaluated over 2013-01-01 to 2014-12-31."
        },
        "regression_benchmarks": reg_benchmarks,
        "classification_benchmarks": clf_benchmarks
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes the production InferencePipeline once at application startup."""
    try:
        app.state.pipeline = InferencePipeline(
            models_dir="models",
            thresholds_path="reports/high_flow_thresholds.csv",
            weights_path="reports/ensemble_weights.csv"
        )
        app.state.pipeline_ready = True
        app.state.init_error = None
        app.state.cached_metrics = _load_cached_metrics()
        print(f"[API Startup] InferencePipeline initialized successfully. Models loaded: {len(app.state.pipeline.loaded_artifacts)}")
    except Exception as e:
        app.state.pipeline = None
        app.state.pipeline_ready = False
        app.state.init_error = str(e)
        app.state.cached_metrics = None
        print(f"[API Startup ERROR] Failed to initialize InferencePipeline: {e}")

    yield

    # Clean shutdown
    app.state.pipeline = None
    app.state.pipeline_ready = False
    print("[API Shutdown] Inference pipeline released.")


app = FastAPI(
    title="BASINSHIFT Hydrological Forecasting API",
    version="1.0.0",
    description=(
        "Production REST API for BASINSHIFT multi-horizon streamflow forecasting and flood warning. "
        "Supports Gauged and Ungauged (PUB) modes with non-leakage temporal isolation."
    ),
    lifespan=lifespan
)

# CORS Middleware Configuration
cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080"
)
allowed_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"]
)


# Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Returns standardized JSON error response for HTTPExceptions."""
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "error_code": exc.detail.get("error_code", "HTTP_ERROR"),
                "message": exc.detail.get("message", "An error occurred."),
                "field": exc.detail.get("field"),
                "details": exc.detail.get("details")
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error_code": "HTTP_ERROR",
            "message": str(exc.detail),
            "field": None,
            "details": None
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Returns standardized JSON error response for request parameter validation errors."""
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    loc = ".".join(str(l) for l in first_err.get("loc", []))
    msg = first_err.get("msg", "Request validation failed.")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "error_code": "VALIDATION_ERROR",
            "message": f"Validation error at '{loc}': {msg}",
            "field": loc,
            "details": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catches unhandled server exceptions and prevents internal stack trace leakage."""
    print(f"[UNHANDLED SERVER ERROR] {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected internal server error occurred.",
            "field": None,
            "details": None
        }
    )


# --- API Routes ---

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health and Pipeline Readiness Check",
    tags=["System"]
)
async def health(request: Request):
    """
    Returns application status, pipeline readiness, and loaded model artifact inventory.
    """
    pipeline = getattr(request.app.state, "pipeline", None)
    pipeline_ready = getattr(request.app.state, "pipeline_ready", False)

    if not pipeline_ready or pipeline is None:
        init_err = getattr(request.app.state, "init_error", "Pipeline not initialized.")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "pipeline_ready": False,
                "loaded_models_count": 0,
                "loaded_artifacts": [],
                "supported_horizons_days": [1, 3, 7],
                "supported_feature_modes": ["gauged", "ungauged"],
                "version": "1.0.0",
                "message": f"Inference pipeline initialization failed: {init_err}"
            }
        )

    return HealthResponse(
        status="healthy",
        pipeline_ready=True,
        loaded_models_count=len(pipeline.loaded_artifacts),
        loaded_artifacts=pipeline.loaded_artifacts,
        supported_horizons_days=[1, 3, 7],
        supported_feature_modes=["gauged", "ungauged"],
        version="1.0.0",
        message="BASINSHIFT inference engine is initialized and ready."
    )


@app.post(
    "/predict",
    response_model=PredictResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Malformed or unsupported file format"},
        422: {"model": ErrorResponse, "description": "Invalid or insufficient data"},
        500: {"model": ErrorResponse, "description": "Internal server error"}
    },
    summary="Generate Streamflow Forecasts and Flood Alerts",
    tags=["Forecasting"]
)
async def predict(
    file: UploadFile = File(..., description="Historical time-series CSV file"),
    catchment_id: str = Form(..., description="Target catchment ID (e.g. camels_01047000)"),
    forecast_origin: str = Form(..., description="Forecast issue date/timestamp (YYYY-MM-DD)"),
    feature_mode: str = Form("gauged", description="Feature mode: 'gauged' or 'ungauged'"),
    allow_unsupported_region: bool = Form(False, description="Whether to allow regression-only prediction if regional Q95 is undefined"),
    pipeline: InferencePipeline = Depends(get_pipeline)
):
    """
    Processes an uploaded historical time-series CSV and generates 1-day, 3-day, and 7-day
    discharge forecasts alongside probabilistic flood alerts.
    """
    # 1. Validate File Format & Filename
    filename = file.filename or ""
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "INVALID_FILE_FORMAT",
                "message": f"Uploaded file '{filename}' is not a CSV. File must have a .csv extension.",
                "field": "file"
            }
        )

    # 2. Read File Contents with Size Limit
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "EMPTY_FILE",
                "message": "Uploaded CSV file is empty.",
                "field": "file"
            }
        )

    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "FILE_TOO_LARGE",
                "message": f"Uploaded file exceeds maximum allowed size of {MAX_UPLOAD_SIZE // (1024 * 1024)} MB.",
                "field": "file"
            }
        )

    # 3. Parse CSV
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "MALFORMED_CSV",
                "message": f"Failed to parse uploaded CSV file: {e}",
                "field": "file"
            }
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "EMPTY_CSV_DATA",
                "message": "Uploaded CSV contains headers but zero data rows.",
                "field": "file"
            }
        )

    # 4. Validate feature_mode
    mode_clean = feature_mode.strip().capitalize()
    if mode_clean not in ["Gauged", "Ungauged"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_FEATURE_MODE",
                "message": f"Invalid feature_mode '{feature_mode}'. Must be 'gauged' or 'ungauged'.",
                "field": "feature_mode"
            }
        )

    # 5. Validate forecast_origin
    try:
        origin_ts = pd.to_datetime(forecast_origin.strip())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INVALID_FORECAST_ORIGIN",
                "message": f"Could not parse forecast_origin '{forecast_origin}': {e}",
                "field": "forecast_origin"
            }
        )

    # 6. Validate Required Columns
    base_required = [
        "catchment_id",
        "date",
        "total_precipitation",
        "temperature_2m",
        "dewpoint_temperature_2m",
        "potential_evaporation",
        "volumetric_soil_water_layer_1",
        "snow_depth_water_equivalent",
        "drainage_area",
        "source_collection"
    ]
    if mode_clean == "Gauged":
        base_required.append("streamflow")

    missing_cols = [c for c in base_required if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "MISSING_REQUIRED_COLUMNS",
                "message": f"Uploaded CSV is missing required column(s): {missing_cols}.",
                "field": "file"
            }
        )

    # 7. Validate Catchment Identity
    cid_clean = catchment_id.strip()
    df["catchment_id"] = df["catchment_id"].astype(str)
    cat_df = df[df["catchment_id"] == cid_clean].copy()
    if cat_df.empty:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "CATCHMENT_NOT_FOUND",
                "message": f"Requested catchment_id '{cid_clean}' not found in uploaded CSV.",
                "field": "catchment_id"
            }
        )

    # 8. Validate Duplicate Dates
    cat_df["date"] = pd.to_datetime(cat_df["date"])
    if cat_df.duplicated(subset=["date"]).any():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "DUPLICATE_DATES",
                "message": f"Duplicate date records detected for catchment '{cid_clean}' in uploaded CSV.",
                "field": "file"
            }
        )

    # 9. Validate Forecast Origin Presence
    if not (cat_df["date"] == origin_ts).any():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "ORIGIN_DATE_NOT_FOUND",
                "message": f"Forecast origin date '{origin_ts.strftime('%Y-%m-%d')}' is not present in uploaded CSV for catchment '{cid_clean}'.",
                "field": "forecast_origin"
            }
        )

    # 10. Check Post-Origin Observations & Filter Strictly
    post_origin_count = int((cat_df["date"] > origin_ts).sum())
    post_origin_warning = None
    if post_origin_count > 0:
        post_origin_warning = (
            f"Uploaded CSV contained {post_origin_count} observations dated after forecast_origin "
            f"({origin_ts.strftime('%Y-%m-%d')}); these were strictly filtered out prior to feature engineering."
        )

    # 11. Validate Antecedent History Length (>= 365 days)
    antecedent_df = cat_df[cat_df["date"] <= origin_ts].sort_values("date").reset_index(drop=True)
    min_date = antecedent_df["date"].min()
    day_span = (origin_ts - min_date).days
    if day_span < 365 or len(antecedent_df) < 365:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "INSUFFICIENT_HISTORY",
                "message": (
                    f"Insufficient antecedent history for catchment '{cid_clean}': requires at least 365 days "
                    f"prior to forecast origin {origin_ts.strftime('%Y-%m-%d')}, but found {day_span} days "
                    f"({len(antecedent_df)} records)."
                ),
                "field": "file"
            }
        )

    # 12. Validate Source Collection & Regional Threshold
    source_col = str(antecedent_df["source_collection"].iloc[-1]).strip()
    if source_col not in pipeline.regional_q95_map and not allow_unsupported_region:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "UNSUPPORTED_REGION",
                "message": (
                    f"Unsupported source_collection '{source_col}' for catchment '{cid_clean}'. "
                    f"Supported collections: {list(pipeline.regional_q95_map.keys())}. "
                    "High-flow regional thresholds are not calibrated for other regions."
                ),
                "field": "file"
            }
        )

    # 13. Execute Prediction
    try:
        prediction_result = pipeline.predict(
            history_df=cat_df,
            catchment_id=cid_clean,
            forecast_origin=origin_ts,
            feature_mode=mode_clean,
            allow_unsupported_region=allow_unsupported_region
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error_code": "PREDICTION_EXECUTION_ERROR",
                "message": f"Inference execution failed: {e}",
                "field": None
            }
        )

    # Add post-origin warning if applicable
    if post_origin_warning:
        prediction_result["warnings"].append(post_origin_warning)

    return prediction_result


@app.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Offline Benchmark Evaluation Metrics",
    tags=["Validation"]
)
async def metrics(request: Request):
    """
    Returns audited offline benchmark metrics for Stage C models across temporal (Test A)
    and geographic holdout (Test B) partitions.
    """
    cached = getattr(request.app.state, "cached_metrics", None)
    if cached is None:
        cached = _load_cached_metrics()
        request.app.state.cached_metrics = cached
    return cached

