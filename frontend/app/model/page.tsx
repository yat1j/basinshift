import React from "react";
import Link from "next/link";
import Image from "next/image";
import KatexEquation from "@/components/ui/KatexEquation";
import { ArrowRight, Cpu, Layers, GitBranch, ShieldCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";

export default function ModelPage() {
  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100">
      {/* Editorial Header */}
      <section className="relative py-20 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-4">Architecture Specification</div>
          <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            Two-Stage Hydrology-Informed <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-basin-cyanAccent">
              Hybrid Model Architecture
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            BASINSHIFT couples conceptual linear reservoir routing with regularized linear regression and gradient-boosted
            residual correction to forecast multi-day river discharge across familiar and unfamiliar catchments.
          </p>
        </div>
      </section>

      {/* Architecture Flow Diagram */}
      <section className="py-16 border-b border-basin-border/40 bg-basin-darkest">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="scientific-badge mb-2">End-to-End Pipeline</div>
            <h2 className="text-2xl font-light text-white">System Architecture & Data Flow</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 font-mono text-xs">
            {/* Step 1 */}
            <div className="bg-basin-surface/70 border border-basin-border rounded-lg p-4 space-y-3">
              <div className="text-basin-cyan font-bold text-[11px] uppercase tracking-wider">Step 01</div>
              <div className="font-sans font-semibold text-white text-sm">Environmental Inputs</div>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                Precipitation, 2m air temperature, antecedent soil moisture proxy, solar radiation, and snow depth.
              </p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-basin-border/40">
                CAMELS / ERA5-Land
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-basin-surface/70 border border-basin-border rounded-lg p-4 space-y-3">
              <div className="text-basin-cyan font-bold text-[11px] uppercase tracking-wider">Step 02</div>
              <div className="font-sans font-semibold text-white text-sm">Hydrological Features</div>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                Soil-gated effective precipitation, API indices, and 4 linear reservoir storage states.
              </p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-basin-border/40">
                Variant A Feature Pipeline
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-basin-surface/70 border border-basin-border rounded-lg p-4 space-y-3">
              <div className="text-basin-cyan font-bold text-[11px] uppercase tracking-wider">Step 03</div>
              <div className="font-sans font-semibold text-white text-sm">Stage 1: Ridge Base</div>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                L2-regularized linear model establishes a stable, non-exploding baseline flow prediction.
              </p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-basin-border/40">
                Ridge Regression (L2)
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-basin-surface/70 border border-basin-border rounded-lg p-4 space-y-3">
              <div className="text-basin-cyan font-bold text-[11px] uppercase tracking-wider">Step 04</div>
              <div className="font-sans font-semibold text-white text-sm">Stage 2: LightGBM Residual</div>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                Gradient-boosted decision trees fit the residual error (y - Q_base), capturing nonlinear crests.
              </p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-basin-border/40">
                LightGBM Regressor
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-basin-surface/70 border border-cyan-500/50 rounded-lg p-4 space-y-3">
              <div className="text-basin-cyanAccent font-bold text-[11px] uppercase tracking-wider">Step 05</div>
              <div className="font-sans font-semibold text-white text-sm">Discharge Forecast</div>
              <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                Non-negative clipping ensures physical consistency for +1d, +3d, and +7d horizons.
              </p>
              <div className="text-[10px] text-basin-cyanAccent pt-2 border-t border-basin-border/40">
                Outputs [1d, 3d, 7d]
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mathematical Formulations Section */}
      <section className="py-20 border-b border-basin-border/40 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="scientific-badge mb-3">Mathematical Formulations</div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Rigorous Mathematical Representation
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              Below are the exact mathematical equations implemented in the BASINSHIFT feature pipeline and modeling
              stages. All discharge variables are measured in normalized units of millimeters per day (mm/day).
            </p>
          </div>

          <div className="space-y-8">
            {/* Equation 1: Water Balance & Reservoirs */}
            <div className="bg-basin-surface/40 border border-basin-border rounded-lg p-6">
              <div className="text-xs font-mono text-basin-cyan uppercase tracking-wider mb-2">
                01 • Hydrological Water Balance & Multi-Scale Linear Reservoirs
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                The global catchment water balance balances precipitation with evapotranspiration, discharge, and storage
                variation. BASINSHIFT routes effective precipitation through four conceptual linear reservoirs:
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex flex-col items-center">
                <KatexEquation math="P_t = \text{ET}_t + Q_t + \frac{dS}{dt}" block />
                <div className="w-full border-t border-basin-border/40 my-3" />
                <KatexEquation math="S_i(t) = S_i(t-1) + I_i(t) - Q_i(t), \quad Q_i(t) = k_i \cdot S_i(t)" block />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-slate-400">
                <div className="p-2 bg-basin-darkest/60 rounded">
                  <span className="text-slate-200">k₁ (Fast runoff):</span> ~0.65 d⁻¹
                </div>
                <div className="p-2 bg-basin-darkest/60 rounded">
                  <span className="text-slate-200">k₂ (Interflow):</span> ~0.25 d⁻¹
                </div>
                <div className="p-2 bg-basin-darkest/60 rounded">
                  <span className="text-slate-200">k₃ (Subsurface):</span> ~0.08 d⁻¹
                </div>
                <div className="p-2 bg-basin-darkest/60 rounded">
                  <span className="text-slate-200">k₄ (Baseflow):</span> ~0.015 d⁻¹
                </div>
              </div>
            </div>

            {/* Equation 2: Ridge Regression */}
            <div className="bg-basin-surface/40 border border-basin-border rounded-lg p-6">
              <div className="text-xs font-mono text-basin-cyan uppercase tracking-wider mb-2">
                02 • Stage 1: Regularized Ridge Objective
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                The Stage 1 linear model prevents divergence on unfamiliar catchments by penalizing large coefficient
                weights via L2 Tikhonov regularization:
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex justify-center">
                <KatexEquation math="\min_{w, b} \left( \sum_{i=1}^N \left( y_i - b - \mathbf{x}_i^T \mathbf{w} \right)^2 + \lambda \|\mathbf{w}\|_2^2 \right)" block />
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-3">
                Where <span className="text-slate-200"><KatexEquation math="\mathbf{x}_i" /></span> represents the hydrological feature vector
                (reservoirs + API + meteo) and <span className="text-slate-200"><KatexEquation math="\lambda" /></span> is tuned via cross-validation.
              </p>
            </div>

            {/* Equation 3: LightGBM Residual Correction */}
            <div className="bg-basin-surface/40 border border-basin-border rounded-lg p-6">
              <div className="text-xs font-mono text-basin-cyan uppercase tracking-wider mb-2">
                03 • Stage 2: Residual Target & Composite Non-Negative Forecast
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                The LightGBM gradient-boosted regressor trains specifically on the residuals of Stage 1:
              </p>
              <div className="bg-basin-darkest p-4 rounded border border-basin-border/60 text-white flex flex-col items-center">
                <KatexEquation math="r_i = y_i - \hat{Q}_{\text{base}, i}" block />
                <div className="w-full border-t border-basin-border/40 my-3" />
                <KatexEquation math="\hat{Q}_{\text{final}}(t + h) = \max\left(0, \, \hat{Q}_{\text{base}}(t + h) + f_{\text{LGBM}}\left(\mathbf{x}_t; \Theta_h\right)\right)" block />
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-3">
                The non-negative floor <span className="text-slate-200"><KatexEquation math="\max(0, \cdot)" /></span> guarantees physical
                realizability, as river discharge cannot be negative.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Component Status & Inventory Transparency */}
      <section className="py-20 border-b border-basin-border/40 bg-basin-darkest">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="scientific-badge mb-3">Model Inventory & Transparency</div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Verified Status of Architectural Components
            </h2>
            <p className="text-slate-400 text-xs font-mono mt-2 leading-relaxed">
              In accordance with scientific integrity guidelines, BASINSHIFT clearly separates verified, deployed
              artifacts from proposed or experimental extensions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            {/* Component 1: Deployed */}
            <div className="bg-basin-surface/40 border border-emerald-500/30 rounded-lg p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Implemented & Loaded (Variant A)</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px]">
                <li>• 4 Linear Reservoirs (fast, surface, subsurface, baseflow)</li>
                <li>• Stage 1 Ridge Base Regression (+1d, +3d, +7d)</li>
                <li>• Stage 2 LightGBM Residual Corrector (+1d, +3d, +7d)</li>
                <li>• Non-negative output clipping (<KatexEquation math="\max(0, \hat{Q})" />)</li>
                <li>• Regional Q95 High-Flow Thresholds</li>
              </ul>
            </div>

            {/* Component 2: Proposed / Experimental */}
            <div className="bg-basin-surface/40 border border-slate-700 rounded-lg p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
                <span>Experimental Candidates / Not In Pilot</span>
              </div>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li>• CatBoost / XGBoost ensemble candidates (unverified)</li>
                <li>• Deep Recurrent (GRU/LSTM) sequence models (research backlog)</li>
                <li>• Calibrated prediction intervals / conformal quantiles (pending)</li>
                <li>• Secondary extreme-flow classifier (not in active pilot)</li>
                <li>• Street-level flood depth / inundation (explicitly out of scope)</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/test"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-basin-teal hover:bg-basin-teal/90 border border-basin-cyan/40 text-xs font-mono font-medium text-white transition-all"
            >
              <span>Test This Architecture with Real Catchment Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
