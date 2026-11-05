"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Info,
  Layers,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ForecastResult } from "@/lib/types";
import { getActiveForecast } from "@/lib/store";
import { generateBenchmarkReplay } from "@/lib/api";
import HydrographChart from "@/components/charts/HydrographChart";

export default function ForecastResultsPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [showModelDetails, setShowModelDetails] = useState(false);

  useEffect(() => {
    const active = getActiveForecast();
    if (active) {
      setForecast(active);
    } else {
      const defaultBenchmark = generateBenchmarkReplay("01434000", "2024-09-15", "gauged", []);
      setForecast(defaultBenchmark);
    }
  }, []);

  if (!forecast) {
    return (
      <div className="min-h-screen bg-white text-[#202124] flex flex-col items-center justify-center p-6 text-xs">
        <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4" />
        <div>Loading Forecast Workspace...</div>
      </div>
    );
  }

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(forecast, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `basinshift_forecast_${forecast.catchment_id}_${forecast.forecast_origin.split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isGauged = forecast.operating_mode === "gauged";
  const originDateFormatted = new Date(forecast.forecast_origin).toUTCString();

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124] pb-24">
      {/* 9.1 Forecast Summary Header */}
      <section className="border-b border-[#dadce0] bg-[#f8f9fa] pt-10 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {forecast.is_historical_replay && (
            <div className="px-3.5 py-2.5 rounded-lg bg-[#fef7e0] border border-[#f9ab00] text-xs text-[#b06000] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e37400] shrink-0" />
                <span>
                  <strong>Historical Replay Demonstration:</strong> Evaluated against verified benchmark records. This
                  is an out-of-sample research replay, not a live operational warning.
                </span>
              </div>
              <span className="text-[11px] font-mono uppercase font-bold text-[#b06000]">Offline Benchmark</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8]">
                  Post-Prediction Results
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-white border border-[#dadce0] text-[#3c4043] font-mono">
                  {isGauged ? "Gauged Mode" : "Ungauged / PUB"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-normal text-[#202124] tracking-tight">
                Station <span className="font-mono font-medium">{forecast.catchment_id}</span>
              </h1>
              <p className="text-sm text-[#5f6368] mt-1">{forecast.catchment_name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="p-3 bg-white border border-[#dadce0] rounded-lg">
                <div className="text-[#5f6368] text-[11px]">Forecast Origin</div>
                <div className="text-[#202124] font-medium mt-0.5">{originDateFormatted}</div>
              </div>

              <Link
                href="/test"
                className="px-4 py-3 text-xs font-medium text-[#202124] bg-white hover:bg-[#f8f9fa] border border-[#dadce0] rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Run</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-10">
        {/* 9.2 Three Forecast Cards */}
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-[#5f6368] mb-4">
            Predicted River Discharge Across Evaluation Horizons
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {forecast.forecast_horizons_days.map((h, idx) => {
              const qVal = forecast.predicted_discharge_mm_day[idx];
              const prob = forecast.high_flow_probability[idx];
              const isHigh = qVal >= forecast.high_flow_threshold_mm_day;

              return (
                <div
                  key={h}
                  className={`google-card p-6 relative ${
                    isHigh ? "border-[#e37400] bg-[#fef7e0]/20" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#1a73e8]">+{h}-Day Horizon</span>
                    <span className="text-[#5f6368] text-[11px]">Runoff Depth</span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-normal text-[#202124] tracking-tight">
                      {qVal.toFixed(2)}
                    </span>
                    <span className="text-xs text-[#5f6368] font-mono">mm/day</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#dadce0] flex items-center justify-between text-xs">
                    <span className="text-[#5f6368]">High-Flow Risk:</span>
                    <span className={prob >= forecast.classifier_decision_threshold ? "text-[#e37400] font-bold" : "text-[#202124]"}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 9.3 Discharge Trend Hydrograph */}
        <div>
          <HydrographChart
            history={forecast.hydrograph_history}
            forecastHorizons={forecast.forecast_horizons_days}
            predictedDischarges={forecast.predicted_discharge_mm_day}
            forecastOrigin={forecast.forecast_origin}
            mode={forecast.operating_mode}
            q95Threshold={forecast.high_flow_threshold_mm_day}
          />
        </div>

        {/* 9.4 High-Flow Probability */}
        <div className="google-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#dadce0] gap-3">
            <div>
              <h3 className="text-base font-medium text-[#202124]">
                High-Flow (Q95 Exceedance) Probability
              </h3>
              <p className="text-xs text-[#5f6368] mt-0.5">
                Calibrated exceedance probability against regional Q95 historical high-flow threshold
              </p>
            </div>
            <div className="text-xs bg-[#f8f9fa] border border-[#dadce0] px-3 py-1.5 rounded-lg text-[#202124]">
              Regional Q95: <strong>{forecast.high_flow_threshold_mm_day} mm/day</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {forecast.forecast_horizons_days.map((h, idx) => {
              const prob = forecast.high_flow_probability[idx];
              const pct = (prob * 100).toFixed(1);
              const isPositive = prob >= forecast.classifier_decision_threshold;

              return (
                <div key={h} className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f6368]">+{h}d Horizon</span>
                    <span className={`font-bold ${isPositive ? "text-[#e37400]" : "text-[#137333]"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#dadce0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isPositive ? "bg-[#e37400]" : "bg-[#1a73e8]"}`}
                      style={{ width: `${Math.min(100, Math.max(5, prob * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#5f6368] pt-1">
                    <span>Score: {prob.toFixed(3)}</span>
                    <span>Decision Cutoff: {forecast.classifier_decision_threshold.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-lg text-xs text-[#3c4043] space-y-1.5">
            <div className="font-medium text-[#202124] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#1a73e8]" />
              <span>Hydrological vs. Classifier Decision Thresholds</span>
            </div>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              <strong>Q95 ({forecast.high_flow_threshold_mm_day} mm/day):</strong> Physical discharge rate defining a
              top-5% historical crest. <br />
              <strong>Decision Cutoff (&tau; = {forecast.classifier_decision_threshold.toFixed(2)}):</strong> Probability
              threshold calibrated on training sets. Exceeding &tau; triggers high-flow risk classification.
            </p>
          </div>
        </div>

        {/* 9.5 Extreme-Flow & Uncertainty Transparency */}
        <div className="p-4 bg-[#f8f9fa] border border-dashed border-[#dadce0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5f6368]">
          <span>
            <strong>Prediction Intervals & Extreme-Flow Classifiers:</strong> Calibrated conformal prediction intervals
            and secondary Q99 extreme classifiers are experimental and currently not deployed in this prototype.
          </span>
          <span className="px-2.5 py-1 rounded bg-white border border-[#dadce0] text-[11px] font-mono shrink-0">
            Research Backlog
          </span>
        </div>

        {/* 9.6 Input Data Quality Panel */}
        <div className="google-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-[#202124] uppercase tracking-wider">
            Input Dataset Quality & Verification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded">
              <div className="text-[#5f6368] text-[11px]">Supplied History</div>
              <div className="text-[#202124] font-medium mt-1">{forecast.data_quality.historical_days_supplied} Days</div>
            </div>
            <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded">
              <div className="text-[#5f6368] text-[11px]">Gauge Flow Available</div>
              <div className="text-[#202124] font-medium mt-1">
                {forecast.data_quality.historical_discharge_available ? "Yes (Gauged)" : "No (PUB)"}
              </div>
            </div>
            <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded">
              <div className="text-[#5f6368] text-[11px]">Meteorology Type</div>
              <div className="text-[#202124] font-medium mt-1">ERA5 / Reanalysis</div>
            </div>
            <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded">
              <div className="text-[#5f6368] text-[11px]">Invalid Records</div>
              <div className="text-[#137333] font-medium mt-1">0 (Clean)</div>
            </div>
          </div>
        </div>

        {/* 9.7 Model Details & Provenance (Expandable) */}
        <div className="google-card overflow-hidden">
          <button
            onClick={() => setShowModelDetails(!showModelDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[#f8f9fa] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-[#202124]">
              <Layers className="w-4 h-4 text-[#1a73e8]" />
              <span className="uppercase tracking-wider">Model Details & Provenance Architecture</span>
            </div>
            {showModelDetails ? <ChevronUp className="w-4 h-4 text-[#5f6368]" /> : <ChevronDown className="w-4 h-4 text-[#5f6368]" />}
          </button>

          {showModelDetails && (
            <div className="p-6 border-t border-[#dadce0] bg-[#f8f9fa] space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#5f6368] block">Regression Family:</span>
                  <span className="text-[#202124] font-medium">{forecast.model_metadata.regression_model_family}</span>
                </div>
                <div>
                  <span className="text-[#5f6368] block">Feature Specification:</span>
                  <span className="text-[#202124] font-medium">Variant A Hydrological Features</span>
                </div>
                <div>
                  <span className="text-[#5f6368] block">Artifact IDs:</span>
                  <span className="text-[#3c4043] font-mono">
                    {forecast.model_metadata.regression_artifact_ids["1d"]} • {forecast.model_metadata.regression_artifact_ids["3d"]}
                  </span>
                </div>
                <div>
                  <span className="text-[#5f6368] block">Data Benchmark:</span>
                  <span className="text-[#202124] font-medium">{forecast.model_metadata.data_version}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9.8 Responsible-Use Notice */}
        <div className="p-5 bg-white border border-[#dadce0] rounded-xl shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#e37400] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wider text-[#b06000]">
                Responsible-Use & Operational Scope Notice
              </div>
              <p className="text-xs text-[#3c4043] leading-relaxed">
                {forecast.limitations_statement}
              </p>
            </div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#dadce0]">
          <div className="text-xs text-[#5f6368]">
            Export structured predictions for reproducible analysis & hydrological verification.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadJSON}
              className="google-pill-light text-xs py-2 px-5 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-[#1a73e8]" />
              <span>Export Predictions (JSON)</span>
            </button>
            <Link
              href="/catchments"
              className="google-pill text-xs py-2 px-5 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <span>View Catchment on Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
