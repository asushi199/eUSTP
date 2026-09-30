import type { AnalisisHomeModule, HomeStatRow } from "../analisis/summary";
import { formatCount } from "./format";
import { splitTebusStatus } from "./progress";

function formatTarikhPendek(value: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return `${Number(match[3])}/${Number(match[2])}/${match[1]}`;
}

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
  const tarikh = formatTarikhPendek(input.sourcedAt);

  return {
    id: "tebus-buku",
    label: "Tebus Buku",
    headlineValue: pct(tebus, total),
    headlineLabel: "Sudah tebus",
    tiles: [],
    bars: [],
    note: tarikh ? `Data setakat ${tarikh}.` : undefined,
    statRows: [
      row("Sudah tebus", "Pelajar yang telah menebus baucar buku", tebus, total),
      row("Sudah guna", "Pelajar yang telah menggunakan baucar", split.selesai, total),
      row("Tebus, belum guna", "Sudah tebus tetapi belum guna", split.belumGuna, total),
      row("Belum tebus", "Belum tebus dan belum guna", split.belumTebus, total),
    ],
  };
}
