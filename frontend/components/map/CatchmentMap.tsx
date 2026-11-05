"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Info,
  Maximize2,
  Activity,
  Layers,
  MapPin,
} from "lucide-react";

interface CatchmentMapProps {
  variant?: "compact" | "expanded";
  onSelectCatchment?: (feature: any) => void;
  selectedCatchmentId?: string;
  className?: string;
}

const USGS_DASHBOARD_URL = "https://dashboard.waterdata.usgs.gov/app/nwd/en/";

export default function CatchmentMap({
  variant = "compact",
  className = "",
}: CatchmentMapProps) {
  // Mode: "preview" shows the polished fallback preview; "embed" attempts the live iframe
  const [viewMode, setViewMode] = useState<"preview" | "embed">("preview");

  const isCompact = variant === "compact";
  const containerHeight = isCompact
    ? "h-[520px]"
    : "h-[620px] sm:h-[680px] md:h-[760px]";

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden glass-card border border-white/10 bg-[#060606] flex flex-col ${className}`}
    >
      {/* =========================================================================
          TOP CONTROL BAR
          ========================================================================= */}
      <div className="p-3.5 sm:p-4 bg-black/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* External Dashboard Preview Label */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            EXTERNAL DASHBOARD PREVIEW
          </span>

          <span className="text-white/80 font-medium font-sans hidden sm:inline">
            USGS National Water Dashboard
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle between Polished Preview and Live Embed Attempt */}
          <div className="inline-flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === "preview"
                  ? "bg-white text-black font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Dashboard Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode("embed")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewMode === "embed"
                  ? "bg-white text-black font-medium"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Interactive Embed
            </button>
          </div>

          {/* On Landing Page: Explore Live Map link navigating to Catchment Explorer */}
          {isCompact && (
            <Link
              href="/catchments"
              className="glass-pill text-xs py-1.5 px-3 flex items-center gap-1.5 text-white hover:text-white transition-all shadow-sm"
            >
              <span>Explore Live Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Prominent link opening official dashboard in new tab */}
          <a
            href={USGS_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-pill-solid text-xs py-1.5 px-3.5 flex items-center gap-1.5 text-white hover:text-white transition-all"
            title="Open official USGS National Water Dashboard in a new browser tab"
          >
            <span>Launch Official Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* =========================================================================
          MAP PRESENTATION BODY
          ========================================================================= */}
      <div className={`relative w-full ${containerHeight} bg-[#040404] overflow-hidden flex flex-col justify-between`}>
        {viewMode === "embed" ? (
          /* Attempt Official Dashboard Iframe Embed */
          <div className="relative w-full h-full flex flex-col">
            {/* Informational overlay ribbon explaining X-Frame-Options */}
            <div className="bg-amber-950/70 border-b border-amber-500/30 px-3 py-1.5 text-[11px] text-amber-200 flex items-center justify-between gap-2 font-mono">
              <span className="truncate">
                USGS frame-ancestor policy may restrict direct in-page embedding on external hosts. If frame does not display, use the Launch button.
              </span>
              <a
                href={USGS_DASHBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-amber-300 font-semibold shrink-0"
              >
                Open in New Tab ↗
              </a>
            </div>

            <iframe
              src={USGS_DASHBOARD_URL}
              title="USGS National Water Dashboard"
              className="w-full flex-grow border-0 bg-black"
              loading="lazy"
              allow="geolocation; fullscreen"
            />
          </div>
        ) : (
          /* Polished Fallback Preview (Guaranteed responsive, crisp, and never broken) */
          <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-8">
            {/* Background Map Imagery from verified monitoring archive */}
            <div className="absolute inset-0 z-0">
              <Image
                src="/media/monitoring/groundsource_gauge_map.png"
                alt="USGS Groundsource Streamgage Map Network"
                fill
                className="object-cover opacity-35 filter brightness-[0.7] contrast-[1.2]"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/40" />
            </div>

            {/* Top Overlay: External Portal Information */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div className="glass-card px-3.5 py-2 flex items-center gap-2.5 text-xs text-white/90 font-mono">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>External Resource: <strong className="text-white">USGS National Water Dashboard</strong></span>
              </div>

              <div className="glass-card px-3.5 py-2 flex items-center gap-2.5 text-xs text-white/90 font-mono">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Coverage: <strong className="text-white">United States Water Resources</strong></span>
              </div>
            </div>

            {/* Center Content: Clear Dashboard Callout */}
            <div className="relative z-10 max-w-xl mx-auto text-center space-y-4 my-auto py-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono text-white/80">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>External USGS Water Data Feed</span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-white tracking-tight font-sans">
                USGS National Water Dashboard
              </h3>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
                Observe streamflow, gauge height, current flood status, and precipitation across the entire United States,
                accessible directly via the external USGS National Water Dashboard portal.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={USGS_DASHBOARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-pill-solid text-sm py-2.5 px-6 shadow-xl inline-flex items-center gap-2 font-medium hover:scale-[1.02] transition-transform w-full sm:w-auto justify-center"
                >
                  <span>Launch Official Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                {isCompact && (
                  <Link
                    href="/catchments"
                    className="glass-pill text-sm py-2.5 px-6 inline-flex items-center gap-2 font-medium w-full sm:w-auto justify-center"
                  >
                    <span>Catchment Explorer</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Overlay: External Parameters Overview (when expanded) */}
            {!isCompact && (
              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono mb-2">
                <div className="p-2.5 glass-card">
                  <div className="text-white/50 text-[10px]">Observation Type</div>
                  <div className="text-white font-medium mt-0.5">Streamflow (Discharge)</div>
                </div>
                <div className="p-2.5 glass-card">
                  <div className="text-white/50 text-[10px]">Observation Type</div>
                  <div className="text-white font-medium mt-0.5">Water Surface Stage</div>
                </div>
                <div className="p-2.5 glass-card">
                  <div className="text-white/50 text-[10px]">Observation Type</div>
                  <div className="text-white font-medium mt-0.5">Precipitation Gauges</div>
                </div>
                <div className="p-2.5 glass-card">
                  <div className="text-white/50 text-[10px]">Data Source</div>
                  <div className="text-sky-300 font-medium mt-0.5">U.S. Geological Survey</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          MANDATORY DATA AUTHENTICITY NOTICE
          ========================================================================= */}
      <div className="p-3 sm:p-3.5 bg-black/90 border-t border-white/10 text-xs text-white/70 flex items-start gap-2.5 font-sans">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Data Authenticity Notice:</strong> External USGS National Water Dashboard preview. Live observations are provided by the external USGS monitoring network and are independent of BASINSHIFT model predictions.
        </p>
      </div>
    </div>
  );
}
