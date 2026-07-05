/** Paparan kapasiti bilik (bilangan orang). */

export function formatCapacity(capacity: number | null | undefined): string | null {
  if (capacity == null || capacity <= 0) return null;
  return `${capacity} pax`;
}

export function parseCapacityInput(raw: FormDataEntryValue | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number.parseInt(text, 10);
  if (!Number.isFinite(n) || n <= 0 || n > 9999) return null;
  return n;
}
