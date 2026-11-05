"use client";

import React, { useState } from "react";
import CatchmentMap from "@/components/map/CatchmentMap";
import { CatchmentGeoFeature } from "@/lib/types";
import { Compass, ShieldCheck, MapPin, Layers, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function CatchmentsPage() {
  const [selectedCatchment, setSelectedCatchment] = useState<CatchmentGeoFeature | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100 pb-20">
      {/* Editorial Header */}
      <section className="relative py-14 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-3">Geospatial Intelligence</div>
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight uppercase">
            Catchment Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Interactive geospatial observation of verified USGS streamflow gauging stations and hydrological benchmark
            basins. Explore drainage topography, elevation gradients, and spatial holdouts.
          </p>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-8 bg-basin-darkest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Map Component */}
          <CatchmentMap onSelectCatchment={(f) => setSelectedCatchment(f)} />

          {/* Geospatial Data Integration Notice */}
          <div className="p-4 bg-basin-midnight border border-basin-border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Data Verification Standards:</strong> All displayed gauging stations and coordinates are verified
                against the USGS National Water Information System (NWIS) and the CAMELS hydrometeorological benchmark.
              </span>
            </div>
            <Link
              href="/resources#data-sources"
              className="inline-flex items-center gap-1.5 text-basin-cyanAccent hover:text-white shrink-0"
            >
              <span>Review NWIS Schema</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Benchmark Station Catalog Table */}
          <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Verified Benchmark Stations Catalog
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-basin-surface text-slate-300 border-b border-basin-border">
                  <tr>
                    <th className="p-3">USGS Station ID</th>
                    <th className="p-3">River & Basin Location</th>
                    <th className="p-3">HUC Region</th>
                    <th className="p-3">Area (km²)</th>
                    <th className="p-3">Elevation</th>
                    <th className="p-3">Q95 Threshold</th>
                    <th className="p-3">Validation Role</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-basin-border/40 text-slate-300">
                  <tr className="hover:bg-basin-surface/30">
                    <td className="p-3 font-bold text-basin-cyanAccent">01434000</td>
                    <td className="p-3 text-white">Neversink River near Claryville, NY</td>
                    <td className="p-3">02 - Mid-Atlantic</td>
                    <td className="p-3">172.5</td>
                    <td className="p-3">680 m</td>
                    <td className="p-3 text-amber-400">14.82 mm/d</td>
                    <td className="p-3 text-emerald-400">Calibration Baseline</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/test?catchment=01434000"
                        className="px-2.5 py-1 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-[11px] text-white"
                      >
                        Forecast
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-basin-surface/30">
                    <td className="p-3 font-bold text-basin-cyanAccent">01427510</td>
                    <td className="p-3 text-white">Lackawaxen River at Rowland, PA</td>
                    <td className="p-3">02 - Mid-Atlantic</td>
                    <td className="p-3">412.3</td>
                    <td className="p-3">435 m</td>
                    <td className="p-3 text-amber-400">12.45 mm/d</td>
                    <td className="p-3 text-emerald-400">Calibration Baseline</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/test?catchment=01427510"
                        className="px-2.5 py-1 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-[11px] text-white"
                      >
                        Forecast
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-basin-surface/30">
                    <td className="p-3 font-bold text-basin-cyanAccent">01570500</td>
                    <td className="p-3 text-white">Susquehanna River at Harrisburg, PA</td>
                    <td className="p-3">02 - Mid-Atlantic</td>
                    <td className="p-3">62,419.0</td>
                    <td className="p-3">310 m</td>
                    <td className="p-3 text-amber-400">9.87 mm/d</td>
                    <td className="p-3 text-basin-cyanAccent">Temporal Holdout</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/test?catchment=01570500"
                        className="px-2.5 py-1 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-[11px] text-white"
                      >
                        Forecast
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-basin-surface/30">
                    <td className="p-3 font-bold text-amber-400">01614000</td>
                    <td className="p-3 text-white">Back Creek near Jones Springs, WV</td>
                    <td className="p-3">02 - Appalachian</td>
                    <td className="p-3">608.6</td>
                    <td className="p-3">390 m</td>
                    <td className="p-3 text-amber-400">16.34 mm/d</td>
                    <td className="p-3 text-amber-400">Unseen Basin Holdout</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/test?catchment=01614000"
                        className="px-2.5 py-1 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-[11px] text-white"
                      >
                        Forecast
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-basin-surface/30">
                    <td className="p-3 font-bold text-amber-400">09073400</td>
                    <td className="p-3 text-white">Roaring Fork River near Aspen, CO</td>
                    <td className="p-3">14 - Upper Colorado</td>
                    <td className="p-3">280.5</td>
                    <td className="p-3">2,980 m</td>
                    <td className="p-3 text-amber-400">18.95 mm/d</td>
                    <td className="p-3 text-amber-400">Unseen Snowmelt Holdout</td>
                    <td className="p-3 text-right">
                      <Link
                        href="/test?catchment=09073400"
                        className="px-2.5 py-1 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-[11px] text-white"
                      >
                        Forecast
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
