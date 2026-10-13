/**
 * Arkib penggunaan DELIMa tahun lepas (peratus aktif sekolah sahaja, tanpa nama guru/murid).
 * Fail tulen — selamat diimport komponen klien. Data sebenar dalam `delima-arkib-data.ts` (pelayan).
 */

/** Tahun yang ada dalam arkib; tahun semasa dipaparkan daripada sumber langsung DELIMa. */
export const DELIMA_ARKIB_TAHUN = [2025] as const;

export type DelimaArkibRow = {
  kod: string;
  nama: string;
  /** % aktif guru (0–100); null jika sekolah tiada dalam sumber guru/murid. */
  guru: number | null;
  /** % aktif murid (0–100); null jika sekolah tiada dalam sumber guru/murid. */
  murid: number | null;
  /** Bil. ID pengguna aktif / jumlah ID pengguna sepanjang tahun (semua jenis ID). */
  pengguna: { aktif: number; jumlah: number } | null;
};

export type DelimaArkib = {
  tahun: number;
  /** Tarikh data guru/murid, cth. "31 Disember 2025 (TOV)". */
  tempoh: string;
  schools: DelimaArkibRow[];
  /** Jumlah pengguna aktif seluruh PPD (kad ringkasan sumber); null jika tiada. */
  ringkasan: { aktif: number; jumlah: number; sumber: string } | null;
};

export function isArkibTahun(tahun: number): boolean {
  return (DELIMA_ARKIB_TAHUN as readonly number[]).includes(tahun);
}
