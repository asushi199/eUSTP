/**
 * Cetak draf (belum dihantar): borang menyimpan keadaan semasa dalam localStorage, kemudian
 * membuka /cetak/kunjung-bantu/draf dalam tab baharu yang membacanya. Tiada query DB.
 * Kod klien sahaja.
 */
import {
  SESI_KUNJUNG_BANTU,
  type DelimaSekolah,
  type Jawapan,
  type MaklumatSekolah,
  type Semakan,
} from "@/lib/kunjung-bantu/instrumen";

export const KUNCI_CETAK_DRAF = `kb-cetak-draf:${SESI_KUNJUNG_BANTU}`;
export const URL_CETAK_DRAF = "/cetak/kunjung-bantu/draf";

export type CetakDrafData = {
  sekolah: { code: string; name: string };
  maklumat: MaklumatSekolah;
  jawapan: Jawapan;
  semakan: Semakan;
  delima: DelimaSekolah | null;
  /** ISO masa draf dicetak. */
  dicetak: string;
  /** Laluan borang asal (untuk pautan Kembali). */
  kembali: string;
};

export function simpanCetakDraf(d: CetakDrafData): boolean {
  try {
    window.localStorage.setItem(KUNCI_CETAK_DRAF, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function bacaCetakDraf(): CetakDrafData | null {
  try {
    const raw = window.localStorage.getItem(KUNCI_CETAK_DRAF);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<CetakDrafData> | null;
    if (!d || typeof d !== "object" || !d.sekolah?.code || !d.maklumat || !d.jawapan) return null;
    const kembali =
      typeof d.kembali === "string" && d.kembali.startsWith("/laporan-kunjung-bantu")
        ? d.kembali
        : "/laporan-kunjung-bantu";
    return {
      sekolah: { code: String(d.sekolah.code), name: String(d.sekolah.name ?? "") },
      maklumat: d.maklumat,
      jawapan: d.jawapan,
      semakan: d.semakan ?? {},
      delima: d.delima ?? null,
      dicetak: String(d.dicetak ?? new Date().toISOString()),
      kembali,
    };
  } catch {
    return null;
  }
}
