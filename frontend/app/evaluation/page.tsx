"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import KatexEquation from "@/components/ui/KatexEquation";
import {
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sliders,
  Filter,
  Info,
} from "lucide-react";
import { fetchMetrics } from "@/lib/api";
import { MetricsResponse, RegressionBenchmark, ClassificationBenchmark } from "@/lib/types";

export default function EvaluationPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Regression Filter State
  const [regFilterPartition, setRegFilterPartition] = useState<string>("all");
  const [regFilterMode, setRegFilterMode] = useState<string>("all");

  // Classification Regime Selectors (Strictly isolated to prevent mixing regimes)
  const [clfHorizon, setClfHorizon] = useState<number>(1);
  const [clfPartition, setClfPartition] = useState<string>("Temporal_Val_Test_A");
  const [clfMode, setClfMode] = useState<string>("Gauged");

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoading(true);
    setError(null);
    const res = await fetchMetrics();
    if (res.success && res.data) {
      setMetrics(res.data);
    } else {
      setError(
        res.error ||
          "Failed to fetch offline benchmarks from GET /metrics. Ensure the FastAPI backend server is running."
      );
    }
    setIsLoading(false);
  };

  // Find matching classification record for current regime
  const activeClassificationBenchmark = metrics?.classification_benchmarks.find((b) => {
    if (b.horizon_days !== clfHorizon) return false;
    if (b.partition !== clfPartition) return false;

    // Harmonize mode naming: Test B uses Gauged_Transfer / Ungauged_PUB
    if (clfPartition === "Geographic_Val_Test_B") {
      if (clfMode === "Gauged") {
        return b.feature_mode === "Gauged_Transfer" || b.feature_mode === "Gauged";
      } else {
        return b.feature_mode === "Ungauged_PUB" || b.feature_mode === "Ungauged";
      }
    } else {
      if (clfMode === "Gauged") {
        return b.feature_mode === "Gauged";
      } else {
        return b.feature_mode === "Ungauged";
      }
    }
  });

  // Filter regression benchmarks dynamically
  const filteredRegressionBenchmarks = (metrics?.regression_benchmarks || []).filter((r) => {
    if (regFilterPartition !== "all" && r.partition !== regFilterPartition) return false;
    if (regFilterMode === "gauged") {
      if (!r.feature_mode.toLowerCase().includes("gauged") || r.feature_mode.toLowerCase().includes("ungauged")) {
        return false;
      }
    } else if (regFilterMode === "ungauged") {
      if (!r.feature_mode.toLowerCase().includes("ungauged")) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-3 font-mono">
                Empirical Validation Benchmarks
              </div>
              <h1 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight font-sans">
                Model Evaluation & Generalization
              </h1>
              <p className="mt-6 text-base sm:text-lg text-white/80 max-w-3xl leading-relaxed font-normal">
                Rigorous evaluation across continuous hydrographs, rare high-flow crests, chronological splits, and
                geographically withheld catchments to prevent data leakage and spatial overfitting.
              </p>
            </div>

            <div className="text-xs p-3 glass-card flex items-center gap-2 text-white/80 shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  metrics ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span>Benchmark Feed:</span>
              <strong className={metrics ? "text-emerald-400" : "text-amber-400 font-mono"}>
                {metrics ? "GET /metrics Active" : "Connecting..."}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* 1. Scientific Metrics Formulas (Dimensionless & Absolute Errors) */}
        <section className="space-y-6">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-normal text-white mb-3 font-sans">
              Standard Hydrological Evaluation Metrics
            </h2>
            <p className="text-base text-white/70 leading-relaxed font-normal">
              Standard statistical errors are evaluated alongside dimensionless efficiency formulations: Nash-Sutcliffe
              Efficiency (NSE) and Kling-Gupta Efficiency (KGE), which decompose hydrograph correlation, variability, and
              volume bias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="glass-card p-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider font-semibold text-white/70">
                Nash-Sutcliffe Efficiency (NSE)
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Assesses predictive power relative to historical observed mean. NSE = 1 represents perfect prediction;
                NSE &gt; 0 indicates performance superior to the historical observed mean benchmark.
              </p>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-center">
                <KatexEquation
                  math="\text{NSE} = 1 - \frac{\sum_{t=1}^n \left( Q_{\text{pred}, t} - Q_{\text{obs}, t} \right)^2}{\sum_{t=1}^n \left( Q_{\text{obs}, t} - \overline{Q}_{\text{obs}} \right)^2}"
                  block
                />
              </div>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider font-semibold text-white/70">
                Kling-Gupta Efficiency (KGE)
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Decomposes performance into linear correlation (<KatexEquation math="r" />), relative variability error (<KatexEquation math="\alpha" />), and
                bias ratio (<KatexEquation math="\beta = \mu_{\text{pred}} / \mu_{\text{obs}}" />).
              </p>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-center">
                <KatexEquation
                  math="\text{KGE} = 1 - \sqrt{(r - 1)^2 + (\alpha - 1)^2 + (\beta - 1)^2}"
                  block
                />
              </div>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider font-semibold text-white/70">
                Mean Absolute Error (MAE)
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Linear average magnitude of error in millimeters per day (mm/d). Less sensitive to extreme crest outliers.
              </p>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-center">
                <KatexEquation
                  math="\text{MAE} = \frac{1}{n} \sum_{t=1}^n \left| Q_{\text{pred}, t} - Q_{\text{obs}, t} \right|"
                  block
                />
              </div>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider font-semibold text-white/70">
                Root Mean Squared Error (RMSE)
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                Quadratic scoring that heavily penalizes large errors during high-flow crests and peak runoff events.
              </p>
              <div className="bg-black/50 p-4 rounded-xl border border-white/10 flex justify-center">
                <KatexEquation
                  math="\text{RMSE} = \sqrt{\frac{1}{n} \sum_{t=1}^n \left( Q_{\text{pred}, t} - Q_{\text{obs}, t} \right)^2}"
                  block
                />
              </div>
            </div>
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-medium text-white">Fetching Offline Benchmarks from GET /metrics…</div>
            <p className="text-xs text-white/60">
              Querying FastAPI backend for audited regression and classification validation statistics.
            </p>
          </div>
        )}

        {/* Error State: Strictly no fake data fallback */}
        {!isLoading && error && (
          <div className="glass-card p-8 border border-red-500/30 bg-red-950/30 space-y-4">
            <div className="flex items-center gap-3 text-red-300">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <h3 className="text-sm font-medium uppercase font-mono">Backend Metrics Unavailable (GET /metrics Offline)</h3>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-mono">
              {error}
            </p>
            <div className="text-xs text-white/60 leading-relaxed">
              In accordance with project integrity constraints, fabricated or estimated benchmark numbers are strictly forbidden.
              To view genuine audited offline benchmark evaluation metrics, launch Member 1&apos;s FastAPI backend server:
              <div className="mt-2 p-3 bg-black/60 rounded border border-white/10 font-mono text-[11px] text-emerald-400">
                python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={loadMetrics}
                className="glass-pill text-xs py-2 px-5 hover:bg-white/10 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Measured Benchmark Performance Table (Live Backend Population) */}
        {!isLoading && metrics && (
          <section className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white font-sans">
                    Observed Pilot Benchmark Results (Audited Offline Evaluation)
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    GET /metrics
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
                  These records reflect audited offline validation across development temporal splits (Test A) and regional
                  holdout splits (Test B). Live predictions do not compute real-time accuracy because ground-truth streamflow is
                  unavailable at forecast issue time.
                </p>
              </div>

              <div className="text-xs font-mono text-white/60 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg shrink-0">
                Total Benchmarks: <strong>{metrics.regression_benchmarks.length}</strong>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex items-center gap-2 font-mono text-white/70">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter Records:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Partition filter */}
                <select
                  value={regFilterPartition}
                  onChange={(e) => setRegFilterPartition(e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-white/50"
                >
                  <option value="all" className="bg-black text-white">All Partitions</option>
                  <option value="Temporal_Val_Test_A" className="bg-black text-white">Temporal Holdout (Test A: 120 Basins)</option>
                  <option value="Geographic_Val_Test_B" className="bg-black text-white">Geographic Holdout (Test B: 30 Basins)</option>
                </select>

                {/* Mode filter */}
                <select
                  value={regFilterMode}
                  onChange={(e) => setRegFilterMode(e.target.value)}
                  className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1 text-white text-xs font-mono focus:outline-none focus:border-white/50"
                >
                  <option value="all" className="bg-black text-white">All Feature Modes</option>
                  <option value="gauged" className="bg-black text-white">Gauged Mode</option>
                  <option value="ungauged" className="bg-black text-white">Ungauged / PUB Mode</option>
                </select>
              </div>
            </div>

            {/* Dynamic Regression Benchmark Table */}
            <div className="overflow-x-auto border border-white/10 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-white/60 border-b border-white/10 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Horizon</th>
                    <th className="p-3">Model Architecture</th>
                    <th className="p-3">Feature Mode</th>
                    <th className="p-3">Validation Partition</th>
                    <th className="p-3 text-right">Median NSE</th>
                    <th className="p-3 text-right">Median KGE</th>
                    <th className="p-3 text-right">MAE (mm/d)</th>
                    <th className="p-3 text-right">RMSE (mm/d)</th>
                    <th className="p-3 text-right">High-Flow RMSE</th>
                    <th className="p-3 text-right">Valid Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[11px]">
                  {filteredRegressionBenchmarks.map((r, idx) => {
                    const isTestB = r.partition.includes("Test_B");
                    const hasMedianNse = typeof r.median_nse === "number";
                    const isPositiveNse = hasMedianNse && (r.median_nse as number) > 0;
                    const isHighPerformance = hasMedianNse && (r.median_nse as number) >= 0.50;
                    const hasMedianKge = typeof r.median_kge === "number";
                    const hasHighFlowRmse = typeof r.high_flow_rmse === "number";

                    return (
                      <tr
                        key={`${r.horizon_days}-${r.model_name}-${r.feature_mode}-${r.partition}-${idx}`}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          isTestB ? "bg-amber-950/[0.08]" : ""
                        }`}
                      >
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          +{r.horizon_days}d ({r.horizon_days * 24}h)
                        </td>
                        <td className="p-3 text-white font-sans whitespace-nowrap">
                          {r.model_name.replace(/_/g, " ")}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              r.feature_mode.toLowerCase().includes("ungauged")
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {r.feature_mode}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap font-sans text-white/70">
                          {r.partition === "Temporal_Val_Test_A"
                            ? "Temporal Holdout (Test A)"
                            : "Geographic Holdout (Test B)"}
                        </td>
                        <td
                          className={`p-3 text-right font-semibold ${
                            isHighPerformance
                              ? "text-emerald-400"
                              : isPositiveNse
                              ? "text-sky-300"
                              : "text-red-400"
                          }`}
                        >
                          {hasMedianNse ? (r.median_nse as number).toFixed(3) : "-"}
                        </td>
                        <td
                          className={`p-3 text-right font-semibold ${
                            hasMedianKge && (r.median_kge as number) > 0.5
                              ? "text-emerald-400"
                              : hasMedianKge && (r.median_kge as number) > 0
                              ? "text-sky-300"
                              : "text-amber-400"
                          }`}
                        >
                          {hasMedianKge ? (r.median_kge as number).toFixed(3) : "-"}
                        </td>
                        <td className="p-3 text-right">{r.mae.toFixed(3)}</td>
                        <td className="p-3 text-right">{r.rmse.toFixed(3)}</td>
                        <td className="p-3 text-right text-white/60">
                          {hasHighFlowRmse ? (r.high_flow_rmse as number).toFixed(2) : "-"}
                        </td>
                        <td className="p-3 text-right text-white/50">
                          {r.n_valid_samples.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRegressionBenchmarks.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-white/50 font-sans">
                        No benchmark evaluation records match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Offline Generalization Notice */}
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white/70 leading-relaxed font-sans space-y-1">
              <div className="font-medium text-white flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                <span>Audited Validation Protocol</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                {metrics.disclaimer}
              </p>
            </div>
          </section>
        )}

        {/* 3. High-Flow Classification (Strictly Isolated by Regime) */}
        {!isLoading && metrics && (
          <section className="glass-card p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-white font-sans">
                    High-Flow (Q95 Exceedance) Classification Benchmarks
                  </h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    Audited Offline Metrics
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 max-w-2xl font-sans leading-relaxed">
                  Detection performance for rare top-5% crest events across operational decision thresholds (&tau;*).
                  Metrics are partitioned strictly by evaluation regime to avoid blending temporal holdout and geographic holdout distributions.
                </p>
              </div>

              {activeClassificationBenchmark && (
                <div className="text-xs font-mono text-white/70 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg shrink-0">
                  Optimal &tau;*: <strong className="text-emerald-400">{activeClassificationBenchmark.training_optimal_threshold.toFixed(2)}</strong>
                </div>
              )}
            </div>

            {/* Strict Regime Selection Controls */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-white/70 uppercase font-mono tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Select Evaluation Regime (Isolated)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* 1. Partition */}
                <div>
                  <label className="block text-white/60 text-[11px] mb-1 font-mono">
                    Validation Partition:
                  </label>
                  <select
                    value={clfPartition}
                    onChange={(e) => setClfPartition(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-white/50"
                  >
                    <option value="Temporal_Val_Test_A" className="bg-black text-white">
                      Temporal Holdout (Test A: 120 Basins)
                    </option>
                    <option value="Geographic_Val_Test_B" className="bg-black text-white">
                      Geographic Holdout (Test B: 30 Basins)
                    </option>
                  </select>
                </div>

                {/* 2. Feature Mode */}
                <div>
                  <label className="block text-white/60 text-[11px] mb-1 font-mono">
                    Hydrological Feature Mode:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setClfMode("Gauged")}
                      className={`py-1.5 px-3 rounded-lg text-center border text-xs font-medium transition-colors font-mono ${
                        clfMode === "Gauged"
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Gauged
                    </button>
                    <button
                      type="button"
                      onClick={() => setClfMode("Ungauged")}
                      className={`py-1.5 px-3 rounded-lg text-center border text-xs font-medium transition-colors font-mono ${
                        clfMode === "Ungauged"
                          ? "bg-white text-black border-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Ungauged / PUB
                    </button>
                  </div>
                </div>

                {/* 3. Horizon */}
                <div>
                  <label className="block text-white/60 text-[11px] mb-1 font-mono">
                    Forecast Horizon:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 3, 7].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setClfHorizon(h)}
                        className={`py-1.5 px-2 rounded-lg text-center border text-xs font-medium transition-colors font-mono ${
                          clfHorizon === h
                            ? "bg-white text-black border-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        +{h}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {activeClassificationBenchmark && (
                <div className="text-[11px] text-white/50 font-mono pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
                  <span>
                    Model Artifact: <strong className="text-white/80">{activeClassificationBenchmark.model_artifact}</strong>
                  </span>
                  <span>
                    Evaluated: <strong className="text-white/80">{activeClassificationBenchmark.n_valid_samples.toLocaleString()}</strong> samples •{" "}
                    Positives: <strong className="text-white/80">{activeClassificationBenchmark.n_positive_events.toLocaleString()}</strong> (
                    {(activeClassificationBenchmark.event_prevalence * 100).toFixed(2)}% prevalence)
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Metric Cards at Optimal Threshold */}
            {activeClassificationBenchmark ? (
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-white/60 mb-3 flex items-center justify-between">
                    <span>Performance at Calibrated Decision Cutoff (&tau;* = {activeClassificationBenchmark.training_optimal_threshold.toFixed(2)})</span>
                    <span className="text-emerald-400 font-semibold">Active Regime</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                      <div className="text-white/60 text-[11px]">Precision (PPV)</div>
                      <div className="text-2xl font-normal text-white">
                        {(activeClassificationBenchmark.precision_at_optimal_tau * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-white/40 pt-1">At &tau;* = {activeClassificationBenchmark.training_optimal_threshold.toFixed(2)}</div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                      <div className="text-white/60 text-[11px]">Recall (Sensitivity)</div>
                      <div className="text-2xl font-normal text-white">
                        {(activeClassificationBenchmark.recall_at_optimal_tau * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-white/40 pt-1">At &tau;* = {activeClassificationBenchmark.training_optimal_threshold.toFixed(2)}</div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                      <div className="text-white/60 text-[11px]">F1 Score</div>
                      <div className="text-2xl font-normal text-amber-400">
                        {activeClassificationBenchmark.f1_at_optimal_tau.toFixed(3)}
                      </div>
                      <div className="text-[10px] text-white/40 pt-1">Harmonic mean</div>
                    </div>

                    <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1">
                      <div className="text-white/60 text-[11px]">AUPRC (PR-AUC)</div>
                      <div className="text-2xl font-normal text-sky-400">
                        {activeClassificationBenchmark.pr_auc.toFixed(3)}
                      </div>
                      <div className="text-[10px] text-white/40 pt-1">Precision-Recall AUC</div>
                    </div>
                  </div>
                </div>

                {/* Additional Discrimination & Skill Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center justify-between">
                    <span className="text-white/60">ROC-AUC:</span>
                    <strong className="text-white">{activeClassificationBenchmark.roc_auc.toFixed(4)}</strong>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center justify-between">
                    <span className="text-white/60">Brier Score:</span>
                    <strong className="text-white">{activeClassificationBenchmark.brier_score.toFixed(4)}</strong>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg flex items-center justify-between sm:col-span-1 col-span-2">
                    <span className="text-white/60">Brier Skill Score (BSS):</span>
                    <strong className="text-emerald-400">
                      {activeClassificationBenchmark.brier_skill_score_operational.toFixed(4)}
                    </strong>
                  </div>
                </div>

                {/* Threshold Comparison Table (&tau;* vs 0.50 where available) */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                    Decision Threshold Comparison (&tau;* vs Default 0.50 Cutoff)
                  </div>

                  <div className="overflow-x-auto border border-white/10 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-white/5 text-white/60 border-b border-white/10 text-[11px]">
                        <tr>
                          <th className="p-3">Decision Threshold</th>
                          <th className="p-3">Cutoff Value (&tau;)</th>
                          <th className="p-3 text-right">Precision (PPV)</th>
                          <th className="p-3 text-right">Recall (Sensitivity)</th>
                          <th className="p-3 text-right">F1 Score</th>
                          <th className="p-3">Operational Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80 text-[11px]">
                        {/* Training-optimal row */}
                        <tr className="bg-emerald-950/20">
                          <td className="p-3 font-semibold text-emerald-300">
                            Training-Optimal (&tau;*)
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {activeClassificationBenchmark.training_optimal_threshold.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-semibold text-white">
                            {(activeClassificationBenchmark.precision_at_optimal_tau * 100).toFixed(1)}%
                          </td>
                          <td className="p-3 text-right font-semibold text-white">
                            {(activeClassificationBenchmark.recall_at_optimal_tau * 100).toFixed(1)}%
                          </td>
                          <td className="p-3 text-right font-semibold text-amber-300">
                            {activeClassificationBenchmark.f1_at_optimal_tau.toFixed(3)}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                              Calibrated Operational Cutoff
                            </span>
                          </td>
                        </tr>

                        {/* Default 0.50 row: Rendered only if returned by backend, else honest uncomputed note */}
                        <tr>
                          <td className="p-3 text-white/70">
                            Default Heuristic Cutoff
                          </td>
                          <td className="p-3 text-white/60">
                            0.50
                          </td>
                          {activeClassificationBenchmark.precision_at_default_05 !== undefined &&
                          activeClassificationBenchmark.precision_at_default_05 !== null ? (
                            <>
                              <td className="p-3 text-right">
                                {(activeClassificationBenchmark.precision_at_default_05 * 100).toFixed(1)}%
                              </td>
                              <td className="p-3 text-right">
                                {(Number(activeClassificationBenchmark.recall_at_default_05) * 100).toFixed(1)}%
                              </td>
                              <td className="p-3 text-right">
                                {Number(activeClassificationBenchmark.f1_at_default_05).toFixed(3)}
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] bg-white/10 text-white/60 px-2 py-0.5 rounded">
                                  Evaluated in Backend
                                </span>
                              </td>
                            </>
                          ) : (
                            <td colSpan={4} className="p-3 text-white/40 italic font-sans">
                              (Default 0.50 cutoff metrics omitted in backend GET /metrics schema; pipeline enforces audited optimal cutoff &tau;* = {activeClassificationBenchmark.training_optimal_threshold.toFixed(2)})
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-white/50 text-xs font-sans">
                No classification benchmark found matching the selected regime ({clfHorizon}d, {clfMode}, {clfPartition}).
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
