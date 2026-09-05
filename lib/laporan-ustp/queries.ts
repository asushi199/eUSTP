import "server-only";
import { and, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { laporanUstp, pkgs, users } from "@/lib/schema";
import { currentLetterMonthKey, shiftLetterMonth } from "@/lib/resources/search";
import { USTP_PKGS } from "@/lib/laporan-ustp/options";

export function resolveUstpMonth(value?: string) {
  return value && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value) ? value : currentLetterMonthKey();
}

export async function listUstpReports(month: string, page: number) {
  await requireUser();
  const selectedMonth = resolveUstpMonth(month);
  const rows = await db.select({
    id: laporanUstp.id, programName: laporanUstp.programName,
    pkgCode: laporanUstp.pkgCode, startDate: laporanUstp.startDate,
    endDate: laporanUstp.endDate, preparedBy: laporanUstp.preparedBy,
    version: laporanUstp.version,
  }).from(laporanUstp)
    .where(and(gte(laporanUstp.startDate, `${selectedMonth}-01`), lt(laporanUstp.startDate, `${shiftLetterMonth(selectedMonth, 1)}-01`)))
    .orderBy(desc(laporanUstp.startDate), desc(laporanUstp.id)).limit(21).offset((page - 1) * 20);
  return { reports: rows.slice(0, 20), hasNext: rows.length > 20 };
}

export async function getUstpReport(id: string) {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return null;
  const [report] = await db.select().from(laporanUstp).where(eq(laporanUstp.id, id)).limit(1);
  return report ?? null;
}

/**
 * Nama Pegawai Telegram Tempahan bagi setiap KOD PKG USTP — untuk auto-isi
 * medan "Disediakan oleh" dalam borang laporan. Kunci = kod USTP (AQA100x);
 * PKG tanpa pegawai berdaftar tidak disertakan.
 */
export async function listUstpPreparedByOptions(): Promise<Record<string, string>> {
  await requireUser();
  const rows = await db
    .select({ pkgId: pkgs.id, nama: users.nama })
    .from(pkgs)
    .innerJoin(users, eq(pkgs.telegramResponsibleUserId, users.id))
    .where(eq(users.aktif, true));
  const nameByPkgId = new Map(
    rows.filter((r) => r.nama).map((r) => [r.pkgId, r.nama as string]),
  );
  const result: Record<string, string> = {};
  for (const pkg of USTP_PKGS) {
    const name = nameByPkgId.get(pkg.pkgId);
    if (name) result[pkg.code] = name;
  }
  return result;
}
