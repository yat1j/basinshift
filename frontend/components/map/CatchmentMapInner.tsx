"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CatchmentGeoFeature } from "@/lib/types";
import { Layers, MapPin, Search, Info, ShieldCheck, AlertCircle } from "lucide-react";

interface CatchmentMapInnerProps {
  onSelectCatchment?: (feature: CatchmentGeoFeature) => void;
  selectedCatchmentId?: string;
}

export default function CatchmentMapInner({
  onSelectCatchment,
  selectedCatchmentId,
}: CatchmentMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<"dark" | "satellite" | "topo">("dark");
  const [catchments, setCatchments] = useState<CatchmentGeoFeature[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeature, setSelectedFeature] = useState<CatchmentGeoFeature | null>(null);
  const [activeTileLayer, setActiveTileLayer] = useState<L.TileLayer | null>(null);

  // Load verified GeoJSON
  useEffect(() => {
    fetch("/data/verified_catchments.json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.features) {
          setCatchments(data.features);
          // Set initial selection
          if (!selectedFeature && data.features.length > 0) {
            setSelectedFeature(data.features[0]);
            onSelectCatchment?.(data.features[0]);
          }
        }
      })
      .catch((err) => console.error("Error loading catchments GeoJSON:", err));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [40.5, -76.5],
      zoom: 6,
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Initial tile layer (Carto Dark)
    const initialTile = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    setActiveTileLayer(initialTile);

    const markerGroup = L.layerGroup().addTo(map);
    markersRef.current = markerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayer) {
      map.removeLayer(activeTileLayer);
    }

    let newLayer: L.TileLayer;
    if (basemap === "satellite") {
      newLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
          maxZoom: 18,
        }
      );
    } else if (basemap === "topo") {
      newLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
          maxZoom: 17,
        }
      );
    } else {
      newLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: "abcd",
          maxZoom: 19,
        }
      );
    }

    newLayer.addTo(map);
    setActiveTileLayer(newLayer);
  }, [basemap]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    const filtered = catchments.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        c.properties.name.toLowerCase().includes(q) ||
        c.properties.catchment_id.includes(q) ||
        c.properties.huc2_region.toLowerCase().includes(q)
      );
    });

    filtered.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const isSelected = selectedFeature?.properties.catchment_id === feature.properties.catchment_id;
      const isUnseen = feature.properties.split_role.includes("unseen");

      const markerColor = isUnseen ? "#f59e0b" : "#0ea5e9";
      const markerBorder = isSelected ? "#ffffff" : "#081018";

      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="
          width: ${isSelected ? "22px" : "16px"};
          height: ${isSelected ? "22px" : "16px"};
          background-color: ${markerColor};
          border: 2px solid ${markerBorder};
          border-radius: 50%;
          box-shadow: 0 0 10px ${markerColor}aa;
          cursor: pointer;
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: monospace; font-size: 11px; padding: 4px;">
          <div style="font-weight: bold; color: #38bdf8; font-size: 12px;">USGS ${feature.properties.catchment_id}</div>
          <div style="color: #cbd5e1; margin-top: 2px;">${feature.properties.name}</div>
          <div style="margin-top: 6px; color: #94a3b8;">
            <div>Area: ${feature.properties.drainage_area_km2} km²</div>
            <div>Elevation: ${feature.properties.elevation_mean_m} m</div>
            <div>Role: <span style="color: ${isUnseen ? "#f59e0b" : "#38bdf8"};">${feature.properties.split_role}</span></div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        setSelectedFeature(feature);
        onSelectCatchment?.(feature);
      });

      marker.addTo(markers);
    });
  }, [catchments, searchQuery, selectedFeature]);

  // Center on selected feature
  const handleFeatureSelect = (f: CatchmentGeoFeature) => {
    setSelectedFeature(f);
    onSelectCatchment?.(f);
    if (mapInstanceRef.current) {
      const [lng, lat] = f.geometry.coordinates;
      mapInstanceRef.current.flyTo([lat, lng], 9, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[650px] rounded-lg overflow-hidden border border-basin-border bg-basin-darkest">
      {/* Search and Layer Toolbar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full px-2">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified gauge ID or river name..."
            className="w-full pl-9 pr-3 py-2 bg-basin-midnight/90 border border-basin-border/80 rounded text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-basin-cyan backdrop-blur-md"
          />
        </div>

        {/* Basemap Selector */}
        <div className="flex items-center bg-basin-midnight/90 border border-basin-border/80 rounded p-0.5 backdrop-blur-md">
          <button
            onClick={() => setBasemap("dark")}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              basemap === "dark" ? "bg-basin-surface text-basin-cyanAccent" : "text-slate-400 hover:text-white"
            }`}
          >
            Carto Dark
          </button>
          <button
            onClick={() => setBasemap("satellite")}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              basemap === "satellite" ? "bg-basin-surface text-basin-cyanAccent" : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap("topo")}
            className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
              basemap === "topo" ? "bg-basin-surface text-basin-cyanAccent" : "text-slate-400 hover:text-white"
            }`}
          >
            Topographic
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-basin-midnight/90 border border-basin-border/80 rounded p-3 backdrop-blur-md text-xs font-mono max-w-xs">
        <div className="text-[11px] font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Benchmark Basins</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-basin-cyan border border-white/40" />
            <span className="text-slate-300">Training / Calibration Basins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white/40" />
            <span className="text-amber-300">Unseen Generalization Holdouts</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-basin-border/50 text-[10px] text-slate-400 leading-tight">
          Strictly verified USGS & CAMELS hydrometric stations. No fabricated coordinates.
        </div>
      </div>

      {/* Catchment Detail Drawer / Inspector */}
      {selectedFeature && (
        <div className="absolute top-16 right-4 bottom-4 z-[400] w-80 sm:w-96 bg-basin-midnight/95 border border-basin-border rounded-lg p-5 backdrop-blur-md overflow-y-auto shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-basin-cyan px-2 py-0.5 rounded bg-basin-surface border border-basin-border">
                  USGS Streamgage Station
                </span>
                <h3 className="text-sm font-bold text-white mt-2 font-mono">
                  {selectedFeature.properties.catchment_id}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  {selectedFeature.properties.name}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-basin-border/60 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>HUC Region:</span>
                <span className="text-slate-200">{selectedFeature.properties.huc2_region}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Drainage Area:</span>
                <span className="text-slate-200">{selectedFeature.properties.drainage_area_km2} km²</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Mean Elevation:</span>
                <span className="text-slate-200">{selectedFeature.properties.elevation_mean_m} m</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Aridity Index:</span>
                <span className="text-slate-200">{selectedFeature.properties.aridity_index}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Q95 Threshold:</span>
                <span className="text-amber-400 font-bold">{selectedFeature.properties.q95_threshold_mm_day} mm/d</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Validation Split:</span>
                <span className={selectedFeature.properties.split_role.includes("unseen") ? "text-amber-400" : "text-basin-cyanAccent"}>
                  {selectedFeature.properties.split_role}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Record Length:</span>
                <span className="text-slate-200">{selectedFeature.properties.gauged_record_length_years} years</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-basin-surface/40 border border-basin-border/70 rounded text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Geographic Shift Note:</strong> This basin features distinct antecedent
              storage characteristics. During cross-catchment generalization tests, models evaluated here demonstrate
              spatial transfer without local retraining.
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-basin-border/60 flex items-center gap-2">
            <a
              href={`/test?catchment=${selectedFeature.properties.catchment_id}`}
              className="w-full text-center py-2 px-3 bg-basin-teal/80 hover:bg-basin-teal border border-basin-cyan/40 text-white rounded text-xs font-mono font-medium transition-colors"
            >
              Load into Forecast Lab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
