"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AdminOnly } from "@/components/dashboard/admin-only";
import { BreakdownBars } from "@/components/dashboard/breakdown-bars";
import { DistrictsTable } from "@/components/dashboard/districts-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { STATUS_LABELS } from "@/components/reports/status-badge";
import { URGENCY_LABELS } from "@/components/reports/urgency-badge";
import { getDistrictStats, getHeatmapPoints, getOverview, getTimeline } from "@/lib/api/analytics";
import type {
  AnalyticsOverview,
  AnalyticsTimeline,
  DistrictStats,
  HeatmapPoint,
} from "@/lib/api/types";

// Leaflet référence `window` dès l'import — incompatible avec le pré-rendu serveur.
const HeatmapView = dynamic(
  () => import("@/components/dashboard/heatmap-view").then((mod) => mod.HeatmapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Chargement de la carte…
      </div>
    ),
  },
);

function formatResolutionTime(hours: number | null): string {
  if (hours === null) return "Pas encore de donnée";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${hours.toFixed(1)} h`;
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [districts, setDistricts] = useState<DistrictStats[]>([]);
  const [timeline, setTimeline] = useState<AnalyticsTimeline | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getOverview(), getDistrictStats(), getTimeline(), getHeatmapPoints()])
      .then(([overviewData, districtsData, timelineData, heatmapData]) => {
        setOverview(overviewData);
        setDistricts(districtsData);
        setTimeline(timelineData);
        setHeatmapPoints(heatmapData);
        setError(null);
      })
      .catch(() => setError("Impossible de charger le tableau de bord. Réessayez."));
  }, []);

  return (
    <AdminOnly>
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>

        {error && (
          <p
            role="alert"
            className="mt-6 border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
          >
            {error}
          </p>
        )}

        {!overview && !error && <p className="mt-6 text-sm text-ink-soft">Chargement…</p>}

        {overview && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Signalements totaux" value={overview.total_reports} />
              <StatCard label="Actifs" value={overview.active_reports} />
              <StatCard label="Résolus" value={overview.resolved_reports} />
              <StatCard
                label="Temps moyen de résolution"
                value={formatResolutionTime(overview.avg_resolution_hours)}
              />
            </div>

            <div className="mt-10 grid gap-10 sm:grid-cols-2">
              <BreakdownBars
                title="Par statut"
                items={Object.entries(overview.by_status).map(([status, count]) => ({
                  label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
                  count,
                }))}
              />
              <BreakdownBars
                title="Par gravité"
                items={Object.entries(overview.by_severity).map(([severity, count]) => ({
                  label: URGENCY_LABELS[severity as keyof typeof URGENCY_LABELS],
                  count,
                }))}
              />
            </div>

            <div className="mt-10">
              <BreakdownBars
                title="Par catégorie"
                items={overview.by_category.map((entry) => ({
                  label: entry.category,
                  count: entry.count,
                }))}
              />
            </div>
          </>
        )}

        {timeline && (
          <div className="mt-10 border-t border-stone pt-8">
            <p className="text-sm font-medium">
              Évolution sur les {timeline.window_days} derniers jours
            </p>
            <div className="mt-3">
              <TimelineChart timeline={timeline} />
            </div>
          </div>
        )}

        <div className="mt-10 border-t border-stone pt-8">
          <p className="text-sm font-medium">Statistiques par quartier</p>
          <div className="mt-3">
            <DistrictsTable districts={districts} />
          </div>
        </div>

        <div className="mt-10 border-t border-stone pt-8">
          <p className="text-sm font-medium">Carte de chaleur</p>
          <div className="mt-3 h-96 border border-stone">
            <HeatmapView points={heatmapPoints} />
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
