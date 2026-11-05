import React from "react";
import Link from "next/link";
import { ShieldAlert, BookOpen, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#f8f9fa] border-t border-[#dadce0] text-[#5f6368] text-xs">
      {/* Advisory Banner */}
      <div className="border-b border-[#dadce0] py-4 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto flex items-start sm:items-center gap-3 text-[#5f6368]">
          <ShieldAlert className="w-4 h-4 text-[#e37400] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[12px] leading-relaxed">
            <strong className="text-[#202124]">Scientific Research Notice:</strong> BASINSHIFT provides experimental
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
              <span className="font-medium text-base text-[#202124]">
                BASINSHIFT
              </span>
            </div>
            <p className="text-[#5f6368] text-xs leading-relaxed font-normal">
              Hydrology-informed machine learning for river-discharge forecasting and generalization across geographically
              unfamiliar catchments.
            </p>
            <div className="pt-1 text-[11px] text-[#5f6368]">
              Tagline: <span className="text-[#202124]">Predict Beyond the Basin.</span>
            </div>
          </div>

          {/* Research & Platform Links */}
          <div>
            <h4 className="text-xs font-medium text-[#202124] uppercase tracking-wider mb-3">Architecture</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/problem" className="hover:text-[#1a73e8] transition-colors">
                  The Hydrological Challenge
                </Link>
              </li>
              <li>
                <Link href="/model" className="hover:text-[#1a73e8] transition-colors">
                  Two-Stage Hybrid Model
                </Link>
              </li>
              <li>
                <Link href="/evaluation" className="hover:text-[#1a73e8] transition-colors">
                  Generalization Evaluation
                </Link>
              </li>
              <li>
                <Link href="/catchments" className="hover:text-[#1a73e8] transition-colors">
                  Catchment Explorer
                </Link>
              </li>
            </ul>
          </div>

          {/* Inference & Data Links */}
          <div>
            <h4 className="text-xs font-medium text-[#202124] uppercase tracking-wider mb-3">Forecasting Lab</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/test" className="hover:text-[#1a73e8] transition-colors">
                  Dataset Upload & Testing
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-[#1a73e8] transition-colors">
                  Post-Prediction Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#1a73e8] transition-colors">
                  Methodology & Limitations
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-[#1a73e8] transition-colors">
                  Scientific Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Data Provenance & Attribution */}
          <div>
            <h4 className="text-xs font-medium text-[#202124] uppercase tracking-wider mb-3">Provenance</h4>
            <p className="text-xs text-[#5f6368] mb-3 leading-relaxed">
              Trained on CAMELS & USGS hydrological benchmark records. Earth Observation imagery courtesy of NASA,
              USGS, NOAA, and Copernicus.
            </p>
            <div className="flex flex-col space-y-1.5 text-[11px]">
              <Link
                href="/resources#asset-manifest"
                className="inline-flex items-center gap-1 text-[#1a73e8] hover:text-[#174ea6] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Asset Source Manifest</span>
              </Link>
              <span className="text-[#5f6368]">Variant A Hybrid Pipeline • Release 1.0</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#dadce0] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#5f6368]">
          <div>
            © {new Date().getFullYear()} BASINSHIFT Research Project. Open-access scientific research platform.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about#limitations" className="hover:text-[#202124] transition-colors">
              Operational Scope
            </Link>
            <span>•</span>
            <Link href="/resources" className="hover:text-[#202124] transition-colors">
              Citations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
