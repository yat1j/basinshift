"""
Pydantic Data Schemas and API Contracts for BASINSHIFT.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


class DailyRecord(BaseModel):
    """Daily meteorological forcing and optional streamgage observation."""
    date: str = Field(..., description="ISO 8601 calendar date YYYY-MM-DD")
    precipitation_mm_day: float = Field(default=0.0, ge=0.0, description="Total daily precipitation (mm)")
    temperature_2m_degC: Optional[float] = Field(default=12.0, description="Mean 2m air temperature (°C)")
    observed_discharge_mm_day: Optional[float] = Field(default=None, description="Observed streamflow (mm/day)")
    soil_moisture_proxy: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Antecedent saturation ratio [0, 1]")
    solar_radiation_w_m2: Optional[float] = Field(default=150.0, ge=0.0, description="Downward solar radiation (W/m²)")
    snow_water_equivalent_mm: Optional[float] = Field(default=0.0, ge=0.0, description="Catchment snowpack SWE (mm)")


class PredictRequest(BaseModel):
    """Inference request payload submitted to POST /predict."""
    catchment_id: str = Field(..., min_length=4, max_length=16, description="USGS or CAMELS catchment ID")
    forecast_origin: str = Field(..., description="Forecast origin date YYYY-MM-DD")
    operating_mode: Literal["gauged", "ungauged"] = Field(
        default="gauged",
        description="'gauged' (assimilates past Q) or 'ungauged' (PUB mode, meteorology only)"
    )
    csv_rows: List[DailyRecord] = Field(..., min_length=1, description="Sequential daily forcing history")

    @field_validator("forecast_origin")
    @classmethod
    def validate_origin_format(cls, v: str) -> str:
        parts = v.split("-")
        if len(parts) != 3 or len(parts[0]) != 4:
            raise ValueError("forecast_origin must follow YYYY-MM-DD format")
        return v


class DataQualityInfo(BaseModel):
    """Audit of supplied antecedent history and data integrity."""
    historical_days_supplied: int
    historical_discharge_available: bool
    missing_values_count: int = 0
    warnings: List[str] = Field(default_factory=list)


class ModelMetadataInfo(BaseModel):
    """Transparent model lineage and artifact provenance."""
    regression_model_family: str
    regression_artifact_ids: Dict[str, str]
    classifier_artifact_ids: Dict[str, str]
    data_version: str


class HydrographPoint(BaseModel):
    """Single point in post-prediction hydrograph time series."""
    date: str
    observed_discharge_mm_day: Optional[float] = None
    precipitation_mm_day: float = 0.0
    is_forecast_origin: bool = False


class PredictResponse(BaseModel):
    """Structured response contract returned by POST /predict."""
    catchment_id: str
    catchment_name: str
    forecast_origin: str
    operating_mode: Literal["gauged", "ungauged"]
    forecast_horizons_days: List[int] = Field(default_factory=lambda: [1, 3, 7])
    predicted_discharge_mm_day: List[float] = Field(..., description="Continuous discharge predictions (mm/day)")
    high_flow_probability: List[float] = Field(..., description="Calibrated exceedance probability [0, 1]")
    high_flow_threshold_mm_day: float = Field(..., description="Regional historical Q95 threshold (mm/day)")
    classifier_decision_threshold: float = Field(default=0.50, description="Decision cutoff tau for binary alert")
    extreme_flow_probability: Optional[float] = None
    prediction_intervals: Optional[Dict[str, Optional[float]]] = None
    data_quality: DataQualityInfo
    model_metadata: ModelMetadataInfo
    limitations_statement: str
    is_historical_replay: bool = False
    hydrograph_history: Optional[List[HydrographPoint]] = None
