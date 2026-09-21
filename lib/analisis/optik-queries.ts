import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  analisisOptikSchools,
  analisisOptikSnapshots,
  schools as schoolTable,
} from "@/lib/schema";
import {
  metricNum,
  metricText,
  optikTovLabel,
  optikTovValue,
  type MetricMap,
} from "@/lib/analisis/queries";
import { roundPct } from "@/lib/analisis/optik-parse";
import type { OptikSchoolPublicRow, OptikSnapshotSummary } from "@/lib/analisis/optik-types";

export type { OptikSchoolPublicRow, OptikSnapshotSummary };

export type OptikPublicView = {
  metrics: MetricMap;
  current: OptikSnapshotSummary | null;
  schools: OptikSchoolPublicRow[];
  trend: { bulan: string; jumlah: number }[];
  snapshots: OptikSnapshotSummary[];
};

function asYmd(value: string | Date): string {
  return String(value).slice(0, 10);
}

function toSummary(
  row: typeof analisisOptikSnapshots.$inferSelect,
): OptikSnapshotSummary {
  return {
    id: row.id,
    capturedOn: asYmd(row.capturedOn),
    chartLabel: row.chartLabel,
    sourceFilename: row.sourceFilename,
    sourceFormat: row.sourceFormat,
    selesaiPct: row.selesaiPct,
    selesaiBil: row.selesaiBil,
    totalBil: row.totalBil,
    belumPct: row.belumPct,
    belumBil: row.belumBil,
    sekolahSelesai: row.sekolahSelesai,
    sekolahBelum: row.sekolahBelum,
    sekolahCount: row.sekolahCount,
    isCurrent: row.isCurrent,
    includeChart: row.includeChart,
    createdAt: row.createdAt,
  };
}

export async function listOptikSnapshots(): Promise<OptikSnapshotSummary[]> {
  const rows = await db
    .select()
    .from(analisisOptikSnapshots)
    .orderBy(desc(analisisOptikSnapshots.capturedOn), desc(analisisOptikSnapshots.id));
  return rows.map(toSummary);
}

export async function getOptikSnapshotById(id: number) {
  const [row] = await db
    .select()
    .from(analisisOptikSnapshots)
    .where(eq(analisisOptikSnapshots.id, id))
    .limit(1);
  return row ?? null;
}

export async function getCurrentOptikSnapshot(): Promise<OptikSnapshotSummary | null> {
  const [row] = await db
    .select()
    .from(analisisOptikSnapshots)
    .where(eq(analisisOptikSnapshots.isCurrent, true))
    .limit(1);
  return row ? toSummary(row) : null;
}

export async function getOptikSchoolsForSnapshot(
  snapshotId: number,
): Promise<OptikSchoolPublicRow[]> {
  const rows = await db
    .select()
    .from(analisisOptikSchools)
    .where(eq(analisisOptikSchools.snapshotId, snapshotId))
    .orderBy(asc(analisisOptikSchools.sort), asc(analisisOptikSchools.schoolCode));
  return rows.map((row) => ({
    schoolCode: row.schoolCode,
    schoolName: row.schoolName,
    selesaiBil: row.selesaiBil,
    totalBil: row.totalBil,
    pctAi: row.pctAi,
    plcStatus: row.plcStatus,
  }));
}

export function buildOptikTrend(
  metrics: MetricMap,
  snapshots: OptikSnapshotSummary[],
): { bulan: string; jumlah: number }[] {
  const points: { bulan: string; jumlah: number }[] = [];
  const tov = optikTovValue(metrics);
  if (tov != null && tov > 0) {
    points.push({ bulan: optikTovLabel(metrics), jumlah: roundPct(tov) });
  }
  const chronological = [...snapshots]
    .filter((row) => row.includeChart)
    .sort((a, b) => {
      if (a.capturedOn !== b.capturedOn) return a.capturedOn.localeCompare(b.capturedOn);
      return a.id - b.id;
    });
  for (const snap of chronological) {
    points.push({ bulan: snap.chartLabel, jumlah: roundPct(snap.selesaiPct) });
  }
  return points;
}

export async function getOptikPublicView(metrics: MetricMap): Promise<OptikPublicView> {
  const snapshots = await listOptikSnapshots();
  const current = snapshots.find((row) => row.isCurrent) ?? snapshots[0] ?? null;
  const schools = current ? await getOptikSchoolsForSnapshot(current.id) : [];
  return {
    metrics,
    current,
    schools,
    trend: buildOptikTrend(metrics, snapshots),
    snapshots,
  };
}

export function optikKpiYear(metrics: MetricMap): string {
  const year = metricText(metrics, "kpi_year");
  return /^\d{4}$/.test(year) ? year : String(new Date().getFullYear());
}

export function optikKpiValue(metrics: MetricMap): number | null {
  return metricNum(metrics, "kpi_kebangsaan", "kpi");
}

export async function applySchoolDirectoryNames(
  schools: OptikSchoolPublicRow[],
): Promise<OptikSchoolPublicRow[]> {
  if (schools.length === 0) return schools;
  const rows = await db
    .select({ code: schoolTable.code, name: schoolTable.name })
    .from(schoolTable);
  const names = new Map(rows.map((row) => [row.code, row.name]));
  return schools.map((row) => ({
    ...row,
    schoolName: names.get(row.schoolCode) ?? row.schoolName,
  }));
}
