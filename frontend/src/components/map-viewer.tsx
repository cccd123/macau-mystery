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
}

export default function MapViewer({ locations }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean up any existing map instance (handles React Strict Mode double-mount)
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // Ignore cleanup errors from stale Leaflet internals
      }
      mapRef.current = null;
    }

    // Defensive cleanup: remove stale Leaflet DOM to prevent _leaflet_pos errors
    container.innerHTML = "";

    const map = L.map(container, {
      center: [22.19, 113.536],
      zoom: 15,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers
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

      L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(`<strong>${loc.name}</strong><br/>${loc.description}`);
    });

    // Draw route line
    if (markers.length > 1) {
      L.polyline(markers, {
        color: "#1a6fa0",
        weight: 3,
        dashArray: "10, 10",
        opacity: 0.6,
      }).addTo(map);
    }

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers as L.LatLngExpression[]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    // Fix rendering after layout settles (dynamic import + container sizing)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // Ignore cleanup errors (e.g. _leaflet_pos undefined in Strict Mode)
        }
        mapRef.current = null;
      }
    };
  }, [locations]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
