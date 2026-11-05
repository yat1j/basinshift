import React from "react";
import Link from "next/link";
import KatexEquation from "@/components/ui/KatexEquation";
import { CheckCircle2, Clock, ArrowRight, Layers, Cpu, ShieldCheck } from "lucide-react";

export default function ModelPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124]">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8] mb-3">
            Technical Architecture Specification
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-[#202124] tracking-tight leading-tight">
            Two-Stage Hydrology-Informed Hybrid Model
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#3c4043] max-w-3xl leading-relaxed">
            BASINSHIFT couples conceptual linear reservoir storage dynamics with regularized linear regression and
            gradient-boosted residual correction to forecast river discharge across familiar and unfamiliar catchments.
          </p>
        </div>
      </section>

      {/* End-to-End Sequential Flow */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-8 text-center">
          End-to-End Architectural Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div className="google-card p-5 space-y-2">
            <span className="text-[11px] font-mono text-[#1a73e8] font-bold uppercase">Step 01</span>
            <h3 className="text-sm font-medium text-[#202124]">Environmental Inputs</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Precipitation, 2m air temperature, antecedent soil moisture proxy, solar radiation, and snow depth.
            </p>
          </div>

          <div className="google-card p-5 space-y-2">
            <span className="text-[11px] font-mono text-[#1a73e8] font-bold uppercase">Step 02</span>
            <h3 className="text-sm font-medium text-[#202124]">Reservoir Routing</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Soil-gated effective precipitation routed through 4 linear reservoirs representing distinct hydrological
              timescales.
            </p>
          </div>

          <div className="google-card p-5 space-y-2">
            <span className="text-[11px] font-mono text-[#1a73e8] font-bold uppercase">Step 03</span>
            <h3 className="text-sm font-medium text-[#202124]">Stage 1: Ridge Base</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              L2-regularized linear model establishes a stable, non-exploding baseflow prediction.
            </p>
          </div>

          <div className="google-card p-5 space-y-2">
            <span className="text-[11px] font-mono text-[#1a73e8] font-bold uppercase">Step 04</span>
            <h3 className="text-sm font-medium text-[#202124]">Stage 2: LightGBM Residual</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Gradient-boosted decision trees fit residual errors, capturing nonlinear crests and saturation excess.
            </p>
          </div>

          <div className="google-card p-5 space-y-2 border-[#1a73e8]/50 bg-[#e8f0fe]/20">
            <span className="text-[11px] font-mono text-[#1a73e8] font-bold uppercase">Step 05</span>
            <h3 className="text-sm font-medium text-[#202124]">Discharge Forecast</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Non-negative clipping ensures physically consistent forecasts for +1d, +3d, and +7d horizons.
            </p>
          </div>
        </div>
      </section>

      {/* Mathematical Formulations Section */}
      <section className="py-16 bg-[#f8f9fa] border-t border-[#dadce0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-3">
              Mathematical Formulations & Equations
            </h2>
            <p className="text-base text-[#3c4043] leading-relaxed">
              All discharge variables are evaluated in normalized units of millimeters per day (mm/day). Below are the exact
              equations implemented in the BASINSHIFT pipeline.
            </p>
          </div>

          {/* Equation 1 */}
          <div className="google-card p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1a73e8]">
              01 • Hydrological Water Balance & Multi-Scale Linear Reservoirs
            </div>
            <p className="text-xs text-[#3c4043] leading-relaxed">
              The catchment water balance equates precipitation with evapotranspiration, discharge, and storage change:
            </p>
            <div className="bg-[#f8f9fa] p-4 rounded border border-[#dadce0] flex flex-col items-center">
              <KatexEquation math="P_t = \text{ET}_t + Q_t + \frac{dS}{dt}" block />
              <div className="w-full border-t border-[#dadce0] my-3" />
              <KatexEquation math="S_i(t) = S_i(t-1) + I_i(t) - Q_i(t), \quad Q_i(t) = k_i \cdot S_i(t)" block />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#5f6368] font-mono">
              <div className="p-2 bg-[#f8f9fa] rounded">k₁ (Fast runoff): ~0.65 d⁻¹</div>
              <div className="p-2 bg-[#f8f9fa] rounded">k₂ (Interflow): ~0.25 d⁻¹</div>
              <div className="p-2 bg-[#f8f9fa] rounded">k₃ (Subsurface): ~0.08 d⁻¹</div>
              <div className="p-2 bg-[#f8f9fa] rounded">k₄ (Baseflow): ~0.015 d⁻¹</div>
            </div>
          </div>

          {/* Equation 2 */}
          <div className="google-card p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1a73e8]">
              02 • Stage 1: Regularized Ridge Objective
            </div>
            <p className="text-xs text-[#3c4043] leading-relaxed">
              Ridge regression prevents explosive predictions under covariate shift by penalizing large weights via L2
              Tikhonov regularization:
            </p>
            <div className="bg-[#f8f9fa] p-4 rounded border border-[#dadce0] flex justify-center">
              <KatexEquation math="\min_{w, b} \left( \sum_{i=1}^N \left( y_i - b - \mathbf{x}_i^T \mathbf{w} \right)^2 + \lambda \|\mathbf{w}\|_2^2 \right)" block />
            </div>
          </div>

          {/* Equation 3 */}
          <div className="google-card p-6 space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider font-semibold text-[#1a73e8]">
              03 • Stage 2: Residual Target & Composite Non-Negative Forecast
            </div>
            <p className="text-xs text-[#3c4043] leading-relaxed">
              LightGBM gradient-boosted decision trees train specifically on the residuals of Stage 1:
            </p>
            <div className="bg-[#f8f9fa] p-4 rounded border border-[#dadce0] flex flex-col items-center">
              <KatexEquation math="r_i = y_i - \hat{Q}_{\text{base}, i}" block />
              <div className="w-full border-t border-[#dadce0] my-3" />
              <KatexEquation math="\hat{Q}_{\text{final}}(t + h) = \max\left(0, \, \hat{Q}_{\text{base}}(t + h) + f_{\text{LGBM}}\left(\mathbf{x}_t; \Theta_h\right)\right)" block />
            </div>
          </div>
        </div>
      </section>

      {/* Component Transparency */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-8">
          Component Inventory & Provenance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="google-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#137333] font-medium text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Implemented & Verified (Variant A)</span>
            </div>
            <ul className="space-y-1.5 text-[#3c4043] leading-relaxed">
              <li>• 4 Linear Reservoirs (fast, surface, subsurface, baseflow)</li>
              <li>• Stage 1 Ridge Base Regression (+1d, +3d, +7d)</li>
              <li>• Stage 2 LightGBM Residual Correction (+1d, +3d, +7d)</li>
              <li>• Non-negative output clipping (<KatexEquation math="\max(0, \hat{Q})" />)</li>
              <li>• Regional Q95 High-Flow Thresholds</li>
            </ul>
          </div>

          <div className="google-card p-6 space-y-3 bg-[#f8f9fa]">
            <div className="flex items-center gap-2 text-[#5f6368] font-medium text-sm">
              <Clock className="w-4 h-4" />
              <span>Experimental / Research Backlog</span>
            </div>
            <ul className="space-y-1.5 text-[#5f6368] leading-relaxed">
              <li>• CatBoost / XGBoost ensemble candidate (unverified)</li>
              <li>• Recurrent neural networks (GRU/LSTM) sequence models</li>
              <li>• Calibrated prediction intervals / conformal quantiles</li>
              <li>• Secondary extreme-flow classifier</li>
              <li>• Street-level flood depth / inundation (out of scope)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link href="/test" className="google-pill text-sm py-2.5 px-6 shadow-sm">
            Test the Architecture in Dataset Lab
          </Link>
        </div>
      </section>
    </div>
  );
}
