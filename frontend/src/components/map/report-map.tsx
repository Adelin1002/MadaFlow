"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ConfirmButton } from "@/components/reports/confirm-button";
import type { Report } from "@/lib/api/types";
import { createReportIcon } from "./leaflet-icons";

// Centre par défaut : Fianarantsoa, faute de signalement pour calculer un centre réel.
const DEFAULT_CENTER: [number, number] = [-21.4536, 47.0833];
const DEFAULT_ZOOM = 13;

function FitToReports({ reports }: { reports: Report[] }) {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) return;
    const bounds = L.latLngBounds(
      reports.map((report) => [report.location.latitude, report.location.longitude]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [reports, map]);

  return null;
}

function ReportPopupContent({ report }: { report: Report }) {
  return (
    <div className="min-w-48 space-y-2 text-sm">
      <p className="font-medium">{report.title}</p>
      <p className="text-ink-soft">{report.description}</p>
      <dl className="space-y-1 text-xs text-ink-soft">
        <div className="flex justify-between gap-4">
          <dt>Gravité</dt>
          <dd>{report.severity}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Priorité</dt>
          <dd>{report.priority_score?.level ?? "en cours de calcul"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Confirmations</dt>
          <dd>{report.confirmations_count}</dd>
        </div>
      </dl>

      <ConfirmButton reportId={report.id} />

      <Link
        href={`/reports/${report.id}`}
        className="block text-xs text-laterite underline underline-offset-2"
      >
        Voir le détail
      </Link>
    </div>
  );
}

export function ReportMap({ reports }: { reports: Report[] }) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToReports reports={reports} />
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.location.latitude, report.location.longitude]}
          icon={createReportIcon(report.priority_score?.level ?? null)}
        >
          <Popup>
            <ReportPopupContent report={report} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
