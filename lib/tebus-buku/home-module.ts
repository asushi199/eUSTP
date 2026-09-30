import type { AnalisisHomeModule, HomeStatRow } from "../analisis/summary";
import { formatCount, formatTarikhSnapshot } from "./format";
import { splitTebusStatus } from "./progress";

function pct(count: number, total: number): string {
  if (total <= 0 || count <= 0) return "0%";
  const rounded = Math.round((count / total) * 1000) / 10;
  return `${rounded.toFixed(1)}%`;
}

function fraction(count: number, total: number): string {
  return `${formatCount(count)}/${formatCount(total)}`;
}

function row(title: string, detail: string, count: number, total: number): HomeStatRow {
  return {
    title,
    detail,
    value: fraction(count, total),
    unit: pct(count, total),
  };
}

/** Kad mesyuarat: kadar tebus di depan, pecahan status di dalam. */
export function buildTebusBukuHomeModule(input: {
  total: number;
  tebusCount: number;
  gunaCount: number;
  schoolCount: number;
  sourcedAt: string | null;
}): AnalisisHomeModule | null {
  const total = Math.trunc(Number(input.total));
  if (!Number.isFinite(total) || total <= 0) return null;

  const split = splitTebusStatus({
    total,
    tebusCount: input.tebusCount,
    gunaCount: input.gunaCount,
  });
  const tebus = split.selesai + split.belumGuna;
  const tarikh = formatTarikhSnapshot(input.sourcedAt);
  const schools = Math.max(0, Math.trunc(Number(input.schoolCount)) || 0);
  const when = tarikh ? `setakat ${tarikh}` : "snapshot semasa";
  const schoolNote = schools > 0 ? ` ${formatCount(schools)} sekolah menengah.` : "";

  return {
    id: "tebus-buku",
    label: "Tebus Buku",
    headlineValue: pct(tebus, total),
    headlineLabel: "Sudah tebus",
    tiles: [],
    bars: [],
    note: `Pelajar sekolah menengah daerah Manjung ${when}.${schoolNote} Sudah guna dan "tebus, belum guna" membentuk jumlah sudah tebus.`,
    statRows: [
      row("Sudah tebus", "Pelajar yang telah menebus baucar buku", tebus, total),
      row("Sudah guna", "Pelajar yang telah menggunakan baucar", split.selesai, total),
      row("Tebus, belum guna", "Sudah tebus tetapi belum guna", split.belumGuna, total),
      row("Belum tebus", "Belum tebus dan belum guna", split.belumTebus, total),
    ],
  };
}
