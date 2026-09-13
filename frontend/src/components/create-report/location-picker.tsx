"use client";

import { useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createReportIcon } from "@/components/map/leaflet-icons";

const DEFAULT_CENTER: [number, number] = [-21.4536, 47.0833]; // Fianarantsoa

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/** Recentre la carte quand la position change par un autre moyen que le clic (géolocalisation navigateur). */
function RecenterOnChange({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);

  return null;
}

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lon: number) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setIsLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange(position.coords.latitude, position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setGeoError("Impossible d'obtenir votre position. Choisissez un point sur la carte.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const initialCenter: [number, number] =
    latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Localisation</p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={isLocating}
          className="text-xs text-laterite underline underline-offset-2 disabled:opacity-50"
        >
          {isLocating ? "Localisation…" : "Utiliser ma position"}
        </button>
      </div>

      <div className="h-64 w-full border border-stone">
        <MapContainer center={initialCenter} zoom={14} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          <RecenterOnChange latitude={latitude} longitude={longitude} />
          {latitude !== null && longitude !== null && (
            <Marker position={[latitude, longitude]} icon={createReportIcon("medium")} />
          )}
        </MapContainer>
      </div>

      <p className="text-xs text-ink-soft">
        Cliquez sur la carte pour placer précisément le signalement, ou utilisez votre position
        actuelle.
      </p>
      {geoError && <p className="text-xs text-laterite">{geoError}</p>}
      {latitude !== null && longitude !== null && (
        <p className="text-xs text-ink-soft">
          Position choisie : {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      )}
    </div>
  );
}
