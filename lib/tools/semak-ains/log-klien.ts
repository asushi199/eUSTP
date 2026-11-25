import { bezaStandard, type Standard } from "./standard";
import { VERSI_ENJIN } from "./versi";

export type DataLog = {
  namaSekolah: string;
  kodSekolah: string | null;
  jenis: "semak" | "lulus" | "tolak";
  bilRekod: number;
  bilHijau?: number;
  bilKuning?: number;
  bilMerah?: number;
  bilBerjaya?: number;
  bilGagal?: number;
  versiPenanda: number;
};

/** Hantar bilangan sahaja ke NEXa (tiada nama murid, tajuk, teks atau ID rekod). Gagal = senyap. */
export function hantarLog(d: DataLog, standard: Standard): void {
  const beza = bezaStandard(standard);
  const badan = {
    namaSekolah: d.namaSekolah.slice(0, 200),
    kodSekolah: d.kodSekolah,
    jenis: d.jenis,
    bilRekod: d.bilRekod,
    bilHijau: d.bilHijau ?? null,
    bilKuning: d.bilKuning ?? null,
    bilMerah: d.bilMerah ?? null,
    bilBerjaya: d.bilBerjaya ?? null,
    bilGagal: d.bilGagal ?? null,
    tetapan: Object.keys(beza).length ? beza : null,
    versiEnjin: VERSI_ENJIN,
    versiPenanda: String(d.versiPenanda),
  };
  void fetch("/api/semak-ains/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(badan),
    keepalive: true,
  }).catch(() => undefined);
}
