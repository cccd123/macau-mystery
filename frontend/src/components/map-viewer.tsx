"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "current" | "locked";
  description: string;
}

interface MapViewerProps {
  locations: Location[];
  onLocationClick?: (id: string) => void;
}

export default function MapViewer({ locations, onLocationClick }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.clientWidth === 0) return;

    // Defensive cleanup of any previous instance (Strict Mode double-mount).
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Only clear the DOM after the previous map instance has been removed.
    container.innerHTML = "";

    const map = L.map(container, {
      center: [22.19, 113.536],
      zoom: 15,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    // CartoDB Voyager tiles load faster and look cleaner than default OSM.
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    const markers: L.LatLngExpression[] = [];
    locations.forEach((loc) => {
      const pos: L.LatLngExpression = [loc.lat, loc.lng];
      markers.push(pos);

      const color = loc.status === "current" ? "#1a8a6e" : "#9ca3af";
      const icon = L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${loc.id}</div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><br/>${loc.description}`);

      if (onLocationClick) {
        marker.on("click", () => onLocationClick(loc.id));
      }
    });

    if (markers.length > 1) {
      L.polyline(markers, {
        color: "#1a6fa0",
        weight: 3,
        dashArray: "10, 10",
        opacity: 0.6,
      }).addTo(map);
      const bounds = L.latLngBounds(markers as L.LatLng[]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (markers.length === 1) {
      map.setView(markers[0], 16);
    }

    // Invalidate size when the container is resized (e.g. mobile tab switch).
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        // ignore
      }
    }, 150);

    if (typeof ResizeObserver !== "undefined") {
      observerRef.current = new ResizeObserver(() => {
        if (mapRef.current) {
          try {
            mapRef.current.invalidateSize();
          } catch {
            // ignore
          }
        }
      });
      observerRef.current.observe(container);
    }

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup errors such as _leaflet_pos undefined
        }
        mapRef.current = null;
      }
    };
  }, [locations, onLocationClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{ minHeight: "320px", zIndex: 0 }}
    />
  );
}
