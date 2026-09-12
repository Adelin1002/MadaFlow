"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { FiltersPanel } from "@/components/map/filters-panel";
import { MapLegend } from "@/components/map/map-legend";
import { listCategories } from "@/lib/api/categories";
import { listReports, type ReportListFilters } from "@/lib/api/reports";
import type { Category, Report } from "@/lib/api/types";

// Leaflet référence `window` dès l'import du module — impossible à
// pré-rendre côté serveur, d'où ssr: false (voir README, section Next.js 16).
const ReportMap = dynamic(
  () => import("@/components/map/report-map").then((mod) => mod.ReportMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Chargement de la carte…
      </div>
    ),
  },
);

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ReportListFilters>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then((response) => setCategories(response.results))
      .catch(() => {
        // Non bloquant : la carte reste utilisable sans filtre par catégorie.
      });
  }, []);

  useEffect(() => {
    listReports(filters)
      .then((response) => {
        setReports(response.results);
        setError(null);
      })
      .catch(() => setError("Impossible de charger les signalements. Réessayez."));
  }, [filters]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone px-6 py-3">
        <FiltersPanel categories={categories} filters={filters} onChange={setFilters} />
        <MapLegend />
      </div>

      <div className="relative flex-1">
        {error && (
          <p
            role="alert"
            className="absolute inset-x-0 top-0 z-[1000] bg-laterite/10 px-4 py-2 text-center text-sm text-laterite"
          >
            {error}
          </p>
        )}
        <ReportMap reports={reports} />
      </div>
    </div>
  );
}
