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
  Calendar,
  Trash2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { FeatureMode } from "@/lib/types";
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

  // Query parameter pre-selection
  useEffect(() => {
    const sampleQuery = searchParams.get("sample");
    const modeQuery = searchParams.get("mode") as FeatureMode | null;
    const catchmentQuery = searchParams.get("catchment");

    if (modeQuery) setOperatingMode(modeQuery);
    if (catchmentQuery) setCatchmentId(catchmentQuery);

    if (sampleQuery) {
      loadBenchmarkSample(sampleQuery, modeQuery || "gauged");
    }

    checkBackendHealth().then((health) => setBackendHealth(health));
  }, [searchParams]);

  const loadBenchmarkSample = async (filename: string, mode: FeatureMode) => {
    setIsLoading(true);
    setLoadingMessage(`Loading benchmark sample: ${filename}…`);
    setApiError(null);

    try {
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load benchmark file: ${response.statusText}`);
      }
      const text = await response.text();
      parseCSVText(text, filename);
    } catch (err: any) {
      setApiError(err.message || "Failed to load benchmark sample.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSVText = (csvText: string, filename: string) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        validateAndSetDataset(results.data as Record<string, any>[], results.meta.fields || [], filename, csvText.length);
      },
      error: (error: any) => {
        setApiError(`CSV Parsing error: ${error?.message || String(error)}`);
      },
    });
  };

  const validateAndSetDataset = (
    rows: Record<string, any>[],
    columns: string[],
    filename: string,
    byteLength: number
  ) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rows.length === 0) {
      errors.push("Dataset contains no rows.");
    }

    // Check for date column
    const dateCol = columns.find(
      (c) => c.toLowerCase() === "date" || c.toLowerCase() === "datetime" || c.toLowerCase() === "time"
    );

    if (!dateCol) {
      errors.push("Missing required 'date' column. Expected daily ISO timestamps (YYYY-MM-DD).");
    }

    // Check length
    if (rows.length < 90) {
      warnings.push(`Dataset length is ${rows.length} days. Hydrological reservoir spin-up requires ≥ 90 days (365 days recommended).`);
    }

    // Check for observed discharge column
    const dischargeCol = columns.find(
      (c) =>
        c.toLowerCase().includes("discharge") ||
        c.toLowerCase().includes("q_obs") ||
        c.toLowerCase() === "q" ||
        c.toLowerCase().includes("flow")
    );

    if (operatingMode === "gauged" && !dischargeCol) {
      warnings.push("Operating mode set to Gauged, but no observed discharge column found. Switching to Ungauged/PUB mode.");
      setOperatingMode("ungauged");
    }

    // Calculate missing values
    let missingCount = 0;
    rows.forEach((row) => {
      columns.forEach((col) => {
        if (row[col] === null || row[col] === undefined || row[col] === "") {
          missingCount++;
        }
      });
    });

    if (missingCount > 0) {
      warnings.push(`Detected ${missingCount} empty cells. Missing meteorological forcings will be linearly forward-filled.`);
    }

    // Extract date range
    let dateRange = null;
    if (dateCol && rows.length > 0) {
      const firstDate = String(rows[0][dateCol]);
      const lastDate = String(rows[rows.length - 1][dateCol]);
      dateRange = { start: firstDate, end: lastDate };
      if (lastDate && !isNaN(Date.parse(lastDate))) {
        setForecastOrigin(lastDate.split("T")[0]);
      }
    }

    const filesizeFormatted =
      byteLength > 1024 * 1024
        ? `${(byteLength / (1024 * 1024)).toFixed(2)} MB`
        : `${(byteLength / 1024).toFixed(1)} KB`;

    setDataset({
      filename,
      filesize: filesizeFormatted,
      rowCount: rows.length,
      columns,
      dateRange,
      missingValuesCount: missingCount,
      duplicateHeaders: [],
      hasDischargeColumn: !!dischargeCol,
      rows,
      validationErrors: errors,
      validationWarnings: warnings,
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

  const handleRunPrediction = async () => {
    if (!dataset || dataset.validationErrors.length > 0) return;

    clearActiveForecast();
    setApiError(null);
    setIsLoading(true);
    setLoadingMessage("Preparing catchment history and generating forecasts…");

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
      if (!response.isBackendConnected) {
        setApiError(
          `Inference server at ${backendHealth?.url || "http://localhost:8000"} is offline. You can launch Member 1's backend or run the verified benchmark replay.`
        );
        setIsLoading(false);
      } else {
        setApiError(response.error || "Inference execution failed.");
        setIsLoading(false);
      }
    }
  };

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
      setIsLoading(false);
      router.push("/results");
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Editorial Header */}
      <section className="py-16 border-b border-white/10 bg-[#060606]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-white/60 mb-2 font-mono">
                Hydrological Testing Laboratory
              </div>
              <h1 className="text-3xl sm:text-4xl font-normal text-white tracking-tight font-sans">
                Dataset Testing & Inference
              </h1>
              <p className="text-sm text-white/70 mt-2 max-w-2xl leading-relaxed">
                Provide continuous daily catchment meteorological forcings (minimum 90–365 days rolling context) to
                evaluate river discharge and high-flow exceedance risk.
              </p>
            </div>

            <div className="text-xs p-3 glass-card flex items-center gap-2 text-white/80">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.connected ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span>Inference Engine:</span>
              <strong className={backendHealth?.connected ? "text-emerald-400" : "text-amber-400"}>
                {backendHealth?.connected ? "API Connected" : "Benchmark Pilot Mode"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-grow">
        {/* Presets */}
        <div className="glass-card p-6 space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center gap-2 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Select a Verified Benchmark Catchment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setOperatingMode("gauged");
                setCatchmentId("01434000");
                loadBenchmarkSample("catchment_01434000_gauged.csv", "gauged");
              }}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left transition-all hover:border-white/30"
            >
              <div className="text-sm font-medium text-white">USGS 01434000 • Gauged</div>
              <div className="text-xs text-white/60 mt-1">
                Neversink River, NY (366 days observed flow & forcings)
              </div>
            </button>

            <button
              onClick={() => {
                setOperatingMode("ungauged");
                setCatchmentId("01434000");
                loadBenchmarkSample("catchment_01434000_ungauged.csv", "ungauged");
              }}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left transition-all hover:border-amber-400/40"
            >
              <div className="text-sm font-medium text-amber-300">USGS 01434000 • Ungauged / PUB</div>
              <div className="text-xs text-white/60 mt-1">
                PUB Mode: Flow observations omitted; meteorology only
              </div>
            </button>

            <button
              onClick={() => {
                setOperatingMode("gauged");
                setCatchmentId("01614000");
                loadBenchmarkSample("unseen_basin_appalachian_gauged.csv", "gauged");
              }}
              className="p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left transition-all hover:border-white/30"
            >
              <div className="text-sm font-medium text-white">USGS 01614000 • Unseen Holdout</div>
              <div className="text-xs text-white/60 mt-1">
                Generalization test basin excluded during model training
              </div>
            </button>
          </div>
        </div>

        {/* Form Controls */}
        <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block text-white/70 font-medium uppercase tracking-wider text-[11px] mb-2 font-mono">
              Catchment Gauge ID
            </label>
            <input
              type="text"
              value={catchmentId}
              onChange={(e) => setCatchmentId(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50"
            />
          </div>

          <div>
            <label className="block text-white/70 font-medium uppercase tracking-wider text-[11px] mb-2 font-mono">
              Operating Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperatingMode("gauged")}
                className={`py-2 px-3 rounded-lg text-center border text-xs font-medium transition-colors ${
                  operatingMode === "gauged"
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                Gauged
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode("ungauged")}
                className={`py-2 px-3 rounded-lg text-center border text-xs font-medium transition-colors ${
                  operatingMode === "ungauged"
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                Ungauged / PUB
              </button>
            </div>
          </div>

          <div>
            <label className="block text-white/70 font-medium uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between font-mono">
              <span>Forecast Origin Date</span>
              <Calendar className="w-3.5 h-3.5 text-white/50" />
            </label>
            <input
              type="date"
              value={forecastOrigin}
              onChange={(e) => setForecastOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
            isDragging
              ? "border-white bg-white/10"
              : "border-white/20 bg-white/[0.02] hover:border-white/40"
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
          <UploadCloud className="w-10 h-10 mx-auto text-white/60 mb-3" />
          <div className="text-base font-medium text-white">
            Drag & Drop Catchment Time Series CSV
          </div>
          <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
            Supports standard hydrological datasets (CAMELS / ERA5-Land / USGS format). Requires date and daily
            meteorological forcings.
          </p>
          <div className="mt-4">
            <label
              htmlFor="csv-file-input"
              className="glass-pill text-xs py-2 px-5 inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Browse Local File</span>
            </label>
          </div>
        </div>

        {/* Errors */}
        {apiError && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Notice:</span>
            </div>
            <p>{apiError}</p>
            {dataset && !backendHealth?.connected && (
              <div className="pt-2">
                <button
                  onClick={handleRunBenchmarkReplay}
                  className="glass-pill text-xs py-1.5 px-4"
                >
                  Run Verified Benchmark Replay Instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dataset Preview */}
        {dataset && (
          <div className="glass-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
              <div>
                <h3 className="text-base font-medium text-white">{dataset.filename}</h3>
                <div className="text-xs text-white/60 mt-0.5">
                  {dataset.rowCount} daily records • {dataset.filesize}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-white/60 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">Date Span</div>
                <div className="text-white font-medium mt-1">
                  {dataset.dateRange ? `${dataset.dateRange.start} → ${dataset.dateRange.end}` : "N/A"}
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">History Window</div>
                <div className="text-white font-medium mt-1">
                  {dataset.rowCount} Days ({dataset.rowCount >= 365 ? "Optimal" : "Sufficient"})
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">Missing Cells</div>
                <div className="text-white font-medium mt-1">
                  {dataset.missingValuesCount === 0 ? "0 (Clean)" : `${dataset.missingValuesCount} Cells`}
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">Observed Flow Column</div>
                <div className="text-white font-medium mt-1">
                  {dataset.hasDischargeColumn ? "Present" : "Not Present (PUB)"}
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div>
              <div className="text-xs font-medium text-white mb-2">First 5 Rows Preview</div>
              <div className="overflow-x-auto border border-white/10 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/60 border-b border-white/10">
                    <tr>
                      {dataset.columns.map((c) => (
                        <th key={c} className="p-2.5 font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {dataset.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        {dataset.columns.map((c) => (
                          <td key={c} className="p-2.5 whitespace-nowrap font-mono text-[11px]">
                            {row[c] !== undefined ? String(row[c]) : "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-white/60">
                Origin: <strong className="text-white">{forecastOrigin}</strong> • Mode:{" "}
                <strong className="text-white uppercase">{operatingMode}</strong>
              </div>

              <button
                disabled={isLoading || dataset.validationErrors.length > 0}
                onClick={backendHealth?.connected ? handleRunPrediction : handleRunBenchmarkReplay}
                className="glass-pill-solid text-sm py-2.5 px-7 shadow-lg w-full sm:w-auto justify-center"
              >
                {isLoading ? "Running Inference..." : "Run Predictions"}
              </button>
            </div>
          </div>
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="glass-card p-8 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-medium text-white">{loadingMessage}</div>
            <p className="text-xs text-white/60">
              Computing 4 linear reservoir states, Ridge baseline, and LightGBM residual hydrograph corrections.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DatasetTestingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-xs">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-4" />
          <div>Initializing Testing Laboratory...</div>
        </div>
      }
    >
      <DatasetTestingContent />
    </Suspense>
  );
}