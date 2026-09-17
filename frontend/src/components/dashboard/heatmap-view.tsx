"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { HeatmapPoint } from "@/lib/api/types";

const DEFAULT_CENTER: [number, number] = [-21.4536, 47.0833]; // Fianarantsoa

function colorForWeight(weight: number): string {
  if (weight >= 75) return "var(--laterite)";
  if (weight >= 50) return "var(--laterite-soft)";
  if (weight >= 25) return "var(--ochre)";
  return "var(--stone)";
}

function FitToPoints({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [points, map]);

  return null;
}

export function HeatmapView({ points }: { points: HeatmapPoint[] }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToPoints points={points} />
      {points.map((point) => (
        <CircleMarker
          key={point.report_id}
          center={[point.lat, point.lon]}
          radius={6 + point.weight / 10}
          pathOptions={{
            color: colorForWeight(point.weight),
            fillColor: colorForWeight(point.weight),
            fillOpacity: 0.5,
            weight: 1,
          }}
        />
      ))}
    </MapContainer>
  );
}
