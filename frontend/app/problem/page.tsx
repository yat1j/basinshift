import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Droplets, Mountain, Clock, Globe, AlertTriangle, Layers } from "lucide-react";

export default function ProblemPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124]">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8] mb-3">
            Scientific Challenge Formulation
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-[#202124] tracking-tight leading-tight">
            The Hydrological Transferability Challenge
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#3c4043] max-w-3xl leading-relaxed">
            Two catchments can receive identical precipitation and produce radically divergent river-discharge
            responses. Differences in antecedent soil moisture, lithology, topography, and channel storage fundamentally
            govern runoff generation.
          </p>
        </div>
      </section>

      {/* Hero Media Section */}
      <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden border border-[#dadce0] shadow-sm">
          <Image
            src="/media/satellite/dendritic_drainage_basin.jpg"
            alt="Dendritic river network and watershed drainage pattern"
            width={1600}
            height={700}
            className="w-full h-[420px] object-cover"
          />
          <div className="p-4 bg-white border-t border-[#dadce0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5f6368]">
            <div>
              <strong className="text-[#202124]">Figure 1.0:</strong> Dendritic drainage basin morphology dictates
              concentration times and hydrograph peak attenuation.
            </div>
            <div>Source: Earth Observation Series</div>
          </div>
        </div>
      </section>

      {/* Physical Drivers */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <h2 className="text-2xl sm:text-4xl font-normal text-[#202124] tracking-tight mb-4">
            Why Traditional ML Overfits to Familiar Basins
          </h2>
          <p className="text-base text-[#3c4043] leading-relaxed">
            When standard gradient-boosted trees or neural networks train on historical river gauge time series, they readily
            learn statistical shortcuts specific to those local basins. When deployed to unmonitored catchments, these
            assumptions degrade across several physical dimensions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Antecedent Moisture</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Dry soils absorb rainfall through infiltration; saturated soils route subsequent rainfall directly to
              surface overland flow. A single rainfall pulse yields 10x higher discharge when soils are at field capacity.
            </p>
          </div>

          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Multi-Scale Storage</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Water travels through fast surface channels (hours), unsaturated interflow (days), and deep groundwater
              aquifers (months). Models lacking multi-scale memory fail multi-day horizons.
            </p>
          </div>

          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Mountain className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Topography & Relief</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Steep alpine headwaters exhibit rapid hydrograph rise times, whereas lowland alluvial plains attenuate flood
              volumes across wide riparian storage zones.
            </p>
          </div>

          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Geographic Shift</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              A model trained on humid temperate basins experiences severe distribution shift when evaluated in semi-arid,
              snow-dominated, or karst geologic regimes.
            </p>
          </div>

          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#fef7e0] text-[#e37400] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Rare High-Flow Crests</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              High-flow crests represent less than 5% of historical observations. Standard loss functions minimize baseflow
              errors while under-predicting catastrophic flood crests.
            </p>
          </div>

          <div className="google-card p-6 space-y-3">
            <div className="w-8 h-8 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-medium text-[#202124]">Temporal Holdouts</h3>
            <p className="text-xs text-[#5f6368] leading-relaxed">
              Non-stationary precipitation patterns require evaluation on strictly chronological holdout periods rather
              than random k-fold cross-validation.
            </p>
          </div>
        </div>
      </section>

      {/* Conceptual Generalization Diagram */}
      <section className="py-16 bg-[#f8f9fa] border-t border-[#dadce0]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-normal text-[#202124] mb-3">
              Familiar vs. Unseen Catchment Partitioning
            </h2>
            <p className="text-xs text-[#5f6368]">
              [Conceptual schematic of validation philosophy for preventing data leakage]
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="google-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                <div className="text-sm font-medium text-[#202124] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
                  <span>Familiar Catchments (Training Baseline)</span>
                </div>
                <span className="text-xs font-mono text-[#5f6368]">In-Sample</span>
              </div>
              <p className="text-xs text-[#3c4043] leading-relaxed">
                Streamflow gauge records are accessible during model training. The Ridge base and LightGBM residual
                models optimize reservoir decay constants against historical gauge records.
              </p>
              <div className="p-3 bg-[#f8f9fa] rounded text-xs text-[#5f6368] space-y-1 font-mono">
                <div>• Gauge Observations: Included</div>
                <div>• Reservoir Routing: Calibrated</div>
                <div>• Role: Baseline sanity check</div>
              </div>
            </div>

            <div className="google-card p-6 space-y-4 border-[#f9ab00]">
              <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                <div className="text-sm font-medium text-[#e37400] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e37400]" />
                  <span>Unseen Catchments (Spatial Transfer)</span>
                </div>
                <span className="text-xs font-mono text-[#e37400]">Out-of-Sample</span>
              </div>
              <p className="text-xs text-[#3c4043] leading-relaxed">
                Excluded entirely from model training. Evaluates if generalized hydrological representations transfer
                without local retraining, simulating real-world unmonitored basins.
              </p>
              <div className="p-3 bg-[#fef7e0] rounded text-xs text-[#e37400] space-y-1 font-mono">
                <div>• Gauge Observations: Excluded / Withheld</div>
                <div>• Reservoir Routing: Unseen</div>
                <div>• Role: Generalization benchmark</div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/model" className="google-pill text-sm py-2.5 px-6 shadow-sm">
              Explore Our Hybrid Model Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
