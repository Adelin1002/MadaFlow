const LEVELS: { level: string; label: string; colorVar: string }[] = [
  { level: "low", label: "Faible", colorVar: "var(--stone)" },
  { level: "medium", label: "Moyenne", colorVar: "var(--ochre)" },
  { level: "high", label: "Élevée", colorVar: "var(--laterite-soft)" },
  { level: "critical", label: "Critique", colorVar: "var(--laterite)" },
];

export function MapLegend() {
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-ink-soft">
      {LEVELS.map(({ level, label, colorVar }) => (
        <li key={level} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-paper-raised"
            style={{ backgroundColor: colorVar }}
            aria-hidden="true"
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
