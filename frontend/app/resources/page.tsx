import React from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Video, Github, ShieldCheck } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124] pb-24">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8] mb-3">
            Scientific Reference Library
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-[#202124] tracking-tight leading-tight">
            Resources & Documentation
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#3c4043] max-w-3xl leading-relaxed">
            Curated scientific literature, hydrological benchmark datasets, asset attribution manifests, and model
            handoff specifications supporting the BASINSHIFT research platform.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* Peer-Reviewed Scientific Literature */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1a73e8]" />
            <h2 className="text-base font-medium text-[#202124]">
              Primary Hydrological Literature & Benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div className="google-card p-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="font-medium text-sm text-[#202124]">
                  The CAMELS data set: Hydrometeorological time series and attributes for 671 catchments
                </div>
                <a
                  href="https://doi.org/10.5194/hess-21-5293-2017"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a73e8] hover:text-[#174ea6] flex items-center gap-1 shrink-0 font-medium"
                >
                  <span>DOI</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                Addor, N., Newman, A. J., Mizukami, N., and Clark, M. P. (2017). Hydrology and Earth System Sciences, 21,
                5293–5313.
              </p>
              <div className="text-[11px] text-[#5f6368]">
                Core dataset utilized for BASINSHIFT training and spatial generalization holdouts.
              </div>
            </div>

            <div className="google-card p-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="font-medium text-sm text-[#202124]">
                  Predictions in Ungauged Basins: A synthesis
                </div>
                <a
                  href="https://www.cambridge.org/core/books/run-off-prediction-in-ungauged-basins/C170A0F352E4DC02324C3AE9DFCDCD53"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a73e8] hover:text-[#174ea6] flex items-center gap-1 shrink-0 font-medium"
                >
                  <span>IAHS</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-[#5f6368] leading-relaxed">
                Hrachowitz, M., et al. (2013). A decade of Predictions in Ungauged Basins (PUB) — a review. Hydrological
                Sciences Journal, 58(6), 1198-1255.
              </p>
              <div className="text-[11px] text-[#5f6368]">
                Foundational motivation for ungauged cross-catchment generalization evaluation.
              </div>
            </div>
          </div>
        </section>

        {/* Visual References */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#1a73e8]" />
            <h2 className="text-base font-medium text-[#202124]">
              Visual Design References & Hydrological Research
            </h2>
          </div>

          <div className="google-card p-6 space-y-4 text-xs">
            <p className="text-sm text-[#3c4043] leading-relaxed">
              BASINSHIFT draws editorial layout, typographic restraint, and visual presentation inspiration from:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href="https://sites.research.google/gr/floodforecasting/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-lg flex items-center justify-between hover:border-[#1a73e8] transition-colors"
              >
                <div>
                  <div className="font-medium text-[#202124]">Google Research Flood Forecasting</div>
                  <div className="text-[11px] text-[#5f6368]">Primary editorial design reference</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#5f6368]" />
              </a>

              <a
                href="https://earthobservatory.nasa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-lg flex items-center justify-between hover:border-[#1a73e8] transition-colors"
              >
                <div>
                  <div className="font-medium text-[#202124]">NASA Earth Observatory</div>
                  <div className="text-[11px] text-[#5f6368]">Satellite river basin imagery</div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#5f6368]" />
              </a>
            </div>
          </div>
        </section>

        {/* Asset Manifest */}
        <section id="asset-manifest" className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#137333]" />
            <h2 className="text-base font-medium text-[#202124]">
              Media Asset Attribution Manifest
            </h2>
          </div>

          <div className="google-card p-6 space-y-3 text-xs">
            <p className="text-xs text-[#5f6368] leading-relaxed">
              All photographic, satellite, and video media utilized across BASINSHIFT are documented in{" "}
              <code className="text-[#1a73e8]">frontend/public/asset-sources.md</code>:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded flex justify-between items-center">
                <span>NASA Ganges-Brahmaputra Delta: PIA14876</span>
                <span className="font-medium text-[#137333]">Public Domain / NASA</span>
              </div>
              <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded flex justify-between items-center">
                <span>Submerged Floodwaters & River Floodplain Meander</span>
                <span className="font-medium text-[#137333]">Open License / Unsplash</span>
              </div>
              <div className="p-3 bg-[#f8f9fa] border border-[#dadce0] rounded flex justify-between items-center">
                <span>River Dynamics Ambient Flow Loop</span>
                <span className="font-medium text-[#137333]">Public Domain / CC0</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
