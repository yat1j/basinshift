"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface HeroVideoProps {
  videoSrc?: string;
  posterSrc: string;
  className?: string;
  children?: React.ReactNode;
}

export default function HeroVideo({
  videoSrc = "/media/videos/google_floods_hero.mp4",
  posterSrc = "/media/satellite/google_flood_hero.png",
  className = "",
  children,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setReducedMotion(true);
      setIsPlaying(false);
    }
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
    <div className={`relative w-full overflow-hidden bg-black ${className}`}>
      {/* Background Video or Poster matching Google Research screenshot 5 */}
      {!hasError && !reducedMotion ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setHasError(true)}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.1]"
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center filter brightness-[0.88] contrast-[1.1]"
          style={{ backgroundImage: `url(${posterSrc})` }}
        />
      )}

      {/* Atmospheric gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40" />

      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full flex flex-col justify-end p-8 sm:p-14">
        {children}
      </div>

      {/* Minimalist Glass Pause Button (matching Screenshot 5) */}
      <button
        onClick={togglePlayback}
        className="video-pause-btn absolute bottom-6 right-6 z-20"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
      </button>
    </div>
  );
}
