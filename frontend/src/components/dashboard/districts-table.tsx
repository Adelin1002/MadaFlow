import type { DistrictStats } from "@/lib/api/types";

export function DistrictsTable({ districts }: { districts: DistrictStats[] }) {
  if (districts.length === 0) {
    return <p className="text-sm text-ink-soft">Aucun quartier renseigné pour l&apos;instant.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-stone text-xs text-ink-soft">
          <th className="pb-2 font-normal">Quartier</th>
          <th className="pb-2 font-normal">Actifs</th>
          <th className="pb-2 font-normal">Résolus</th>
          <th className="pb-2 font-normal">Critiques actifs</th>
          <th className="pb-2 font-normal">Score moyen</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone">
        {districts.map((district) => (
          <tr key={district.district_id}>
            <td className="py-2">{district.district}</td>
            <td className="py-2">{district.active_reports}</td>
            <td className="py-2">{district.resolved_reports}</td>
            <td className="py-2">
              {district.critical_active_reports > 0 ? (
                <span className="text-laterite">{district.critical_active_reports}</span>
              ) : (
                district.critical_active_reports
              )}
            </td>
            <td className="py-2 text-ink-soft">
              {district.avg_priority_score !== null ? district.avg_priority_score.toFixed(1) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
