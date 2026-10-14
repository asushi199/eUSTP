import { z } from "zod";
import { JENIS_KEHADIRAN, type JenisKehadiran } from "./enums";

/** Organisasi tetap bagi pegawai PPD. */
export const ORGANISASI_PPD = "PPD Manjung";

export const NAMA_MAKS = 200;
export const JAWATAN_MAKS = 200;
export const ORGANISASI_MAKS = 200;

const teks = (maks: number, mesej: string, panjang: string) =>
  z.string().transform((v) => v.trim().replace(/\s+/g, " ")).pipe(
    z.string().min(1, mesej).max(maks, panjang),
  );

const teksSchema = z.object({
  nama: teks(NAMA_MAKS, "Sila isi nama.", "Nama terlalu panjang."),
  jawatan: teks(JAWATAN_MAKS, "Sila isi jawatan.", "Jawatan terlalu panjang."),
});

const organisasiSchema = teks(ORGANISASI_MAKS, "Sila isi organisasi.", "Organisasi terlalu panjang.");

export type TeksKehadiran = { nama: string; jawatan: string; organisasi?: string };

export type SahkanTeksResult =
  | { ok: true; nama: string; jawatan: string; organisasi: string | null }
  | { ok: false; error: string };

/**
 * Sahkan medan teks kehadiran (Nama, Jawatan, + Organisasi jika `perluOrganisasi`):
 * trim, ruang berganda dibuang, wajib diisi, panjang terhad.
 */
export function sahkanTeksKehadiran(
  input: unknown,
  opts: { perluOrganisasi: boolean },
): SahkanTeksResult {
  const asas = teksSchema.safeParse(input);
  if (!asas.success) {
    return { ok: false, error: asas.error.issues[0]?.message ?? "Input tidak sah." };
  }
  let organisasi: string | null = null;
  if (opts.perluOrganisasi) {
    const org = organisasiSchema.safeParse((input as { organisasi?: unknown })?.organisasi ?? "");
    if (!org.success) {
      return { ok: false, error: org.error.issues[0]?.message ?? "Organisasi tidak sah." };
    }
    organisasi = org.data;
  }
  return { ok: true, nama: asas.data.nama, jawatan: asas.data.jawatan, organisasi };
}

export function isJenisKehadiran(v: string): v is JenisKehadiran {
  return (JENIS_KEHADIRAN as readonly string[]).includes(v);
}

export type RekodKiraan = { jenis: string; schoolCode: string | null };

/** Kod sekolah yang dikira hadir: ada rekod PGB atau WAKIL bagi kod itu. */
export function kodSekolahHadir(rekod: readonly RekodKiraan[]): Set<string> {
  const kod = new Set<string>();
  for (const r of rekod) {
    if ((r.jenis === "PGB" || r.jenis === "WAKIL") && r.schoolCode) kod.add(r.schoolCode);
  }
  return kod;
}

export type KiraanKehadiran = {
  sekolahHadir: number;
  sekolahJumlah: number;
  pgb: number;
  wakil: number;
  pegawai: number;
  lain: number;
  jumlah: number;
};

/** Ringkasan bilangan. Hanya sekolah yang "dijangka" — pegawai/lain-lain tidak dijangka. */
export function kiraKehadiran(
  rekod: readonly RekodKiraan[],
  kodSekolahDijangka: readonly string[],
): KiraanKehadiran {
  const hadir = kodSekolahHadir(rekod);
  const dijangka = new Set(kodSekolahDijangka);
  const bil = (jenis: JenisKehadiran) => rekod.filter((r) => r.jenis === jenis).length;
  return {
    sekolahHadir: [...hadir].filter((k) => dijangka.has(k)).length,
    sekolahJumlah: dijangka.size,
    pgb: bil("PGB"),
    wakil: bil("WAKIL"),
    pegawai: bil("PEGAWAI"),
    lain: bil("LAIN"),
    jumlah: rekod.length,
  };
}

export const JENIS_KEHADIRAN_LABEL: Record<JenisKehadiran, string> = {
  PGB: "PGB",
  WAKIL: "Wakil sekolah",
  PEGAWAI: "Pegawai PPD",
  LAIN: "Lain-lain",
};

/** Escape % _ \ untuk corak ILIKE. */
export function escapeLike(q: string): string {
  return q.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const CARIAN_PEGAWAI_MIN = 2;
export const CARIAN_PEGAWAI_MAKS_HASIL = 10;

/** Rekod pada satu hari (YYYY-MM-DD); `null` = semua hari. */
export function tapisRekodHari<T extends { tarikh: string }>(
  rekod: readonly T[],
  hari: string | null,
): T[] {
  return hari ? rekod.filter((r) => r.tarikh === hari) : [...rekod];
}

/** Hari lalai paparan admin: hari ini jika dalam hari mesyuarat, jika tidak `null` (semua hari). */
export function hariLalaiKehadiran(hariMesyuarat: readonly string[], hariIni: string): string | null {
  return hariMesyuarat.includes(hariIni) ? hariIni : null;
}

/** Tafsir parameter `hari` (URL): tarikh sah dalam senarai hari, "semua" = null, selain itu lalai. */
export function tafsirHariDipilih(
  param: string | undefined,
  hariMesyuarat: readonly string[],
  hariIni: string,
): string | null {
  if (param === "semua") return null;
  if (param && hariMesyuarat.includes(param)) return param;
  return hariLalaiKehadiran(hariMesyuarat, hariIni);
}
