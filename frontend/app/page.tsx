import React from "react";
import Link from "next/link";
import Image from "next/image";
import HeroVideo from "@/components/ui/HeroVideo";
import { ArrowRight, Layers, Activity, Compass, ShieldCheck, Cpu, Waves } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* SECTION 1 — CINEMATIC HERO */}
      <section className="relative w-full min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Video / Poster Background */}
        <HeroVideo
          videoSrc="/media/videos/river_flow_hero.mp4"
          posterSrc="/images/backgrounds/hero_river_satellite.jpg"
          className="absolute inset-0 h-full"
        />

        {/* Hero Editorial Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-basin-midnight/80 border border-basin-cyan/30 text-[11px] font-mono uppercase tracking-widest text-basin-cyanAccent backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-basin-cyan animate-pulse" />
            <span>Hydrological Intelligence Research</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white uppercase font-sans mb-6">
            Predict Beyond <br className="hidden sm:inline" />
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-basin-cyanAccent">
              The Basin.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed mb-10">
            Hydrology-informed machine learning for river-discharge forecasting and high-flow-risk analysis across
            geographically unfamiliar catchments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/problem"
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-mono font-medium uppercase tracking-wider text-white bg-basin-surface hover:bg-basin-card border border-basin-borderLight rounded transition-all flex items-center justify-center gap-2 group"
            >
              <span>Explore the Platform</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/test"
              className="w-full sm:w-auto px-6 py-3.5 text-xs font-mono font-medium uppercase tracking-wider text-white bg-basin-teal hover:bg-basin-teal/90 border border-basin-cyan/50 rounded shadow-lg shadow-basin-teal/20 transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-basin-cyanAccent" />
              <span>Test the Model</span>
            </Link>
          </div>
        </div>

        {/* Ambient bottom scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-slate-500 font-mono text-[10px] tracking-widest uppercase">
          <span>Scroll to examine</span>
          <div className="w-4 h-6 rounded-full border border-slate-600 flex items-start justify-center p-1">
            <div className="w-1 h-1.5 bg-basin-cyan rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE CHALLENGE */}
      <section className="py-24 border-t border-basin-border/50 bg-basin-midnight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="scientific-badge">Hydrological Heterogeneity</div>
              <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight leading-tight">
                Every catchment tells a different story.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                River discharge depends on rainfall, catchment characteristics, antecedent soil moisture, storage, and
                channel routing. Similar environmental inputs can produce vastly different river responses, making
                reliable prediction across unfamiliar catchments fundamentally difficult.
              </p>
              <div className="pt-2">
                <Link
                  href="/problem"
                  className="inline-flex items-center gap-2 text-xs font-mono text-basin-cyanAccent hover:text-white transition-colors uppercase tracking-wider"
                >
                  <span>Examine the Physical Mechanisms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-lg overflow-hidden border border-basin-border group">
                <Image
                  src="/media/rivers/river_floodplain_meander.jpg"
                  alt="River channel meander and natural floodplain storage"
                  width={800}
                  height={500}
                  className="w-full h-80 object-cover filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-basin-darkest/90 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="text-[11px] font-mono text-basin-cyanAccent uppercase">
                    Active Floodplain & Channel Storage
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Storage dynamics delay and attenuate hydrograph crest peaks.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — OUR APPROACH */}
      <section className="py-24 border-t border-basin-border/50 bg-basin-darkest">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="scientific-badge">Architecture Overview</div>
            <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight">
              Connecting hydrological processes with machine learning.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              BASINSHIFT couples physics-inspired linear reservoir dynamics with machine learning residual correction to
              isolate transferable catchment dynamics from localized training bias.
            </p>
          </div>

          {/* Sequential Process Flow Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="editorial-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded border border-basin-cyan/40 bg-basin-surface flex items-center justify-center text-basin-cyanAccent mb-4">
                  <Waves className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-mono text-basin-cyan uppercase tracking-wider">Stage 01</div>
                <h3 className="text-base font-semibold text-white mt-1 mb-2">Hydrological Representation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Four linear reservoirs represent fast surface runoff, interflow, percolation, and slow baseflow storage
                  timescales alongside antecedent soil moisture.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-basin-border/40 text-[11px] font-mono text-slate-500">
                4-Reservoir Storage Routing
              </div>
            </div>

            <div className="editorial-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded border border-basin-cyan/40 bg-basin-surface flex items-center justify-center text-basin-cyanAccent mb-4">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-mono text-basin-cyan uppercase tracking-wider">Stage 02</div>
                <h3 className="text-base font-semibold text-white mt-1 mb-2">Ridge Base + Residual Trees</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Regularized Ridge regression fits a stable linear baseline, followed by LightGBM gradient-boosted trees
                  learning nonlinear residual hydrograph corrections.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-basin-border/40 text-[11px] font-mono text-slate-500">
                Two-Stage Hybrid Framework
              </div>
            </div>

            <div className="editorial-card p-6 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded border border-basin-cyan/40 bg-basin-surface flex items-center justify-center text-basin-cyanAccent mb-4">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-mono text-basin-cyan uppercase tracking-wider">Stage 03</div>
                <h3 className="text-base font-semibold text-white mt-1 mb-2">Cross-Basin Generalization</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Explicit evaluation on catchments withheld entirely from training ensures predictions reflect genuine
                  hydrological transfer rather than basin memorization.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-basin-border/40 text-[11px] font-mono text-slate-500">
                Out-of-Sample Spatial Testing
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/model"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-basin-surface hover:bg-basin-card border border-basin-border text-xs font-mono text-slate-200 hover:text-white transition-colors"
            >
              <span>Inspect Full Mathematical Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 text-basin-cyanAccent" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY GENERALIZATION MATTERS */}
      <section className="py-24 border-t border-basin-border/50 bg-basin-midnight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="scientific-badge">Spatial Distribution Shift</div>
              <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight leading-tight">
                Beyond the basins a model has seen.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Standard hydrological models frequently achieve high scores simply by memorizing gauge-specific runoff
                curves. When deployed to unmonitored or geographically separated basins, performance degrades sharply.
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                BASINSHIFT benchmarks both geographic generalization (unseen basins holdout) and temporal generalization
                (chronological split holdout) without data leakage.
              </p>
              <div className="pt-2">
                <Link
                  href="/evaluation"
                  className="inline-flex items-center gap-2 text-xs font-mono text-basin-cyanAccent hover:text-white transition-colors uppercase tracking-wider"
                >
                  <span>Review Benchmark Metrics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-basin-surface/70 border border-basin-border p-5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-basin-cyanAccent">
                    <span className="text-[11px] uppercase tracking-wider">Familiar Catchments</span>
                    <span className="w-2 h-2 rounded-full bg-basin-cyan" />
                  </div>
                  <div className="text-sm font-semibold text-white">In-Sample Calibration</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Observed discharge available during training. High localized correlation is expected but does not
                    confirm transferable dynamics.
                  </p>
                  <div className="pt-2 text-[10px] text-slate-500 border-t border-basin-border/40">
                    Baseline Metric: High Local Fit
                  </div>
                </div>

                <div className="bg-basin-surface/70 border border-amber-500/40 p-5 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-amber-400">
                    <span className="text-[11px] uppercase tracking-wider">Unseen Catchments</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <div className="text-sm font-semibold text-white">Out-of-Sample Holdout</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Excluded completely from training. Evaluates if physics-informed features transfer across distinct
                    drainage areas and geologic formations.
                  </p>
                  <div className="pt-2 text-[10px] text-amber-400/80 border-t border-basin-border/40">
                    Generalization Target: Transferability
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FINAL CALL TO ACTION */}
      <section className="py-24 border-t border-basin-border/50 bg-basin-darkest relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            Explore the BASINSHIFT <br />
            <span className="font-semibold text-basin-cyanAccent">Forecasting Workspace.</span>
          </h2>
          <p className="max-w-xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Upload catchment meteorological series or select verified benchmark basins to evaluate multi-day discharge
            predictions and high-flow exceedance risk.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/test"
              className="px-8 py-3.5 text-xs font-mono font-medium uppercase tracking-wider text-white bg-basin-teal hover:bg-basin-teal/90 border border-basin-cyan/50 rounded shadow-lg transition-all flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-basin-cyanAccent" />
              <span>Launch Testing Laboratory</span>
            </Link>
            <Link
              href="/catchments"
              className="px-6 py-3.5 text-xs font-mono font-medium uppercase tracking-wider text-slate-300 hover:text-white bg-basin-surface hover:bg-basin-card border border-basin-border rounded transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4 text-slate-400" />
              <span>Catchment Explorer Map</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
