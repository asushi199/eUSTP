/**
 * Jenis & peringkat sekolah daripada nama dan kod dalam jadual `schools`.
 *
 * Corak sebenar (102 sekolah PPD Manjung, disahkan daripada data):
 *   nama "SK ..."               kod ABA/ABB     -> SK   (42)
 *   nama "SJKC ..."             kod ABC         -> SJKC (24)
 *   nama "SJKT ..."             kod ABD         -> SJKT (15)
 *   nama "SMK ..."              kod AEA/AEB/AEE -> SM   (19)
 *   nama "SABK ..."             kod AFT         -> SM   (1)
 *   nama "KOLEJ VOKASIONAL ..." kod AHA         -> SM   (1)
 * Nama diutamakan; kod digunakan jika nama tidak dikenali. Jika kedua-duanya
 * dikenali tetapi bercanggah, jenisSekolah() melontar ralat (data tidak konsisten).
 */

export const JENIS_SEKOLAH = ["SK", "SJKC", "SJKT", "SM"] as const;
export type JenisSekolah = (typeof JENIS_SEKOLAH)[number];
export type Peringkat = "SR" | "SM";

export type SekolahRingkas = { code: string; name: string };

function normalisasiNama(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toUpperCase();
}

const AWALAN_SM =
  /^(SMK|SMKA|SMJK|SMT|SMV|SBP|SABK|SM|SEKOLAH MENENGAH|KOLEJ VOKASIONAL|KV)(?![A-Z0-9])/;

function jenisDariNama(name: string): JenisSekolah | null {
  const n = normalisasiNama(name);
  if (/^SJK\s*\(?C\)?(?![A-Z0-9])/.test(n)) return "SJKC";
  if (/^SJK\s*\(?T\)?(?![A-Z0-9])/.test(n)) return "SJKT";
  if (/^SK(?![A-Z0-9])/.test(n)) return "SK";
  if (AWALAN_SM.test(n)) return "SM";
  return null;
}

const JENIS_DARI_KOD: Record<string, JenisSekolah> = {
  ABA: "SK",
  ABB: "SK",
  ABC: "SJKC",
  ABD: "SJKT",
  AEA: "SM",
  AEB: "SM",
  AEE: "SM",
  AFT: "SM",
  AHA: "SM",
};

function jenisDariKod(code: string): JenisSekolah | null {
  return JENIS_DARI_KOD[code.trim().toUpperCase().slice(0, 3)] ?? null;
}

/** Seperti jenisSekolah() tetapi pulangkan null jika corak tidak dikenali / bercanggah. */
export function kenalJenisSekolah(name: string, code: string): JenisSekolah | null {
  const dariNama = jenisDariNama(name);
  const dariKod = jenisDariKod(code);
  if (dariNama && dariKod && dariNama !== dariKod) return null;
  return dariNama ?? dariKod;
}

/** Jenis sekolah; melontar ralat jika corak nama/kod tidak dikenali atau bercanggah. */
export function jenisSekolah(name: string, code: string): JenisSekolah {
  const dariNama = jenisDariNama(name);
  const dariKod = jenisDariKod(code);
  if (dariNama && dariKod && dariNama !== dariKod) {
    throw new Error(
      `Jenis sekolah bercanggah untuk ${code} "${name}": nama = ${dariNama}, kod = ${dariKod}.`,
    );
  }
  const jenis = dariNama ?? dariKod;
  if (!jenis) {
    throw new Error(`Jenis sekolah tidak dikenali untuk ${code} "${name}".`);
  }
  return jenis;
}

/** Peringkat: SK/SJKC/SJKT = SR; SM = SM. */
export function peringkat(jenis: JenisSekolah): Peringkat {
  return jenis === "SM" ? "SM" : "SR";
}

export function labelJenisSekolah(jenis: JenisSekolah | null): string {
  switch (jenis) {
    case "SK":
      return "SK";
    case "SJKC":
      return "SJK(C)";
    case "SJKT":
      return "SJK(T)";
    case "SM":
      return "Menengah";
    default:
      return "Tidak dikenali";
  }
}
