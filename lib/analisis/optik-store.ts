import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  analisisMetrics,
  analisisOptikSchools,
  analisisOptikSnapshots,
  analisisOptikTeachers,
} from "@/lib/schema";
import type { OptikParseResult } from "@/lib/analisis/optik-parse";

const AS_AT_MONTHS = [
  "Jan",
  "Feb",
  "Mac",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ogo",
  "Sep",
  "Okt",
  "Nov",
  "Dis",
];

export async function upsertOptikMetric(key: string, value: string) {
  await db
    .insert(analisisMetrics)
    .values({ modul: "optik", key, value })
    .onConflictDoUpdate({
      target: [analisisMetrics.modul, analisisMetrics.key],
      set: { value, updatedAt: sql`now()` },
    });
}

export async function syncOptikCurrentMetrics(
  capturedOn: string,
  parsed: Pick<
    OptikParseResult,
    "selesaiPct" | "selesaiBil" | "belumPct" | "belumBil"
  >,
) {
  const [y, m, d] = capturedOn.split("-");
  const asAt = `${Number(d)} ${AS_AT_MONTHS[Number(m) - 1]} ${y}`;
  await Promise.all([
    upsertOptikMetric("as_at", asAt),
    upsertOptikMetric("selesai_pct", String(parsed.selesaiPct)),
    upsertOptikMetric("selesai_bil", String(parsed.selesaiBil)),
    upsertOptikMetric("belum_pct", String(parsed.belumPct)),
    upsertOptikMetric("belum_bil", String(parsed.belumBil)),
  ]);
}

export async function insertOptikSnapshot(input: {
  parsed: OptikParseResult;
  capturedOn: string;
  chartLabel: string;
  filename: string;
  userId: number | null;
  makeCurrent: boolean;
}): Promise<number> {
  return db.transaction(async (tx) => {
    const sameDate = await tx
      .select({ id: analisisOptikSnapshots.id })
      .from(analisisOptikSnapshots)
      .where(eq(analisisOptikSnapshots.capturedOn, input.capturedOn));
    if (sameDate.length > 0) {
      await tx
        .delete(analisisOptikSnapshots)
        .where(eq(analisisOptikSnapshots.capturedOn, input.capturedOn));
    }
    if (input.makeCurrent) {
      await tx
        .update(analisisOptikSnapshots)
        .set({ isCurrent: false })
        .where(eq(analisisOptikSnapshots.isCurrent, true));
    }
    const [snap] = await tx
      .insert(analisisOptikSnapshots)
      .values({
        capturedOn: input.capturedOn,
        chartLabel: input.chartLabel,
        sourceFilename: input.filename,
        sourceFormat: input.parsed.format,
        rawCsv: input.parsed.csv,
        selesaiPct: input.parsed.selesaiPct,
        selesaiBil: input.parsed.selesaiBil,
        totalBil: input.parsed.totalBil,
        belumPct: input.parsed.belumPct,
        belumBil: input.parsed.belumBil,
        sekolahSelesai: input.parsed.sekolahSelesai,
        sekolahBelum: input.parsed.sekolahBelum,
        sekolahCount: input.parsed.schools.length,
        isCurrent: input.makeCurrent,
        includeChart: true,
        uploadedByUserId: input.userId,
      })
      .returning({ id: analisisOptikSnapshots.id });
    if (!snap) throw new Error("Snapshot gagal disimpan.");
    await tx.insert(analisisOptikSchools).values(
      input.parsed.schools.map((row, index) => ({
        snapshotId: snap.id,
        schoolCode: row.schoolCode,
        schoolName: row.schoolName,
        selesaiBil: row.selesaiBil,
        totalBil: row.totalBil,
        pctAi: row.pctAi,
        plcStatus: row.plcStatus,
        sort: index,
      })),
    );
    if (input.parsed.teachers.length > 0) {
      await tx.insert(analisisOptikTeachers).values(
        input.parsed.teachers.map((row, index) => ({
          snapshotId: snap.id,
          schoolCode: row.schoolCode,
          name: row.name,
          email: row.email,
          plcStatus: row.plcStatus,
          sort: index,
        })),
      );
    }
    return snap.id;
  });
}
