"use client";

import { use, useEffect, useState } from "react";
import { AiAnalysesPanel } from "@/components/reports/ai-analyses-panel";
import { ConfirmButton } from "@/components/reports/confirm-button";
import { PriorityExplanation } from "@/components/reports/priority-explanation";
import { StatusBadge } from "@/components/reports/status-badge";
import { StatusUpdateControl } from "@/components/reports/status-update-control";
import { UrgencyBadge } from "@/components/reports/urgency-badge";
import { useAuth } from "@/lib/auth/AuthContext";
import { useCategories } from "@/lib/hooks/use-categories";
import { formatFullDate, formatRelativeDate } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { applyStatusPatch, getReport } from "@/lib/api/reports";
import type { Report } from "@/lib/api/types";

const ADMIN_TYPES = new Set(["municipal_admin", "platform_admin"]);

export default function ReportDetailPage(props: PageProps<"/reports/[id]">) {
  const { id } = use(props.params);
  const { user } = useAuth();
  const categories = useCategories();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReport(id)
      .then(setReport)
      .catch((caughtError) => {
        setError(
          caughtError instanceof ApiError && caughtError.status === 404
            ? "Ce signalement n'existe pas ou plus."
            : "Impossible de charger ce signalement.",
        );
      });
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <p
          role="alert"
          className="border border-laterite bg-laterite/10 px-3 py-2 text-sm text-laterite"
        >
          {error}
        </p>
      </div>
    );
  }

  if (!report) {
    return <div className="mx-auto max-w-2xl px-6 py-20 text-sm text-ink-soft">Chargement…</div>;
  }

  const categoryName = categories.find((category) => category.id === report.category)?.name;
  const isAdmin = user ? ADMIN_TYPES.has(user.user_type) : false;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{report.title}</h1>
        <StatusBadge status={report.status} />
      </div>

      <p className="mt-1 text-sm text-ink-soft" title={formatFullDate(report.created_at)}>
        Signalé {formatRelativeDate(report.created_at)}
        {categoryName ? ` · ${categoryName}` : ""}
      </p>

      <p className="mt-6 text-ink">{report.description}</p>

      {report.images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {report.images.map((image) => (
            // eslint-disable-next-line @next/next/no-img-element -- images utilisateur arbitraires, next/image exigerait de whitelister le domaine backend
            <img
              key={image.id}
              src={image.image}
              alt="Photo du signalement"
              className="aspect-square w-full border border-stone object-cover"
            />
          ))}
        </div>
      )}

      <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-stone py-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-soft">Gravité</dt>
          <dd className="mt-1">
            <UrgencyBadge level={report.severity} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Priorité</dt>
          <dd className="mt-1">
            {report.priority_score ? (
              <UrgencyBadge level={report.priority_score.level} />
            ) : (
              <span className="text-ink-soft">en cours de calcul</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Confirmations</dt>
          <dd className="mt-1">{report.confirmations_count}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Localisation</dt>
          <dd className="mt-1">{report.location.approximate_address || "Non précisée"}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <ConfirmButton reportId={report.id} />
      </div>

      {report.priority_score && (
        <div className="mt-10 border-t border-stone pt-6">
          <PriorityExplanation priorityScore={report.priority_score} />
        </div>
      )}

      {isAdmin && (
        <div className="mt-10 space-y-6 border-t border-stone pt-6">
          <StatusUpdateControl
            report={report}
            onUpdated={(patch) =>
              setReport((current) => (current ? applyStatusPatch(current, patch) : current))
            }
          />
          <AiAnalysesPanel reportId={report.id} />
        </div>
      )}
    </div>
  );
}
