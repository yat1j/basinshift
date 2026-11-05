import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Droplets, Mountain, Clock, Globe, AlertTriangle, Layers } from "lucide-react";

export default function ProblemPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-3 font-mono">
            Scientific Challenge Formulation
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight font-sans">
            The Hydrological Transferability Challenge
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-3xl leading-relaxed font-normal">
            Two catchments can receive identical precipitation and produce radically divergent river-discharge
            responses. Differences in antecedent soil moisture, lithology, topography, and channel storage fundamentally
            govern runoff generation.
          </p>
        </div>
      </section>

      {/* Hero Media Section - Real Flood River Photography */}
      <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <Image
            src="/media/floods/when_rivers_rise.png"
            alt="Real river overflowing banks and inundating catchment floodplains"
            width={1600}
            height={700}
            className="w-full h-[420px] object-cover"
          />
          <div className="p-4 bg-black/80 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/60">
            <div>
              <strong className="text-white">Figure 1.0:</strong> Channel routing, riparian floodplain storage, and
              attenuation during severe riverine discharge events.
            </div>
            <div>Source: Ground Hydro-Observation Archive</div>
          </div>
        </div>
      </section>

      {/* Physical Drivers */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight mb-4 font-sans">
            Why Traditional ML Overfits to Familiar Basins
          </h2>
          <p className="text-base text-white/70 leading-relaxed font-normal">
            When standard machine learning models train on historical river gauge time series, they learn statistical
            shortcuts specific to those local basins. When deployed to unmonitored catchments, these assumptions degrade
            across several physical dimensions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Antecedent Moisture</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Dry soils absorb rainfall through infiltration; saturated soils route subsequent rainfall directly to
              surface overland flow. A single rainfall pulse yields 10x higher discharge when soils are at field capacity.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Multi-Scale Storage</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Water travels through fast surface channels (hours), unsaturated interflow (days), and deep groundwater
              aquifers (months). Models lacking multi-scale memory fail multi-day horizons.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Mountain className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Topography & Relief</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Steep alpine headwaters exhibit rapid hydrograph rise times, whereas lowland alluvial plains attenuate flood
              volumes across wide riparian storage zones.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Geographic Shift</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              A model trained on humid temperate basins experiences severe distribution shift when evaluated in semi-arid,
              snow-dominated, or karst geologic regimes.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Rare High-Flow Crests</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              High-flow crests represent less than 5% of historical observations. Standard loss functions minimize baseflow
              errors while under-predicting catastrophic flood crests.
            </p>
          </div>

          <div className="glass-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-white">Temporal Holdouts</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Non-stationary precipitation patterns require evaluation on strictly chronological holdout periods rather
              than random k-fold cross-validation.
            </p>
          </div>
        </div>
      </section>

      {/* Conceptual Generalization Diagram */}
      <section className="py-16 bg-[#060606] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-normal text-white mb-3 font-sans">
              Familiar vs. Unseen Catchment Partitioning
            </h2>
            <p className="text-xs text-white/50 font-mono">
              [Conceptual schematic of validation philosophy for preventing data leakage]
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>Familiar Catchments (Training Baseline)</span>
                </div>
                <span className="text-xs font-mono text-white/50">In-Sample</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Streamflow gauge records are accessible during model training. The Ridge base and LightGBM residual
                models optimize reservoir decay constants against historical gauge records.
              </p>
              <div className="p-3 bg-black/60 rounded text-xs text-white/50 space-y-1 font-mono">
                <div>• Gauge Observations: Included</div>
                <div>• Reservoir Routing: Calibrated</div>
                <div>• Role: Baseline sanity check</div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-4 border-amber-500/40">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="text-sm font-medium text-amber-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Unseen Catchments (Spatial Transfer)</span>
                </div>
                <span className="text-xs font-mono text-amber-400">Out-of-Sample</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Excluded entirely from model training. Evaluates if generalized hydrological representations transfer
                without local retraining, simulating real-world unmonitored basins.
              </p>
              <div className="p-3 bg-amber-950/30 rounded text-xs text-amber-300/70 space-y-1 font-mono">
                <div>• Gauge Observations: Excluded / Withheld</div>
                <div>• Reservoir Routing: Unseen</div>
                <div>• Role: Generalization benchmark</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/model" className="glass-pill text-sm py-2.5 px-6 shadow-sm">
              Explore Our Hybrid Model Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
