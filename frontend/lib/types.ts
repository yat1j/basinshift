export type FeatureMode = "gauged" | "ungauged";

export type ValidationStatus = "valid" | "valid_with_gaps" | "rejected";

export interface ForecastPoint {
  horizon_days: number;
  date: string;
  predicted_discharge_mm_day: number;
  high_flow_probability?: number;
}

export interface HydrographPoint {
  date: string;
  observed_discharge_mm_day: number | null;
  precipitation_mm_day?: number;
  is_forecast_origin?: boolean;
}

export interface DataQualityReport {
  historical_days_supplied: number;
  historical_days_used: number;
  date_range_start: string;
  date_range_end: string;
  missing_observations_count: number;
  invalid_values_count: number;
  historical_discharge_available: boolean;
  future_meteo_supplied: boolean;
  warnings: string[];
  validation_status: ValidationStatus;
}

export interface ModelMetadata {
  regression_model_family: string;
  regression_artifact_ids: Record<string, string>;
  classifier_artifact_ids: Record<string, string>;
  feature_mode: FeatureMode;
  hydrological_feature_lineage: string;
  model_version: string;
  data_version: string;
  threshold_version_reference: string;
  is_variant_a: boolean;
}

export interface ForecastResult {
  catchment_id: string;
  catchment_name: string;
  forecast_origin: string; // ISO timestamp
  operating_mode: FeatureMode;
  is_historical_replay: boolean;
  forecast_horizons_days: [number, number, number];
  predicted_discharge_mm_day: [number, number, number];
  high_flow_probability: [number, number, number];
  high_flow_threshold_mm_day: number; // Q95 threshold
  classifier_decision_threshold: number; // tau, default 0.50
  extreme_flow_available: false; // explicitly false per current model inventory
  prediction_intervals_available: false; // explicitly false per current model inventory
  data_quality: DataQualityReport;
  model_metadata: ModelMetadata;
  hydrograph_history: HydrographPoint[];
  limitations_statement: string;
}

export interface CatchmentGeoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    catchment_id: string;
    name: string;
    huc2_region: string;
    drainage_area_km2: number;
    elevation_mean_m: number;
    aridity_index: number;
    soil_depth_pelletier_m: number;
    q95_threshold_mm_day: number;
    split_role: "training_calibration" | "temporal_holdout" | "unseen_catchment_holdout" | "unseen_snowmelt_holdout";
    benchmark_dataset: string;
    forecast_status: "enabled_pilot" | "generalization_eval" | "pending_integration";
    gauged_record_length_years: number;
  };
}

