/**
 * Utiliti tulen untuk paparan admin berskop-bulan (Kalendar + Senarai).
 * Dikongsi merentas modul (Khidmat Bantu, Tempahan). Tiada IO / server-only.
 * Semua tarikh ialah rentetan ISO `yyyy-MM-dd`.
 */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function todayParts(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** Parameter URL "yyyy-MM" (mis. "2026-07"). */
export function formatBulan(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}`;
}

export function parseBulan(
  value: string | null | undefined,
): { year: number; month: number } | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  return { year, month };
}

/** "Julai 2026" */
export function monthLabelOf(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("ms-MY", {
    month: "long",
    year: "numeric",
  });
}

/** Betulkah tarikh ISO ini dalam (tahun, bulan 0-indeks)? */
export function inMonth(dateIso: string, year: number, month: number): boolean {
  return dateIso.slice(0, 4) === String(year) && Number(dateIso.slice(5, 7)) === month + 1;
}

/**
 * Grid bulanan (mula Isnin). Setiap sel ialah tarikh yyyy-MM-dd atau null
 * (sel isian luar bulan). Sentiasa baris penuh 7 lajur.
 */
export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${year}-${pad2(month + 1)}-${pad2(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export type DayGroup<T> = { date: string; items: T[] };

/** Kumpul mengikut hari, hari menaik. */
export function groupByDay<T>(items: T[], getDate: (item: T) => string): DayGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const date = getDate(item);
    const list = map.get(date);
    if (list) list.push(item);
    else map.set(date, [item]);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, dayItems]) => ({ date, items: dayItems }));
}

/** Peta tarikh -> item (untuk sel kalendar). */
export function indexByDay<T>(items: T[], getDate: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const date = getDate(item);
    const list = map.get(date);
    if (list) list.push(item);
    else map.set(date, [item]);
  }
  return map;
}
