import type { ReportStatus } from "@/lib/api/types";

export const STATUS_LABELS: Record<ReportStatus, string> = {
  new: "Nouveau",
  confirmed: "Confirmé",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Rejeté",
};

const STYLES: Record<ReportStatus, string> = {
  new: "border-stone text-ink-soft",
  confirmed: "border-ochre text-ochre",
  in_progress: "border-laterite-soft text-laterite-soft",
  resolved: "border-paddy text-paddy",
  rejected: "border-stone text-ink-soft opacity-70",
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
