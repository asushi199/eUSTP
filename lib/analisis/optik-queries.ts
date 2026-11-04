import "server-only";

import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  analisisOptikSchools,
  analisisOptikSnapshots,
  analisisOptikTeachers,
  schools as schoolTable,
} from "@/lib/schema";
import {
  metricNum,
  metricText,
  optikTovLabel,
  optikTovValue,
  type MetricMap,
} from "@/lib/analisis/queries";
import { kedalamanGuru, roundPct } from "@/lib/analisis/optik-parse";
import type {
  OptikGuruTeratasRow,
  OptikKedalamanRow,
  OptikSchoolPublicRow,
  OptikSnapshotSummary,
  OptikTeacherPublicRow,
} from "@/lib/analisis/optik-types";

export type {
  OptikGuruTeratasRow,
  OptikKedalamanRow,
  OptikSchoolPublicRow,
  OptikSnapshotSummary,
  OptikTeacherPublicRow,
};

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
    guruBelumLogin: row.guruBelumLogin,
    muridAi: row.muridAi,
    muridJumlah: row.muridJumlah,
    muridPct: row.muridPct,
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
    guruBelumLogin: row.guruBelumLogin,
    muridAi: row.muridAi,
    muridJumlah: row.muridJumlah,
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

/** Halaman utama: KPI + carta sahaja, tanpa senarai 101 sekolah. */
export async function getOptikHomeView(metrics: MetricMap): Promise<{
  current: OptikSnapshotSummary | null;
  trend: { bulan: string; jumlah: number }[];
}> {
  const snapshots = await listOptikSnapshots();
  const current = snapshots.find((row) => row.isCurrent) ?? snapshots[0] ?? null;
  return { current, trend: buildOptikTrend(metrics, snapshots) };
}

export type OptikKpiPoint = { year: string; value: number };

export function optikKpiYear(metrics: MetricMap): string {
  const year = metricText(metrics, "kpi_year");
  return /^\d{4}$/.test(year) ? year : String(new Date().getFullYear());
}

export function optikKpiValue(metrics: MetricMap): number | null {
  return metricNum(metrics, "kpi_kebangsaan", "kpi");
}

export function optikKpiDisplayMode(metrics: MetricMap): "one" | "both" {
  const raw = metricText(metrics, "kpi_display").toLowerCase();
  return raw === "one" ? "one" : "both";
}

export function optikKpiPrevious(metrics: MetricMap): OptikKpiPoint | null {
  const year = metricText(metrics, "kpi_prev_year");
  const value = metricNum(metrics, "kpi_prev_value");
  if (!/^\d{4}$/.test(year) || value == null) return null;
  return { year, value };
}

export function optikKpiCurrent(metrics: MetricMap): OptikKpiPoint | null {
  const value = optikKpiValue(metrics);
  if (value == null) return null;
  return { year: optikKpiYear(metrics), value };
}

/** Tahun KPI yang dipaparkan di kad dan garis carta. */
export function optikKpiPoints(metrics: MetricMap): OptikKpiPoint[] {
  const current = optikKpiCurrent(metrics);
  const prev = optikKpiPrevious(metrics);
  const rows =
    optikKpiDisplayMode(metrics) === "both" && prev
      ? [prev, current]
      : [current];
  return rows
    .filter((row): row is OptikKpiPoint => row != null)
    .sort((a, b) => a.year.localeCompare(b.year));
}

export function optikKpiGroupStats(metrics: MetricMap): { label: string; value: string }[] {
  return optikKpiPoints(metrics).map((row) => ({
    label: row.year,
    value: `${row.value.toLocaleString("ms-MY")}%`,
  }));
}

export function optikKpiReferenceLines(metrics: MetricMap): { y: number; label: string }[] {
  return optikKpiPoints(metrics).map((row) => ({
    y: row.value,
    label: `KPI ${row.year} ${row.value}%`,
  }));
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

export async function getOptikSchoolDetail(schoolCode: string): Promise<{
  school: OptikSchoolPublicRow | null;
  teachers: OptikTeacherPublicRow[];
  snapshotLabel: string;
} | null> {
  const current = await getCurrentOptikSnapshot();
  if (!current) return null;
  const code = schoolCode.trim().toUpperCase();
  const [match] = await db
    .select()
    .from(analisisOptikSchools)
    .where(
      and(
        eq(analisisOptikSchools.snapshotId, current.id),
        eq(analisisOptikSchools.schoolCode, code),
      ),
    )
    .limit(1);
  if (!match) {
    return { school: null, teachers: [], snapshotLabel: current.chartLabel };
  }
  const [named] = await applySchoolDirectoryNames([
    {
      schoolCode: match.schoolCode,
      schoolName: match.schoolName,
      selesaiBil: match.selesaiBil,
      totalBil: match.totalBil,
      pctAi: match.pctAi,
      plcStatus: match.plcStatus,
      guruBelumLogin: match.guruBelumLogin,
      muridAi: match.muridAi,
      muridJumlah: match.muridJumlah,
    },
  ]);
  const teachers = await db
    .select({
      name: analisisOptikTeachers.name,
      plcStatus: analisisOptikTeachers.plcStatus,
      hariAktif: analisisOptikTeachers.hariAktif,
    })
    .from(analisisOptikTeachers)
    .where(
      and(
        eq(analisisOptikTeachers.snapshotId, current.id),
        eq(analisisOptikTeachers.schoolCode, code),
      ),
    )
    .orderBy(asc(analisisOptikTeachers.sort));
  return {
    school: named ?? {
      schoolCode: match.schoolCode,
      schoolName: match.schoolName,
      selesaiBil: match.selesaiBil,
      totalBil: match.totalBil,
      pctAi: match.pctAi,
      plcStatus: match.plcStatus,
      guruBelumLogin: match.guruBelumLogin,
      muridAi: match.muridAi,
      muridJumlah: match.muridJumlah,
    },
    teachers,
    snapshotLabel: current.chartLabel,
  };
}

/** Kedalaman penggunaan guru + papan guru paling aktif untuk snapshot semasa. */
export async function getOptikPenggunaan(limit = 10): Promise<{
  kedalaman: OptikKedalamanRow[];
  teratas: OptikGuruTeratasRow[];
  median: number | null;
  snapshotLabel: string;
} | null> {
  const current = await getCurrentOptikSnapshot();
  if (!current) return null;
  const rows = await db
    .select({
      name: analisisOptikTeachers.name,
      schoolCode: analisisOptikTeachers.schoolCode,
      hariAktif: analisisOptikTeachers.hariAktif,
    })
    .from(analisisOptikTeachers)
    .where(
      and(
        eq(analisisOptikTeachers.snapshotId, current.id),
        isNotNull(analisisOptikTeachers.hariAktif),
      ),
    );
  if (rows.length === 0) return null;
  const hari = rows.map((r) => r.hariAktif ?? 0).sort((a, b) => a - b);
  const median = hari[Math.floor(hari.length / 2)] ?? null;
  const top = [...rows]
    .sort((a, b) => (b.hariAktif ?? 0) - (a.hariAktif ?? 0) || a.name.localeCompare(b.name, "ms"))
    .slice(0, limit);
  const schools = await applySchoolDirectoryNames(
    await getOptikSchoolsForSnapshot(current.id),
  );
  const names = new Map(schools.map((s) => [s.schoolCode, s.schoolName]));
  return {
    kedalaman: kedalamanGuru(rows.map((r) => r.hariAktif)),
    teratas: top.map((r) => ({
      name: r.name,
      schoolCode: r.schoolCode,
      schoolName: names.get(r.schoolCode) ?? r.schoolCode,
      hariAktif: r.hariAktif ?? 0,
    })),
    median,
    snapshotLabel: current.chartLabel,
  };
}
