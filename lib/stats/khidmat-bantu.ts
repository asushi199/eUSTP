import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { khidmatBantuRequests } from "@/lib/schema";
import {
  APPLICANT_TYPES,
  SERVICE_TYPES,
  getApplicantTypeLabel,
} from "@/lib/khidmat-bantu/config";
import { currentStatsYear, fillMonths, STATS_TZ } from "./year";
import type { BreakdownPoint, MonthPoint, StatKpi } from "./types";

/**
 * Statistik Khidmat Bantu — hanya permohonan `approved`.
 * Tarikh acara: activity_date, atau tarikh lulus (MYT) jika tiada.
 */
const eventDate = sql`coalesce(
  ${khidmatBantuRequests.activityDate},
  (timezone(${STATS_TZ}, ${khidmatBantuRequests.approvedAt}))::date
)`;

function yearCond(year: number) {
  return sql`extract(year from ${eventDate}) = ${year}`;
}

const approved = eq(khidmatBantuRequests.status, "approved");

export type KhidmatAnalisis = {
  kpi: StatKpi[];
  byJenis: BreakdownPoint[];
  byPemohon: BreakdownPoint[];
  monthly: MonthPoint[];
};

export function emptyKhidmatAnalisis(year: number): KhidmatAnalisis {
  const kpi: StatKpi[] = [{ label: "Diluluskan", value: 0 }];
  if (year === currentStatsYear()) kpi.push({ label: "Bulan ini", value: 0 });
  kpi.push({ label: "Sekolah terlibat", value: 0 });
  return {
    kpi,
    byJenis: SERVICE_TYPES.map((s) => ({ label: s.label, jumlah: 0 })),
    byPemohon: APPLICANT_TYPES.map((a) => ({ label: a.label, jumlah: 0 })),
    monthly: fillMonths(new Map()),
  };
}

function bucketJenis(serviceType: string): string {
  if (serviceType === "mcp_lain") return "lain_lain";
  return SERVICE_TYPES.some((s) => s.id === serviceType) ? serviceType : "lain_lain";
}

export async function getKhidmatAnalisis(year: number): Promise<KhidmatAnalisis> {
  const whereYear = and(approved, yearCond(year));

  const [kpiRow] = await db
    .select({
      diluluskan: sql<number>`count(*)::int`,
      bulanIni: sql<number>`count(*) filter (
        where extract(month from ${eventDate})
          = extract(month from timezone(${STATS_TZ}, now()))
          and extract(year from ${eventDate})
          = extract(year from timezone(${STATS_TZ}, now()))
      )::int`,
      sekolah: sql<number>`count(distinct ${khidmatBantuRequests.schoolCode})
        filter (where ${khidmatBantuRequests.schoolCode} is not null)::int`,
    })
    .from(khidmatBantuRequests)
    .where(whereYear);

  const [jenisRows, pemohonRows, monthRows] = await Promise.all([
    db
      .select({
        jenis: khidmatBantuRequests.serviceType,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(khidmatBantuRequests)
      .where(whereYear)
      .groupBy(khidmatBantuRequests.serviceType),
    db
      .select({
        jenis: khidmatBantuRequests.applicantType,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(khidmatBantuRequests)
      .where(whereYear)
      .groupBy(khidmatBantuRequests.applicantType),
    db
      .select({
        bulan: sql<number>`extract(month from ${eventDate})::int`,
        jumlah: sql<number>`count(*)::int`,
      })
      .from(khidmatBantuRequests)
      .where(whereYear)
      .groupBy(sql`1`),
  ]);

  const jenisMap = new Map<string, number>();
  for (const row of jenisRows) {
    const key = bucketJenis(row.jenis);
    jenisMap.set(key, (jenisMap.get(key) ?? 0) + row.jumlah);
  }

  const pemohonMap = new Map(pemohonRows.map((r) => [r.jenis, r.jumlah]));

  const kpi: StatKpi[] = [{ label: "Diluluskan", value: kpiRow?.diluluskan ?? 0 }];
  if (year === currentStatsYear()) {
    kpi.push({ label: "Bulan ini", value: kpiRow?.bulanIni ?? 0 });
  }
  kpi.push({ label: "Sekolah terlibat", value: kpiRow?.sekolah ?? 0 });

  return {
    kpi,
    byJenis: SERVICE_TYPES.map((s) => ({
      label: s.label,
      jumlah: jenisMap.get(s.id) ?? 0,
    })),
    byPemohon: APPLICANT_TYPES.map((a) => ({
      label: getApplicantTypeLabel(a.id),
      jumlah: pemohonMap.get(a.id) ?? 0,
    })),
    monthly: fillMonths(new Map(monthRows.map((r) => [r.bulan, r.jumlah]))),
  };
}

export async function minKhidmatYear(): Promise<number | null> {
  const [row] = await db
    .select({
      min: sql<number | null>`min(extract(year from ${eventDate}))::int`,
    })
    .from(khidmatBantuRequests)
    .where(approved);
  return row?.min ?? null;
}
