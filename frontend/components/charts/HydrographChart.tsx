"use client";

import React, { useState } from "react";
import { HydrographPoint, FeatureMode } from "@/lib/types";

interface HydrographChartProps {
  history: HydrographPoint[];
  forecastHorizons: [number, number, number];
  predictedDischarges: [number, number, number];
  forecastOrigin: string;
  mode: FeatureMode;
  q95Threshold: number;
}

export default function HydrographChart({
  history,
  forecastHorizons,
  predictedDischarges,
  forecastOrigin,
  mode,
  q95Threshold,
}: HydrographChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    type: "observed" | "forecast";
    discharge: number | null;
    precip?: number;
    horizon?: number;
    x: number;
    y: number;
  } | null>(null);

  const originDate = new Date(forecastOrigin);
  const forecastPoints = forecastHorizons.map((h, idx) => {
    const d = new Date(originDate);
    d.setDate(d.getDate() + h);
    return {
      horizon: h,
      dateStr: d.toISOString().split("T")[0],
      discharge: predictedDischarges[idx],
    };
  });

  const allDischarges: number[] = [];
  if (mode === "gauged") {
    history.forEach((h) => {
      if (h.observed_discharge_mm_day !== null && !isNaN(h.observed_discharge_mm_day)) {
        allDischarges.push(h.observed_discharge_mm_day);
      }
    });
  }
  forecastPoints.forEach((p) => allDischarges.push(p.discharge));
  allDischarges.push(q95Threshold);

  const maxQ = Math.max(...allDischarges, 10) * 1.15;
  const minQ = 0;
  const maxPrecip = Math.max(...history.map((h) => h.precipitation_mm_day || 0), 10);

  const width = 800;
  const height = 340;
  const margin = { top: 35, right: 40, bottom: 45, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const totalSteps = history.length + 7;

  const getX = (index: number) => margin.left + (index / (totalSteps - 1)) * plotWidth;
  const getY = (q: number) => {
    const clamped = Math.max(minQ, Math.min(maxQ, q));
    return margin.top + plotHeight - ((clamped - minQ) / (maxQ - minQ)) * plotHeight;
  };
  const getPrecipY = (p: number) => (p / maxPrecip) * (plotHeight * 0.28);

  let observedPath = "";
  if (mode === "gauged" && history.length > 0) {
    history.forEach((pt, i) => {
      if (pt.observed_discharge_mm_day !== null) {
        const x = getX(i);
        const y = getY(pt.observed_discharge_mm_day);
        observedPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
    });
  }

  const originIndex = history.length - 1;
  const originQ =
    mode === "gauged" && history[originIndex]?.observed_discharge_mm_day !== null
      ? history[originIndex].observed_discharge_mm_day!
      : predictedDischarges[0];

  const originX = getX(originIndex);
  const originY = getY(originQ);

  let forecastPath = `M ${originX} ${originY}`;
  forecastPoints.forEach((fp) => {
    const fpIndex = originIndex + fp.horizon;
    const fx = getX(fpIndex);
    const fy = getY(fp.discharge);
    forecastPath += ` L ${fx} ${fy}`;
  });

  return (
    <div className="glass-card p-6 space-y-4">
      {/* Header and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
        <div>
          <h3 className="text-base font-medium text-white">
            Catchment Discharge Hydrograph & Rainfall Hyetograph
          </h3>
          <p className="text-xs text-white/60 mt-0.5">
            Normalized runoff depth (mm/day) against inverted daily precipitation (mm)
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {mode === "gauged" && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-white/60" />
              <span className="text-white/60">Observed</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-sky-400 border-t-2 border-dashed border-sky-400" />
            <span className="text-sky-300 font-bold">Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-amber-400" />
            <span className="text-amber-400">Q95 ({q95Threshold} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500/20 border border-sky-400/40 rounded-sm" />
            <span className="text-white/60">Precipitation</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 overflow-x-auto bg-black/40 rounded-xl p-2 border border-white/5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[620px] overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((fraction, idx) => {
            const y = margin.top + plotHeight * fraction;
            const qVal = (maxQ - fraction * (maxQ - minQ)).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text x={margin.left - 8} y={y + 3} textAnchor="end" fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="monospace">
                  {qVal}
                </text>
              </g>
            );
          })}

          {/* Precipitation Hyetograph */}
          {history.map((pt, i) => {
            if (!pt.precipitation_mm_day || pt.precipitation_mm_day <= 0) return null;
            const barH = getPrecipY(pt.precipitation_mm_day);
            const x = getX(i) - 2;
            return <rect key={`p-${i}`} x={x} y={margin.top} width="4" height={barH} fill="rgba(56, 189, 248, 0.25)" rx="1" />;
          })}

          {/* Q95 Reference Line */}
          <line
            x1={margin.left}
            y1={getY(q95Threshold)}
            x2={width - margin.right}
            y2={getY(q95Threshold)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={width - margin.right - 4}
            y={getY(q95Threshold) - 5}
            textAnchor="end"
            fill="#f59e0b"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Q95 ({q95Threshold} mm/d)
          </text>

          {/* Forecast Origin Vertical Divider */}
          <line
            x1={originX}
            y1={margin.top}
            x2={originX}
            y2={margin.top + plotHeight}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <text
            x={originX}
            y={margin.top - 8}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Origin
          </text>

          {/* Gauged Observed Discharge Line */}
          {mode === "gauged" && (
            <path d={observedPath} fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Forecast Trajectory Line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast Horizon Markers */}
          {forecastPoints.map((fp) => {
            const fpIndex = originIndex + fp.horizon;
            const cx = getX(fpIndex);
            const cy = getY(fp.discharge);
            const isExceedance = fp.discharge >= q95Threshold;
            return (
              <g
                key={`fp-${fp.horizon}`}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredPoint({
                    date: fp.dateStr,
                    type: "forecast",
                    discharge: fp.discharge,
                    horizon: fp.horizon,
                    x: cx,
                    y: cy,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  className={isExceedance ? "fill-amber-500" : "fill-sky-400"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <text
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  +{fp.horizon}d
                </text>
              </g>
            );
          })}

          {/* X Axis */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={width - margin.right}
            y2={margin.top + plotHeight}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1"
          />
          {history.length > 0 && (
            <text x={margin.left} y={margin.top + plotHeight + 18} textAnchor="start" fill="rgba(255, 255, 255, 0.5)" fontSize="10" fontFamily="monospace">
              {history[0].date}
            </text>
          )}
          <text x={originX} y={margin.top + plotHeight + 18} textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="monospace">
            {forecastOrigin.split("T")[0]}
          </text>

          {/* Y Axis Label */}
          <text
            x={-(margin.top + plotHeight / 2)}
            y="18"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="rgba(255, 255, 255, 0.5)"
            fontSize="11"
            fontFamily="monospace"
          >
            Discharge (mm/day)
          </text>
        </svg>

        {/* Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none px-3 py-2 glass-card border border-white/20 text-white rounded-lg shadow-xl font-mono text-xs"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / height) * 100 - 25)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-bold text-sky-400">
              {hoveredPoint.type === "forecast" ? `Forecast (+${hoveredPoint.horizon}d)` : "Observed Flow"}
            </div>
            <div className="text-white/60 text-[11px]">{hoveredPoint.date}</div>
            <div className="mt-1 font-bold text-white">
              {hoveredPoint.discharge !== null ? `${hoveredPoint.discharge} mm/day` : "N/A (Ungauged)"}
            </div>
          </div>
        )}
      </div>

      {mode === "ungauged" && (
        <div className="mt-3 p-3 bg-white/[0.03] border border-white/10 rounded-lg text-xs text-white/60 leading-relaxed">
          <strong className="text-white">Ungauged / PUB Mode:</strong> Historical gauge measurements are unavailable
          at this catchment and are omitted to avoid data fabrication. Predictions rely solely on meteorological forcings
          and linear reservoir routing.
        </div>
      )}
    </div>
  );
}