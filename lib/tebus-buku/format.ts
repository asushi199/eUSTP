const TINGKATAN_RANK: Record<string, number> = {
  T1: 10,
  T2: 20,
  T3: 30,
  T4: 40,
  T5: 50,
  T6S1: 61,
  T6S2: 62,
  T6S3: 63,
  P: 70,
  KHAM: 80,
};

export function shortSchoolName(name: string): string {
  return name
    .replace(/^SEKOLAH MENENGAH KEBANGSAAN\s+/i, "SMK ")
    .replace(/^KOLEJ VOKASIONAL\s+/i, "KV ")
    .trim();
}

export function compareTingkatan(a: string, b: string): number {
  const ra = TINGKATAN_RANK[a] ?? 500;
  const rb = TINGKATAN_RANK[b] ?? 500;
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b, "ms");
}

export function formatCount(value: number): string {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return "0";
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatTarikhSnapshot(value: string | Date | null): string | null {
  if (!value) return null;
  const iso = typeof value === "string" ? value : value.toISOString().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const months = [
    "Januari",
    "Februari",
    "Mac",
    "April",
    "Mei",
    "Jun",
    "Julai",
    "Ogos",
    "September",
    "Oktober",
    "November",
    "Disember",
  ];
  const month = months[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}
