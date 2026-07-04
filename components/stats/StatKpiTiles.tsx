import type { StatKpi } from "@/lib/stats/types";

/** Petak KPI ringkas — nombor dakwat besar, label kelabu (tiada biru). */
export default function StatKpiTiles({ tiles }: { tiles: StatKpi[] }) {
  if (tiles.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="card p-4">
          <p className="text-2xl font-semibold tabular-nums tracking-tight">
            {t.value.toLocaleString("ms-MY")}
          </p>
          <p className="mt-1 text-xs leading-snug text-graphite">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
