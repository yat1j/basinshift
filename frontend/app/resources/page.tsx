import React from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Video, Github, ShieldCheck, Database, Layers } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100 pb-20">
      {/* Editorial Header */}
      <section className="relative py-20 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-4">Scientific Reference Library</div>
          <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            Resources & Documentation
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Curated scientific literature, hydrological benchmark datasets, asset attribution manifests, and model
            handoff specifications supporting the BASINSHIFT research platform.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* 1. PEER-REVIEWED SCIENTIFIC LITERATURE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-basin-cyan" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Primary Hydrological Literature & Benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 font-mono text-xs">
            {/* Paper 1: CAMELS */}
            <div className="p-4 bg-basin-midnight border border-basin-border rounded-lg space-y-2 hover:border-basin-borderLight transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="font-sans font-semibold text-white text-sm">
                  The CAMELS data set: Hydrometeorological time series and attributes for 671 catchments
                </div>
                <a
                  href="https://doi.org/10.5194/hess-21-5293-2017"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-basin-cyanAccent hover:text-white flex items-center gap-1 shrink-0"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Addor, N., Newman, A. J., Mizukami, N., and Clark, M. P. (2017). Hydrology and Earth System Sciences, 21,
                5293–5313.
              </p>
              <div className="text-[10px] text-slate-400">
                Core benchmark used for BASINSHIFT training and spatial generalization holdouts.
              </div>
            </div>

            {/* Paper 2: PUB Decade */}
            <div className="p-4 bg-basin-midnight border border-basin-border rounded-lg space-y-2 hover:border-basin-borderLight transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="font-sans font-semibold text-white text-sm">
                  Predictions in Ungauged Basins: A synthesis
                </div>
                <a
                  href="https://www.cambridge.org/core/books/run-off-prediction-in-ungauged-basins/C170A0F352E4DC02324C3AE9DFCDCD53"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-basin-cyanAccent hover:text-white flex items-center gap-1 shrink-0"
                >
                  <span>IAHS Press</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Hrachowitz, M., et al. (2013). A decade of Predictions in Ungauged Basins (PUB) — a review. Hydrological
                Sciences Journal, 58(6), 1198-1255.
              </p>
              <div className="text-[10px] text-slate-400">
                Foundational motivation for ungauged cross-catchment generalization evaluation.
              </div>
            </div>

            {/* Paper 3: Kling-Gupta Efficiency */}
            <div className="p-4 bg-basin-midnight border border-basin-border rounded-lg space-y-2 hover:border-basin-borderLight transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="font-sans font-semibold text-white text-sm">
                  Decomposition of the mean squared error and NSE performance criteria
                </div>
                <a
                  href="https://doi.org/10.1016/j.jhydrol.2009.08.003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-basin-cyanAccent hover:text-white flex items-center gap-1 shrink-0"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                Gupta, H. V., Kling, H., Yilmaz, K. K., and Martinez, G. F. (2009). Journal of Hydrology, 377(1-2), 80-91.
              </p>
              <div className="text-[10px] text-slate-400">
                Mathematical formulation for KGE metric implemented in BASINSHIFT.
              </div>
            </div>
          </div>
        </section>

        {/* 2. REPOSITORY & HANDOFF SPECIFICATIONS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-basin-cyan" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Project Codebase & Architecture Specifications
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-5 bg-basin-midnight border border-basin-border rounded-lg space-y-3">
              <div className="text-white font-semibold flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <span>GitHub Repository</span>
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Complete multi-page research platform, frontend dashboard, and modular API integration client.
              </p>
              <div className="pt-2 border-t border-basin-border/40 text-[11px] text-basin-cyanAccent">
                Branch: research-site-redesign
              </div>
            </div>

            <div className="p-5 bg-basin-midnight border border-basin-border rounded-lg space-y-3">
              <div className="text-white font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Member 1 Post-Predict Specification</span>
              </div>
              <p className="text-slate-400 text-xs font-sans leading-relaxed">
                Defines the inference contract, 3-horizon output structure, Q95 thresholds, and data quality fields.
              </p>
              <div className="pt-2 border-t border-basin-border/40 text-[11px] text-basin-cyanAccent">
                Specification: Post_Predict_UI_Spec.md
              </div>
            </div>
          </div>
        </section>

        {/* 3. SCIENTIFIC VISUAL INSPIRATION & REFERENCES */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-basin-cyan" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Visual Design References & Hydrological Research
            </h2>
          </div>

          <div className="p-5 bg-basin-midnight border border-basin-border rounded-lg space-y-4">
            <div className="text-xs text-slate-300 font-sans leading-relaxed">
              BASINSHIFT draws editorial layout, typographic restraint, and visual storytelling inspiration from leading
              Earth system and hydrological research platforms:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              <a
                href="https://sites.research.google/gr/floodforecasting/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-basin-surface border border-basin-border hover:border-basin-cyan/50 rounded flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="text-white group-hover:text-basin-cyanAccent">
                    Google Research Flood Forecasting
                  </div>
                  <div className="text-[10px] text-slate-400">Editorial presentation reference</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>

              <a
                href="https://earthobservatory.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-basin-surface border border-basin-border hover:border-basin-cyan/50 rounded flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="text-white group-hover:text-basin-cyanAccent">NASA Earth Observatory</div>
                  <div className="text-[10px] text-slate-400">Satellite catchment observations</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              </a>
            </div>
          </div>
        </section>

        {/* 4. ASSET SOURCE MANIFEST DIRECTORY */}
        <section id="asset-manifest" className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Curated Asset Source Manifest (Public Domain & Open Licenses)
            </h2>
          </div>

          <div className="p-5 bg-basin-midnight border border-basin-border rounded-lg space-y-3 font-mono text-xs">
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              All photographic, satellite, and video media utilized across BASINSHIFT are documented in{" "}
              <code className="text-basin-cyan">frontend/public/asset-sources.md</code>:
            </p>

            <div className="space-y-2 text-[11px] text-slate-400">
              <div className="p-2.5 bg-basin-surface/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  <strong className="text-slate-200">NASA Ganges-Brahmaputra Delta:</strong> PIA14876 (MISR Instrument)
                </span>
                <span className="text-emerald-400">Public Domain / NASA</span>
              </div>
              <div className="p-2.5 bg-basin-surface/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  <strong className="text-slate-200">USGS Streamflow Gauging Infrastructure:</strong> USGS NWIS
                </span>
                <span className="text-emerald-400">Public Domain / USGS</span>
              </div>
              <div className="p-2.5 bg-basin-surface/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  <strong className="text-slate-200">River Dynamics Ambient Flow Loop:</strong> Internet Archive CC
                </span>
                <span className="text-emerald-400">Public Domain / CC0</span>
              </div>
              <div className="p-2.5 bg-basin-surface/40 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  <strong className="text-slate-200">Unsplash Hydrology Collection:</strong> Meander & Topography
                </span>
                <span className="text-emerald-400">Open License / Unsplash</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
