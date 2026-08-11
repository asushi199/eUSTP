import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { laporanAkhbar, schools } from "@/lib/schema";
import { AKHBAR_YEAR } from "./enums";

export type LaporanAkhbarRow = typeof laporanAkhbar.$inferSelect;

export type AkhbarSchoolListItem = {
  schoolCode: string;
  schoolName: string;
  zone: string;
  record: LaporanAkhbarRow | null;
};

export async function getSchoolByCode(code: string) {
  const [row] = await db
    .select({ code: schools.code, name: schools.name, zone: schools.zone })
    .from(schools)
    .where(eq(schools.code, code))
    .limit(1);
  return row ?? null;
}

export async function getLaporanAkhbarBySchool(
  schoolCode: string,
  year = AKHBAR_YEAR,
): Promise<LaporanAkhbarRow | null> {
  const [row] = await db
    .select()
    .from(laporanAkhbar)
    .where(and(eq(laporanAkhbar.schoolCode, schoolCode), eq(laporanAkhbar.year, year)))
    .limit(1);
  return row ?? null;
}

export async function getLaporanAkhbarByReceipt(
  schoolCode: string,
  receiptToken: string,
  year = AKHBAR_YEAR,
): Promise<LaporanAkhbarRow | null> {
  const [row] = await db
    .select()
    .from(laporanAkhbar)
    .where(
      and(
        eq(laporanAkhbar.schoolCode, schoolCode),
        eq(laporanAkhbar.year, year),
        eq(laporanAkhbar.receiptToken, receiptToken),
      ),
    )
    .limit(1);
  return row ?? null;
}

/** Semua sekolah direktori + rekod tinjauan (jika ada), isih ikut kod. */
export async function listAkhbarAdminRows(
  year = AKHBAR_YEAR,
): Promise<AkhbarSchoolListItem[]> {
  const schoolRows = await db
    .select({
      schoolCode: schools.code,
      schoolName: schools.name,
      zone: schools.zone,
    })
    .from(schools)
    .orderBy(schools.code);

  const records = await db
    .select()
    .from(laporanAkhbar)
    .where(eq(laporanAkhbar.year, year));

  const byCode = new Map(records.map((r) => [r.schoolCode, r]));

  return schoolRows.map((s) => ({
    ...s,
    record: byCode.get(s.schoolCode) ?? null,
  }));
}
