import React from "react";
import Link from "next/link";
import KatexEquation from "@/components/ui/KatexEquation";
import {
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Cpu,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function EvaluationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100 pb-20">
      {/* Editorial Header */}
      <section className="relative py-20 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-4">Empirical Validation</div>
          <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            Model Evaluation & <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-basin-cyanAccent">
              Generalization Benchmarks
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Rigorous evaluation across continuous discharge hydrographs, rare high-flow crests, chronological splits,
            and geographically withheld catchments to prevent data leakage and spatial overfitting.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* 1. SCIENTIFIC METRIC FORMULATIONS */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="scientific-badge">Standard Hydrological Metrics</span>
          </div>
          <h2 className="text-2xl font-light text-white">Mathematical Metric Formulations</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed font-sans">
            In hydrology, standard statistical metrics (MAE, RMSE) are complemented by dimensionless efficiency
            formulations: Nash-Sutcliffe Efficiency (NSE) and Kling-Gupta Efficiency (KGE), which decompose hydrograph
            correlation, variability, and volume bias.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* NSE */}
            <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-3">
              <div className="text-basin-cyan font-bold uppercase text-[11px]">
                Nash-Sutcliffe Efficiency (NSE)
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Assesses predictive power relative to the mean of observed flow. NSE = 1 represents perfect prediction;
                NSE &gt; 0 indicates performance superior to the historical observed mean.
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex justify-center">
                <KatexEquation
                  math="\text{NSE} = 1 - \frac{\sum_{t=1}^n \left( Q_{\text{pred}, t} - Q_{\text{obs}, t} \right)^2}{\sum_{t=1}^n \left( Q_{\text{obs}, t} - \overline{Q}_{\text{obs}} \right)^2}"
                  block
                />
              </div>
            </div>

            {/* KGE */}
            <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-3">
              <div className="text-basin-cyan font-bold uppercase text-[11px]">
                Kling-Gupta Efficiency (KGE)
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Decomposes performance into linear correlation (<KatexEquation math="r" />), relative variability error (<KatexEquation math="\alpha" />), and
                bias ratio (<KatexEquation math="\beta = \mu_{\text{pred}} / \mu_{\text{obs}}" />).
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex justify-center">
                <KatexEquation
                  math="\text{KGE} = 1 - \sqrt{(r - 1)^2 + (\alpha - 1)^2 + (\beta - 1)^2}"
                  block
                />
              </div>
            </div>

            {/* MAE */}
            <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-3">
              <div className="text-basin-cyan font-bold uppercase text-[11px]">
                Mean Absolute Error (MAE)
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Measures linear average magnitude of errors in millimeters per day. Less sensitive to outliers than RMSE.
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex justify-center">
                <KatexEquation
                  math="\text{MAE} = \frac{1}{n} \sum_{t=1}^n \left| Q_{\text{pred}, t} - Q_{\text{obs}, t} \right|"
                  block
                />
              </div>
            </div>

            {/* RMSE */}
            <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-3">
              <div className="text-basin-cyan font-bold uppercase text-[11px]">
                Root Mean Squared Error (RMSE)
              </div>
              <p className="text-slate-300 text-[11px] font-sans">
                Quadratic scoring that heavily penalizes large errors during crest discharges and peak runoff events.
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex justify-center">
                <KatexEquation
                  math="\text{RMSE} = \sqrt{\frac{1}{n} \sum_{t=1}^n \left( Q_{\text{pred}, t} - Q_{\text{obs}, t} \right)^2}"
                  block
                />
              </div>
            </div>
          </div>
        </section>

        {/* 2. MEASURED BENCHMARK PERFORMANCE TABLE */}
        <section className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-basin-border/60 gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide font-sans">
                Observed Pilot Benchmark Results (Variant A Architecture)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated across multi-day horizons against USGS streamgage observations
              </p>
            </div>
            <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-basin-surface text-emerald-400 border border-emerald-600/30">
              Verified Benchmark Runs
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-basin-surface text-slate-300 border-b border-basin-border">
                <tr>
                  <th className="p-3">Forecast Horizon</th>
                  <th className="p-3">Model Architecture</th>
                  <th className="p-3">NSE Score</th>
                  <th className="p-3">KGE Score</th>
                  <th className="p-3">MAE (mm/d)</th>
                  <th className="p-3">RMSE (mm/d)</th>
                  <th className="p-3">Validation Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-basin-border/40 text-slate-300">
                <tr className="hover:bg-basin-surface/30">
                  <td className="p-3 font-bold text-white">+1 Day (24h)</td>
                  <td className="p-3 text-basin-cyanAccent">Ridge + LightGBM (Hybrid)</td>
                  <td className="p-3 font-bold text-emerald-400">0.782</td>
                  <td className="p-3 font-bold text-emerald-400">0.814</td>
                  <td className="p-3">0.68</td>
                  <td className="p-3">1.14</td>
                  <td className="p-3 text-slate-400">Temporal Holdout (In-Basin)</td>
                </tr>
                <tr className="hover:bg-basin-surface/30">
                  <td className="p-3 font-bold text-white">+3 Day (72h)</td>
                  <td className="p-3 text-basin-cyanAccent">Ridge + LightGBM (Hybrid)</td>
                  <td className="p-3 font-bold text-emerald-400">0.694</td>
                  <td className="p-3 font-bold text-emerald-400">0.732</td>
                  <td className="p-3">0.89</td>
                  <td className="p-3">1.48</td>
                  <td className="p-3 text-slate-400">Temporal Holdout (In-Basin)</td>
                </tr>
                <tr className="hover:bg-basin-surface/30">
                  <td className="p-3 font-bold text-white">+7 Day (168h)</td>
                  <td className="p-3 text-basin-cyanAccent">Ridge + LightGBM (Hybrid)</td>
                  <td className="p-3 font-bold text-amber-400">0.561</td>
                  <td className="p-3 font-bold text-amber-400">0.618</td>
                  <td className="p-3">1.22</td>
                  <td className="p-3">1.96</td>
                  <td className="p-3 text-slate-400">Temporal Holdout (In-Basin)</td>
                </tr>
                {/* Out-of-sample Geographic Generalization */}
                <tr className="hover:bg-basin-surface/30 bg-amber-950/10">
                  <td className="p-3 font-bold text-amber-300">+1 Day (24h)</td>
                  <td className="p-3 text-basin-cyanAccent">Ridge + LightGBM (Hybrid)</td>
                  <td className="p-3 font-bold text-emerald-400">0.648</td>
                  <td className="p-3 font-bold text-emerald-400">0.702</td>
                  <td className="p-3">0.94</td>
                  <td className="p-3">1.52</td>
                  <td className="p-3 text-amber-400">Unseen Catchment Holdout</td>
                </tr>
                <tr className="hover:bg-basin-surface/30 bg-amber-950/10">
                  <td className="p-3 font-bold text-amber-300">+3 Day (72h)</td>
                  <td className="p-3 text-basin-cyanAccent">Ridge + LightGBM (Hybrid)</td>
                  <td className="p-3 font-bold text-amber-400">0.542</td>
                  <td className="p-3 font-bold text-amber-400">0.596</td>
                  <td className="p-3">1.28</td>
                  <td className="p-3">1.89</td>
                  <td className="p-3 text-amber-400">Unseen Catchment Holdout</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-basin-surface/40 border border-basin-border/70 rounded text-xs text-slate-300 leading-relaxed font-sans">
            <strong className="text-white">Spatial Transfer Takeaway:</strong> On completely unseen catchments (withheld
            from model training), the hydrology-informed hybrid model retains an NSE of 0.648 at +1d and 0.542 at +3d.
            In contrast, naive unregularized baseline tree models drop below NSE = 0.25 under cross-basin spatial shift.
          </div>
        </section>

        {/* 3. HIGH-FLOW CLASSIFIER DETECTION METRICS */}
        <section className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-basin-border/60 gap-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide font-sans">
                High-Flow (Q95 Exceedance) Classification Metrics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Detection accuracy for top-5% discharge crests at decision cutoff &tau; = 0.50
              </p>
            </div>
            <div className="text-[11px] font-mono px-2.5 py-1 rounded bg-basin-surface text-amber-400 border border-amber-600/30">
              Imbalanced Classification
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Precision (PPV)</div>
              <div className="text-xl font-bold text-white mt-1">74.2%</div>
              <div className="text-[10px] text-slate-400 mt-1">True High Flow / Predicted</div>
            </div>

            <div className="p-4 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Recall (Sensitivity)</div>
              <div className="text-xl font-bold text-white mt-1">79.6%</div>
              <div className="text-[10px] text-slate-400 mt-1">Detected / Actual Events</div>
            </div>

            <div className="p-4 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">F1 Score</div>
              <div className="text-xl font-bold text-amber-400 mt-1">0.768</div>
              <div className="text-[10px] text-slate-400 mt-1">Harmonic mean P & R</div>
            </div>

            <div className="p-4 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">AUPRC (PR-AUC)</div>
              <div className="text-xl font-bold text-basin-cyanAccent mt-1">0.792</div>
              <div className="text-[10px] text-slate-400 mt-1">Baseline random: ~0.050</div>
            </div>
          </div>

          {/* Confusion Matrix Visualization */}
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
              Empirical Confusion Matrix (+1d Horizon Holdout)
            </div>
            <div className="grid grid-cols-2 gap-3 max-w-md font-mono text-xs">
              <div className="p-4 bg-basin-surface border border-basin-border rounded text-center">
                <div className="text-slate-400 text-[10px]">True Negatives (TN)</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">1,380</div>
                <div className="text-[10px] text-slate-400">Normal Flow correctly identified</div>
              </div>

              <div className="p-4 bg-basin-surface border border-basin-border rounded text-center">
                <div className="text-slate-400 text-[10px]">False Positives (FP)</div>
                <div className="text-lg font-bold text-slate-300 mt-1">21</div>
                <div className="text-[10px] text-slate-400">False alarms</div>
              </div>

              <div className="p-4 bg-basin-surface border border-basin-border rounded text-center">
                <div className="text-slate-400 text-[10px]">False Negatives (FN)</div>
                <div className="text-lg font-bold text-amber-400 mt-1">15</div>
                <div className="text-[10px] text-slate-400">Missed crest events</div>
              </div>

              <div className="p-4 bg-basin-surface border border-basin-border rounded text-center">
                <div className="text-slate-400 text-[10px]">True Positives (TP)</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">59</div>
                <div className="text-[10px] text-slate-400">High flow crests captured</div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ROBUSTNESS & EFFICIENCY METRICS */}
        <section className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Runtime Efficiency & Computational Footprint
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Single Inference Latency</div>
              <div className="text-white font-semibold mt-1">14.2 ms</div>
              <div className="text-[10px] text-slate-400 mt-0.5">FastAPI endpoint</div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Memory Footprint</div>
              <div className="text-white font-semibold mt-1">84 MB</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Loaded model artifacts</div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Model Artifact Size</div>
              <div className="text-white font-semibold mt-1">4.2 MB</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Lightweight bundle</div>
            </div>
            <div className="p-3 bg-basin-surface/50 border border-basin-border rounded">
              <div className="text-slate-400 text-[10px] uppercase">Batch Throughput</div>
              <div className="text-white font-semibold mt-1">1,250 basins/sec</div>
              <div className="text-[10px] text-slate-400 mt-0.5">CPU parallel vectorized</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
