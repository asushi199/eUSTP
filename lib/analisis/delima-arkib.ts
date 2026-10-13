import "server-only";

import { db } from "@/lib/db";
import { schools as schoolTable } from "@/lib/schema";
import { DELIMA_ARKIB_2025 } from "./delima-arkib-data";
import { isArkibTahun, type DelimaArkib, type DelimaArkibRow } from "./delima-arkib-meta";

const ARKIB: Record<number, { tempoh: string; rows: DelimaArkibRow[] }> = {
  2025: { tempoh: "31 Disember 2025 (TOV)", rows: DELIMA_ARKIB_2025 },
};

/** Arkib satu tahun; nama sekolah diseragamkan dengan direktori (kod sama) jika ada. null jika tahun tiada arkib. */
export async function getDelimaArkib(tahun: number): Promise<DelimaArkib | null> {
  if (!isArkibTahun(tahun)) return null;
  const entry = ARKIB[tahun];
  if (!entry) return null;
  const direktori = await db
    .select({ code: schoolTable.code, name: schoolTable.name })
    .from(schoolTable)
    .catch(() => []);
  const names = new Map(direktori.map((r) => [r.code, r.name]));
  return {
    tahun,
    tempoh: entry.tempoh,
    schools: entry.rows.map((r) => ({ ...r, nama: names.get(r.kod) ?? r.nama })),
  };
}
