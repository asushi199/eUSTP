/**
 * Snapshot ESN (Etika Siber Nasional) daripada esn.moe.edu.my — dibaca manual
 * (log masuk akaun PPD Manjung: Dashboard + Status Pelaksanaan), disimpan sebagai JSON
 * dalam `analisis_esn_snapshots`. Hanya data peringkat sekolah; tiada nama murid/guru.
 */

/** Tarikh akhir pendaftaran & pelaksanaan ESN, ikut tahun (YYYY-MM-DD). */
export const ESN_TARIKH_AKHIR: Record<number, string> = {
  2026: "2026-12-15",
};

/** Taburan status: selesai / dalam proses / belum mula. */
export type EsnTaburan = { selesai: number; proses: number; belum: number };

export type EsnKumpulan = EsnTaburan & {
  /** Contoh: "Murid Tahap 1", "Murid Menengah Atas". */
  label: string;
  jumlah: number;
};

export type EsnJenis = "rendah" | "menengah";

export type EsnRingkasan = {
  jenis: EsnJenis;
  label: string;
  sekolah: EsnTaburan & { jumlah: number };
  murid: EsnKumpulan[];
};

export type EsnStatus = "selesai" | "proses" | "belum";

export type EsnSekolah = {
  kod: string;
  nama: string;
  jenis: EsnJenis;
  status: EsnStatus;
  kelasSiap: number;
  kelasJumlah: number;
  muridSiap: number;
  muridJumlah: number;
  /** Rekod ujian dalam sistem ESN (cth. SMK BERTESTING) — dikira dalam jumlah rasmi, tidak disenaraikan. */
  ujian?: boolean;
};

export type EsnSnapshot = {
  tahun: number;
  capturedOn: string;
  sumber: string;
  ppd: string;
  ringkasan: EsnRingkasan[];
  sekolah: EsnSekolah[];
};

export const ESN_STATUS_LABEL: Record<EsnStatus, string> = {
  selesai: "Selesai",
  proses: "Dalam proses",
  belum: "Belum mula",
};

/** Jumlah murid selesai / jumlah murid merentas semua kumpulan. */
export function jumlahMuridEsn(s: EsnSnapshot): { siap: number; proses: number; jumlah: number } {
  const k = s.ringkasan.flatMap((r) => r.murid);
  return {
    siap: k.reduce((a, x) => a + x.selesai, 0),
    proses: k.reduce((a, x) => a + x.proses, 0),
    jumlah: k.reduce((a, x) => a + x.jumlah, 0),
  };
}

/** Jumlah sekolah ikut status merentas rendah + menengah. */
export function jumlahSekolahEsn(s: EsnSnapshot): EsnTaburan & { jumlah: number } {
  const k = s.ringkasan.map((r) => r.sekolah);
  return {
    selesai: k.reduce((a, x) => a + x.selesai, 0),
    proses: k.reduce((a, x) => a + x.proses, 0),
    belum: k.reduce((a, x) => a + x.belum, 0),
    jumlah: k.reduce((a, x) => a + x.jumlah, 0),
  };
}

/** Semakan konsisten: senarai sekolah (Status Pelaksanaan) = angka Dashboard. */
export function semakEsn(s: EsnSnapshot): string[] {
  const ralat: string[] = [];
  for (const r of s.ringkasan) {
    const sek = s.sekolah.filter((x) => x.jenis === r.jenis);
    const bil = (st: EsnStatus) => sek.filter((x) => x.status === st).length;
    if (sek.length !== r.sekolah.jumlah) ralat.push(`${r.label}: ${sek.length} sekolah ≠ ${r.sekolah.jumlah}`);
    for (const st of ["selesai", "proses", "belum"] as const) {
      if (bil(st) !== r.sekolah[st]) ralat.push(`${r.label}: sekolah ${st} ${bil(st)} ≠ ${r.sekolah[st]}`);
    }
    const siap = sek.reduce((a, x) => a + x.muridSiap, 0);
    const jumlah = sek.reduce((a, x) => a + x.muridJumlah, 0);
    const siapR = r.murid.reduce((a, x) => a + x.selesai, 0);
    const jumlahR = r.murid.reduce((a, x) => a + x.jumlah, 0);
    if (siap !== siapR || jumlah !== jumlahR) ralat.push(`${r.label}: murid ${siap}/${jumlah} ≠ ${siapR}/${jumlahR}`);
    for (const k of r.murid) {
      if (k.selesai + k.proses + k.belum !== k.jumlah) ralat.push(`${k.label}: taburan ≠ jumlah`);
    }
  }
  return ralat;
}
