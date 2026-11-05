"use client";

import dynamic from "next/dynamic";
import React from "react";
import { CatchmentGeoFeature } from "@/lib/types";

const CatchmentMapDynamic = dynamic(
  () => import("./CatchmentMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] rounded-lg border border-basin-border bg-basin-midnight flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-basin-cyan border-t-transparent rounded-full animate-spin mb-3" />
        <span>Initializing Interactive Catchment Map & Geometries...</span>
      </div>
    ),
  }
);

interface CatchmentMapProps {
  onSelectCatchment?: (feature: CatchmentGeoFeature) => void;
  selectedCatchmentId?: string;
}

export default function CatchmentMap(props: CatchmentMapProps) {
  return <CatchmentMapDynamic {...props} />;
}
