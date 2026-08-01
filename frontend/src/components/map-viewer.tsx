"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    // Fix leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    const mapEl = document.getElementById("map-container");
    if (!mapEl || (mapEl as any)._leaflet_id) return;

    const map = L.map("map-container").setView([22.19, 113.536], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add markers
    const markers: L.LatLngExpression[] = [];
    locations.forEach((loc) => {
      const pos: L.LatLngExpression = [loc.lat, loc.lng];
      markers.push(pos);

      const color =
        loc.status === "current" ? "#2563eb" : "#9ca3af";
      const icon = L.divIcon({
        html: `<div style="background:${color};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${loc.id}</div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(pos, { icon })
        .addTo(map)
        .bindPopup(
          `<strong>${loc.name}</strong><br/>${loc.description}`
        );
    });

    // Draw route line
    if (markers.length > 1) {
      L.polyline(markers, {
        color: "#2563eb",
        weight: 3,
        dashArray: "10, 10",
        opacity: 0.6,
      }).addTo(map);
    }

    return () => {
      map.remove();
    };
  }, [locations]);

  return (
    <div
      id="map-container"
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
