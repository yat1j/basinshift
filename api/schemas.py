"""
BASINSHIFT FastAPI Data Contracts and Schemas
Author: Lead ML Engineer
Authoritative Plan: BASINSHIFT_Final_Master_Plan_Rubric_Aligned.html (Version 2.0)
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """System health check and readiness contract."""
    status: str = Field(..., example="healthy")
    pipeline_ready: bool = Field(..., example=True)
    loaded_models_count: int = Field(..., example=13)
    loaded_artifacts: List[str] = Field(..., example=["xgboost_gauged_h1.joblib", "..."])
    supported_horizons_days: List[int] = Field(..., example=[1, 3, 7])
    supported_feature_modes: List[str] = Field(..., example=["gauged", "ungauged"])
    version: str = Field(..., example="1.0.0")
    message: str = Field(..., example="BASINSHIFT inference engine is initialized and ready.")


class PredictResponse(BaseModel):
    """
    Unified forecasting and flood warning prediction contract.
    Strictly conforms to InferencePipeline output schema and audited JSON contract.
    """
    catchment_id: str = Field(..., example="camels_01047000")
    forecast_origin: str = Field(..., example="2013-05-15")
    feature_mode: str = Field(..., example="Gauged")
    forecast_horizons_days: List[int] = Field(..., example=[1, 3, 7])
    discharge_unit: str = Field(..., example="mm/day")
    predicted_discharge: Dict[str, float] = Field(..., example={"1d": 1.8448, "3d": 1.9941, "7d": 2.0006})
    high_flow_probability: Optional[Dict[str, float]] = Field(None, example={"1d": 0.0153, "3d": 0.1105, "7d": 0.2775})
    high_flow_alert_threshold: Optional[Dict[str, float]] = Field(None, example={"1d": 0.70, "3d": 0.70, "7d": 0.60})
    high_flow_alert: Optional[Dict[str, bool]] = Field(None, example={"1d": False, "3d": False, "7d": False})
    extreme_flow_probability: Optional[Any] = Field(None, example=None)
    prediction_intervals: Optional[Any] = Field(None, example=None)
    uncertainty_available: bool = Field(False, example=False)
    model_metadata: Dict[str, Any] = Field(...)
    forecast_basis: str = Field(..., example="historical_reanalysis_replay")
    warnings: List[str] = Field(default_factory=list, example=[])


class RegressionBenchmark(BaseModel):
    """Individual regression benchmark performance metric record."""
    horizon_days: int = Field(..., example=1)
    model_name: str = Field(..., example="Constrained_Ensemble")
    feature_mode: str = Field(..., example="Gauged")
    partition: str = Field(..., example="Temporal_Val_Test_A")
    n_valid_samples: int = Field(..., example=86336)
    rmse: float = Field(..., example=1.5726)
    mae: float = Field(..., example=0.6405)
    mean_nse: Optional[float] = Field(None, example=0.5821)
    median_nse: Optional[float] = Field(None, example=0.6942)
    mean_kge: Optional[float] = Field(None, example=0.6412)
    median_kge: Optional[float] = Field(None, example=0.7105)
    high_flow_rmse: Optional[float] = Field(None, example=8.2084)


class ClassificationBenchmark(BaseModel):
    """Individual high-flow classifier benchmark performance metric record."""
    horizon_days: int = Field(..., example=1)
    feature_mode: str = Field(..., example="Gauged")
    partition: str = Field(..., example="Temporal_Val_Test_A")
    model_artifact: str = Field(..., example="classifier_gauged_h1.joblib")
    n_valid_samples: int = Field(..., example=86336)
    n_positive_events: int = Field(..., example=4228)
    event_prevalence: float = Field(..., example=0.0490)
    training_optimal_threshold: float = Field(..., example=0.70)
    pr_auc: float = Field(..., example=0.6463)
    roc_auc: float = Field(..., example=0.9632)
    brier_score: float = Field(..., example=0.0245)
    brier_skill_score_operational: float = Field(..., example=0.6955)
    f1_at_optimal_tau: float = Field(..., example=0.8478)
    precision_at_optimal_tau: float = Field(..., example=0.8621)
    recall_at_optimal_tau: float = Field(..., example=0.8340)


class MetricsResponse(BaseModel):
    """Comprehensive benchmark evaluation metrics response."""
    status: str = Field("success", example="success")
    disclaimer: str = Field(...)
    partitions: Dict[str, str] = Field(...)
    regression_benchmarks: List[RegressionBenchmark] = Field(...)
    classification_benchmarks: List[ClassificationBenchmark] = Field(...)


class ErrorResponse(BaseModel):
    """Standardized API error contract."""
    status: str = Field("error", example="error")
    error_code: str = Field(..., example="INSUFFICIENT_HISTORY")
    message: str = Field(..., example="Insufficient antecedent history for catchment 'camels_01047000': requires at least 365 days.")
    field: Optional[str] = Field(None, example="file")
    details: Optional[Any] = Field(None, example=None)

