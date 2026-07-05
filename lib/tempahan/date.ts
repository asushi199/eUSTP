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

export function listDateRange(start: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDays(start, index));
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
