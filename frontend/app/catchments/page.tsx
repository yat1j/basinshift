"use client";

import React, { useState } from "react";
import CatchmentMap from "@/components/map/CatchmentMap";
import { CatchmentGeoFeature } from "@/lib/types";
import { ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function CatchmentsPage() {
  const [selectedCatchment, setSelectedCatchment] = useState<CatchmentGeoFeature | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Editorial Header */}
      <section className="py-16 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-2 font-mono">
            Geospatial Observation
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-white tracking-tight font-sans">
            Catchment Explorer
          </h1>
          <p className="text-base text-white/70 mt-3 max-w-2xl leading-relaxed font-normal">
            Interactive observation of verified USGS streamflow gauging stations and CAMELS benchmark watersheds.
            Explore drainage topography, elevation gradients, and spatial holdouts.
          </p>
        </div>
      </section>

      {/* Main Map Content: Expanded interactive USGS National Water Dashboard */}
      <section className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <CatchmentMap variant="expanded" />

        {/* Verification Note */}
        <div className="p-4 glass-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Data Verification:</strong> All coordinates and drainage areas are verified against the USGS
              National Water Information System (NWIS).
            </span>
          </div>
          <Link
            href="/resources"
            className="text-white/80 hover:text-white flex items-center gap-1 font-medium shrink-0 editorial-link"
          >
            <span>Review NWIS Schema</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Catalog Table */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-base font-medium text-white font-sans">
            Verified Benchmark Stations Catalog
          </h3>
          <div className="overflow-x-auto border border-white/10 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/60 border-b border-white/10 font-mono">
                <tr>
                  <th className="p-3">USGS Station ID</th>
                  <th className="p-3">River & Location</th>
                  <th className="p-3">HUC Region</th>
                  <th className="p-3">Drainage Area</th>
                  <th className="p-3">Elevation</th>
                  <th className="p-3">Q95 Threshold</th>
                  <th className="p-3">Validation Role</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80 font-sans">
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-sky-400">01434000</td>
                  <td className="p-3 font-medium text-white">Neversink River near Claryville, NY</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3 font-mono">172.5 km²</td>
                  <td className="p-3 font-mono">680 m</td>
                  <td className="p-3 text-amber-400 font-mono font-medium">14.82 mm/d</td>
                  <td className="p-3 text-emerald-400 font-medium">Calibration Baseline</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01434000"
                      className="glass-pill text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-sky-400">01427510</td>
                  <td className="p-3 font-medium text-white">Lackawaxen River at Rowland, PA</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3 font-mono">412.3 km²</td>
                  <td className="p-3 font-mono">435 m</td>
                  <td className="p-3 text-amber-400 font-mono font-medium">12.45 mm/d</td>
                  <td className="p-3 text-emerald-400 font-medium">Calibration Baseline</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01427510"
                      className="glass-pill text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-sky-400">01570500</td>
                  <td className="p-3 font-medium text-white">Susquehanna River at Harrisburg, PA</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3 font-mono">62,419.0 km²</td>
                  <td className="p-3 font-mono">310 m</td>
                  <td className="p-3 text-amber-400 font-mono font-medium">9.87 mm/d</td>
                  <td className="p-3 text-sky-300 font-medium">Temporal Holdout</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01570500"
                      className="glass-pill text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3 font-mono font-medium text-amber-400">01614000</td>
                  <td className="p-3 font-medium text-white">Back Creek near Jones Springs, WV</td>
                  <td className="p-3">02 - Appalachian</td>
                  <td className="p-3 font-mono">608.6 km²</td>
                  <td className="p-3 font-mono">390 m</td>
                  <td className="p-3 text-amber-400 font-mono font-medium">16.34 mm/d</td>
                  <td className="p-3 text-amber-400 font-medium">Unseen Basin Holdout</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01614000"
                      className="glass-pill text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}