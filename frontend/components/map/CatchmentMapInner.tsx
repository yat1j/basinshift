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

  const [basemap, setBasemap] = useState<"light" | "satellite" | "topo">("light");
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

    // Initial tile layer (Clean Light OpenStreetMap / Carto Light)
    const initialTile = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
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
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
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

      const markerColor = isUnseen ? "#e37400" : "#1a73e8";
      const markerBorder = "#ffffff";

      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="
          width: ${isSelected ? "22px" : "16px"};
          height: ${isSelected ? "22px" : "16px"};
          background-color: ${markerColor};
          border: 2px solid ${markerBorder};
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      const popupContent = `
        <div style="font-size: 12px; padding: 4px; color: #202124;">
          <div style="font-weight: 600; color: #1a73e8;">USGS ${feature.properties.catchment_id}</div>
          <div style="color: #3c4043; margin-top: 2px;">${feature.properties.name}</div>
          <div style="margin-top: 6px; color: #5f6368; font-size: 11px;">
            <div>Area: ${feature.properties.drainage_area_km2} km²</div>
            <div>Elevation: ${feature.properties.elevation_mean_m} m</div>
            <div>Role: <span style="color: ${isUnseen ? "#e37400" : "#1a73e8"}; font-weight: 500;">${feature.properties.split_role}</span></div>
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
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-[#dadce0] bg-[#f8f9fa]">
      {/* Top Search Toolbar (matching Screenshot 1 style) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full px-2">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#5f6368]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a location, USGS gauge, or river..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#dadce0] rounded-full text-xs text-[#202124] placeholder-[#5f6368] focus:outline-none focus:border-[#1a73e8] shadow-md"
          />
        </div>

        {/* Basemap Switcher */}
        <div className="flex items-center bg-white border border-[#dadce0] rounded-full p-0.5 shadow-md">
          <button
            onClick={() => setBasemap("light")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "light" ? "bg-[#1f1f1f] text-white font-medium" : "text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => setBasemap("satellite")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "satellite" ? "bg-[#1f1f1f] text-white font-medium" : "text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBasemap("topo")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              basemap === "topo" ? "bg-[#1f1f1f] text-white font-medium" : "text-[#5f6368] hover:text-[#202124]"
            }`}
          >
            Terrain
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Clean White Legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white border border-[#dadce0] rounded-xl p-3 shadow-md text-xs max-w-xs">
        <div className="text-xs font-medium text-[#202124] mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#137333]" />
          <span>Verified Benchmark Stations</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8] border border-white" />
            <span className="text-[#3c4043]">Training / Calibration Basins</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e37400] border border-white" />
            <span className="text-[#3c4043]">Unseen Generalization Holdouts</span>
          </div>
        </div>
      </div>

      {/* Station Details Drawer */}
      {selectedFeature && (
        <div className="absolute top-16 right-4 bottom-4 z-[400] w-80 sm:w-96 bg-white border border-[#dadce0] rounded-xl p-6 shadow-xl overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#1a73e8]">
                  USGS Streamgage Station
                </span>
                <h3 className="text-base font-semibold text-[#202124] mt-1">
                  Station {selectedFeature.properties.catchment_id}
                </h3>
                <p className="text-xs text-[#5f6368] mt-0.5 leading-snug">
                  {selectedFeature.properties.name}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#dadce0] space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>HUC Region:</span>
                <span className="text-[#202124] font-medium">{selectedFeature.properties.huc2_region}</span>
              </div>
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>Drainage Area:</span>
                <span className="text-[#202124] font-medium">{selectedFeature.properties.drainage_area_km2} km²</span>
              </div>
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>Mean Elevation:</span>
                <span className="text-[#202124] font-medium">{selectedFeature.properties.elevation_mean_m} m</span>
              </div>
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>Aridity Index:</span>
                <span className="text-[#202124] font-medium">{selectedFeature.properties.aridity_index}</span>
              </div>
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>Q95 Threshold:</span>
                <span className="text-[#e37400] font-bold">{selectedFeature.properties.q95_threshold_mm_day} mm/d</span>
              </div>
              <div className="flex justify-between items-center text-[#5f6368]">
                <span>Validation Split:</span>
                <span className={selectedFeature.properties.split_role.includes("unseen") ? "text-[#e37400] font-medium" : "text-[#1a73e8] font-medium"}>
                  {selectedFeature.properties.split_role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-[#dadce0]">
            <a
              href={`/test?catchment=${selectedFeature.properties.catchment_id}`}
              className="google-pill w-full text-center text-xs py-2.5"
            >
              Load into Forecast Lab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
