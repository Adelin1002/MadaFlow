interface BreakdownItem {
  label: string;
  count: number;
}

export function BreakdownBars({ title, items }: { title: string; items: BreakdownItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Aucune donnée.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.label}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-ink-soft">{item.count}</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-sand">
                <div
                  className="h-1.5 bg-laterite"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
