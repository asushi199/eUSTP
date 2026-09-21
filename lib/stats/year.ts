import { formatInTimeZone } from "date-fns-tz";

export const STATS_TZ = "Asia/Kuala_Lumpur";

export const BULAN_PENDEK = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogs",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
] as const;

/** Tahun kalendar semasa di zon masa Malaysia. */
export function currentStatsYear(): number {
  return Number(formatInTimeZone(new Date(), STATS_TZ, "yyyy"));
}

export function parseStatsYear(
  raw: string | undefined,
  years: number[],
  fallback: number,
): number {
  const n = Number(raw);
  if (Number.isInteger(n) && years.includes(n)) return n;
  return fallback;
}

/** Tahun dari URL: 2024 hingga tahun semasa, tanpa senarai data. */
export function clampStatsYear(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 2024 && n <= fallback) return n;
  return fallback;
}

export function fillMonths(byMonth: Map<number, number>) {
  return BULAN_PENDEK.map((bulan, i) => ({
    bulan,
    jumlah: byMonth.get(i + 1) ?? 0,
  }));
}

export function yearRange(minYear: number | null, current: number): number[] {
  const start = Math.max(2024, Math.min(minYear ?? current, current));
  const years: number[] = [];
  for (let y = start; y <= current; y++) years.push(y);
  return years;
}
