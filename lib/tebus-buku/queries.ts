import "server-only";

import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { tebusBukuPelajar } from "@/lib/schema";
import { compareTingkatan } from "./format";
import type {
  TebusBukuSchool,
  TebusBukuSchoolPage,
  TebusBukuStudent,
} from "./types";

function toSchool(row: {
  schoolCode: string;
  schoolName: string;
  total: number;
  tebusCount: number;
  gunaCount: number;
}): TebusBukuSchool {
  return {
    code: row.schoolCode,
    name: row.schoolName,
    total: Number(row.total),
    tebusCount: Number(row.tebusCount),
    gunaCount: Number(row.gunaCount),
  };
}

export async function listTebusBukuSchools(): Promise<{
  schools: TebusBukuSchool[];
  sourcedAt: string | null;
}> {
  const [rows, snapshot] = await Promise.all([
    db
      .select({
        schoolCode: tebusBukuPelajar.schoolCode,
        schoolName: tebusBukuPelajar.schoolName,
        total: count(),
        tebusCount: sql<number>`sum(case when ${tebusBukuPelajar.sudahTebus} then 1 else 0 end)`,
        gunaCount: sql<number>`sum(case when ${tebusBukuPelajar.sudahGuna} then 1 else 0 end)`,
      })
      .from(tebusBukuPelajar)
      .groupBy(tebusBukuPelajar.schoolCode, tebusBukuPelajar.schoolName)
      .orderBy(asc(tebusBukuPelajar.schoolCode)),
    db
      .select({ sourcedAt: tebusBukuPelajar.sourcedAt })
      .from(tebusBukuPelajar)
      .limit(1),
  ]);

  return {
    schools: rows.map(toSchool),
    sourcedAt: snapshot[0]?.sourcedAt ?? null,
  };
}

export async function getTebusBukuSchoolPage(
  schoolCode: string,
): Promise<TebusBukuSchoolPage | null> {
  const code = schoolCode.trim().toUpperCase();
  if (!code) return null;

  const [summary] = await db
    .select({
      schoolCode: tebusBukuPelajar.schoolCode,
      schoolName: tebusBukuPelajar.schoolName,
      total: count(),
      tebusCount: sql<number>`sum(case when ${tebusBukuPelajar.sudahTebus} then 1 else 0 end)`,
      gunaCount: sql<number>`sum(case when ${tebusBukuPelajar.sudahGuna} then 1 else 0 end)`,
      sourcedAt: sql<string>`min(${tebusBukuPelajar.sourcedAt})`,
    })
    .from(tebusBukuPelajar)
    .where(eq(tebusBukuPelajar.schoolCode, code))
    .groupBy(tebusBukuPelajar.schoolCode, tebusBukuPelajar.schoolName);

  if (!summary) return null;

  const rows = await db
    .select({
      nama: tebusBukuPelajar.nama,
      tingkatan: tebusBukuPelajar.tingkatan,
      sudahTebus: tebusBukuPelajar.sudahTebus,
      sudahGuna: tebusBukuPelajar.sudahGuna,
    })
    .from(tebusBukuPelajar)
    .where(eq(tebusBukuPelajar.schoolCode, code))
    .orderBy(asc(tebusBukuPelajar.nama));

  const tingkatan = [...new Set(rows.map((row) => row.tingkatan))].sort(
    compareTingkatan,
  );

  const students: TebusBukuStudent[] = rows;

  return {
    school: toSchool(summary),
    students,
    sourcedAt: summary.sourcedAt ?? null,
    tingkatan,
  };
}
