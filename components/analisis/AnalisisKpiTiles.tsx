/** Petak KPI analisis — nilai sudah diformat sebagai teks (boleh ada %, unit). */
export default function AnalisisKpiTiles({
  tiles,
}: {
  tiles: { label: string; value: string }[];
}) {
  const shown = tiles.filter((t) => t.value !== "");
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {shown.map((t) => (
        <div key={t.label} className="card p-4">
          <p className="text-xl font-semibold tabular-nums tracking-tight">{t.value}</p>
          <p className="mt-1 text-xs leading-snug text-graphite">{t.label}</p>
        </div>
      ))}
    </div>
  );
}
