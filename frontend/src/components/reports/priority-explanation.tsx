import type { PriorityScore, PriorityScoreFactor } from "@/lib/api/types";

const FACTOR_LABELS: Record<string, string> = {
  severity: "Gravité déclarée",
  confirmations: "Confirmations citoyennes",
  duplicates: "Signalements liés",
  age: "Ancienneté",
  recurrence: "Récurrence dans le quartier",
};

const NOT_IMPLEMENTED_LABELS: Record<string, string> = {
  proximite_zone_importante: "Proximité d'une zone importante",
};

function describeFactor(name: string, factor: PriorityScoreFactor): string | null {
  switch (name) {
    case "confirmations":
      return typeof factor.count === "number" ? `${factor.count} confirmation(s)` : null;
    case "duplicates":
      return typeof factor.count === "number" ? `${factor.count} signalement(s) lié(s)` : null;
    case "age":
      return typeof factor.days === "number" ? `${factor.days} jour(s) depuis la création` : null;
    case "recurrence":
      if (typeof factor.note === "string") return factor.note;
      if (typeof factor.count === "number" && typeof factor.district === "string") {
        return `${factor.count} signalement(s) récent(s) dans ${factor.district}`;
      }
      return null;
    default:
      return null;
  }
}

export function PriorityExplanation({ priorityScore }: { priorityScore: PriorityScore }) {
  const { factors, not_implemented_factors } = priorityScore.explanation;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">Détail du calcul</p>
        <p className="text-sm text-ink-soft">{priorityScore.score.toFixed(1)} / 100</p>
      </div>

      <ul className="space-y-3">
        {Object.entries(factors).map(([name, factor]) => {
          const detail = describeFactor(name, factor);
          return (
            <li key={name}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{FACTOR_LABELS[name] ?? name}</span>
                <span className="text-ink-soft">
                  {factor.score.toFixed(0)}/100 · poids {Math.round((factor.weight ?? 0) * 100)}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-sand">
                <div
                  className="h-1.5 bg-laterite"
                  style={{ width: `${Math.min(100, factor.score)}%` }}
                />
              </div>
              {detail && <p className="mt-1 text-xs text-ink-soft">{detail}</p>}
            </li>
          );
        })}
      </ul>

      {not_implemented_factors.length > 0 && (
        <p className="border-t border-stone pt-3 text-xs text-ink-soft">
          Facteur{not_implemented_factors.length > 1 ? "s" : ""} non pris en compte pour
          l&apos;instant, faute de donnée fiable disponible :{" "}
          {not_implemented_factors.map((key) => NOT_IMPLEMENTED_LABELS[key] ?? key).join(", ")}.
        </p>
      )}
    </div>
  );
}
