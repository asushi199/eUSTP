import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisDcsSnapshots } from "@/lib/schema";
import type { DcsSnapshot } from "./dcs-types";

/** Snapshot DCS terbaharu bagi setiap tahun (tahun terkini dahulu). */
export async function getDcsTerkiniIkutTahun(): Promise<DcsSnapshot[]> {
  const rows = await db
    .select({ tahun: analisisDcsSnapshots.tahun, data: analisisDcsSnapshots.data })
    .from(analisisDcsSnapshots)
    .orderBy(desc(analisisDcsSnapshots.tahun), desc(analisisDcsSnapshots.capturedOn));
  const seen = new Set<number>();
  const out: DcsSnapshot[] = [];
  for (const r of rows) {
    if (seen.has(r.tahun)) continue;
    seen.add(r.tahun);
    out.push(r.data as DcsSnapshot);
  }
  return out;
}
