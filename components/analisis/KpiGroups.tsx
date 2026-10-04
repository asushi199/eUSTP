/** Petak KPI dikumpul ikut kategori — dipakai bila statistik modul jelas berkumpulan (cth. DELIMa: guru/murid, OPTIK: status/sasaran). */

export type KpiStat = { label: string; value: string };
export type KpiGroup = { title: string; stats: KpiStat[]; align?: "left" | "center"; wide?: boolean };

function StatCell({
  label,
  value,
  align,
  dense,
}: KpiStat & { align: "left" | "center"; dense: boolean }) {
  if (value === "") return null;
  // Tiga petak atau lebih dalam satu kad: fon & ruang lebih kecil supaya angka (cth. 95.5%) tidak melimpah.
  return (
    <div
      className={`${dense ? "px-2 py-3 first:pl-3 last:pr-3" : "px-3 py-3 first:pl-4 last:pr-4"} ${align === "center" ? "text-center" : ""}`}
    >
      <p
        className={`font-semibold tabular-nums tracking-tight ${dense ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px] leading-snug text-graphite">{label}</p>
    </div>
  );
}

function GroupCard({ title, stats, align = "left" }: KpiGroup) {
  const shown = stats.filter((s) => s.value !== "");
  if (shown.length === 0) return null;
  return (
    <div className="card overflow-hidden">
      <p
        className={`border-b border-fog/70 bg-cloud/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.6px] text-steel ${align === "center" ? "text-center" : ""}`}
      >
        {title}
      </p>
      <div
        className="grid divide-x divide-fog/70"
        style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}
      >
        {shown.map((s) => (
          <StatCell key={s.label} {...s} align={align} dense={shown.length >= 3} />
        ))}
      </div>
    </div>
  );
}

/** Tailwind perlukan nama kelas statik — peta bilangan kumpulan ke kelas grid responsif. */
const SM_COLS: Record<number, string> = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};

export default function KpiGroups({ groups }: { groups: KpiGroup[] }) {
  const shown = groups.filter((g) => g.stats.some((s) => s.value !== ""));
  if (shown.length === 0) return null;

  // Ikut susunan: kumpulan `wide` ambil satu baris penuh; kumpulan biasa berturutan berkongsi satu baris.
  const rows: { wide: boolean; groups: KpiGroup[] }[] = [];
  for (const g of shown) {
    const last = rows[rows.length - 1];
    if (!g.wide && last && !last.wide) last.groups.push(g);
    else rows.push({ wide: !!g.wide, groups: [g] });
  }

  return (
    <div className="space-y-3">
      {rows.map((row) =>
        row.wide ? (
          <GroupCard key={row.groups[0].title} {...row.groups[0]} />
        ) : (
          <div
            key={row.groups.map((g) => g.title).join("|")}
            className={`grid gap-3 ${SM_COLS[row.groups.length] ?? "sm:grid-cols-4"}`}
          >
            {row.groups.map((g) => (
              <GroupCard key={g.title} {...g} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}
