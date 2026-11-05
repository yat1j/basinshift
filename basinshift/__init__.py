"""
BASINSHIFT: Hydrology-Informed River-Discharge Forecasting & PUB Generalization.
"""

from basinshift.schemas import (
    DailyRecord,
    PredictRequest,
    PredictResponse,
    DataQualityInfo,
    ModelMetadataInfo,
    HydrographPoint,
)
from basinshift.features import (
    extract_hydrological_features,
    simulate_linear_reservoirs,
    compute_effective_precipitation,
    compute_snowmelt_proxy,
)
from basinshift.hybrid import HybridPredictor
from basinshift.metrics import (
    compute_nse,
    compute_kge,
    compute_mae,
    compute_rmse,
    compute_high_flow_metrics,
)
from basinshift.validation import (
    validate_chronological_sequence,
    validate_no_future_leakage,
    validate_spinup_history,
    validate_spatial_partition,
)

__version__ = "1.0.0"
__author__ = "BASINSHIFT Research Initiative"

__all__ = [
    "DailyRecord",
    "PredictRequest",
    "PredictResponse",
    "DataQualityInfo",
    "ModelMetadataInfo",
    "HydrographPoint",
    "extract_hydrological_features",
    "simulate_linear_reservoirs",
    "compute_effective_precipitation",
    "compute_snowmelt_proxy",
    "HybridPredictor",
    "compute_nse",
    "compute_kge",
    "compute_mae",
    "compute_rmse",
    "compute_high_flow_metrics",
    "validate_chronological_sequence",
    "validate_no_future_leakage",
    "validate_spinup_history",
    "validate_spatial_partition",
]
