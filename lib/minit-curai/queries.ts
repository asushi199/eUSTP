import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/rbac";
import { minitCurai, users } from "@/lib/schema";
import { currentLetterMonthKey, shiftLetterMonth } from "@/lib/resources/search";

export function resolveMinitMonth(value?: string) {
  return value && /^(20\d{2})-(0[1-9]|1[0-2])$/.test(value) ? value : currentLetterMonthKey();
}

export async function listMinitCurai(month: string) {
  await requireUser();
  const selectedMonth = resolveMinitMonth(month);
  return db.select({
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
}

export async function getMinitCurai(id: string) {
  await requireUser();
  if (!z.string().uuid().safeParse(id).success) return null;
  const [report] = await db.select().from(minitCurai).where(eq(minitCurai.id, id)).limit(1);
  return report ?? null;
}

export async function listMinitCuraiOfficers() {
  await requireUser();
  return db
    .select({ nama: users.nama, jawatan: users.jawatan })
    .from(users)
    .where(eq(users.aktif, true))
    .orderBy(asc(users.nama));
}
