const COLORS: Record<"low" | "medium" | "high" | "critical", string> = {
  low: "var(--stone)",
  medium: "var(--ochre)",
  high: "var(--laterite-soft)",
  critical: "var(--laterite)",
};

const LABELS: Record<"low" | "medium" | "high" | "critical", string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

/**
 * Utilisé à la fois pour la gravité déclarée par le citoyen (Report.severity)
 * et le niveau de priorité calculé (PriorityScore.level) — même échelle à 4
 * niveaux, mêmes couleurs que les marqueurs de la carte (voir
 * src/components/map/leaflet-icons.ts), pour rester cohérent visuellement.
 */
export function UrgencyBadge({
  level,
  prefix,
}: {
  level: "low" | "medium" | "high" | "critical";
  prefix?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: COLORS[level] }}
        aria-hidden="true"
      />
      {prefix ? `${prefix} : ` : ""}
      {LABELS[level]}
    </span>
  );
}
