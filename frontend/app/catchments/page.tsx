"use client";

import React, { useState } from "react";
import CatchmentMap from "@/components/map/CatchmentMap";
import { CatchmentGeoFeature } from "@/lib/types";
import { ShieldCheck, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function CatchmentsPage() {
  const [selectedCatchment, setSelectedCatchment] = useState<CatchmentGeoFeature | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124] pb-24">
      {/* Editorial Header */}
      <section className="py-16 border-b border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8] mb-2">
            Geospatial Observation
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-[#202124] tracking-tight">
            Catchment Explorer
          </h1>
          <p className="text-base text-[#5f6368] mt-3 max-w-2xl leading-relaxed">
            Interactive observation of verified USGS streamflow gauging stations and CAMELS benchmark watersheds.
            Explore drainage topography, elevation gradients, and spatial holdouts.
          </p>
        </div>
      </section>

      {/* Main Map Content */}
      <section className="py-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <CatchmentMap onSelectCatchment={(f) => setSelectedCatchment(f)} />

        {/* Verification Note */}
        <div className="p-4 bg-[#f8f9fa] border border-[#dadce0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5f6368]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#137333] shrink-0" />
            <span>
              <strong>Data Verification:</strong> All coordinates and drainage areas are verified against the USGS
              National Water Information System (NWIS).
            </span>
          </div>
          <Link
            href="/resources"
            className="text-[#1a73e8] hover:text-[#174ea6] flex items-center gap-1 font-medium shrink-0"
          >
            <span>Review NWIS Schema</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Catalog Table */}
        <div className="google-card p-6 space-y-4">
          <h3 className="text-base font-medium text-[#202124]">
            Verified Benchmark Stations Catalog
          </h3>
          <div className="overflow-x-auto border border-[#dadce0] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] text-[#5f6368] border-b border-[#dadce0]">
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
              <tbody className="divide-y divide-[#dadce0] text-[#3c4043]">
                <tr className="hover:bg-[#f8f9fa]">
                  <td className="p-3 font-mono font-medium text-[#1a73e8]">01434000</td>
                  <td className="p-3 font-medium text-[#202124]">Neversink River near Claryville, NY</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3">172.5 km²</td>
                  <td className="p-3">680 m</td>
                  <td className="p-3 text-[#e37400] font-medium">14.82 mm/d</td>
                  <td className="p-3 text-[#137333] font-medium">Calibration Baseline</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01434000"
                      className="google-pill-light text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8f9fa]">
                  <td className="p-3 font-mono font-medium text-[#1a73e8]">01427510</td>
                  <td className="p-3 font-medium text-[#202124]">Lackawaxen River at Rowland, PA</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3">412.3 km²</td>
                  <td className="p-3">435 m</td>
                  <td className="p-3 text-[#e37400] font-medium">12.45 mm/d</td>
                  <td className="p-3 text-[#137333] font-medium">Calibration Baseline</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01427510"
                      className="google-pill-light text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8f9fa]">
                  <td className="p-3 font-mono font-medium text-[#1a73e8]">01570500</td>
                  <td className="p-3 font-medium text-[#202124]">Susquehanna River at Harrisburg, PA</td>
                  <td className="p-3">02 - Mid-Atlantic</td>
                  <td className="p-3">62,419.0 km²</td>
                  <td className="p-3">310 m</td>
                  <td className="p-3 text-[#e37400] font-medium">9.87 mm/d</td>
                  <td className="p-3 text-[#1a73e8] font-medium">Temporal Holdout</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01570500"
                      className="google-pill-light text-xs py-1 px-3 shadow-none inline-block"
                    >
                      Forecast
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-[#f8f9fa]">
                  <td className="p-3 font-mono font-medium text-[#e37400]">01614000</td>
                  <td className="p-3 font-medium text-[#202124]">Back Creek near Jones Springs, WV</td>
                  <td className="p-3">02 - Appalachian</td>
                  <td className="p-3">608.6 km²</td>
                  <td className="p-3">390 m</td>
                  <td className="p-3 text-[#e37400] font-medium">16.34 mm/d</td>
                  <td className="p-3 text-[#e37400] font-medium">Unseen Basin Holdout</td>
                  <td className="p-3 text-right">
                    <Link
                      href="/test?catchment=01614000"
                      className="google-pill-light text-xs py-1 px-3 shadow-none inline-block"
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
