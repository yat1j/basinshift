import React from "react";
import Link from "next/link";
import { ShieldAlert, BookOpen, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#050505] border-t border-white/10 text-white/60 text-xs">
      {/* Advisory Banner */}
      <div className="border-b border-white/10 py-4 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-6xl mx-auto flex items-start sm:items-center gap-3 text-white/70">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[12px] leading-relaxed font-sans">
            <strong className="text-white">Scientific Research Notice:</strong> BASINSHIFT provides experimental
            river-discharge forecasts and high-flow probabilities for research and demonstration. Discharge is not the
            same as local flood depth or inundation. Results are not certified public flood warnings.
          </p>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-base text-white tracking-tight font-sans">
                BASINSHIFT
              </span>
            </div>
            <p className="text-white/60 text-xs leading-relaxed font-normal">
              Hydrology-informed machine learning for river-discharge forecasting and generalization across geographically
              unfamiliar catchments.
            </p>
            <div className="pt-1 text-[11px] text-white/50">
              Tagline: <span className="text-white">Predict Beyond the Basin.</span>
            </div>
          </div>

          {/* Research & Platform Links */}
          <div>
            <h4 className="text-xs font-medium text-white uppercase tracking-wider mb-3 font-mono">Architecture</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/problem" className="hover:text-white transition-colors">
                  The Hydrological Challenge
                </Link>
              </li>
              <li>
                <Link href="/model" className="hover:text-white transition-colors">
                  Two-Stage Hybrid Model
                </Link>
              </li>
              <li>
                <Link href="/evaluation" className="hover:text-white transition-colors">
                  Generalization Evaluation
                </Link>
              </li>
              <li>
                <Link href="/catchments" className="hover:text-white transition-colors">
                  Catchment Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Inference & Data Links */}
          <div>
            <h4 className="text-xs font-medium text-white uppercase tracking-wider mb-3 font-mono">Forecasting Lab</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/test" className="hover:text-white transition-colors">
                  Dataset Upload & Testing
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-white transition-colors">
                  Post-Prediction Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Methodology & Limitations
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">
                  Scientific Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Provenance & Attribution */}
          <div>
            <h4 className="text-xs font-medium text-white uppercase tracking-wider mb-3 font-mono">Provenance</h4>
            <p className="text-xs text-white/60 mb-3 leading-relaxed">
              Trained on CAMELS & USGS hydrological benchmark records. Earth Observation imagery courtesy of Google
              Research, NASA, USGS, NOAA, and Copernicus.
            </p>
            <div className="flex flex-col space-y-1.5 text-[11px]">
              <Link href="/resources#asset-manifest" className="text-white/80 hover:text-white underline">
                Media Asset Sources & Attribution
              </Link>
              <Link href="/about#limitations" className="text-amber-400/90 hover:text-amber-300">
                Operational Boundaries & Safe Use
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/40 gap-4">
          <div>&copy; 2026 BASINSHIFT Research Initiative. Open-source under MIT License.</div>
          <div className="flex items-center space-x-6">
            <Link href="/about" className="hover:text-white transition-colors">
              Methodology
            </Link>
            <Link href="/resources" className="hover:text-white transition-colors">
              Data Governance
            </Link>
            <Link href="/test" className="hover:text-white transition-colors">
              Inference API
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}