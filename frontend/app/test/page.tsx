"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Activity,
  Layers,
  Calendar,
  Settings2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { FeatureMode, ForecastResult } from "@/lib/types";
import { checkBackendHealth, submitPrediction, generateBenchmarkReplay, HealthCheckResult } from "@/lib/api";
import { saveActiveForecast, clearActiveForecast } from "@/lib/store";

interface ParsedDataset {
  filename: string;
  filesize: string;
  rowCount: number;
  columns: string[];
  dateRange: { start: string; end: string } | null;
  missingValuesCount: number;
  duplicateHeaders: string[];
  hasDischargeColumn: boolean;
  rows: Record<string, any>[];
  validationErrors: string[];
  validationWarnings: string[];
}

function DatasetTestingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Operating Form State
  const [operatingMode, setOperatingMode] = useState<FeatureMode>("gauged");
  const [forecastOrigin, setForecastOrigin] = useState<string>("2024-09-15");
  const [catchmentId, setCatchmentId] = useState<string>("01434000");
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);

  // Status & Loading State
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<HealthCheckResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(setBackendHealth);
  }, []);

  // Check URL params for preselected catchment
  useEffect(() => {
    const cid = searchParams.get("catchment");
    if (cid) {
      setCatchmentId(cid);
    }
  }, [searchParams]);

  // Load a pre-configured benchmark sample
  const loadBenchmarkSample = async (sampleName: string, mode: FeatureMode) => {
    setApiError(null);
    setIsLoading(true);
    setLoadingMessage("Loading verified benchmark catchment records...");

    try {
      const res = await fetch(`/samples/${sampleName}`);
      if (!res.ok) throw new Error("Failed to load benchmark file");
      const text = await res.text();
      parseCSVText(text, sampleName, mode);
    } catch (err: any) {
      setApiError(`Could not load benchmark sample: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Parsing and Validation Logic
  const parseCSVText = (csvText: string, filename: string, forcedMode?: FeatureMode) => {
    setApiError(null);
    const mode = forcedMode || operatingMode;

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const headers = results.meta.fields || [];

        // Check duplicate headers
        const headerCounts: Record<string, number> = {};
        const duplicateHeaders: string[] = [];
        headers.forEach((h) => {
          headerCounts[h] = (headerCounts[h] || 0) + 1;
          if (headerCounts[h] === 2) duplicateHeaders.push(h);
        });

        // Validate date column
        const hasDateCol = headers.includes("date");
        const hasDischarge = headers.includes("observed_discharge_mm_day");

        let missingValuesCount = 0;
        let validDateStart: string | null = null;
        let validDateEnd: string | null = null;

        if (hasDateCol && rows.length > 0) {
          validDateStart = rows[0].date;
          validDateEnd = rows[rows.length - 1].date;
          // Set origin to a reasonable default near end
          if (validDateEnd) {
            setForecastOrigin(validDateEnd);
          }
        }

        // Check required features for Variant A
        const validationErrors: string[] = [];
        const validationWarnings: string[] = [];

        if (!hasDateCol) {
          validationErrors.push("Missing required 'date' column (format YYYY-MM-DD).");
        }

        if (rows.length < 30) {
          validationErrors.push(
            `Insufficient records (${rows.length} rows). The feature pipeline requires historical hydrological context.`
          );
        } else if (rows.length < 365) {
          validationWarnings.push(
            `Dataset contains ${rows.length} days of history. 365 days rolling context is recommended for optimal reservoir spin-up.`
          );
        }

        if (duplicateHeaders.length > 0) {
          validationErrors.push(`Duplicate column headers detected: ${duplicateHeaders.join(", ")}`);
        }

        if (mode === "gauged" && !hasDischarge) {
          validationWarnings.push(
            "Selected 'Gauged' mode, but 'observed_discharge_mm_day' column was not found. Switching to Ungauged/PUB mode is recommended."
          );
        }

        if (mode === "ungauged" && hasDischarge) {
          validationWarnings.push(
            "'observed_discharge_mm_day' is present in CSV but will be withheld during Ungauged / PUB inference."
          );
        }

        // Count missing cells in essential columns
        rows.forEach((r) => {
          headers.forEach((h) => {
            if (r[h] === "" || r[h] === undefined || r[h] === null) {
              missingValuesCount++;
            }
          });
        });

        setDataset({
          filename,
          filesize: `${(csvText.length / 1024).toFixed(1)} KB`,
          rowCount: rows.length,
          columns: headers,
          dateRange: validDateStart && validDateEnd ? { start: validDateStart, end: validDateEnd } : null,
          missingValuesCount,
          duplicateHeaders,
          hasDischargeColumn: hasDischarge,
          rows,
          validationErrors,
          validationWarnings,
        });
      },
      error: (err: any) => {
        setApiError(`CSV Parsing Error: ${err?.message || String(err)}`);
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setApiError("Invalid file type. Please upload a standard comma-separated (.csv) file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setApiError("Invalid file format. Only .csv files are supported.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setDataset(null);
    setApiError(null);
    clearActiveForecast();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Prediction Execution
  const handleRunPrediction = async () => {
    if (!dataset || dataset.validationErrors.length > 0) return;

    clearActiveForecast();
    setApiError(null);
    setIsLoading(true);
    setLoadingMessage("Preparing catchment history and generating forecasts…");

    // Attempt backend inference call
    const response = await submitPrediction({
      catchment_id: catchmentId,
      forecast_origin: forecastOrigin,
      operating_mode: operatingMode,
      csv_rows: dataset.rows,
    });

    if (response.success && response.data) {
      saveActiveForecast(response.data);
      router.push("/results");
    } else {
      // If live backend is offline, check if user is running verified benchmark or custom
      if (!response.isBackendConnected) {
        // Honest notification: backend offline
        setApiError(
          `Inference server at ${backendHealth?.url || "http://localhost:8000"} is offline. You can launch the local inference service (Member 1 backend) or view verified benchmark replay results.`
        );
        setIsLoading(false);
      } else {
        setApiError(response.error || "Inference execution failed.");
        setIsLoading(false);
      }
    }
  };

  // Run benchmark demonstration replay
  const handleRunBenchmarkReplay = () => {
    if (!dataset) return;
    setIsLoading(true);
    setLoadingMessage("Preparing catchment history and generating forecasts…");

    setTimeout(() => {
      const replay = generateBenchmarkReplay(
        catchmentId,
        forecastOrigin,
        operatingMode,
        dataset.rows
      );
      saveActiveForecast(replay);
      router.push("/results");
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-screen bg-basin-darkest text-slate-100">
      {/* Editorial Header Banner */}
      <section className="relative py-14 border-b border-basin-border/60 bg-basin-midnight">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="scientific-badge mb-3">Hydrological Testing Laboratory</div>
              <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight uppercase">
                Dataset Testing & Inference
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Provide continuous daily catchment meteorological forcings (minimum 90–365 days rolling context) to
                evaluate river discharge and high-flow probability.
              </p>
            </div>

            {/* Backend Health Status Pill */}
            <div className="font-mono text-xs p-3 bg-basin-surface/70 border border-basin-border rounded-lg flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendHealth?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span className="text-slate-300 font-semibold">Backend Status:</span>
              </div>
              <span className={backendHealth?.connected ? "text-emerald-300" : "text-amber-300"}>
                {backendHealth?.connected ? "Inference API Online" : "Pilot Replay Mode"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Laboratory Workspace */}
      <section className="py-12 bg-basin-darkest flex-grow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Preset Benchmark Quick Selectors */}
          <div className="bg-basin-midnight border border-basin-border rounded-lg p-5">
            <div className="text-xs font-mono text-basin-cyan uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Or Choose a Verified Benchmark Catchment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setOperatingMode("gauged");
                  setCatchmentId("01434000");
                  loadBenchmarkSample("catchment_01434000_gauged.csv", "gauged");
                }}
                className="p-3 bg-basin-surface/50 hover:bg-basin-surface border border-basin-border hover:border-basin-cyan/50 rounded text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-basin-cyanAccent">
                  USGS 01434000 • Gauged Mode
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Neversink River, NY (366 days observed flow & forcings)
                </div>
              </button>

              <button
                onClick={() => {
                  setOperatingMode("ungauged");
                  setCatchmentId("01434000");
                  loadBenchmarkSample("catchment_01434000_ungauged.csv", "ungauged");
                }}
                className="p-3 bg-basin-surface/50 hover:bg-basin-surface border border-basin-border hover:border-amber-400/50 rounded text-left transition-all group"
              >
                <div className="text-xs font-semibold text-amber-300 group-hover:text-amber-200">
                  USGS 01434000 • Ungauged / PUB
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  PUB Mode: Flow observations omitted; meteorology only
                </div>
              </button>

              <button
                onClick={() => {
                  setOperatingMode("gauged");
                  setCatchmentId("01614000");
                  loadBenchmarkSample("unseen_basin_appalachian_gauged.csv", "gauged");
                }}
                className="p-3 bg-basin-surface/50 hover:bg-basin-surface border border-basin-border hover:border-basin-cyan/50 rounded text-left transition-all group"
              >
                <div className="text-xs font-semibold text-white group-hover:text-basin-cyanAccent">
                  USGS 01614000 • Unseen Holdout
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Generalization test basin excluded during model training
                </div>
              </button>
            </div>
          </div>

          {/* Configuration Controls Bar */}
          <div className="bg-basin-midnight border border-basin-border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
            {/* Catchment ID */}
            <div>
              <label className="block text-slate-400 uppercase tracking-wider text-[11px] mb-2">
                Catchment Gauge Identifier
              </label>
              <input
                type="text"
                value={catchmentId}
                onChange={(e) => setCatchmentId(e.target.value)}
                placeholder="e.g. 01434000"
                className="w-full px-3 py-2 bg-basin-surface border border-basin-border rounded text-white focus:outline-none focus:ring-1 focus:ring-basin-cyan font-mono"
              />
            </div>

            {/* Operating Mode Selector */}
            <div>
              <label className="block text-slate-400 uppercase tracking-wider text-[11px] mb-2">
                Operating Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperatingMode("gauged")}
                  className={`py-2 px-3 rounded text-center transition-colors border ${
                    operatingMode === "gauged"
                      ? "bg-basin-teal/80 border-basin-cyan text-white font-bold"
                      : "bg-basin-surface border-basin-border text-slate-400 hover:text-white"
                  }`}
                >
                  Gauged
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingMode("ungauged")}
                  className={`py-2 px-3 rounded text-center transition-colors border ${
                    operatingMode === "ungauged"
                      ? "bg-amber-900/60 border-amber-400 text-amber-200 font-bold"
                      : "bg-basin-surface border-basin-border text-slate-400 hover:text-white"
                  }`}
                >
                  Ungauged / PUB
                </button>
              </div>
            </div>

            {/* Forecast Origin */}
            <div>
              <label className="block text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                <span>Forecast Origin Date</span>
                <Calendar className="w-3.5 h-3.5 text-basin-cyan" />
              </label>
              <input
                type="date"
                value={forecastOrigin}
                onChange={(e) => setForecastOrigin(e.target.value)}
                className="w-full px-3 py-2 bg-basin-surface border border-basin-border rounded text-white focus:outline-none focus:ring-1 focus:ring-basin-cyan font-mono"
              />
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-all ${
              isDragging
                ? "border-basin-cyan bg-basin-surface/70"
                : "border-basin-border hover:border-basin-borderLight bg-basin-midnight/60"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
              id="csv-file-input"
            />
            <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <div className="text-sm font-semibold text-white">
              Drag & Drop Catchment Time Series CSV
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Supports standard hydrological datasets (CAMELS / ERA5-Land / USGS format). Requires date and daily
              meteorological forcings.
            </p>
            <div className="mt-4">
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-basin-surface hover:bg-basin-card border border-basin-border rounded text-xs font-mono font-medium text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-basin-cyan" />
                <span>Browse Local File</span>
              </label>
            </div>
          </div>

          {/* Validation Errors / Alerts */}
          {apiError && (
            <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-lg flex items-start gap-3 text-red-200 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-grow">
                <div className="font-bold text-red-300">Validation / Connection Notice:</div>
                <div className="mt-1 leading-relaxed">{apiError}</div>
                {/* Allow fallback replay if backend is offline */}
                {dataset && !backendHealth?.connected && (
                  <div className="mt-3 pt-3 border-t border-red-800/40 flex items-center gap-3">
                    <button
                      onClick={handleRunBenchmarkReplay}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-xs transition-colors"
                    >
                      Run Historical Replay Demonstration Instead
                    </button>
                    <span className="text-[11px] text-slate-400">
                      (Generates structured pilot benchmark outputs for UI inspection)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsed Dataset Inspection Panel */}
          {dataset && (
            <div className="bg-basin-midnight border border-basin-border rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-basin-border/60 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-basin-border bg-basin-surface flex items-center justify-center text-basin-cyan">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">{dataset.filename}</h3>
                    <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                      <span>Size: {dataset.filesize}</span>
                      <span>•</span>
                      <span>{dataset.rowCount} daily observations</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-mono text-slate-400 hover:text-white bg-basin-surface hover:bg-basin-card border border-basin-border rounded transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear File</span>
                  </button>
                </div>
              </div>

              {/* Dataset Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
                  <div className="text-slate-400 text-[10px] uppercase">Available Date Span</div>
                  <div className="text-white font-semibold mt-1">
                    {dataset.dateRange ? `${dataset.dateRange.start} → ${dataset.dateRange.end}` : "N/A"}
                  </div>
                </div>

                <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
                  <div className="text-slate-400 text-[10px] uppercase">Historical Context</div>
                  <div
                    className={`font-semibold mt-1 ${
                      dataset.rowCount >= 365 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {dataset.rowCount} Days ({dataset.rowCount >= 365 ? "Optimal" : "Sufficient"})
                  </div>
                </div>

                <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
                  <div className="text-slate-400 text-[10px] uppercase">Missing Values</div>
                  <div className="text-white font-semibold mt-1">
                    {dataset.missingValuesCount === 0 ? "0 Missing (Clean)" : `${dataset.missingValuesCount} Cells`}
                  </div>
                </div>

                <div className="p-3 bg-basin-surface/50 border border-basin-border/60 rounded">
                  <div className="text-slate-400 text-[10px] uppercase">Gauge Discharge Column</div>
                  <div
                    className={`font-semibold mt-1 ${
                      dataset.hasDischargeColumn ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {dataset.hasDischargeColumn ? "Present" : "Not Present (PUB)"}
                  </div>
                </div>
              </div>

              {/* Column Inspection */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Detected Variables ({dataset.columns.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dataset.columns.map((col) => (
                    <span
                      key={col}
                      className="px-2 py-0.5 rounded bg-basin-surface border border-basin-border text-[11px] font-mono text-slate-300"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Validation Warnings */}
              {dataset.validationWarnings.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-600/30 rounded text-xs font-mono text-amber-300 space-y-1">
                  {dataset.validationWarnings.map((w, idx) => (
                    <div key={idx}>• {w}</div>
                  ))}
                </div>
              )}

              {/* Data Preview Table (First 5 Rows) */}
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Data Head Preview (First 5 Rows)
                </div>
                <div className="overflow-x-auto border border-basin-border/60 rounded">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-basin-surface/80 text-slate-300">
                      <tr>
                        {dataset.columns.map((c) => (
                          <th key={c} className="p-2 border-b border-basin-border/60 font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-basin-border/40 text-slate-300">
                      {dataset.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-basin-surface/30">
                          {dataset.columns.map((c) => (
                            <td key={c} className="p-2 whitespace-nowrap">
                              {row[c] !== undefined ? String(row[c]) : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submission Action */}
              <div className="pt-4 border-t border-basin-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 font-mono">
                  Origin: <span className="text-white font-bold">{forecastOrigin}</span> • Mode:{" "}
                  <span className="text-basin-cyan uppercase font-bold">{operatingMode}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    disabled={isLoading || dataset.validationErrors.length > 0}
                    onClick={backendHealth?.connected ? handleRunPrediction : handleRunBenchmarkReplay}
                    className="w-full sm:w-auto px-6 py-3 bg-basin-teal hover:bg-basin-teal/90 disabled:opacity-50 text-white rounded font-mono text-xs font-medium uppercase tracking-wider border border-basin-cyan/50 flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Activity className="w-4 h-4 text-basin-cyanAccent" />
                    <span>{isLoading ? "Running Inference..." : "Run Predictions"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay State */}
          {isLoading && (
            <div className="p-8 bg-basin-midnight border border-basin-cyan/40 rounded-lg text-center space-y-3 font-mono">
              <div className="w-8 h-8 border-2 border-basin-cyan border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-semibold text-white">{loadingMessage}</div>
              <p className="text-xs text-slate-400">
                Evaluating 4-linear reservoir states, Ridge baseline, and LightGBM residual hydrograph corrections.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DatasetTestingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-basin-darkest text-slate-200 flex flex-col items-center justify-center p-6 font-mono text-xs">
          <div className="w-8 h-8 border-2 border-basin-cyan border-t-transparent rounded-full animate-spin mb-4" />
          <div>Initializing Testing Laboratory...</div>
        </div>
      }
    >
      <DatasetTestingContent />
    </Suspense>
  );
}
