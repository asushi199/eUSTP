/**
 * Arkib penggunaan DELIMa tahun lepas (peratus aktif sekolah sahaja, tanpa nama guru/murid).
 * Fail tulen — selamat diimport komponen klien. Data sebenar dalam `delima-arkib-data.ts` (pelayan).
 */

/** Tahun yang ada dalam arkib; tahun semasa dipaparkan daripada sumber langsung DELIMa. */
export const DELIMA_ARKIB_TAHUN = [2025] as const;

export type DelimaArkibRow = {
  kod: string;
  nama: string;
  /** % aktif guru (0–100). */
  guru: number;
  /** % aktif murid (0–100). */
  murid: number;
};

export type DelimaArkib = {
  tahun: number;
  /** Tarikh data, cth. "31 Disember 2025 (TOV)". */
  tempoh: string;
  schools: DelimaArkibRow[];
};

export function isArkibTahun(tahun: number): boolean {
  return (DELIMA_ARKIB_TAHUN as readonly number[]).includes(tahun);
}
