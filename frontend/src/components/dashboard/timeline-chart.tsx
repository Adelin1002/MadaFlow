import type { AnalyticsTimeline } from "@/lib/api/types";

export function buildDateAxis(timeline: AnalyticsTimeline): string[] {
  const dates = new Set<string>();
  timeline.created.forEach((point) => dates.add(point.date));
  timeline.resolved.forEach((point) => dates.add(point.date));
  return Array.from(dates).sort();
}

export function TimelineChart({ timeline }: { timeline: AnalyticsTimeline }) {
  const dates = buildDateAxis(timeline);

  if (dates.length === 0) {
    return <p className="text-sm text-ink-soft">Aucun signalement sur cette période.</p>;
  }

  const createdByDate = new Map(timeline.created.map((point) => [point.date, point.count]));
  const resolvedByDate = new Map(timeline.resolved.map((point) => [point.date, point.count]));
  const max = Math.max(
    1,
    ...dates.map((date) => Math.max(createdByDate.get(date) ?? 0, resolvedByDate.get(date) ?? 0)),
  );

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-laterite" aria-hidden="true" />
          Créés
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-paddy" aria-hidden="true" />
          Résolus
        </span>
      </div>

      <div className="mt-3 flex h-32 items-end gap-1">
        {dates.map((date) => {
          const created = createdByDate.get(date) ?? 0;
          const resolved = resolvedByDate.get(date) ?? 0;
          return (
            <div key={date} className="flex flex-1 items-end gap-0.5" title={date}>
              <div
                className="flex-1 bg-laterite"
                style={{
                  height: `${(created / max) * 100}%`,
                  minHeight: created > 0 ? "2px" : "0",
                }}
              />
              <div
                className="flex-1 bg-paddy"
                style={{
                  height: `${(resolved / max) * 100}%`,
                  minHeight: resolved > 0 ? "2px" : "0",
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex justify-between text-xs text-ink-soft">
        <span>{dates[0]}</span>
        <span>{dates[dates.length - 1]}</span>
      </div>
    </div>
  );
}
