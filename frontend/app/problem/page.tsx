import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, Mountain, Clock, Globe, AlertTriangle, Layers } from "lucide-react";

export default function ProblemPage() {
  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100">
      {/* Editorial Header */}
      <section className="relative py-20 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-4">Scientific Problem Formulation</div>
          <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            The Hydrological <br />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-basin-cyanAccent">
              Transferability Challenge
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Two catchments can receive identical precipitation and produce radically divergent river-discharge
            responses. Differences in antecedent soil moisture, lithology, topography, and channel storage fundamentally
            govern runoff generation.
          </p>
        </div>
      </section>

      {/* Hero Media Section */}
      <section className="py-12 border-b border-basin-border/40 bg-basin-darkest">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-lg overflow-hidden border border-basin-border">
            <Image
              src="/media/satellite/dendritic_drainage_basin.jpg"
              alt="Dendritic river network and watershed drainage pattern"
              width={1600}
              height={700}
              className="w-full h-[400px] object-cover filter contrast-[1.1]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-basin-darkest via-basin-darkest/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="max-w-xl">
                <span className="text-[11px] font-mono text-basin-cyan uppercase tracking-wider">
                  Earth Observation Perspective
                </span>
                <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                  Drainage network topology dictates travel time, channel attenuation, and hydrograph peak sharpness.
                  Machine learning architectures must capture these structural mechanics.
                </p>
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                Figure 1.0 • Dendritic Basin Morphology
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Physical Mechanisms */}
      <section className="py-20 border-b border-basin-border/40 bg-basin-midnight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="scientific-badge mb-3">Nonlinear Hydrological Drivers</div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Why Traditional ML Overfits to Familiar Basins
            </h2>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              When standard gradient boosting or neural networks train on river discharge time series, they readily learn
              spurious statistical shortcuts tied to specific gauging stations. When tested on unseen catchments, these
              assumptions collapse across several physical dimensions:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
            {/* Factor 1: Soil Moisture */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-basin-cyanAccent">
                <Droplets className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Antecedent Moisture</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Soil Moisture & Gating</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Dry soils absorb rainfall through infiltration; saturated soils route subsequent rainfall directly to
                surface overland flow. A single rainfall event yields 10x higher discharge when soils are near field capacity.
              </p>
            </div>

            {/* Factor 2: Storage Timescales */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-basin-cyanAccent">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Storage Routing</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Multi-Scale Reservoirs</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Water travels through fast surface channels (hours), unsaturated subsurface interflow (days), and deep
                groundwater aquifers (months). Models lacking multi-scale memory fail long-horizon forecasting.
              </p>
            </div>

            {/* Factor 3: Topography */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-basin-cyanAccent">
                <Mountain className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Geomorphic Relief</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Topography & Drainage</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Steep alpine headwaters exhibit rapid hydrograph rise times with minimal attenuation, while lowland alluvial
                valleys distribute flood volumes across wide riparian floodplains.
              </p>
            </div>

            {/* Factor 4: Spatial Distribution Shift */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-basin-cyanAccent">
                <Globe className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Spatial Covariate Shift</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Geographic Generalization</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                A model trained on humid temperate catchments experiences severe covariate shift when evaluated in
                semi-arid, snow-dominated, or karst geologic regimes.
              </p>
            </div>

            {/* Factor 5: Rare High-Flow Tails */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Extreme Tail Events</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Rare High-Flow Events</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                High-flow events (e.g. Q95 exceedances) represent less than 5% of historical observations. Standard loss
                functions (MSE) minimize baseflow errors while under-predicting catastrophic flood crests.
              </p>
            </div>

            {/* Factor 6: Temporal Non-Stationarity */}
            <div className="editorial-card p-6 space-y-3">
              <div className="flex items-center gap-2 text-basin-cyanAccent">
                <Layers className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Temporal Holdout</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans">Non-Stationary Climates</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Changing meteorological patterns and shifting snowmelt timing demand evaluation on strictly chronological
                holdout windows rather than random k-fold cross-validation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conceptual Generalization Diagram */}
      <section className="py-20 border-b border-basin-border/40 bg-basin-darkest">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="scientific-badge mb-3">Validation Methodology</div>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
              Familiar vs. Unseen Catchment Partitioning
            </h2>
            <p className="text-slate-400 text-xs mt-2 font-mono">
              [Note: Conceptual schematic illustration for validation philosophy, not actual BASINSHIFT boundary data]
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-basin-surface/50 border border-basin-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-basin-border/60">
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-basin-cyan" />
                  <span>Familiar Catchments (Training Calibration)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">In-Sample</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Streamflow gauge records are accessible during model training. The Ridge base and LightGBM residual
                models optimize reservoir decay constants and nonlinear corrections against historical gauge records.
              </p>
              <div className="p-3 bg-basin-darkest/70 rounded text-[11px] font-mono text-slate-400 space-y-1">
                <div>• Gauge Observations: Included</div>
                <div>• Reservoir Optimization: Calibrated</div>
                <div>• Validation Purpose: Baseline sanity verification</div>
              </div>
            </div>

            <div className="bg-basin-surface/50 border border-amber-500/40 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-basin-border/60">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span>Unseen Catchments (Geographic Transfer)</span>
                </div>
                <span className="text-[10px] font-mono text-amber-400">Out-of-Sample</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Excluded entirely from training and parameter estimation. Evaluates if generalized hydrological
                representations transfer without fine-tuning, reflecting real-world predictions in unmonitored basins.
              </p>
              <div className="p-3 bg-basin-darkest/70 rounded text-[11px] font-mono text-amber-300/80 space-y-1">
                <div>• Gauge Observations: Excluded / Withheld</div>
                <div>• Reservoir Optimization: Unseen</div>
                <div>• Validation Purpose: Generalization benchmark</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/model"
              className="inline-flex items-center gap-2 px-6 py-3 rounded bg-basin-teal hover:bg-basin-teal/90 border border-basin-cyan/40 text-xs font-mono font-medium text-white transition-all"
            >
              <span>Explore How the Two-Stage Hybrid Model Solves This</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
