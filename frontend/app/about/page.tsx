import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, ArrowRight, BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Editorial Header */}
      <section className="py-20 sm:py-24 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-3 font-mono">
            Mission & Operational Scope
          </div>
          <h1 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-tight font-sans">
            About BASINSHIFT
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/80 max-w-3xl leading-relaxed font-normal">
            Predict Beyond the Basin. A scientific research initiative investigating whether hydrology-informed machine
            learning can overcome spatial distribution shift in ungauged and unfamiliar river basins.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {/* Core Mission */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-normal text-white font-sans">
              The Generalization Mission
            </h2>
            <p className="text-base text-white/70 leading-relaxed font-normal">
              Global river networks are predominantly unmonitored. Standard streamflow forecasting algorithms perform
              well only in catchments where decades of historical gauge records exist to memorize local runoff curves.
            </p>
            <p className="text-base text-white/70 leading-relaxed font-normal">
              BASINSHIFT addresses the fundamental question:{" "}
              <em className="text-white not-italic font-medium">
                Can machine learning learn transferable physical relationships that generalize across unseen drainage
                geologies?
              </em>{" "}
              By incorporating multi-scale linear reservoirs and strict spatial holdouts, BASINSHIFT decouples hydrological
              routing mechanics from localized station bias.
            </p>
          </div>
          <div className="md:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
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
        <section id="limitations" className="glass-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-white/10">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-lg font-medium text-white font-sans">
              Operational Scope & What BASINSHIFT Is NOT
            </h2>
          </div>

          <p className="text-sm text-white/70 leading-relaxed">
            Scientific clarity requires unambiguous separation between river discharge forecasting, flood inundation
            mapping, and emergency management. BASINSHIFT explicitly adheres to the following operational boundaries:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <div className="text-amber-400 font-medium">• Not a Street-Level Flood Predictor</div>
              <p className="text-white/60 leading-relaxed">
                BASINSHIFT forecasts volumetric river discharge (mm/day) at catchment outlets. It does not predict
                hyper-local street inundation or building-level water depth.
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <div className="text-amber-400 font-medium">• Not an Emergency Warning Service</div>
              <p className="text-white/60 leading-relaxed">
                Outputs are experimental research predictions and must not be used as an official flood warning or as
                the sole basis for life safety, evacuation, or operational dam operations.
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <div className="text-amber-400 font-medium">• Reanalysis vs. Operational NWP</div>
              <p className="text-white/60 leading-relaxed">
                The current research prototype is calibrated on historical reanalysis records (ERA5-Land) and does not
                ingest a live operational weather radar feed.
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-1.5">
              <div className="text-amber-400 font-medium">• Expert Oversight Required</div>
              <p className="text-white/60 leading-relaxed">
                Hydrological risk assessments must be reviewed in conjunction with official government hydro-meteorological
                agencies and localized catchment knowledge.
              </p>
            </div>
          </div>
        </section>

        {/* Data Provenance & Methodology */}
        <section className="glass-card p-6 sm:p-8 space-y-4 text-xs">
          <h2 className="text-base font-medium text-white font-sans">
            Data Provenance & Validation Philosophy
          </h2>
          <ul className="space-y-2 text-white/70 text-xs leading-relaxed">
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
              geographically before model training to ensure strict out-of-sample integrity.
            </li>
          </ul>
        </section>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10">
          <Link
            href="/resources"
            className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 font-medium editorial-link"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Examine Documentation & Scientific References</span>
          </Link>

          <Link href="/test" className="glass-pill-solid text-xs py-2.5 px-7 shadow-lg">
            <span>Open Dataset Testing Lab</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}