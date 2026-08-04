/** Utiliti tarikh ISO (yyyy-MM-dd) — diporting dari tempahan-pkg-manjung. */

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromIsoDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function addDays(value: string, days: number) {
  const date = fromIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function startOfMonth(value: string) {
  const date = fromIsoDate(value);
  date.setDate(1);
  return toIsoDate(date);
}

export function addMonths(value: string, months: number) {
  const date = fromIsoDate(value);
  date.setMonth(date.getMonth() + months);
  return toIsoDate(date);
}

/** Hari terakhir bulan bagi tarikh ISO. */
export function endOfMonth(value: string) {
  const date = fromIsoDate(value);
  date.setMonth(date.getMonth() + 1, 0);
  return toIsoDate(date);
}

export function daysInMonth(value: string) {
  return fromIsoDate(endOfMonth(value)).getDate();
}

export function listDateRange(start: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

/** Semua tarikh dalam bulan yang mengandungi `value`. */
export function listMonthDates(value: string) {
  const start = startOfMonth(value);
  return listDateRange(start, daysInMonth(start));
}

/** Had maksimum hari inklusif untuk satu permohonan lintas hari. */
export const MAX_BOOKING_DAYS = 7;

const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string) {
  return isoDateRe.test(value);
}

export function isWithinBookingDayLimit(dayCount: number) {
  return dayCount >= 1 && dayCount <= MAX_BOOKING_DAYS;
}

/**
 * Senarai tarikh ISO inklusif dari start ke end.
 * Pulang null jika format tidak sah atau end < start.
 */
export function listInclusiveDates(start: string, end: string): string[] | null {
  if (!isIsoDate(start) || !isIsoDate(end)) return null;
  if (end < start) return null;

  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    if (dates.length > MAX_BOOKING_DAYS) return dates;
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function formatMalayDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  return fromIsoDate(value).toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDayName(value: string) {
  return fromIsoDate(value).toLocaleDateString("ms-MY", { weekday: "short" });
}
