"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface HeroVideoProps {
  videoSrc?: string;
  posterSrc: string;
  className?: string;
}

export default function HeroVideo({
  videoSrc = "/media/videos/river_flow_hero.mp4",
  posterSrc = "/images/backgrounds/hero_river_satellite.jpg",
  className = "",
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setReducedMotion(true);
      setIsPlaying(false);
    }

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) {
        setIsPlaying(false);
        videoRef.current?.pause();
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      {/* Background Video or Poster */}
      {!hasError && !reducedMotion ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.70] contrast-[1.15]"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center filter brightness-[0.65] contrast-[1.1]"
          style={{ backgroundImage: `url(${posterSrc})` }}
        />
      )}

      {/* Atmospheric Editorial Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-basin-darkest via-basin-darkest/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-basin-darkest/80 via-transparent to-basin-darkest/80" />

      {/* Subtle Pause / Play Control */}
      {!hasError && !reducedMotion && (
        <button
          onClick={togglePlayback}
          className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-slate-300 bg-basin-midnight/70 hover:bg-basin-surface border border-basin-border/70 rounded backdrop-blur-sm transition-all focus:outline-none focus:ring-1 focus:ring-basin-cyan"
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
          title={isPlaying ? "Pause video background" : "Play video background"}
        >
          {isPlaying ? <Pause className="w-3 h-3 text-basin-cyanAccent" /> : <Play className="w-3 h-3 text-emerald-400" />}
          <span>{isPlaying ? "Pause Ambient" : "Play Ambient"}</span>
        </button>
      )}
    </div>
  );
}
