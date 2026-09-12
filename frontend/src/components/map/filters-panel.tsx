import type { ReportListFilters } from "@/lib/api/reports";
import type { Category } from "@/lib/api/types";

interface FiltersPanelProps {
  categories: Category[];
  filters: ReportListFilters;
  onChange: (filters: ReportListFilters) => void;
}

const STATUS_OPTIONS: { value: NonNullable<ReportListFilters["status"]>; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "confirmed", label: "Confirmé" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolu" },
  { value: "rejected", label: "Rejeté" },
];

const SEVERITY_OPTIONS: { value: NonNullable<ReportListFilters["severity"]>; label: string }[] = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" },
];

const PRIORITY_OPTIONS: { value: NonNullable<ReportListFilters["priority"]>; label: string }[] = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Élevée" },
  { value: "critical", label: "Critique" },
];

function selectClasses() {
  return "border border-stone bg-paper-raised px-2.5 py-1.5 text-sm outline-none focus:border-ink";
}

export function FiltersPanel({ categories, filters, onChange }: FiltersPanelProps) {
  function update<K extends keyof ReportListFilters>(key: K, value: ReportListFilters[K]) {
    onChange({ ...filters, [key]: value || undefined });
  }

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        aria-label="Filtrer par catégorie"
        value={filters.category ?? ""}
        onChange={(event) => update("category", event.target.value)}
        className={selectClasses()}
      >
        <option value="">Toutes catégories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrer par statut"
        value={filters.status ?? ""}
        onChange={(event) => update("status", event.target.value as ReportListFilters["status"])}
        className={selectClasses()}
      >
        <option value="">Tous statuts</option>
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrer par gravité"
        value={filters.severity ?? ""}
        onChange={(event) =>
          update("severity", event.target.value as ReportListFilters["severity"])
        }
        className={selectClasses()}
      >
        <option value="">Toute gravité</option>
        {SEVERITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrer par priorité"
        value={filters.priority ?? ""}
        onChange={(event) =>
          update("priority", event.target.value as ReportListFilters["priority"])
        }
        className={selectClasses()}
      >
        <option value="">Toute priorité</option>
        {PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="text-sm text-ink-soft underline underline-offset-2 hover:text-laterite"
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
}
