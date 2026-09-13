"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiltersPanel } from "@/components/map/filters-panel";
import { StatusBadge } from "@/components/reports/status-badge";
import { UrgencyBadge } from "@/components/reports/urgency-badge";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatRelativeDate } from "@/lib/format";
import { listReports, type ReportListFilters } from "@/lib/api/reports";
import type { PaginatedResponse, Report } from "@/lib/api/types";

export default function ReportsPage() {
  const categories = useCategories();
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  const [filters, setFilters] = useState<ReportListFilters>({});
  const [page, setPage] = useState<PaginatedResponse<Report> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentPage = filters.page ?? 1;

  useEffect(() => {
    listReports(filters)
      .then((response) => {
        setPage(response);
        setError(null);
      })
      .catch(() => setError("Impossible de charger les signalements. Réessayez."));
  }, [filters]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Signalements</h1>

      <div className="mt-6">
        <FiltersPanel
          categories={categories}
          filters={filters}
          onChange={(next) => setFilters({ ...next, page: undefined })}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
        >
          {error}
        </p>
      )}

      {page && page.results.length === 0 && (
        <p className="mt-10 text-sm text-ink-soft">
          Aucun signalement ne correspond à ces filtres.
        </p>
      )}

      <ul className="mt-6 divide-y divide-stone">
        {page?.results.map((report) => (
          <li key={report.id}>
            <Link
              href={`/reports/${report.id}`}
              className="block py-4 transition-colors hover:bg-paper-raised"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{report.title}</p>
                <StatusBadge status={report.status} />
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{report.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
                <span>{categoryNameById.get(report.category) ?? "Catégorie inconnue"}</span>
                <UrgencyBadge level={report.severity} prefix="Gravité" />
                {report.priority_score && (
                  <UrgencyBadge level={report.priority_score.level} prefix="Priorité" />
                )}
                <span>{report.confirmations_count} confirmation(s)</span>
                <span>{formatRelativeDate(report.created_at)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {page && (page.next || page.previous) && (
        <div className="mt-8 flex justify-between text-sm">
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, page: currentPage - 1 }))}
            disabled={!page.previous}
            className="border border-stone px-4 py-2 disabled:opacity-40"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={() => setFilters((current) => ({ ...current, page: currentPage + 1 }))}
            disabled={!page.next}
            className="border border-stone px-4 py-2 disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
