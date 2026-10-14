/** Nilai tetap modul MJKD (tulen — selamat diimport komponen klien). */

export const STATUS_MJKD = [
  "SELESAI",
  "DALAM_PELAKSANAAN",
  "BELUM",
  "TIDAK_BERKAITAN",
] as const;
export type StatusMjkd = (typeof STATUS_MJKD)[number];

export const STATUS_MJKD_LABEL: Record<StatusMjkd, string> = {
  SELESAI: "Selesai",
  DALAM_PELAKSANAAN: "Dalam Pelaksanaan",
  BELUM: "Belum Dilaksanakan",
  TIDAK_BERKAITAN: "Tidak Berkaitan",
};

/** Huruf ringkas untuk sel matriks sekolah × perkara. */
export const STATUS_MJKD_SINGKAT: Record<StatusMjkd, string> = {
  SELESAI: "S",
  DALAM_PELAKSANAAN: "D",
  BELUM: "B",
  TIDAK_BERKAITAN: "T",
};

/** Kelas warna (tanpa biru — biru dihadkan 2 unsur setiap skrin). */
export const STATUS_MJKD_WARNA: Record<StatusMjkd, string> = {
  SELESAI: "bg-storm-deep text-white",
  DALAM_PELAKSANAAN: "bg-storm-mist/50 text-storm-deep",
  BELUM: "bg-bloom-rose text-bloom-deep",
  TIDAK_BERKAITAN: "bg-fog text-graphite",
};

export const SASARAN_MJKD = ["SEMUA", "SR", "SM", "SJK"] as const;
export type SasaranMjkd = (typeof SASARAN_MJKD)[number];

export const SASARAN_MJKD_LABEL: Record<SasaranMjkd, string> = {
  SEMUA: "Semua sekolah",
  SR: "Sekolah rendah (SK, SJKC, SJKT)",
  SM: "Sekolah menengah",
  SJK: "SJK (SJKC dan SJKT)",
};

export const JENIS_KEHADIRAN = ["PGB", "WAKIL", "PEGAWAI", "LAIN"] as const;
export type JenisKehadiran = (typeof JENIS_KEHADIRAN)[number];

export function isStatusMjkd(v: string): v is StatusMjkd {
  return (STATUS_MJKD as readonly string[]).includes(v);
}

export function isSasaranMjkd(v: string): v is SasaranMjkd {
  return (SASARAN_MJKD as readonly string[]).includes(v);
}

/** Tajuk mesyuarat, cth. "Bil.1/2026". */
export function labelMesyuarat(m: { bil: number; tahun: number }): string {
  return `Bil.${m.bil}/${m.tahun}`;
}

/** Hari ini (waktu Kuala Lumpur) sebagai YYYY-MM-DD. */
export function hariIniKl(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Maklum balas boleh dihantar/dikemas kini bila suis dibuka dan (jika ada) tarikh tutup
 * belum berlalu — tarikh tutup ialah hari terakhir yang masih dibenarkan.
 */
export function maklumBalasTerbuka(
  m: { maklumBalasDibuka: boolean; tarikhTutupMaklumBalas: string | null },
  now: Date = new Date(),
): boolean {
  if (!m.maklumBalasDibuka) return false;
  if (!m.tarikhTutupMaklumBalas) return true;
  return hariIniKl(now) <= m.tarikhTutupMaklumBalas;
}

const NAMA_HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];

/**
 * Hari berbaki sebelum maklum balas ditutup (waktu KL): 0 = hari ini hari terakhir,
 * negatif = sudah lepas. `namaHari` = nama hari tarikh tutup (cth. "Isnin").
 */
export function bakiHariTutup(
  tutup: string,
  now: Date = new Date(),
): { hari: number; namaHari: string } {
  const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
  return {
    hari: Math.round((t(tutup) - t(hariIniKl(now))) / 86_400_000),
    namaHari: NAMA_HARI[new Date(t(tutup)).getUTCDay()] ?? "",
  };
}

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

/** "27 Februari 2026" daripada "2026-02-27" (tanpa pergantungan zon masa). */
export function formatTarikhMs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${NAMA_BULAN[m - 1] ?? m} ${y}`;
}
