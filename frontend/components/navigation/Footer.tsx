import React from "react";
import Link from "next/link";
import { Waves, ShieldAlert, ArrowUpRight, BookOpen, GitFork } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-basin-border/80 bg-basin-midnight text-slate-400 text-xs mt-20">
      {/* Advisory Banner */}
      <div className="border-b border-basin-border/40 bg-basin-darkest/60 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3 text-slate-400">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-slate-200">Scientific Research Notice:</strong> BASINSHIFT provides experimental
            river-discharge forecasts and high-flow probabilities for research and demonstration. Discharge is not the
            same as local flood depth or inundation. Results are not certified public flood warnings.
          </p>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded border border-basin-cyan/40 bg-basin-surface flex items-center justify-center text-basin-cyan">
                <Waves className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono font-semibold tracking-wider text-sm text-white">
                BASINSHIFT
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Hydrology-informed machine learning for river-discharge forecasting and generalization across geographically
              unfamiliar catchments.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400">
              Tagline: <span className="text-slate-300">Predict Beyond the Basin.</span>
            </div>
          </div>

          {/* Research & Platform Links */}
          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/problem" className="hover:text-basin-cyanAccent transition-colors">
                  The Hydrological Challenge
                </Link>
              </li>
              <li>
                <Link href="/model" className="hover:text-basin-cyanAccent transition-colors">
                  Two-Stage Hybrid Model
                </Link>
              </li>
              <li>
                <Link href="/evaluation" className="hover:text-basin-cyanAccent transition-colors">
                  Generalization Evaluation
                </Link>
              </li>
              <li>
                <Link href="/catchments" className="hover:text-basin-cyanAccent transition-colors">
                  Catchment Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Inference & Data Links */}
          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">Forecasting Lab</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/test" className="hover:text-basin-cyanAccent transition-colors">
                  Dataset Upload & Testing
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-basin-cyanAccent transition-colors">
                  Post-Prediction Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-basin-cyanAccent transition-colors">
                  Methodology & Limitations
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-basin-cyanAccent transition-colors">
                  Scientific Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Provenance & Attribution */}
          <div>
            <h4 className="font-mono text-xs text-white uppercase tracking-wider mb-3">Provenance</h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Trained on CAMELS & USGS hydrological benchmark records. Verified Earth Observation data courtesy of NASA,
              USGS, NOAA, and Copernicus.
            </p>
            <div className="flex flex-col space-y-1.5 font-mono text-[11px]">
              <Link
                href="/resources#asset-manifest"
                className="inline-flex items-center gap-1 text-slate-300 hover:text-basin-cyanAccent transition-colors"
              >
                <BookOpen className="w-3 h-3 text-basin-cyan" />
                <span>Asset Source Manifest</span>
              </Link>
              <span className="text-slate-400">Variant A Hybrid Pipeline • Release 1.0</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-basin-border/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
          <div>
            © {new Date().getFullYear()} BASINSHIFT Research Project. Open-access scientific research platform.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about#limitations" className="hover:text-slate-200 transition-colors">
              Operational Scope
            </Link>
            <span>•</span>
            <Link href="/resources" className="hover:text-slate-200 transition-colors">
              Citations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
