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
  AlertTriangle,
} from "lucide-react";
import { FeatureMode } from "@/lib/types";
import { checkBackendHealth, submitPrediction, HealthCheckResult } from "@/lib/api";
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

const BASE_REQUIRED_COLUMNS = [
  "catchment_id",
  "date",
  "total_precipitation",
  "temperature_2m",
  "dewpoint_temperature_2m",
  "potential_evaporation",
  "volumetric_soil_water_layer_1",
  "snow_depth_water_equivalent",
  "drainage_area",
  "source_collection",
];

function DatasetTestingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Operating Form State
  const [operatingMode, setOperatingMode] = useState<FeatureMode>("gauged");
  const [forecastOrigin, setForecastOrigin] = useState<string>("2013-05-15");
  const [catchmentId, setCatchmentId] = useState<string>("camels_01047000");
  const [allowUnsupportedRegion, setAllowUnsupportedRegion] = useState<boolean>(false);
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | Blob | null>(null);

  // Status & Loading State
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<HealthCheckResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query parameter pre-selection and initial health check
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

  // Re-run validation if operating mode or forecast origin changes on an existing dataset
  useEffect(() => {
    if (dataset && dataset.rows.length > 0) {
      validateAndSetDataset(dataset.rows, dataset.columns, dataset.filename, dataset.rows.length * 100);
    }
  }, [operatingMode, forecastOrigin]);

  const loadBenchmarkSample = async (
    filename: string,
    mode: FeatureMode,
    forcedCid: string = "camels_01047000",
    forcedOrigin: string = "2013-05-15"
  ) => {
    setIsLoading(true);
    setLoadingMessage(`Loading authentic benchmark sample: ${filename}…`);
    setApiError(null);
    setOperatingMode(mode);
    setCatchmentId(forcedCid);
    setForecastOrigin(forcedOrigin);

    try {
      const response = await fetch(`/samples/${filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load benchmark sample file (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob();
      const file = new File([blob], filename, { type: "text/csv" });
      setUploadedFile(file);

      const text = await blob.text();
      Papa.parse(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndSetDataset(
            results.data as Record<string, any>[],
            results.meta.fields || [],
            filename,
            text.length,
            mode,
            forcedOrigin,
            forcedCid
          );
        },
        error: (error: any) => {
          setApiError(`CSV Parsing error: ${error?.message || String(error)}`);
        },
      });
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
        validateAndSetDataset(
          results.data as Record<string, any>[],
          results.meta.fields || [],
          filename,
          csvText.length
        );
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
    byteLength: number,
    modeOverride?: FeatureMode,
    originOverride?: string,
    cidOverride?: string
  ) => {
    const activeMode = modeOverride || operatingMode;
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rows.length === 0) {
      errors.push("Uploaded dataset contains no data rows.");
      setDataset({
        filename,
        filesize: "0 KB",
        rowCount: 0,
        columns,
        dateRange: null,
        missingValuesCount: 0,
        duplicateHeaders: [],
        hasDischargeColumn: false,
        rows: [],
        validationErrors: errors,
        validationWarnings: warnings,
      });
      return;
    }

    // 1. Validate Schema against Required Columns
    const expectedCols = activeMode === "gauged"
      ? [...BASE_REQUIRED_COLUMNS, "streamflow"]
      : BASE_REQUIRED_COLUMNS;

    const missingCols = expectedCols.filter((col) => !columns.includes(col));
    if (missingCols.length > 0) {
      errors.push(
        `Missing required column(s) for ${activeMode} mode: ${missingCols.join(", ")}. Required schema: ${expectedCols.join(", ")}`
      );
    }

    // 2. Identify Catchment Identity
    if (cidOverride) {
      setCatchmentId(cidOverride);
    } else if (columns.includes("catchment_id")) {
      const firstCid = String(rows[0]?.catchment_id || "").trim();
      if (firstCid) {
        setCatchmentId(firstCid);
      }
    }

    // 3. Date Range and Forecast Origin Detection
    const hasDateCol = columns.includes("date");
    let dateRange = null;
    let targetOrigin = originOverride || forecastOrigin;

    if (hasDateCol) {
      const validDates = rows
        .map((r) => String(r.date || "").trim())
        .filter((d) => d && !isNaN(Date.parse(d)));

      if (validDates.length > 0) {
        validDates.sort();
        const firstDate = validDates[0];
        const lastDate = validDates[validDates.length - 1];
        dateRange = { start: firstDate, end: lastDate };

        // If forecastOrigin is outside the date range or unset, default to the latest date
        if (originOverride) {
          targetOrigin = originOverride;
          setForecastOrigin(originOverride);
        } else if (!validDates.includes(forecastOrigin)) {
          targetOrigin = lastDate;
          setForecastOrigin(lastDate);
        }
      } else {
        errors.push("No valid ISO date records found in the 'date' column.");
      }
    } else {
      errors.push("Missing required 'date' column (expected YYYY-MM-DD).");
    }

    // 4. Duplicate Dates Validation
    if (hasDateCol) {
      const seenDates = new Set<string>();
      let dupCount = 0;
      for (const r of rows) {
        const d = String(r.date || "").trim();
        if (d) {
          if (seenDates.has(d)) {
            dupCount++;
          }
          seenDates.add(d);
        }
      }
      if (dupCount > 0) {
        errors.push(`Duplicate date records detected (${dupCount} occurrences). Each date must be unique per catchment.`);
      }
    }

    // 5. Antecedent History Length Validation (>= 365 continuous days prior to origin)
    if (hasDateCol && targetOrigin) {
      const targetTs = new Date(targetOrigin).getTime();
      const antecedentRows = rows.filter((r) => {
        const d = String(r.date || "").trim();
        return d && new Date(d).getTime() <= targetTs;
      });

      if (antecedentRows.length < 365) {
        errors.push(
          `Insufficient antecedent history: found ${antecedentRows.length} daily records before forecast origin (${targetOrigin}). The inference pipeline strictly requires at least 365 days of continuous antecedent history.`
        );
      }
    }

    // 6. Check for Missing Values in Required Columns
    let missingCount = 0;
    rows.forEach((row) => {
      columns.forEach((col) => {
        if (row[col] === null || row[col] === undefined || row[col] === "") {
          missingCount++;
        }
      });
    });

    if (missingCount > 0) {
      warnings.push(`Detected ${missingCount} empty cells across dataset fields.`);
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
      hasDischargeColumn: columns.includes("streamflow"),
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

    setUploadedFile(file);
    setApiError(null);

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

    setUploadedFile(file);
    setApiError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setDataset(null);
    setUploadedFile(null);
    setApiError(null);
    clearActiveForecast();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRunPrediction = async () => {
    if (!dataset || dataset.validationErrors.length > 0) return;

    if (!uploadedFile) {
      setApiError("No file selected for prediction upload.");
      return;
    }

    clearActiveForecast();
    setApiError(null);
    setIsLoading(true);
    setLoadingMessage("Transmitting time-series CSV to BASINSHIFT inference engine…");

    const response = await submitPrediction({
      file: uploadedFile,
      filename: dataset.filename,
      catchment_id: catchmentId,
      forecast_origin: forecastOrigin,
      feature_mode: operatingMode,
      allow_unsupported_region: allowUnsupportedRegion,
      antecedent_rows: dataset.rows,
    });

    if (response.success && response.data) {
      saveActiveForecast(response.data);
      router.push("/results");
    } else {
      setIsLoading(false);
      if (!response.isBackendConnected) {
        setApiError(
          `Inference server at ${backendHealth?.url || "http://localhost:8000"} is unreachable. ` +
          `Please verify that Member 1's FastAPI server is running on http://localhost:8000.`
        );
      } else {
        const errorDetail = response.errorCode ? `[${response.errorCode}] ` : "";
        const fieldDetail = response.errorField ? ` (Field: ${response.errorField})` : "";
        setApiError(`${errorDetail}${response.error || "Inference execution failed."}${fieldDetail}`);
      }
    }
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
                Provide continuous daily catchment meteorological forcings (minimum 365 days rolling context) to
                evaluate river discharge and high-flow exceedance risk using the authoritative FastAPI backend.
              </p>
            </div>

            <div className="text-xs p-3 glass-card flex items-center gap-2 text-white/80">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth?.connected ? "bg-emerald-400" : "bg-red-400"
                }`}
              />
              <span>Inference Engine:</span>
              <strong className={backendHealth?.connected ? "text-emerald-400" : "text-red-400"}>
                {backendHealth?.connected ? "API Connected (GET /health OK)" : "Offline (http://localhost:8000)"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex-grow">
        {/* Authentic Presets */}
        <div className="glass-card p-6 space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-white/70 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Select an Authentic Benchmark Sample (from backend reports/)</span>
            </div>
            {uploadedFile && (
              <span className="text-[11px] text-emerald-400 font-mono">
                Active: {(uploadedFile as any).name || dataset?.filename}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                loadBenchmarkSample("sample_gauged_upload.csv", "gauged", "camels_01047000", "2013-05-15");
              }}
              className={`p-4 border rounded-xl text-left transition-all ${
                uploadedFile && (uploadedFile as any).name === "sample_gauged_upload.csv" && operatingMode === "gauged"
                  ? "bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/50"
                  : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-emerald-500/40"
              }`}
            >
              <div className="text-sm font-medium text-white flex items-center justify-between">
                <span>camels_01047000 • Gauged Mode</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  uploadedFile && (uploadedFile as any).name === "sample_gauged_upload.csv" && operatingMode === "gauged"
                    ? "bg-emerald-400 text-black font-semibold"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {uploadedFile && (uploadedFile as any).name === "sample_gauged_upload.csv" && operatingMode === "gauged"
                    ? "✓ Loaded"
                    : "Gauged"}
                </span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                Carrabassett River, ME • 731 days observed streamflow & ERA5-Land forcings (origin 2013-05-15)
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                loadBenchmarkSample("sample_ungauged_upload.csv", "ungauged", "camels_01047000", "2013-05-15");
              }}
              className={`p-4 border rounded-xl text-left transition-all ${
                uploadedFile && (uploadedFile as any).name === "sample_ungauged_upload.csv" && operatingMode === "ungauged"
                  ? "bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/50"
                  : "bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-amber-400/40"
              }`}
            >
              <div className="text-sm font-medium text-amber-300 flex items-center justify-between">
                <span>camels_01047000 • Ungauged / PUB Mode</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  uploadedFile && (uploadedFile as any).name === "sample_ungauged_upload.csv" && operatingMode === "ungauged"
                    ? "bg-amber-400 text-black font-semibold"
                    : "bg-amber-500/20 text-amber-300"
                }`}>
                  {uploadedFile && (uploadedFile as any).name === "sample_ungauged_upload.csv" && operatingMode === "ungauged"
                    ? "✓ Loaded"
                    : "Ungauged / PUB"}
                </span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                PUB Mode: Streamflow column omitted; 731 days ERA5-Land meteorology only (origin 2013-05-15)
              </div>
            </button>
          </div>
        </div>

        {/* Selected Sample Ready Indicator */}
        {uploadedFile && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs text-white font-medium flex items-center gap-2">
                  <span>Active CSV File:</span>
                  <span className="font-mono text-emerald-300 font-semibold">
                    {dataset?.filename || (uploadedFile as any).name}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Sample Ready
                  </span>
                </div>
                <div className="text-[11px] text-white/60 mt-0.5 font-mono">
                  Catchment: <strong className="text-white">{catchmentId}</strong> • Origin: <strong className="text-white">{forecastOrigin}</strong> • Mode: <strong className="text-white uppercase">{operatingMode}</strong>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-white/60 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear File</span>
            </button>
          </div>
        )}

        {/* Form Controls */}
        <div className="glass-card p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <label className="block text-white/70 font-medium uppercase tracking-wider text-[11px] mb-2 font-mono">
              Catchment ID (backend matching)
            </label>
            <input
              type="text"
              value={catchmentId}
              onChange={(e) => setCatchmentId(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-white/50"
              placeholder="camels_01047000"
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
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-white/50"
            />
          </div>

          <div className="sm:col-span-3 pt-1 border-t border-white/5 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white">
              <input
                type="checkbox"
                checked={allowUnsupportedRegion}
                onChange={(e) => setAllowUnsupportedRegion(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-0"
              />
              <span className="text-[11px] font-mono">
                allow_unsupported_region (allow regression-only prediction if regional Q95 is undefined)
              </span>
            </label>
          </div>
        </div>

        {/* Drag and Drop Zone (Manual upload remains optional) */}
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
            {uploadedFile ? (
              <span className="text-emerald-400 font-mono">
                Active File: {dataset?.filename || (uploadedFile as any).name}
              </span>
            ) : (
              "Drag & Drop Catchment Time Series CSV"
            )}
          </div>
          <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
            {uploadedFile ? (
              <span>CSV loaded into upload state. Manual upload remains optional: browse or drop another file below at any time.</span>
            ) : (
              "Uploaded file will be sent as raw multipart/form-data directly to POST /predict. Requires ERA5-Land forcings and ≥ 365 days antecedent history prior to origin."
            )}
          </p>
          <div className="mt-4">
            <label
              htmlFor="csv-file-input"
              className="glass-pill text-xs py-2 px-5 inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{uploadedFile ? "Replace With Local File" : "Browse Local File (Optional Manual Upload)"}</span>
            </label>
          </div>
        </div>

        {/* API Error State */}
        {apiError && (
          <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-200 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Backend Error:</span>
            </div>
            <p className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{apiError}</p>
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

            {/* Validation Errors & Warnings */}
            {dataset.validationErrors.length > 0 && (
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span>Validation Incompatibilities ({dataset.validationErrors.length}):</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                  {dataset.validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {dataset.validationWarnings.length > 0 && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-medium text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Notices:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {dataset.validationWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">Date Span</div>
                <div className="text-white font-medium mt-1 font-mono">
                  {dataset.dateRange ? `${dataset.dateRange.start} → ${dataset.dateRange.end}` : "N/A"}
                </div>
              </div>

              <div className="p-3 bg-white/[0.03] rounded-lg border border-white/10">
                <div className="text-white/60 text-[11px]">History Window</div>
                <div className="text-white font-medium mt-1">
                  {dataset.rowCount} Days ({dataset.rowCount >= 365 ? "Sufficient" : "Insufficient"})
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
                  {dataset.hasDischargeColumn ? (
                    <span className="text-emerald-400 font-mono">streamflow (Present)</span>
                  ) : (
                    <span className="text-amber-400 font-mono">None (Ungauged)</span>
                  )}
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
                        <th key={c} className="p-2.5 font-medium font-mono text-[11px]">
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
                Catchment: <strong className="text-white font-mono">{catchmentId}</strong> • Origin:{" "}
                <strong className="text-white font-mono">{forecastOrigin}</strong> • Mode:{" "}
                <strong className="text-white uppercase font-mono">{operatingMode}</strong>
              </div>

              <button
                disabled={isLoading || dataset.validationErrors.length > 0}
                onClick={handleRunPrediction}
                className="glass-pill-solid text-sm py-2.5 px-7 shadow-lg w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Running Prediction..." : "Run Predictions"}
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
              Processing antecedent window, linear reservoir states, and ensemble inference models.
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
