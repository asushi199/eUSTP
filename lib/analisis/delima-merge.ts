/**
 * Gabungan DELIMa 2.0 + 3.0 bagi paparan sekolah (tulen, selamat untuk komponen klien).
 * DELIMa 2.0 sudah tiada, jadi tiada lagi pembezaan: guna angka dengan peratus aktif tertinggi,
 * dan tahap SENTIASA dikira semula daripada peratus itu (bukan label lama sumber 2.0).
 */
import type { DelimaLivePop, DelimaSchoolPop, DelimaSchoolRow, DelimaTahap } from "./delima-live";

export function tahapDariPeratus(peratus: number): DelimaTahap {
  return peratus >= 75 ? "Tinggi" : peratus >= 40 ? "Sederhana" : "Rendah";
}

export function tertinggi(
  v20: DelimaLivePop | null | undefined,
  v30: DelimaLivePop | null | undefined,
): DelimaSchoolPop | null {
  const pilih = v20 && (!v30 || v20.peratus >= v30.peratus) ? v20 : v30;
  if (!pilih) return null;
  return {
    aktif: pilih.aktif,
    jumlah: pilih.jumlah,
    peratus: pilih.peratus,
    tahap: tahapDariPeratus(pilih.peratus),
  };
}

export function gabungSekolah(row: DelimaSchoolRow): DelimaSchoolRow {
  return {
    ...row,
    guru: tertinggi(row.guru, row.guru30),
    murid: tertinggi(row.murid, row.murid30),
    guru30: undefined,
    murid30: undefined,
  };
}
