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

  useEffect(() => {
    checkBackendHealth().then(setBackendHealth);
  }, []);

  useEffect(() => {
    const cid = searchParams.get("catchment");
    if (cid) setCatchmentId(cid);
  }, [searchParams]);

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

  const parseCSVText = (csvText: string, filename: string, forcedMode?: FeatureMode) => {
    setApiError(null);
    const mode = forcedMode || operatingMode;

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, any>[];
        const headers = results.meta.fields || [];

        const headerCounts: Record<string, number> = {};
        const duplicateHeaders: string[] = [];
        headers.forEach((h) => {
          headerCounts[h] = (headerCounts[h] || 0) + 1;
          if (headerCounts[h] === 2) duplicateHeaders.push(h);
        });

        const hasDateCol = headers.includes("date");
        const hasDischarge = headers.includes("observed_discharge_mm_day");

        let missingValuesCount = 0;
        let validDateStart: string | null = null;
        let validDateEnd: string | null = null;

        if (hasDateCol && rows.length > 0) {
          validDateStart = rows[0].date;
          validDateEnd = rows[rows.length - 1].date;
          if (validDateEnd) setForecastOrigin(validDateEnd);
        }

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
      router.push("/results");
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#202124]">
      {/* Editorial Header */}
      <section className="py-14 border-b border-[#dadce0] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-[#1a73e8] mb-2">
                Hydrological Testing Laboratory
              </div>
              <h1 className="text-3xl sm:text-4xl font-normal text-[#202124] tracking-tight">
                Dataset Testing & Inference
              </h1>
              <p className="text-sm text-[#5f6368] mt-2 max-w-2xl leading-relaxed">
                Provide continuous daily catchment meteorological forcings (minimum 90–365 days rolling context) to
                evaluate river discharge and high-flow exceedance risk.
              </p>
            </div>

            <div className="text-xs p-3 bg-white border border-[#dadce0] rounded-lg flex items-center gap-2 text-[#5f6368]">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendHealth?.connected ? "bg-[#137333]" : "bg-[#f9ab00]"
                }`}
              />
              <span>Inference Engine:</span>
              <strong className={backendHealth?.connected ? "text-[#137333]" : "text-[#e37400]"}>
                {backendHealth?.connected ? "API Connected" : "Benchmark Pilot Mode"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-grow">
        {/* Presets */}
        <div className="google-card p-6 space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-[#202124] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#137333]" />
            <span>Select a Verified Benchmark Catchment</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setOperatingMode("gauged");
                setCatchmentId("01434000");
                loadBenchmarkSample("catchment_01434000_gauged.csv", "gauged");
              }}
              className="p-4 bg-[#f8f9fa] hover:bg-white border border-[#dadce0] rounded-lg text-left transition-all hover:border-[#1a73e8]"
            >
              <div className="text-sm font-medium text-[#202124]">USGS 01434000 • Gauged</div>
              <div className="text-xs text-[#5f6368] mt-1">
                Neversink River, NY (366 days observed flow & forcings)
              </div>
            </button>

            <button
              onClick={() => {
                setOperatingMode("ungauged");
                setCatchmentId("01434000");
                loadBenchmarkSample("catchment_01434000_ungauged.csv", "ungauged");
              }}
              className="p-4 bg-[#f8f9fa] hover:bg-white border border-[#dadce0] rounded-lg text-left transition-all hover:border-[#e37400]"
            >
              <div className="text-sm font-medium text-[#e37400]">USGS 01434000 • Ungauged / PUB</div>
              <div className="text-xs text-[#5f6368] mt-1">
                PUB Mode: Flow observations omitted; meteorology only
              </div>
            </button>

            <button
              onClick={() => {
                setOperatingMode("gauged");
                setCatchmentId("01614000");
                loadBenchmarkSample("unseen_basin_appalachian_gauged.csv", "gauged");
              }}
              className="p-4 bg-[#f8f9fa] hover:bg-white border border-[#dadce0] rounded-lg text-left transition-all hover:border-[#1a73e8]"
            >
              <div className="text-sm font-medium text-[#202124]">USGS 01614000 • Unseen Holdout</div>
              <div className="text-xs text-[#5f6368] mt-1">
                Generalization test basin excluded during model training
              </div>
            </button>
          </div>
        </div>

        {/* Form Controls */}
        <div className="google-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block text-[#5f6368] font-medium uppercase tracking-wider text-[11px] mb-2">
              Catchment Gauge ID
            </label>
            <input
              type="text"
              value={catchmentId}
              onChange={(e) => setCatchmentId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded text-[#202124] focus:outline-none focus:border-[#1a73e8]"
            />
          </div>

          <div>
            <label className="block text-[#5f6368] font-medium uppercase tracking-wider text-[11px] mb-2">
              Operating Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOperatingMode("gauged")}
                className={`py-2 px-3 rounded text-center border text-xs font-medium transition-colors ${
                  operatingMode === "gauged"
                    ? "bg-[#1f1f1f] border-[#1f1f1f] text-white"
                    : "bg-white border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa]"
                }`}
              >
                Gauged
              </button>
              <button
                type="button"
                onClick={() => setOperatingMode("ungauged")}
                className={`py-2 px-3 rounded text-center border text-xs font-medium transition-colors ${
                  operatingMode === "ungauged"
                    ? "bg-[#1f1f1f] border-[#1f1f1f] text-white"
                    : "bg-white border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa]"
                }`}
              >
                Ungauged / PUB
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[#5f6368] font-medium uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
              <span>Forecast Origin Date</span>
              <Calendar className="w-3.5 h-3.5 text-[#5f6368]" />
            </label>
            <input
              type="date"
              value={forecastOrigin}
              onChange={(e) => setForecastOrigin(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-[#dadce0] rounded text-[#202124] focus:outline-none focus:border-[#1a73e8]"
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
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
            isDragging
              ? "border-[#1a73e8] bg-[#e8f0fe]/30"
              : "border-[#dadce0] bg-[#f8f9fa] hover:border-[#bdc1c6]"
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
          <UploadCloud className="w-10 h-10 mx-auto text-[#5f6368] mb-3" />
          <div className="text-base font-medium text-[#202124]">
            Drag & Drop Catchment Time Series CSV
          </div>
          <p className="text-xs text-[#5f6368] mt-1 max-w-md mx-auto">
            Supports standard hydrological datasets (CAMELS / ERA5-Land / USGS format). Requires date and daily
            meteorological forcings.
          </p>
          <div className="mt-4">
            <label
              htmlFor="csv-file-input"
              className="google-pill-light text-xs py-2 px-5 inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Browse Local File</span>
            </label>
          </div>
        </div>

        {/* Errors */}
        {apiError && (
          <div className="p-4 bg-[#fce8e6] border border-[#ea4335]/40 rounded-lg text-xs text-[#c5221f] space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>Notice:</span>
            </div>
            <p>{apiError}</p>
            {dataset && !backendHealth?.connected && (
              <div className="pt-2">
                <button
                  onClick={handleRunBenchmarkReplay}
                  className="google-pill text-xs py-1.5 px-4"
                >
                  Run Verified Benchmark Replay Instead
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dataset Preview */}
        {dataset && (
          <div className="google-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#dadce0] gap-4">
              <div>
                <h3 className="text-base font-medium text-[#202124]">{dataset.filename}</h3>
                <div className="text-xs text-[#5f6368] mt-0.5">
                  {dataset.rowCount} daily records • {dataset.filesize}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="text-xs text-[#5f6368] hover:text-[#d93025] flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove File</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#f8f9fa] rounded border border-[#dadce0]">
                <div className="text-[#5f6368] text-[11px]">Date Span</div>
                <div className="text-[#202124] font-medium mt-1">
                  {dataset.dateRange ? `${dataset.dateRange.start} → ${dataset.dateRange.end}` : "N/A"}
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded border border-[#dadce0]">
                <div className="text-[#5f6368] text-[11px]">History Window</div>
                <div className="text-[#202124] font-medium mt-1">
                  {dataset.rowCount} Days ({dataset.rowCount >= 365 ? "Optimal" : "Sufficient"})
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded border border-[#dadce0]">
                <div className="text-[#5f6368] text-[11px]">Missing Cells</div>
                <div className="text-[#202124] font-medium mt-1">
                  {dataset.missingValuesCount === 0 ? "0 (Clean)" : `${dataset.missingValuesCount} Cells`}
                </div>
              </div>

              <div className="p-3 bg-[#f8f9fa] rounded border border-[#dadce0]">
                <div className="text-[#5f6368] text-[11px]">Observed Flow Column</div>
                <div className="text-[#202124] font-medium mt-1">
                  {dataset.hasDischargeColumn ? "Present" : "Not Present (PUB)"}
                </div>
              </div>
            </div>

            {/* Table Preview */}
            <div>
              <div className="text-xs font-medium text-[#202124] mb-2">First 5 Rows Preview</div>
              <div className="overflow-x-auto border border-[#dadce0] rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8f9fa] text-[#5f6368] border-b border-[#dadce0]">
                    <tr>
                      {dataset.columns.map((c) => (
                        <th key={c} className="p-2.5 font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dadce0] text-[#3c4043]">
                    {dataset.rows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#f8f9fa]">
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
            <div className="pt-4 border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#5f6368]">
                Origin: <strong className="text-[#202124]">{forecastOrigin}</strong> • Mode:{" "}
                <strong className="text-[#202124] uppercase">{operatingMode}</strong>
              </div>

              <button
                disabled={isLoading || dataset.validationErrors.length > 0}
                onClick={backendHealth?.connected ? handleRunPrediction : handleRunBenchmarkReplay}
                className="google-pill text-sm py-2.5 px-6 shadow-sm w-full sm:w-auto justify-center"
              >
                {isLoading ? "Running Inference..." : "Run Predictions"}
              </button>
            </div>
          </div>
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="google-card p-8 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-medium text-[#202124]">{loadingMessage}</div>
            <p className="text-xs text-[#5f6368]">
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
        <div className="min-h-screen bg-white text-[#202124] flex flex-col items-center justify-center p-6 text-xs">
          <div className="w-6 h-6 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4" />
          <div>Initializing Testing Laboratory...</div>
        </div>
      }
    >
      <DatasetTestingContent />
    </Suspense>
  );
}
