"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { updateReportStatus, type UpdateStatusResponse } from "@/lib/api/reports";
import type { Report, ReportStatus } from "@/lib/api/types";
import { STATUS_LABELS } from "./status-badge";

export function StatusUpdateControl({
  report,
  onUpdated,
}: {
  report: Report;
  onUpdated: (patch: UpdateStatusResponse) => void;
}) {
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateReportStatus(report.id, status);
      onUpdated(updated);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError && caughtError.body.detail
          ? caughtError.body.detail
          : "Impossible de mettre à jour le statut.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="border border-stone p-4">
      <p className="text-sm font-medium">Changer le statut</p>
      <p className="mt-1 text-xs text-ink-soft">Réservé aux administrateurs.</p>

      <div className="mt-3 flex items-center gap-2">
        <select
          aria-label="Nouveau statut"
          value={status}
          onChange={(event) => setStatus(event.target.value as ReportStatus)}
          className="border border-stone bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-ink"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || status === report.status}
          className="border border-ink px-3 py-1.5 text-sm font-medium transition-colors hover:border-laterite hover:text-laterite disabled:opacity-50"
        >
          {isSaving ? "Mise à jour…" : "Mettre à jour"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-laterite">{error}</p>}
    </div>
  );
}
