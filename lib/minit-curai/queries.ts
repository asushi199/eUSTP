import "server-only";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { listUstpPreparedByOptions } from "@/lib/laporan-ustp/queries";
import { minitCurai } from "@/lib/schema";
import { currentLetterMonthKey, shiftLetterMonth } from "@/lib/resources/search";

export function resolveMinitMonth(value?: string) {
  return value && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value) ? value : currentLetterMonthKey();
}

function dbErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isMinitDbNotReady(error: unknown) {
  const msg = dbErrorMessage(error);
  return msg.includes("does not exist") && msg.includes("minit_curai");
}

export async function listMinitCurai(month: string) {
  await requireUser();
  const selectedMonth = resolveMinitMonth(month);
  const rows = await db.select({
    id: minitCurai.id,
    tajuk: minitCurai.tajuk,
    meetingDate: minitCurai.meetingDate,
    reporterName: minitCurai.reporterName,
    unitSektor: minitCurai.unitSektor,
    anjuran: minitCurai.anjuran,
    tempat: minitCurai.tempat,
  }).from(minitCurai)
    .where(and(
      gte(minitCurai.meetingDate, `${selectedMonth}-01`),
      lt(minitCurai.meetingDate, `${shiftLetterMonth(selectedMonth, 1)}-01`),
    ))
    .orderBy(desc(minitCurai.meetingDate), desc(minitCurai.id));
  return rows.map((row) => ({ ...row, meetingDate: String(row.meetingDate) }));
}

export async function loadMinitCuraiList(month: string) {
  try {
    return { reports: await listMinitCurai(month), error: null as string | null };
  } catch (error) {
    return {
      reports: [],
      error: isMinitDbNotReady(error)
        ? "Jadual minit_curai belum wujud pada pangkalan data production. Jalankan npm run db:migrate dengan DATABASE_URL yang sama seperti Vercel."
        : dbErrorMessage(error),
    };
  }
}

function asYmd(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(value);
  }
  return String(value ?? "").slice(0, 10);
}

function asIso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

export async function getMinitCurai(id: string) {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return null;
  const [report] = await db.select().from(minitCurai).where(eq(minitCurai.id, id)).limit(1);
  if (!report) return null;
  return {
    ...report,
    meetingDate: asYmd(report.meetingDate),
    targetDate: report.targetDate ? asYmd(report.targetDate) : null,
    tarikhCurai: asYmd(report.tarikhCurai),
    preparedAt: asYmd(report.preparedAt),
    reviewedAt: report.reviewedAt ? asYmd(report.reviewedAt) : null,
    createdAt: asIso(report.createdAt),
    updatedAt: asIso(report.updatedAt),
  };
}

/** Nama 5 pegawai PKG — sumber sama seperti Laporan Program USTP. */
export async function listMinitCuraiReporters() {
  return Object.values(await listUstpPreparedByOptions()).filter(Boolean);
}
