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
  regional_q95_threshold_mm_per_day?: number;
  source_collection?: string;
  hydrological_features?: string;
  probability_calibration?: string;
  regression_models?: Record<string, any>;
  classifier_models?: Record<string, any>;
  [key: string]: any;
}

export interface BackendPredictResponse {
  catchment_id: string;
  forecast_origin: string;
  feature_mode: string;
  forecast_horizons_days: number[];
  discharge_unit: string;
  predicted_discharge: Record<string, number>;
  high_flow_probability: Record<string, number> | null;
  high_flow_alert_threshold: Record<string, number> | null;
  high_flow_alert: Record<string, boolean> | null;
  extreme_flow_probability: any;
  prediction_intervals: any;
  uncertainty_available: boolean;
  model_metadata: Record<string, any>;
  forecast_basis: string;
  warnings: string[];
}

export interface ForecastResult {
  catchment_id: string;
  catchment_name: string;
  forecast_origin: string; // ISO timestamp
  operating_mode: FeatureMode;
  is_historical_replay: boolean;
  forecast_horizons_days: [number, number, number];

  // Authoritative Backend Actual Fields
  predicted_discharge: Record<string, number>;
  high_flow_probability: Record<string, number> | [number, number, number] | null;
  high_flow_alert_threshold: Record<string, number> | null;
  high_flow_alert: Record<string, boolean> | null;
  discharge_unit?: string;
  forecast_basis?: string;
  warnings?: string[];

  // Adapted helper properties for UI backwards-compatibility
  predicted_discharge_mm_day: [number, number, number];
  high_flow_threshold_mm_day: number; // Q95 threshold
  classifier_decision_threshold: number; // tau
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

export interface RegressionBenchmark {
  horizon_days: number;
  model_name: string;
  feature_mode: string;
  partition: string;
  n_valid_samples: number;
  rmse: number;
  mae: number;
  mean_nse?: number | null;
  median_nse?: number | null;
  mean_kge?: number | null;
  median_kge?: number | null;
  high_flow_rmse?: number | null;
}

export interface ClassificationBenchmark {
  horizon_days: number;
  feature_mode: string;
  partition: string;
  model_artifact: string;
  n_valid_samples: number;
  n_positive_events: number;
  event_prevalence: number;
  training_optimal_threshold: number;
  pr_auc: number;
  roc_auc: number;
  brier_score: number;
  brier_skill_score_operational: number;
  f1_at_optimal_tau: number;
  precision_at_optimal_tau: number;
  recall_at_optimal_tau: number;
  precision_at_default_05?: number | null;
  recall_at_default_05?: number | null;
  f1_at_default_05?: number | null;
}

export interface MetricsResponse {
  status: string;
  disclaimer: string;
  partitions: Record<string, string>;
  regression_benchmarks: RegressionBenchmark[];
  classification_benchmarks: ClassificationBenchmark[];
}

export interface MetricsResult {
  success: boolean;
  data?: MetricsResponse;
  error?: string;
  isBackendConnected: boolean;
}

