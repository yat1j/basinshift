"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import CatchmentMap from "@/components/map/CatchmentMap";
import { ArrowRight, ChevronRight, Play, Pause, AlertTriangle, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const [isPlayingBreakout, setIsPlayingBreakout] = useState(true);
  const [isTerrainPlaying, setIsTerrainPlaying] = useState(true);
  const terrainVideoRef = useRef<HTMLVideoElement>(null);

  const toggleTerrainPlay = () => {
    if (!terrainVideoRef.current) return;
    if (isTerrainPlaying) {
      terrainVideoRef.current.pause();
      setIsTerrainPlaying(false);
    } else {
      terrainVideoRef.current.play();
      setIsTerrainPlaying(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* =========================================================================
          SECTION 1 — HERO & DUAL MEDIA SHOWCASE (Side by Side: Photo + Playing Video)
          ========================================================================= */}
      <section className="relative w-full pt-8 sm:pt-12 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        {/* Editorial Headline & Action Pills */}
        <div className="space-y-4 mb-8">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/60 font-mono">
            BASINSHIFT • Predict Beyond the Basin
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white font-sans drop-shadow-sm">
                Discharge Forecasting
              </h1>
              <p className="text-base sm:text-lg text-white/70 mt-2 max-w-2xl leading-relaxed font-normal">
                Hydrology-informed machine learning for river-discharge forecasting and high-flow risk across
                geographically unfamiliar catchments.
              </p>
            </div>

            {/* Glass Pill Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/model" className="glass-pill text-sm py-2 px-6 shadow-sm">
                Our Model
              </Link>
              <Link href="/test" className="glass-pill-solid text-sm py-2 px-6 shadow-md">
                Test the Model
              </Link>
              <Link href="/catchments" className="glass-pill text-sm py-2 px-6 shadow-sm">
                Catchment Explorer
              </Link>
            </div>
          </div>
        </div>

        {/* SIDE-BY-SIDE DUAL MEDIA SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Panel: The Photo (Layered Hydrological Model) */}
          <div className="glass-card relative overflow-hidden border border-white/15 h-[380px] sm:h-[460px] lg:h-[500px] bg-[#080808] flex flex-col justify-between p-5 sm:p-6 group">
            <div className="flex items-center justify-between z-10">
              <span className="glass-pill text-xs py-1 px-3 font-mono">
                Hydrological & Inundation Model
              </span>
              <span className="text-xs text-white/50 font-mono">Dual-Layer Physics</span>
            </div>

            <div className="relative w-full flex-grow my-3 flex items-center justify-center">
              <Image
                src="/media/diagrams/floods_layered_model.jpg"
                alt="Hydrological model and inundation model layered architecture"
                fill
                className="object-contain filter contrast-[1.04]"
                priority
              />
            </div>

            <div className="z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/70 font-sans">
              <div>
                <strong className="text-white">Conceptual Hydrology:</strong> Multi-scale storage & discharge routing
              </div>
              <span className="text-[11px] font-mono text-white/40">USGS / CAMELS Benchmark</span>
            </div>
          </div>

          {/* Right Panel: The Playing Video (3D Geomorphic Terrain Flythrough) */}
          <div className="glass-card relative overflow-hidden border border-white/15 h-[380px] sm:h-[460px] lg:h-[500px] bg-black flex flex-col justify-between group">
            {/* Playing Looping Muted Video */}
            <video
              ref={terrainVideoRef}
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover filter brightness-[0.88] contrast-[1.06]"
            >
              <source src="/media/videos/terrain_flythrough.mp4" type="video/mp4" />
            </video>

            {/* Gradient Overlays for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

            <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between">
              <span className="glass-pill text-xs py-1 px-3 font-mono">
                Catchment Dynamics • 3D Terrain
              </span>
              <span className="text-xs text-white/80 font-mono drop-shadow">Active Orbit</span>
            </div>

            <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between text-xs text-white/80 font-sans">
              <div className="drop-shadow">
                <strong className="text-white">Geomorphology & Drainage:</strong> Topographic river valley relief
              </div>

              {/* Minimalist Pause / Play Control */}
              <button
                onClick={toggleTerrainPlay}
                className="video-pause-btn"
                aria-label={isTerrainPlaying ? "Pause terrain flythrough" : "Play terrain flythrough"}
              >
                {isTerrainPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-white" />
                )}
              </button>
            </div>
          </div>
        </div>
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
          SECTION 4 — REAL SUBMERGED TREES VIDEO BREAKOUT (Matches Screenshot 4)
          ========================================================================= */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-16">
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl h-[380px] sm:h-[460px] md:h-[500px]">
          {/* Real Google Research Floods Alerts Video */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.80] contrast-[1.05]"
          >
            <source src="/media/videos/floods_alerts_video.mp4" type="video/mp4" />
          </video>

          {/* Gradient Overlay for Text Legibility */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Centered Editorial Quote directly over floodwaters (matching Screenshot 4) */}
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <h3 className="max-w-2xl text-2xl sm:text-4xl font-normal text-white drop-shadow-xl leading-snug font-sans">
              To help people worldwide access vital flood information when time is of the essence
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
