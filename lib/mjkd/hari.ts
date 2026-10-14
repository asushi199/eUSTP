/** Tarikh mesyuarat berbilang hari (tulen). Semua tarikh ialah YYYY-MM-DD (tanpa zon masa). */

const MAKS_HARI = 14;

const NAMA_BULAN = [
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

export function isTarikhIso(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/**
 * Senarai tarikh dari `tarikh` hingga `tarikhTamat` (termasuk). Tamat kosong, tidak sah atau
 * sebelum mula = satu hari. Dihadkan 14 hari.
 */
export function hariMesyuarat(m: { tarikh: string; tarikhTamat: string | null }): string[] {
  if (!isTarikhIso(m.tarikh)) return [];
  if (!m.tarikhTamat || !isTarikhIso(m.tarikhTamat) || m.tarikhTamat <= m.tarikh) {
    return [m.tarikh];
  }
  const hari: string[] = [];
  const mula = new Date(`${m.tarikh}T00:00:00Z`);
  for (let i = 0; i < MAKS_HARI; i += 1) {
    const d = new Date(mula.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    if (d > m.tarikhTamat) break;
    hari.push(d);
  }
  return hari;
}

/** "21 Oktober" daripada "2026-10-21". */
export function labelHariPendek(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${NAMA_BULAN[m - 1] ?? m}`;
}

/** "21 & 22 Oktober" (bulan sama) atau "31 Oktober & 1 November" (bulan berbeza). */
export function labelBeberapaHari(hari: readonly string[]): string {
  if (hari.length === 0) return "";
  if (hari.length === 1) return labelHariPendek(hari[0]!);
  const bulanSama = hari.every((h) => h.slice(0, 7) === hari[0]!.slice(0, 7));
  if (bulanSama) {
    const hariBulan = hari.map((h) => Number(h.slice(8)));
    const [, m] = hari[0]!.split("-").map(Number);
    return `${hariBulan.join(" & ")} ${NAMA_BULAN[(m ?? 1) - 1]}`;
  }
  return hari.map(labelHariPendek).join(" & ");
}

export type PilihanTarikh = { label: string; hari: string[] };

/** Pilihan "Tarikh Pembentangan": setiap hari, ditambah "semua hari" bila lebih daripada satu. */
export function pilihanTarikhPembentangan(hari: readonly string[]): PilihanTarikh[] {
  const pilihan = hari.map((h) => ({ label: labelHariPendek(h), hari: [h] }));
  if (hari.length >= 2) pilihan.push({ label: labelBeberapaHari(hari), hari: [...hari] });
  return pilihan;
}

/** Nilai ringkas untuk radio/borang: tarikh dicantum dengan koma. */
export function nilaiPilihanHari(hari: readonly string[]): string {
  return hari.join(",");
}

/** Pecah nilai radio; hanya tarikh yang ada dalam `hariSah` diterima (kosong jika tidak sah). */
export function huraiPilihanHari(nilai: string, hariSah: readonly string[]): string[] {
  const hari = [...new Set(nilai.split(",").map((h) => h.trim()).filter(Boolean))];
  if (hari.length === 0 || hari.some((h) => !hariSah.includes(h))) return [];
  return hariSah.filter((h) => hari.includes(h));
}

/**
 * Mesyuarat sebelum lalai: yang terkini sebelum (tahun, bil) yang ditentukan
 * (tahun lebih awal, atau tahun sama dengan bil lebih kecil).
 */
/** `a` diadakan lebih awal daripada `b` (ikut tahun, kemudian Bil.). */
export function lebihAwal(
  a: { tahun: number; bil: number },
  b: { tahun: number; bil: number },
): boolean {
  return a.tahun < b.tahun || (a.tahun === b.tahun && a.bil < b.bil);
}

export function mesyuaratSebelumLalai<T extends { id: string; tahun: number; bil: number }>(
  senarai: readonly T[],
  sasaran: { tahun: number; bil: number; id?: string },
): T | null {
  const lebihAwal = senarai.filter(
    (m) =>
      m.id !== sasaran.id &&
      (m.tahun < sasaran.tahun || (m.tahun === sasaran.tahun && m.bil < sasaran.bil)),
  );
  lebihAwal.sort((a, b) => b.tahun - a.tahun || b.bil - a.bil);
  return lebihAwal[0] ?? null;
}
