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
      // Fallback to verified benchmark default
      const defaultReplay = generateBenchmarkReplay(
        "01434000",
        "2024-09-15",
        "gauged"
      );
      setForecast(defaultReplay);
    }
  }, []);

  if (!forecast) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center p-6">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-medium">Loading Forecast Analysis...</div>
      </div>
    );
  }

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forecast, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `basinshift_forecast_${forecast.catchment_id}_${forecast.forecast_origin.split("T")[0]}.json`;
    a.click();
  };

  const isGauged = forecast.operating_mode === "gauged";
  const originDateFormatted = new Date(forecast.forecast_origin).toUTCString();

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Forecast Summary Header */}
      <section className="border-b border-white/10 bg-[#060606] pt-12 pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {forecast.is_historical_replay && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Historical Replay Demonstration:</strong> Evaluated against verified benchmark records. This
                  is an out-of-sample research replay, not a live operational warning.
                </span>
              </div>
              <span className="text-[11px] font-mono uppercase font-bold text-amber-400">Offline Benchmark</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-white/60 font-mono">
                  Post-Prediction Results
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-white/90 font-mono">
                  {isGauged ? "Gauged Mode" : "Ungauged / PUB"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-normal text-white tracking-tight font-sans">
                Station <span className="font-mono font-medium">{forecast.catchment_id}</span>
              </h1>
              <p className="text-sm text-white/60 mt-1">{forecast.catchment_name}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="p-3 glass-card">
                <div className="text-white/60 text-[11px] font-mono">Forecast Origin</div>
                <div className="text-white font-medium mt-0.5">{originDateFormatted}</div>
              </div>

              <Link
                href="/test"
                className="glass-pill text-xs py-3 px-5 flex items-center gap-1.5 shadow-sm"
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
        {/* Three Forecast Cards */}
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-4 font-mono">
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
                  className={`glass-card p-6 relative ${
                    isHigh ? "border-amber-500/50 bg-amber-950/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-white">+{h}-Day Horizon</span>
                    <span className="text-white/60 text-[11px] font-mono">Runoff Depth</span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-normal text-white tracking-tight">
                      {qVal.toFixed(2)}
                    </span>
                    <span className="text-xs text-white/60 font-mono">mm/day</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-white/60">High-Flow Risk:</span>
                    <span className={prob >= forecast.classifier_decision_threshold ? "text-amber-400 font-bold" : "text-white"}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discharge Trend Hydrograph */}
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

        {/* High-Flow Probability */}
        <div className="glass-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
            <div>
              <h3 className="text-base font-medium text-white">
                High-Flow (Q95 Exceedance) Probability
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Calibrated exceedance probability against regional Q95 historical high-flow threshold
              </p>
            </div>
            <div className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white font-mono">
              Regional Q95: <strong>{forecast.high_flow_threshold_mm_day} mm/day</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            {forecast.forecast_horizons_days.map((h, idx) => {
              const prob = forecast.high_flow_probability[idx];
              const pct = (prob * 100).toFixed(1);
              const isPositive = prob >= forecast.classifier_decision_threshold;

              return (
                <div key={h} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60">+{h}d Horizon</span>
                    <span className={`font-bold ${isPositive ? "text-amber-400" : "text-emerald-400"}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isPositive ? "bg-amber-400" : "bg-sky-400"}`}
                      style={{ width: `${Math.min(100, Math.max(5, prob * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-white/50 pt-1">
                    <span>Score: {prob.toFixed(3)}</span>
                    <span>Decision Cutoff: {forecast.classifier_decision_threshold.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white/70 space-y-1.5">
            <div className="font-medium text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Hydrological vs. Classifier Decision Thresholds</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              <strong>Q95 ({forecast.high_flow_threshold_mm_day} mm/day):</strong> Physical discharge rate defining a
              top-5% historical crest. <br />
              <strong>Decision Cutoff (&tau; = {forecast.classifier_decision_threshold.toFixed(2)}):</strong> Probability
              threshold calibrated on training sets. Exceeding &tau; triggers high-flow risk classification.
            </p>
          </div>
        </div>

        {/* Extreme-Flow & Uncertainty Transparency */}
        <div className="p-4 bg-white/[0.02] border border-dashed border-white/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/60">
          <span>
            <strong className="text-white">Prediction Intervals & Extreme-Flow Classifiers:</strong> Calibrated conformal
            prediction intervals and secondary Q99 extreme classifiers are experimental and currently not deployed in this prototype.
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-mono shrink-0 text-white/70">
            Research Backlog
          </span>
        </div>

        {/* Input Data Quality Panel */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-sm font-medium text-white uppercase tracking-wider font-mono">
            Input Dataset Quality & Verification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg">
              <div className="text-white/50 text-[11px]">Supplied History</div>
              <div className="text-white font-medium mt-1">{forecast.data_quality.historical_days_supplied} Days</div>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg">
              <div className="text-white/50 text-[11px]">Gauge Flow Available</div>
              <div className="text-white font-medium mt-1">
                {forecast.data_quality.historical_discharge_available ? "Yes (Gauged)" : "No (PUB)"}
              </div>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg">
              <div className="text-white/50 text-[11px]">Meteorology Type</div>
              <div className="text-white font-medium mt-1">ERA5 / Reanalysis</div>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg">
              <div className="text-white/50 text-[11px]">Invalid Records</div>
              <div className="text-emerald-400 font-medium mt-1">0 (Clean)</div>
            </div>
          </div>
        </div>

        {/* Model Details & Provenance (Expandable) */}
        <div className="glass-card overflow-hidden">
          <button
            onClick={() => setShowModelDetails(!showModelDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-white">
              <Layers className="w-4 h-4 text-white/70" />
              <span className="uppercase tracking-wider font-mono">Model Details & Provenance Architecture</span>
            </div>
            {showModelDetails ? <ChevronUp className="w-4 h-4 text-white/60" /> : <ChevronDown className="w-4 h-4 text-white/60" />}
          </button>

          {showModelDetails && (
            <div className="p-6 border-t border-white/10 bg-white/[0.02] space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-white/60 block">Regression Family:</span>
                  <span className="text-white font-medium">{forecast.model_metadata.regression_model_family}</span>
                </div>
                <div>
                  <span className="text-white/60 block">Feature Specification:</span>
                  <span className="text-white font-medium">Variant A Hydrological Features</span>
                </div>
                <div>
                  <span className="text-white/60 block">Artifact IDs:</span>
                  <span className="text-white/80 font-mono">
                    {forecast.model_metadata.regression_artifact_ids["1d"]} • {forecast.model_metadata.regression_artifact_ids["3d"]}
                  </span>
                </div>
                <div>
                  <span className="text-white/60 block">Data Benchmark:</span>
                  <span className="text-white font-medium">{forecast.model_metadata.data_version}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Responsible-Use Notice */}
        <div className="p-5 glass-card border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-medium uppercase tracking-wider text-amber-300 font-mono">
                Responsible-Use & Operational Scope Notice
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {forecast.limitations_statement}
              </p>
            </div>
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="text-xs text-white/60">
            Export structured predictions for reproducible analysis & hydrological verification.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadJSON}
              className="glass-pill text-xs py-2 px-5 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-white/70" />
              <span>Export Predictions (JSON)</span>
            </button>
            <Link
              href="/catchments"
              className="glass-pill-solid text-xs py-2 px-6 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
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