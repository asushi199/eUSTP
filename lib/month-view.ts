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

export type WeekGroup<T> = {
  weekKey: string;
  weekNumber: number;
  label: string;
  startDateKey: string;
  endDateKey: string;
  itemCount: number;
  days: DayGroup<T>[];
};

/** Label julat minggu BM, cth. "3 - 9 Ogo" atau "28 Jul - 3 Ogo". */
export function weekRangeLabel(startDateKey: string, endDateKey: string): string {
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);
  if (startDateKey === endDateKey) {
    return start.toLocaleDateString("ms-MY", { day: "numeric", month: "short" });
  }
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getDate()} - ${end.toLocaleDateString("ms-MY", {
      day: "numeric",
      month: "short",
    })}`;
  }
  return `${start.toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
  })} - ${end.toLocaleDateString("ms-MY", { day: "numeric", month: "short" })}`;
}

/**
 * Kumpul item mengikut minggu grid bulanan (Isnin–Ahad, sama `buildMonthGrid`).
 * Hanya minggu dengan sekurang-kurangnya satu item dikembalikan.
 */
export function groupItemsByWeek<T>(
  year: number,
  month: number,
  items: T[],
  getDate: (item: T) => string,
): WeekGroup<T>[] {
  const grid = buildMonthGrid(year, month);
  const byDate = indexByDay(items, getDate);
  const bulan = formatBulan(year, month);
  const weeks: WeekGroup<T>[] = [];

  grid.forEach((cells, index) => {
    const dates = cells.filter((d): d is string => d != null);
    if (dates.length === 0) return;

    const days: DayGroup<T>[] = [];
    let itemCount = 0;
    for (const date of dates) {
      const dayItems = byDate.get(date);
      if (!dayItems?.length) continue;
      days.push({ date, items: dayItems });
      itemCount += dayItems.length;
    }
    if (itemCount === 0) return;

    const weekNumber = index + 1;
    weeks.push({
      weekKey: `${bulan}-W${weekNumber}`,
      weekNumber,
      label: `MINGGU ${weekNumber}`,
      startDateKey: dates[0],
      endDateKey: dates[dates.length - 1],
      itemCount,
      days,
    });
  });

  return weeks;
}

/**
 * Minggu default dibuka: minggu yang merangkumi hari ini (jika beritem),
 * jika tidak minggu beritem paling hampir kepada `todayIso`.
 */
export function defaultOpenWeekKey(
  groups: WeekGroup<unknown>[],
  todayIso: string,
): string | null {
  if (groups.length === 0) return null;

  const containing = groups.find(
    (g) => g.startDateKey <= todayIso && todayIso <= g.endDateKey && g.itemCount > 0,
  );
  if (containing) return containing.weekKey;

  let best: WeekGroup<unknown> | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const g of groups) {
    if (g.itemCount === 0) continue;
    const dist =
      todayIso < g.startDateKey
        ? dateIsoDiffDays(g.startDateKey, todayIso)
        : dateIsoDiffDays(todayIso, g.endDateKey);
    if (dist < bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return best?.weekKey ?? null;
}

function dateIsoDiffDays(later: string, earlier: string): number {
  const a = new Date(`${later}T00:00:00`).getTime();
  const b = new Date(`${earlier}T00:00:00`).getTime();
  return Math.round((a - b) / 86_400_000);
}
