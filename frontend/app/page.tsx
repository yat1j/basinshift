"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroVideo from "@/components/ui/HeroVideo";
import CatchmentMap from "@/components/map/CatchmentMap";
import { ArrowRight, ChevronRight, Play, Pause, AlertTriangle, ShieldCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* =========================================================================
          SECTION 1 — HERO BANNER (Matches Screenshot 5 exactly)
          ========================================================================= */}
      <section className="relative w-full">
        <HeroVideo
          posterSrc="/media/satellite/google_flood_hero.png"
          videoSrc="/media/videos/google_floods_hero.mp4"
          className="h-[480px] sm:h-[560px] md:h-[620px]"
        >
          <div className="max-w-6xl mx-auto w-full space-y-6">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white font-sans drop-shadow-lg">
              Discharge Forecasting
            </h1>

            {/* Glass Pill Buttons (Screenshot 5 style) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/model" className="glass-pill text-sm py-2 px-6 shadow-md">
                Our Model
              </Link>
              <Link href="/test" className="glass-pill text-sm py-2 px-6 shadow-md">
                Test the Model
              </Link>
              <Link href="/catchments" className="glass-pill text-sm py-2 px-6 shadow-md">
                Catchment Explorer
              </Link>
            </div>
          </div>
        </HeroVideo>
      </section>

      {/* =========================================================================
          SECTION 2 — EDITORIAL STORYTELLING (Matches Screenshot 3: White on Pitch Black)
          ========================================================================= */}
      <section className="pt-14 pb-16 sm:pt-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-normal text-white tracking-tight leading-[1.18] mb-8 font-sans">
          Using AI to make critical river-discharge forecasting universally accessible
        </h2>

        <div className="text-base sm:text-lg text-white/80 leading-relaxed space-y-6 font-normal">
          <p>
            Every year, floods and catastrophic river discharge cause thousands of fatalities worldwide, disrupt the
            lives of millions, and cause significant financial damages. To ensure that{" "}
            <Link href="/problem" className="editorial-link">
              no one is surprised
            </Link>{" "}
            by these hydrological extremes and to help communities better prepare, BASINSHIFT has developed
            hydrology-informed machine learning models to forecast{" "}
            <Link href="/model" className="editorial-link">
              river discharge
            </Link>{" "}
            and{" "}
            <Link href="/evaluation" className="editorial-link">
              high-flow risk
            </Link>{" "}
            across geographically unfamiliar catchments.
          </p>

          <p>
            Our state-of-the-art models deliver accurate, timely information, empowering researchers, regional water
            authorities, and emergency managers to respond to crises and keep communities informed. By coupling physical
            linear reservoir routing with regularized gradient-boosted residual trees, our technology generalizes beyond
            the basins a model has observed during training.
          </p>

          <p>
            Our forecasting models are part of the open hydrological research initiative for planetary water intelligence,
            benchmarked against verified data from the{" "}
            <Link href="/resources" className="editorial-link">
              CAMELS benchmark
            </Link>{" "}
            and the{" "}
            <Link href="/catchments" className="editorial-link">
              USGS streamgage network
            </Link>
            .
          </p>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3 — REAL FLOOD IMPACT & PROBLEM FACED PHOTOS (Matches Google Research)
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/10">
        <div className="max-w-3xl mb-12">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-2 font-mono">
            Ground Reality & Human Impact
          </div>
          <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight mb-4 font-sans">
            When rivers rise, early forecasting protects communities
          </h2>
          <p className="text-base text-white/70 leading-relaxed">
            Over 1.8 billion people are exposed to significant flood risk globally. In ungauged basins lacking localized
            hydrological telemetry, sudden rainfall produces unforecasted crests that inundate villages, wash away
            bridges, and destroy livelihoods.
          </p>
        </div>

        {/* Real Ground Photos Grid from Google Research Media */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src="/media/floods/when_rivers_rise.png"
                alt="River overflow inundating rural floodplain communities"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-sm font-medium text-white">Riverfront Inundation</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Seasonal crests in unmonitored headwaters overflow riparian banks before downstream communities receive
                official warnings.
              </p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src="/media/floods/affected_community_person.jpg"
                alt="Community member affected by flash flooding"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-sm font-medium text-white">Vulnerable Catchments</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Smallholder farmers and rural populations bear the heaviest economic losses when flash discharge is
                underestimated.
              </p>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="relative h-64 w-full">
              <Image
                src="/media/floods/flood_relief_workers.jpg"
                alt="Emergency response and relief workers in flooded settlement"
                fill
                className="object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="text-sm font-medium text-white">Emergency Response Delay</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Reliable multi-day discharge predictions (+1d to +7d) give local authorities the lead time needed to
                deploy evacuation aid.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — LAYERED HYDROLOGICAL MODEL & SATELLITE EARTH OBSERVATION (SIDE BY SIDE)
          ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Hydrological & Inundation Layered Model Architecture Photo */}
          <div className="glass-card overflow-hidden border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center bg-[#0a0a0a] shadow-2xl">
            <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] rounded-xl overflow-hidden flex items-center justify-center bg-white/[0.02]">
              <Image
                src="/media/floods_layered_model.png"
                alt="Hydrological and Inundation Layered Model Architecture"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </div>

          {/* Right Column: High-Resolution Satellite & Earth Observation Video */}
          <div className="glass-card overflow-hidden border border-white/10 rounded-2xl p-4 flex flex-col justify-center items-center bg-[#0a0a0a] shadow-2xl">
            <div className="relative w-full h-[280px] sm:h-[340px] md:h-[380px] rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover filter brightness-[0.95] contrast-[1.05]"
              >
                <source src="/media/videos/earth_imagery_video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5 — CATCHMENT EXPLORER / FLOOD HUB (Matches Screenshot 1)
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/10">
        <div className="max-w-4xl space-y-5 mb-10">
          <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-sans">
            Catchment Explorer
          </h2>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
            <strong className="text-white font-medium">Catchment Explorer</strong> is a visual resource that displays
            drainage maps, discharge trends, and multi-day flood forecasts based on our hydrology-informed AI models and
            verified benchmark data sources. It is designed to meet the needs of researchers, hydrological agencies, and
            communities directly at risk. With forecasts up to 7 days in advance (+1d, +3d, +7d) for riverine basins, users
            are able to assess the situation to take timely action. All benchmark data in BASINSHIFT is publicly
            available for reproducible research.
          </p>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
            These hydrology-informed forecasts evaluate generalization across both familiar and geographically unfamiliar
            ungauged basins.
          </p>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed">
            We also provide researchers and experts with additional data — via an{" "}
            <Link href="/test" className="editorial-link">
              API
            </Link>
            , the open-sourced{" "}
            <Link href="/model" className="editorial-link">
              hydrology model
            </Link>
            , the{" "}
            <Link href="/resources" className="editorial-link">
              CAMELS reanalysis dataset
            </Link>{" "}
            and the{" "}
            <Link href="/evaluation" className="editorial-link">
              generalization benchmark suite
            </Link>
            .
          </p>
        </div>

        {/* Map Container */}
        <div className="glass-card overflow-hidden shadow-2xl">
          <div className="p-4 bg-black/60 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-white">BASINSHIFT Explorer</span>
              <span className="text-xs text-white/60">• Verified Benchmark Streamgages</span>
            </div>
            <Link href="/test" className="text-xs font-medium text-white hover:text-white/80 flex items-center gap-1">
              <span>Upload Catchment History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-[520px]">
            <CatchmentMap />
          </div>
        </div>

        <p className="text-center text-xs text-white/60 mt-4">
          <em className="text-white font-medium not-italic">Catchment Explorer</em> currently benchmarks against verified
          USGS streamgage stations and CAMELS drainage basins.
        </p>
      </section>

      {/* =========================================================================
          SECTION 6 — ALERTS AND NOTIFICATIONS (Matches Screenshot 2)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-normal text-white tracking-tight mb-4 font-sans">
          Alerts and notifications
        </h2>
        <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-12">
          In addition to continuous discharge trajectories, BASINSHIFT computes calibrated high-flow exceedance
          probabilities against regional Q95 thresholds to help researchers and water managers anticipate severe crest
          events.
        </p>

        {/* Centered Phone Notification Mockup Card (Screenshot 2) */}
        <div className="flex justify-center">
          <div className="w-full max-w-md glass-card border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <p className="text-sm sm:text-base text-white leading-relaxed">
                By tomorrow morning, Neversink River is expected to rise compared to this morning. High-flow exceedance
                probability elevated to 42% (Q95 threshold: 14.82 mm/day). Please be cautious if monitoring the riverfront.
              </p>

              <div className="text-xs text-white/60">4 hours ago</div>

              <div className="pt-2">
                <Link
                  href="/results"
                  className="glass-pill text-xs py-2 px-5 inline-flex items-center gap-1.5"
                >
                  <span>See more in Forecast Results</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Real Flood River Photo Snippet */}
            <div className="border-t border-white/10 bg-black/40 p-4">
              <div className="text-xs font-medium text-white mb-2">
                Discharge prediction for tomorrow morning
              </div>
              <div className="relative h-44 rounded-lg overflow-hidden border border-white/10">
                <Image
                  src="/media/floods/when_rivers_rise.png"
                  alt="Flood prediction catchment river channel"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <div className="text-white text-xs font-mono">
                    Station 01434000 • +1d Forecast Crest: 5.24 mm/day
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 — BOTTOM CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 border-t border-white/10 bg-[#060606]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-normal text-white tracking-tight">
            Explore the BASINSHIFT Forecasting Platform
          </h2>
          <p className="text-base text-white/70 max-w-xl mx-auto">
            Test the two-stage hybrid model with catchment time series or explore verified benchmark basins.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/test" className="glass-pill-solid text-sm py-2.5 px-6 shadow-lg">
              Test the Model
            </Link>
            <Link href="/model" className="glass-pill text-sm py-2.5 px-6">
              Read Model Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
