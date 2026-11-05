"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CatchmentGeoFeature } from "@/lib/types";
import { Search, ShieldCheck } from "lucide-react";

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

    // Initial tile layer (Carto Dark for pitch-black theme)
    const initialTile = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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

  // Switch Basemap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayer) {
      map.removeLayer(activeTileLayer);
    }

    let newLayer: L.TileLayer;
    if (basemap === "satellite") {
      newLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}",
        {
          attribution: "Tiles &copy; Esri, USGS",
          maxZoom: 18,
        }
      );
    } else if (basemap === "topo") {
      newLayer = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        {
          attribution: 'Map data &copy; OpenStreetMap, SRTM | OpenTopoMap',
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
    const markers = markersRef.current;
    if (!markers) return;

    markers.clearLayers();

    const filtered = catchments.filter((f) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        f.properties.catchment_id.toLowerCase().includes(q) ||
        f.properties.name.toLowerCase().includes(q) ||
        f.properties.huc2_region.toLowerCase().includes(q)
      );
    });

    filtered.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const isSelected = selectedFeature?.properties.catchment_id === feature.properties.catchment_id;
      const isUnseen = feature.properties.split_role.includes("unseen");

      const markerColor = isUnseen ? "#f59e0b" : "#38bdf8";
      const markerBorder = isSelected ? "#ffffff" : "rgba(255,255,255,0.7)";

      const customIcon = L.divIcon({
        className: "custom-station-pin",
        html: `<div style="
          width: ${isSelected ? "22px" : "16px"};
          height: ${isSelected ? "22px" : "16px"};
          background-color: ${markerColor};
          border: 2px solid ${markerBorder};
          border-radius: 50%;
          box-shadow: 0 0 12px ${markerColor}80;
          cursor: pointer;
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-size: 12px; padding: 4px; color: #ffffff; background-color: #121212; border-radius: 6px;">
          <div style="font-weight: 600; color: #38bdf8;">USGS ${feature.properties.catchment_id}</div>
          <div style="color: #e2e8f0; margin-top: 2px;">${feature.properties.name}</div>
          <div style="margin-top: 6px; color: #a1a1aa; font-size: 11px;">
            <div>Area: ${feature.properties.drainage_area_km2} km²</div>
            <div>Elevation: ${feature.properties.elevation_mean_m} m</div>
            <div>Role: <span style="color: ${isUnseen ? "#f59e0b" : "#38bdf8"}; font-weight: 500;">${feature.properties.split_role}</span></div>
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

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0a0a]">
      {/* Top Search Toolbar */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full px-2">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-white/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location, USGS gauge, or river..."
            className="w-full pl-9 pr-3 py-2.5 bg-black/80 backdrop-blur-md border border-white/20 rounded-full text-xs text-white placeholder-white/50 focus:outline-none focus:border-white/60 shadow-lg"
          />
        </div>

        {/* Basemap Switcher */}
        <div className="flex items-center bg-black/80 backdrop-blur-md border border-white/20 rounded-full p-0.5 shadow-lg">
          <button
            onClick={() => setBasemap("dark")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "dark" ? "bg-white text-black font-medium" : "text-white/70 hover:text-white"
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setBasemap("satellite")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "satellite" ? "bg-white text-black font-medium" : "text-white/70 hover:text-white"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap("topo")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "topo" ? "bg-white text-black font-medium" : "text-white/70 hover:text-white"
            }`}
          >
            Terrain
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Glass Legend */}
      <div className="absolute bottom-4 left-4 z-[400] glass-card p-3.5 shadow-xl text-xs max-w-xs">
        <div className="text-xs font-medium text-white mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Verified Benchmark Stations</span>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/60" />
            <span className="text-white/70">Training / Calibration Basins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/60" />
            <span className="text-white/70">Unseen Generalization Holdouts</span>
          </div>
        </div>
      </div>

      {/* Station Details Drawer */}
      {selectedFeature && (
        <div className="absolute top-16 right-4 bottom-4 z-[400] w-80 sm:w-96 glass-card p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-sky-400 font-mono">
                  USGS Streamgage Station
                </span>
                <h3 className="text-base font-semibold text-white mt-1 font-sans">
                  Station {selectedFeature.properties.catchment_id}
                </h3>
                <p className="text-xs text-white/60 mt-0.5 leading-snug">
                  {selectedFeature.properties.name}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center text-white/60">
                <span>HUC Region:</span>
                <span className="text-white font-medium">{selectedFeature.properties.huc2_region}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Drainage Area:</span>
                <span className="text-white font-medium">{selectedFeature.properties.drainage_area_km2} km²</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Mean Elevation:</span>
                <span className="text-white font-medium">{selectedFeature.properties.elevation_mean_m} m</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Aridity Index:</span>
                <span className="text-white font-medium">{selectedFeature.properties.aridity_index}</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Q95 Threshold:</span>
                <span className="text-amber-400 font-bold">{selectedFeature.properties.q95_threshold_mm_day} mm/d</span>
              </div>
              <div className="flex justify-between items-center text-white/60">
                <span>Validation Split:</span>
                <span className={selectedFeature.properties.split_role.includes("unseen") ? "text-amber-400 font-medium" : "text-sky-400 font-medium"}>
                  {selectedFeature.properties.split_role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-white/10">
            <a
              href={`/test?catchment=${selectedFeature.properties.catchment_id}`}
              className="glass-pill-solid w-full text-center text-xs py-2.5 block"
            >
              Load into Forecast Lab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}