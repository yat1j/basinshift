"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroVideo from "@/components/ui/HeroVideo";
import CatchmentMap from "@/components/map/CatchmentMap";
import { ArrowRight, ExternalLink, Play, Pause, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [isPlayingBreakout, setIsPlayingBreakout] = useState(true);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124]">
      {/* =========================================================================
          SECTION 1 — HERO BANNER (Matches Screenshot 5 exactly)
          ========================================================================= */}
      <section className="relative w-full">
        <HeroVideo
          posterSrc="/media/satellite/river_sand_satellite.jpg"
          videoSrc="/media/videos/river_flow_hero.mp4"
          className="h-[480px] sm:h-[560px] md:h-[620px]"
        >
          <div className="max-w-6xl mx-auto w-full space-y-6">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white font-sans drop-shadow-md">
              Discharge Forecasting
            </h1>

            {/* Pill Buttons: Matches Screenshot 5 exactly [Paper] [Blog] [Flood Hub] */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/model" className="google-pill text-sm py-2 px-6 shadow-md">
                Our Model
              </Link>
              <Link href="/test" className="google-pill text-sm py-2 px-6 shadow-md">
                Test the Model
              </Link>
              <Link href="/catchments" className="google-pill text-sm py-2 px-6 shadow-md">
                Catchment Explorer
              </Link>
            </div>
          </div>
        </HeroVideo>
      </section>

      {/* =========================================================================
          SECTION 2 — EDITORIAL STORYTELLING (Matches Screenshot 3 exactly)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-normal text-[#202124] tracking-tight leading-[1.15] mb-8 font-sans">
          Using AI to make critical river-discharge forecasting universally accessible
        </h2>

        <div className="text-base sm:text-lg text-[#3c4043] leading-relaxed space-y-6 font-normal">
          <p>
            Every year, floods and extreme river discharge cause thousands of fatalities worldwide, disrupt the lives of
            millions, and cause significant financial damages. To ensure that{" "}
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
            across unfamiliar catchments.
          </p>

          <p>
            Our state-of-the-art models deliver accurate, timely information, empowering researchers, water authorities,
            and disaster managers to respond to crises and keep communities informed. By coupling physical linear
            reservoir routing with regularized gradient-boosted residual correction, our technology generalizes beyond the
            basins a model has observed during training.
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
          SECTION 3 — SUBMERGED TREES / FLOODWATER VIDEO (Matches Screenshot 4 exactly)
          ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="relative rounded-2xl overflow-hidden shadow-sm h-[380px] sm:h-[460px] md:h-[500px]">
          {/* Real submerged floodwaters photo / video */}
          <Image
            src="/media/floods/submerged_floodwaters.jpg"
            alt="Flooded river and submerged trees with high water levels"
            fill
            className="object-cover object-center filter brightness-[0.88] contrast-[1.05]"
          />

          {/* Centered Editorial Quote directly over floodwater (matching Screenshot 4) */}
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <h3 className="max-w-2xl text-2xl sm:text-4xl font-normal text-white drop-shadow-lg leading-snug font-sans">
              To help researchers and water managers access vital discharge forecasts when time is of the essence
            </h3>
          </div>

          {/* Pause button in bottom right corner (Screenshot 4) */}
          <button
            onClick={() => setIsPlayingBreakout(!isPlayingBreakout)}
            className="video-pause-btn absolute bottom-6 right-6 z-20"
            aria-label="Pause media"
          >
            {isPlayingBreakout ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          </button>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4 — CATCHMENT EXPLORER / FLOOD HUB (Matches Screenshot 1 exactly)
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="max-w-4xl space-y-5 mb-10">
          <h2 className="text-3xl sm:text-4xl font-normal text-[#202124] tracking-tight font-sans">
            Catchment Explorer
          </h2>

          <p className="text-base sm:text-lg text-[#3c4043] leading-relaxed">
            <strong className="text-[#202124] font-medium">Catchment Explorer</strong> is a visual resource that displays
            drainage maps, discharge trends, and multi-day flood forecasts based on our hydrology-informed AI models and
            verified benchmark data sources. It is designed to meet the needs of researchers, hydrological agencies, and
            communities directly at risk. With forecasts up to 7 days in advance (+1d, +3d, +7d) for riverine basins, users
            are able to assess the situation to take timely action. All benchmark data in BASINSHIFT is publicly
            available for reproducible research.
          </p>

          <p className="text-base sm:text-lg text-[#3c4043] leading-relaxed">
            These hydrology-informed forecasts evaluate generalization across both familiar and geographically unfamiliar
            ungauged basins.
          </p>

          <p className="text-base sm:text-lg text-[#3c4043] leading-relaxed">
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

        {/* Interactive Map Presentation Container (Screenshot 1) */}
        <div className="google-card overflow-hidden shadow-sm">
          {/* Header inside Map container */}
          <div className="p-4 bg-white border-b border-[#dadce0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[#202124]">BASINSHIFT Explorer</span>
              <span className="text-xs text-[#5f6368]">• Verified Benchmark Streamgages</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/test"
                className="text-xs font-medium text-[#1a73e8] hover:text-[#174ea6] flex items-center gap-1"
              >
                <span>Upload Catchment History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Real Leaflet Map */}
          <div className="h-[520px]">
            <CatchmentMap />
          </div>
        </div>

        {/* Caption underneath Map (matching Screenshot 1: 'Flood Hub currently covers...') */}
        <p className="text-center text-xs text-[#5f6368] mt-4 font-normal">
          <em className="text-[#202124] font-medium not-italic">Catchment Explorer</em> currently benchmarks against
          verified USGS streamgage stations and CAMELS drainage basins.
        </p>
      </section>

      {/* =========================================================================
          SECTION 5 — ALERTS AND NOTIFICATIONS (Matches Screenshot 2 exactly)
          ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#dadce0]/60">
        <h2 className="text-3xl sm:text-4xl font-normal text-[#202124] tracking-tight mb-4 font-sans">
          Alerts and notifications
        </h2>
        <p className="text-base sm:text-lg text-[#3c4043] leading-relaxed mb-12">
          In addition to continuous discharge trajectories, BASINSHIFT computes calibrated high-flow exceedance
          probabilities against regional Q95 thresholds to help researchers and water managers anticipate severe crest
          events.
        </p>

        {/* Centered Phone Notification Mockup Card (Screenshot 2) */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white border border-[#dadce0] rounded-2xl shadow-lg overflow-hidden">
            {/* Card Content Header */}
            <div className="p-6 space-y-4">
              <p className="text-sm sm:text-base text-[#202124] leading-relaxed">
                By tomorrow morning, Neversink River is expected to rise compared to this morning. High-flow exceedance
                probability elevated to 42% (Q95 threshold: 14.82 mm/day). Please be cautious if monitoring the riverfront.
              </p>

              <div className="text-xs text-[#5f6368]">4 hours ago</div>

              <div className="pt-2">
                <Link
                  href="/results"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] text-[#202124] text-xs font-medium rounded-full transition-colors"
                >
                  <span>See more in Forecast Results</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Bottom Forecast Snippet (Screenshot 2) */}
            <div className="border-t border-[#dadce0] bg-[#f8f9fa] p-4">
              <div className="text-xs font-medium text-[#202124] mb-2">
                Discharge prediction for tomorrow morning
              </div>
              <div className="relative h-44 rounded-lg overflow-hidden border border-[#dadce0]">
                <Image
                  src="/media/rivers/river_floodplain_meander.jpg"
                  alt="Flood prediction catchment river channel"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <div className="text-white text-xs font-mono">
                    Station 01434000 • +1d Crest: 5.24 mm/day
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6 — BOTTOM CTA (Clean Google Research style)
          ========================================================================= */}
      <section className="py-20 bg-[#f8f9fa] border-t border-[#dadce0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-normal text-[#202124] tracking-tight">
            Explore the BASINSHIFT Forecasting Platform
          </h2>
          <p className="text-base text-[#5f6368] max-w-xl mx-auto">
            Test the two-stage hybrid model with catchment time series or explore verified benchmark basins.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link href="/test" className="google-pill text-sm py-2.5 px-6 shadow-sm">
              Test the Model
            </Link>
            <Link href="/model" className="google-pill-light text-sm py-2.5 px-6">
              Read Model Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
