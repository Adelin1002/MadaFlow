export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-stone p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
