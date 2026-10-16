import "server-only";

import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { analisisEsnSnapshots } from "@/lib/schema";
import type { EsnSnapshot } from "./esn-types";

/** Snapshot ESN terbaharu bagi setiap tahun (tahun terkini dahulu). */
export async function getEsnTerkiniIkutTahun(): Promise<EsnSnapshot[]> {
  const rows = await db
    .select({ tahun: analisisEsnSnapshots.tahun, data: analisisEsnSnapshots.data })
    .from(analisisEsnSnapshots)
    .orderBy(desc(analisisEsnSnapshots.tahun), desc(analisisEsnSnapshots.capturedOn));
  const seen = new Set<number>();
  const out: EsnSnapshot[] = [];
  for (const r of rows) {
    if (seen.has(r.tahun)) continue;
    seen.add(r.tahun);
    out.push(r.data as EsnSnapshot);
  }
  return out;
}
