"use client";

import React, { useState } from "react";
import { HydrographPoint, ForecastPoint, FeatureMode } from "@/lib/types";

interface HydrographChartProps {
  history: HydrographPoint[];
  forecastHorizons: [number, number, number];
  predictedDischarges: [number, number, number];
  forecastOrigin: string; // ISO or date string
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

  // Generate forecast points based on origin date
  const originDate = new Date(forecastOrigin);
  const forecastPoints: { horizon: number; dateStr: string; discharge: number }[] = forecastHorizons.map(
    (h, idx) => {
      const d = new Date(originDate);
      d.setDate(d.getDate() + h);
      return {
        horizon: h,
        dateStr: d.toISOString().split("T")[0],
        discharge: predictedDischarges[idx],
      };
    }
  );

  // Determine discharge range
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

  // Max precipitation for top hyetograph
  const maxPrecip = Math.max(...history.map((h) => h.precipitation_mm_day || 0), 10);

  // Layout dimensions
  const width = 800;
  const height = 340;
  const margin = { top: 35, right: 40, bottom: 45, left: 55 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Total points along X axis = history points + max horizon (7 days)
  const totalSteps = history.length + 7;

  const getX = (index: number) => {
    return margin.left + (index / (totalSteps - 1)) * plotWidth;
  };

  const getY = (q: number) => {
    const clamped = Math.max(minQ, Math.min(maxQ, q));
    return margin.top + plotHeight - ((clamped - minQ) / (maxQ - minQ)) * plotHeight;
  };

  const getPrecipY = (p: number) => {
    // Inverted hyetograph in top 25% of chart
    const maxBarHeight = plotHeight * 0.28;
    return (p / maxPrecip) * maxBarHeight;
  };

  // Build SVG path for observed discharge (Gauged mode only)
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

  // Build forecast trend path
  let forecastPath = "";
  const originIndex = history.length - 1;
  const originQ =
    mode === "gauged" && history[originIndex]?.observed_discharge_mm_day !== null
      ? history[originIndex].observed_discharge_mm_day!
      : predictedDischarges[0]; // connect from baseline

  const originX = getX(originIndex);
  const originY = getY(originQ);

  forecastPath = `M ${originX} ${originY}`;
  forecastPoints.forEach((fp) => {
    const fpIndex = originIndex + fp.horizon;
    const fx = getX(fpIndex);
    const fy = getY(fp.discharge);
    forecastPath += ` L ${fx} ${fy}`;
  });

  return (
    <div className="w-full bg-basin-midnight border border-basin-border rounded-lg p-4 sm:p-6 select-none relative">
      {/* Chart Title and Legend Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-basin-border/60 gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <span>Hydrograph: Discharge Trajectory</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-basin-surface border border-basin-border text-slate-300">
              {mode === "gauged" ? "Gauged Catchment" : "Ungauged (PUB Mode)"}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical response and multi-day horizons (+1d, +3d, +7d) against regional Q95 threshold
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {mode === "gauged" && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-slate-300" />
              <span className="text-slate-300">Observed Flow</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-basin-cyan dashed border-t-2 border-dashed border-basin-cyanAccent" />
            <span className="text-basin-cyanAccent">Forecast (+1, +3, +7d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-amber-400" />
            <span className="text-amber-400">Q95 High Flow ({q95Threshold} mm)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-900/60 border border-sky-600/50 rounded-sm" />
            <span className="text-slate-400">Precipitation</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((fraction, idx) => {
            const y = margin.top + plotHeight * fraction;
            const qVal = (maxQ - (fraction * (maxQ - minQ))).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="#17293a"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {qVal}
                </text>
              </g>
            );
          })}

          {/* Precipitation Hyetograph (top inverted bars) */}
          {history.map((pt, i) => {
            if (!pt.precipitation_mm_day || pt.precipitation_mm_day <= 0) return null;
            const barH = getPrecipY(pt.precipitation_mm_day);
            const x = getX(i) - 2;
            return (
              <rect
                key={`p-${i}`}
                x={x}
                y={margin.top}
                width="4"
                height={barH}
                fill="#0284c7"
                fillOpacity="0.45"
                rx="1"
              />
            );
          })}

          {/* Q95 Threshold Line */}
          <line
            x1={margin.left}
            y1={getY(q95Threshold)}
            x2={width - margin.right}
            y2={getY(q95Threshold)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.85"
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
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.9"
          />
          <text
            x={originX}
            y={margin.top - 10}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
          >
            Forecast Origin
          </text>

          {/* Gauged Observed Discharge Line */}
          {mode === "gauged" && (
            <path
              d={observedPath}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Observed Points hover triggers */}
          {mode === "gauged" &&
            history.map((pt, i) => {
              if (pt.observed_discharge_mm_day === null) return null;
              const cx = getX(i);
              const cy = getY(pt.observed_discharge_mm_day);
              return (
                <circle
                  key={`obs-${i}`}
                  cx={cx}
                  cy={cy}
                  r="3"
                  className="fill-slate-300 hover:fill-white cursor-pointer transition-colors"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      date: pt.date,
                      type: "observed",
                      discharge: pt.observed_discharge_mm_day,
                      precip: pt.precipitation_mm_day,
                      x: cx,
                      y: cy,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

          {/* Forecast Trajectory Line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#0ea5e9"
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
                  className={isExceedance ? "fill-amber-500 animate-pulse" : "fill-basin-cyan"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={cy - 12}
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

          {/* X-Axis Dates */}
          <line
            x1={margin.left}
            y1={margin.top + plotHeight}
            x2={width - margin.right}
            y2={margin.top + plotHeight}
            stroke="#2e4e6b"
            strokeWidth="1"
          />
          {/* Key Date Labels */}
          {history.length > 0 && (
            <text
              x={margin.left}
              y={margin.top + plotHeight + 18}
              textAnchor="start"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              {history[0].date}
            </text>
          )}
          <text
            x={originX}
            y={margin.top + plotHeight + 18}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="10"
            fontFamily="monospace"
          >
            {forecastOrigin.split("T")[0]}
          </text>
          {forecastPoints.length > 0 && (
            <text
              x={getX(originIndex + 7)}
              y={margin.top + plotHeight + 18}
              textAnchor="end"
              fill="#64748b"
              fontSize="10"
              fontFamily="monospace"
            >
              +{forecastPoints[2].horizon}d ({forecastPoints[2].dateStr})
            </text>
          )}

          {/* Y-Axis Label */}
          <text
            x={-(margin.top + plotHeight / 2)}
            y="18"
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            fontFamily="monospace"
          >
            Discharge (mm/day)
          </text>
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none px-3 py-2 bg-basin-darkest/95 border border-basin-cyan/50 text-white rounded shadow-xl font-mono text-xs"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / height) * 100 - 25)}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-semibold text-basin-cyanAccent">
              {hoveredPoint.type === "forecast" ? `Forecast (+${hoveredPoint.horizon}d)` : "Observed Discharge"}
            </div>
            <div className="text-slate-300 text-[11px]">{hoveredPoint.date}</div>
            <div className="mt-1 flex items-center justify-between gap-4">
              <span className="text-slate-400">Flow:</span>
              <span className="font-bold text-white">
                {hoveredPoint.discharge !== null ? `${hoveredPoint.discharge} mm/day` : "N/A (Ungauged)"}
              </span>
            </div>
            {hoveredPoint.precip !== undefined && (
              <div className="flex items-center justify-between gap-4 text-sky-400">
                <span className="text-slate-400">Precip:</span>
                <span>{hoveredPoint.precip} mm</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ungauged Mode Explicit Technical Explanation */}
      {mode === "ungauged" && (
        <div className="mt-3 p-3 bg-basin-surface/50 border border-basin-border/80 rounded text-xs text-slate-300 flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1 shrink-0" />
          <p className="leading-relaxed">
            <strong className="text-white">Ungauged / PUB (Predictions in Ungauged Basins) Active:</strong> Streamflow
            gauge observations are unavailable at this catchment. Historical observed discharge is omitted to prevent
            fabrication. Discharge forecasts (+1d, +3d, +7d) are generated directly from meteorological forcings,
            topographic characteristics, and reservoir storage dynamics.
          </p>
        </div>
      )}
    </div>
  );
}
