import "server-only";

import {
  namaPpd,
  ringkasCsvPpd,
  type DelimaV30,
} from "./delima-csv-parse";

export type { DelimaV30, DelimaV30Pop } from "./delima-csv-parse";

/**
 * Data DELIMa 3.0 setiap sekolah daripada CSV yang diterbitkan Google Sheet "Portal Statistik
 * DELIMa Negeri Perak" (Google Site DELIMa Perak → Analisis DELIMa). Pautan CSV awam
 * (Publish to web) — tiada kata laluan; hanya jumlah aktif/jumlah pengguna setiap sekolah dibaca
 * (lajur nama/e-mel individu dalam tab lain TIDAK diambil).
 *
 * Angka DELIMa 2.0 kekal daripada papan pemuka DELIMa Perak (`delima-live.ts`); lembaran 2.0 dalam
 * CSV ini memberi angka yang sama.
 */
const SHEET =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQbUT2iTdSIFymEjhWe_b17zk2fXaI_zaeEb59N4ypvxN4m6bW_R0G3IQjbwkugSA/pub";
const GID = { guru: "1023985887", murid: "1408521867" } as const;
const REVALIDATE_SAAT = 3600;

async function getCsv(gid: string): Promise<string> {
  const res = await fetch(`${SHEET}?gid=${gid}&single=true&output=csv`, {
    next: { revalidate: REVALIDATE_SAAT },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** DELIMa 3.0 guru + murid bagi satu daerah (PPD). null jika sumber gagal dicapai/format berubah. */
export async function fetchDelimaV30(daerahSlug: string): Promise<DelimaV30 | null> {
  try {
    const ppd = namaPpd(daerahSlug);
    const [guruCsv, muridCsv] = await Promise.all([getCsv(GID.guru), getCsv(GID.murid)]);
    const guru = ringkasCsvPpd(guruCsv, ppd);
    const murid = ringkasCsvPpd(muridCsv, ppd);
    if (!guru || !murid) return null;
    return {
      guru: guru.sekolah,
      murid: murid.sekolah,
      jumlahGuru: guru.jumlah,
      jumlahMurid: murid.jumlah,
    };
  } catch {
    return null;
  }
}
