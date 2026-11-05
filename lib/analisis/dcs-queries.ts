import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisDcsSnapshots } from "@/lib/schema";
import type { DcsSnapshot } from "./dcs-types";

/** Snapshot DCS terbaharu bagi setiap tahun (tahun terkini dahulu). */
export async function getDcsTerkiniIkutTahun(): Promise<DcsSnapshot[]> {
  // DISTINCT ON: hanya satu baris (terkini) setiap tahun dipindahkan dari DB —
  // dahulu SEMUA snapshot JSON ditarik lalu ditapis dalam JS (egress membazir).
  const rows = await db
    .selectDistinctOn([analisisDcsSnapshots.tahun], {
      tahun: analisisDcsSnapshots.tahun,
      data: analisisDcsSnapshots.data,
    })
    .from(analisisDcsSnapshots)
    .orderBy(desc(analisisDcsSnapshots.tahun), desc(analisisDcsSnapshots.capturedOn));
  return rows.map((r) => r.data as DcsSnapshot);
}
