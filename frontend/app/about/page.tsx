import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, ArrowRight, BookOpen, Compass, Layers, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100 pb-20">
      {/* Editorial Header */}
      <section className="relative py-20 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="scientific-badge mb-4">Project Overview & Scientific Ethics</div>
          <h1 className="text-3xl sm:text-5xl font-light text-white tracking-tight uppercase">
            About BASINSHIFT
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            Predict Beyond the Basin. A scientific research initiative investigating whether hydrology-informed machine
            learning can overcome spatial distribution shift in ungauged and unfamiliar river basins.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* Core Mission */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <h2 className="text-2xl font-light text-white">The Generalization Mission</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Global river networks are predominantly unmonitored. Standard streamflow forecasting algorithms perform
              well only in catchments where decades of historical gauge records exist to memorize local runoff curves.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              BASINSHIFT addresses the fundamental question:{" "}
              <em className="text-slate-200">
                Can machine learning learn transferable physical relationships that generalize across unseen drainage
                geologies?
              </em>{" "}
              By incorporating multi-scale linear reservoirs and strict spatial holdouts, BASINSHIFT decouples hydrological
              routing mechanics from localized station bias.
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-lg overflow-hidden border border-basin-border">
              <Image
                src="/media/monitoring/gauging_station_field.jpg"
                alt="Hydrological gauging station and field telemetry"
                width={600}
                height={400}
                className="w-full h-64 object-cover"
              />
            </div>
          </div>
        </section>

        {/* Operational Scope & Limitations */}
        <section id="limitations" className="bg-basin-midnight border border-basin-border rounded-lg p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-basin-border/60">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
              Operational Scope & What BASINSHIFT Is NOT
            </h2>
          </div>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Scientific clarity requires unambiguous separation between river discharge forecasting, flood inundation
            mapping, and emergency management. BASINSHIFT explicitly adheres to the following operational boundaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 bg-basin-surface/40 border border-basin-border rounded space-y-1.5">
              <div className="text-amber-400 font-bold uppercase text-[11px]">• Not a Street-Level Flood Predictor</div>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                BASINSHIFT forecasts volumetric river discharge (mm/day) at catchment outlets. It does not predict
                hyper-local street inundation or building-level water depth.
              </p>
            </div>

            <div className="p-4 bg-basin-surface/40 border border-basin-border rounded space-y-1.5">
              <div className="text-amber-400 font-bold uppercase text-[11px]">• Not an Emergency Warning Service</div>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Outputs are experimental research predictions and must not be used as an official flood warning or as
                the sole basis for life safety, evacuation, or operational dam operations.
              </p>
            </div>

            <div className="p-4 bg-basin-surface/40 border border-basin-border rounded space-y-1.5">
              <div className="text-amber-400 font-bold uppercase text-[11px]">• Reanalysis vs. Operational NWP</div>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                The current research prototype is calibrated on historical reanalysis records (ERA5-Land / Daymet) and
                does not ingest an active live weather radar feed.
              </p>
            </div>

            <div className="p-4 bg-basin-surface/40 border border-basin-border rounded space-y-1.5">
              <div className="text-amber-400 font-bold uppercase text-[11px]">• Expert Oversight Required</div>
              <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                Hydrological risk assessments must be reviewed in conjunction with official government hydro-meteorological
                agencies and localized catchment knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* Data Provenance & Methodology */}
        <section className="bg-basin-midnight border border-basin-border rounded-lg p-6 sm:p-8 space-y-4 font-mono text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Data Provenance & Validation Philosophy
          </h2>
          <p className="text-slate-300 text-xs font-sans leading-relaxed">
            All models are calibrated and evaluated using peer-reviewed hydrological datasets:
          </p>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li>
              • <strong className="text-white">CAMELS Dataset (Addor et al., 2017):</strong> Catchment Attributes and
              Meteorology for Large-Sample Studies, covering 671 minimally managed US watersheds.
            </li>
            <li>
              • <strong className="text-white">USGS NWIS:</strong> Verified daily streamflow discharge observations from
              the National Water Information System.
            </li>
            <li>
              • <strong className="text-white">Spatial Holdout Design:</strong> Validation catchments are withheld
              geographically before feature scaling and reservoir optimization to ensure strict out-of-sample integrity.
            </li>
          </ul>
        </section>

        {/* Navigation Action */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-basin-border/60">
          <Link
            href="/resources"
            className="text-xs font-mono text-basin-cyanAccent hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Examine Documentation & Scientific References</span>
          </Link>

          <Link
            href="/test"
            className="px-6 py-2.5 bg-basin-teal hover:bg-basin-teal/90 text-white rounded font-mono text-xs font-medium border border-basin-cyan/40 transition-colors flex items-center gap-2"
          >
            <span>Open Dataset Testing Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
