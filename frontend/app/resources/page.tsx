import React from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Video, Github, ShieldCheck } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-3 font-mono">
            Scientific Reference Library
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight font-sans">
            Resources & Documentation
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-3xl leading-relaxed font-normal">
            Curated scientific literature, hydrological benchmark datasets, asset attribution manifests, and model
            handoff specifications supporting the BASINSHIFT research platform.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* Peer-Reviewed Scientific Literature */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-medium text-white font-sans">
              Primary Hydrological Literature & Benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div className="glass-card p-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="font-medium text-sm text-white">
                  The CAMELS data set: Hydrometeorological time series and attributes for 671 catchments
                </div>
                <a
                  href="https://doi.org/10.5194/hess-21-5293-2017"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white flex items-center gap-1 shrink-0 font-medium editorial-link"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Addor, N., Newman, A. J., Mizukami, N., and Clark, M. P. (2017). Hydrology and Earth System Sciences, 21,
                5293–5313.
              </p>
              <div className="text-[11px] text-white/50">
                Core dataset utilized for BASINSHIFT training and spatial generalization holdouts.
              </div>
            </div>

            <div className="glass-card p-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="font-medium text-sm text-white">
                  Predictions in Ungauged Basins: A synthesis
                </div>
                <a
                  href="https://www.cambridge.org/core/books/run-off-prediction-in-ungauged-basins/C170A0F352E4DC02324C3AE9DFCDCD53"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/80 hover:text-white flex items-center gap-1 shrink-0 font-medium editorial-link"
                >
                  <span>IAHS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Hrachowitz, M., et al. (2013). A decade of Predictions in Ungauged Basins (PUB) — a review. Hydrological
                Sciences Journal, 58(6), 1198-1255.
              </p>
              <div className="text-[11px] text-white/50">
                Foundational motivation for ungauged cross-catchment generalization evaluation.
              </div>
            </div>
          </div>
        </section>

        {/* Visual References */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-medium text-white font-sans">
              Visual Design References & Hydrological Research
            </h2>
          </div>

          <div className="glass-card p-6 space-y-4 text-xs">
            <p className="text-sm text-white/70 leading-relaxed">
              BASINSHIFT draws editorial layout, typographic restraint, and visual presentation inspiration from:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://sites.research.google/gr/floodforecasting/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between hover:border-white/30 transition-colors"
              >
                <div>
                  <div className="font-medium text-white">Google Research Flood Forecasting</div>
                  <div className="text-[11px] text-white/50">Primary editorial design reference</div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/60" />
              </a>

              <a
                href="https://earthobservatory.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between hover:border-white/30 transition-colors"
              >
                <div>
                  <div className="font-medium text-white">NASA Earth Observatory</div>
                  <div className="text-[11px] text-white/50">Satellite river basin imagery</div>
                </div>
                <ExternalLink className="w-4 h-4 text-white/60" />
              </a>
            </div>
          </div>
        </section>

        {/* Asset Manifest */}
        <section id="asset-manifest" className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-medium text-white font-sans">
              Media Asset Attribution Manifest
            </h2>
          </div>

          <div className="glass-card p-6 space-y-3 text-xs">
            <p className="text-xs text-white/60 leading-relaxed">
              All photographic, satellite, and video media utilized across BASINSHIFT are documented in{" "}
              <code className="text-sky-300 font-mono">frontend/public/asset-sources.md</code>:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex justify-between items-center">
                <span className="text-white/80">Google Research Flood Forecasting: Hero Aerial & Floods Alerts Loop</span>
                <span className="font-medium text-emerald-400 font-mono">Public Research Media</span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex justify-between items-center">
                <span className="text-white/80">NASA Ganges-Brahmaputra Delta: PIA14876</span>
                <span className="font-medium text-emerald-400 font-mono">Public Domain / NASA</span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg flex justify-between items-center">
                <span className="text-white/80">River Inundation & Affected Community Photography</span>
                <span className="font-medium text-emerald-400 font-mono">Ground Hydro-Observation Archive</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}