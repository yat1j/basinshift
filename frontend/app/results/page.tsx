"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Info,
  Layers,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Waves,
} from "lucide-react";
import { ForecastResult } from "@/lib/types";
import { getActiveForecast } from "@/lib/store";
import { generateBenchmarkReplay } from "@/lib/api";
import HydrographChart from "@/components/charts/HydrographChart";

export default function ForecastResultsPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const active = getActiveForecast();
    if (active) {
      setForecast(active);
    } else {
      // Default to benchmark pilot for immediate editorial viewing if user visits directly
      const defaultBenchmark = generateBenchmarkReplay(
        "01434000",
        "2024-09-15",
        "gauged",
        []
      );
      setForecast(defaultBenchmark);
    }
  }, []);

  if (!forecast) {
    return (
      <div className="min-h-screen bg-basin-darkest text-slate-200 flex flex-col items-center justify-center p-6 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-basin-cyan border-t-transparent rounded-full animate-spin mb-4" />
        <div>Loading Forecast Workspace...</div>
      </div>
    );
  }

  // Export predictions as JSON or CSV
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
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100 pb-20">
      {/* 9.1 FORECAST SUMMARY HEADER */}
      <section className="border-b border-basin-border/80 bg-basin-midnight pt-10 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Historical Replay Notice Banner */}
          {forecast.is_historical_replay && (
            <div className="px-3.5 py-2 rounded bg-amber-950/30 border border-amber-600/40 text-amber-300 font-mono text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Historical Replay Demonstration:</strong> Evaluated against verified benchmark records. This
                  is an out-of-sample research replay, not a live operational forecast feed.
                </span>
              </div>
              <span className="hidden sm:inline text-[10px] text-amber-400/80 uppercase tracking-wider">
                Offline Verified
              </span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="scientific-badge">Post-Prediction Results Workspace</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                    isGauged
                      ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
                      : "bg-amber-950/40 border-amber-500/40 text-amber-300"
                  }`}
                >
                  {isGauged ? "Gauged Mode" : "Ungauged / PUB Mode"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight font-sans">
                Station <span className="font-mono font-bold">{forecast.catchment_id}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">{forecast.catchment_name}</p>
            </div>

            {/* Quick Metadata Box */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="p-2.5 bg-basin-surface/70 border border-basin-border rounded">
                <div className="text-slate-400 text-[10px] uppercase">Forecast Origin</div>
                <div className="text-white font-semibold mt-0.5">{originDateFormatted}</div>
              </div>

              <div className="p-2.5 bg-basin-surface/70 border border-basin-border rounded">
                <div className="text-slate-400 text-[10px] uppercase">Data Quality Status</div>
                <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="capitalize">{forecast.data_quality.validation_status.replace("_", " ")}</span>
                </div>
              </div>

              <Link
                href="/test"
                className="px-3 py-2 text-xs font-mono text-slate-300 hover:text-white bg-basin-surface hover:bg-basin-card border border-basin-border rounded flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Run</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* 9.2 THREE FORECAST CARDS */}
        <div>
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
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
                  className={`editorial-card p-5 relative overflow-hidden border ${
                    isHigh ? "border-amber-500/60 bg-amber-950/10" : "border-basin-border"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-basin-surface border border-basin-border text-basin-cyanAccent font-bold">
                      +{h}-Day Horizon
                    </span>
                    <span className="text-slate-400 text-[11px]">Normalized Runoff</span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-tight">
                      {qVal.toFixed(2)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">mm/day</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-basin-border/50 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">High-Flow Prob:</span>
                    <span className={prob >= forecast.classifier_decision_threshold ? "text-amber-400 font-bold" : "text-slate-300"}>
                      {(prob * 100).toFixed(1)}% ({prob.toFixed(3)})
                    </span>
                  </div>

                  {isHigh && (
                    <div className="mt-2 text-[10px] font-mono text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Exceeds Regional Q95 Threshold</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9.3 DISCHARGE HYDROGRAPH / UNGAUGED VISUALIZATION */}
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

        {/* 9.4 HIGH-FLOW PROBABILITY & THRESHOLD EXPLANATION */}
        <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-basin-border/60 gap-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-sans flex items-center gap-2">
                <span>High-Flow Exceedance Probability</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-basin-surface text-amber-400 border border-amber-600/30">
                  Regional Q95 Calibration
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against the experimental training-derived Q95 discharge threshold
              </p>
            </div>
            <div className="text-xs font-mono text-slate-300 bg-basin-surface/80 px-3 py-1.5 rounded border border-basin-border">
              Q95 Threshold: <strong className="text-amber-400">{forecast.high_flow_threshold_mm_day} mm/day</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            {forecast.forecast_horizons_days.map((h, idx) => {
              const prob = forecast.high_flow_probability[idx];
              const pct = (prob * 100).toFixed(1);
              const isPositive = prob >= forecast.classifier_decision_threshold;

              return (
                <div key={h} className="p-4 bg-basin-surface/40 border border-basin-border/70 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">+{h}d Horizon</span>
                    <span className={`font-bold ${isPositive ? "text-amber-400" : "text-emerald-400"}`}>
                      {pct}%
                    </span>
                  </div>
                  {/* Visual Probability Bar */}
                  <div className="w-full h-2 bg-basin-darkest rounded-full overflow-hidden border border-basin-border/40">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isPositive ? "bg-amber-500" : "bg-basin-cyan"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(4, prob * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Raw Score: {prob.toFixed(3)}</span>
                    <span>Decision &tau;: {forecast.classifier_decision_threshold.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicit Threshold Distinction Notice */}
          <div className="p-4 bg-basin-surface/40 border border-basin-border/70 rounded text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 text-basin-cyan" />
              <span>Hydrological vs. Classifier Decision Thresholds</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              <strong className="text-slate-200">Q95 ({forecast.high_flow_threshold_mm_day} mm/day):</strong> The physical
              discharge rate defining a top-5% historical crest in this hydrological regime. <br />
              <strong className="text-slate-200">Classifier Decision Cutoff (&tau; = {forecast.classifier_decision_threshold.toFixed(2)}):</strong>{" "}
              The probability threshold calibrated on training validation sets (default 0.50). Any probability exceeding{" "}
              &tau; triggers a positive high-flow risk classification.
            </p>
          </div>
        </div>

        {/* 9.5 EXTREME-FLOW & UNCERTAINTY — HONEST TRANSPARENCY */}
        <div className="p-4 bg-basin-surface/20 border border-dashed border-slate-700 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Probabilistic Calibration & Prediction Intervals:</strong> Calibrated conformal prediction
              intervals and extreme-high-flow (Q99) classifiers are currently experimental and not deployed in this
              prototype.
            </span>
          </div>
          <span className="px-2 py-1 rounded bg-basin-darkest border border-basin-border text-[10px] text-slate-400 shrink-0">
            Status: Research Backlog
          </span>
        </div>

        {/* 9.6 INPUT DATA QUALITY PANEL */}
        <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Input Dataset Quality & Verification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
              <div className="text-slate-400 text-[10px] uppercase">Supplied History</div>
              <div className="text-white font-semibold mt-1">
                {forecast.data_quality.historical_days_supplied} Days
              </div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
              <div className="text-slate-400 text-[10px] uppercase">Historical Discharge</div>
              <div className="text-white font-semibold mt-1">
                {forecast.data_quality.historical_discharge_available ? "Available (Gauged)" : "Unavailable (PUB)"}
              </div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
              <div className="text-slate-400 text-[10px] uppercase">Meteorology Type</div>
              <div className="text-white font-semibold mt-1">
                {forecast.data_quality.future_meteo_supplied ? "NWP Forecast Feed" : "ERA5 / Reanalysis"}
              </div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
              <div className="text-slate-400 text-[10px] uppercase">Invalid Records</div>
              <div className="text-emerald-400 font-semibold mt-1">
                {forecast.data_quality.invalid_values_count} (0%)
              </div>
            </div>
          </div>
        </div>

        {/* 9.7 MODEL DETAILS AND PROVENANCE (EXPANDABLE) */}
        <div className="border border-basin-border rounded-lg bg-basin-midnight overflow-hidden">
          <button
            onClick={() => setShowModelDetails(!showModelDetails)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-basin-surface/30 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-white">
              <Layers className="w-4 h-4 text-basin-cyan" />
              <span className="font-semibold uppercase tracking-wider">
                Model Details & Provenance Architecture
              </span>
            </div>
            {showModelDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showModelDetails && (
            <div className="p-6 border-t border-basin-border/60 bg-basin-darkest space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-[11px] block">Regression Family:</span>
                  <span className="text-white font-semibold">{forecast.model_metadata.regression_model_family}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Feature Specification:</span>
                  <span className="text-white font-semibold">
                    {forecast.model_metadata.is_variant_a ? "Variant A Hydrological Features" : "Variant B"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Model Artifact ID (+1d / +3d / +7d):</span>
                  <span className="text-slate-300">
                    {forecast.model_metadata.regression_artifact_ids["1d"]} •{" "}
                    {forecast.model_metadata.regression_artifact_ids["3d"]} •{" "}
                    {forecast.model_metadata.regression_artifact_ids["7d"]}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Classifier Artifact ID:</span>
                  <span className="text-slate-300">
                    {forecast.model_metadata.classifier_artifact_ids?.["1d"] || "lgbm_clf_h1_varA_v1.0"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Training Benchmark Data:</span>
                  <span className="text-white font-semibold">{forecast.model_metadata.data_version}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Threshold Reference:</span>
                  <span className="text-white font-semibold">{forecast.model_metadata.threshold_version_reference}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-basin-border/50 text-[11px] text-slate-400">
                <strong className="text-slate-300">Lineage:</strong> {forecast.model_metadata.hydrological_feature_lineage}
              </div>
            </div>
          )}
        </div>

        {/* 9.8 EXACT RESPONSIBLE-USE STATEMENT */}
        <div className="p-5 bg-basin-midnight border border-basin-border/80 rounded-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                Responsible-Use & Operational Scope Notice
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {forecast.limitations_statement}
              </p>
            </div>
          </div>
        </div>

        {/* 9.9 DOWNLOAD & EXPORT CONTROLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-basin-border/60 font-mono text-xs">
          <div className="text-slate-400">
            Export structured predictions for reproducible analysis & hydrological verification.
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownloadJSON}
              className="w-full sm:w-auto px-4 py-2 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-basin-cyan" />
              <span>Export Predictions (JSON)</span>
            </button>
            <Link
              href="/catchments"
              className="w-full sm:w-auto px-4 py-2 bg-basin-teal hover:bg-basin-teal/90 text-white rounded border border-basin-cyan/40 flex items-center justify-center gap-2 transition-colors"
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
