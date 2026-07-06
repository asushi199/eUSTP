import "server-only";

import { and, asc, count, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { khidmatBantuRequests } from "@/lib/schema";
import type { KhidmatBantuDetails } from "@/lib/schema";

export type KhidmatBantuRow = {
  id: string;
  serviceType: string;
  applicantType: string;
  schoolCode: string | null;
  orgName: string;
  applicantName: string;
  contact: string;
  contactNormalized: string;
  email: string | null;
  details: KhidmatBantuDetails;
  activityDate: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvalTokenHash: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
};

function mapRow(row: typeof khidmatBantuRequests.$inferSelect): KhidmatBantuRow {
  return {
    id: row.id,
    serviceType: row.serviceType,
    applicantType: row.applicantType,
    schoolCode: row.schoolCode,
    orgName: row.orgName,
    applicantName: row.applicantName,
    contact: row.contact,
    contactNormalized: row.contactNormalized,
    email: row.email,
    details: row.details,
    activityDate: row.activityDate,
    status: row.status,
    approvalTokenHash: row.approvalTokenHash,
    approvedAt: row.approvedAt,
    rejectedAt: row.rejectedAt,
    createdAt: row.createdAt,
  };
}

export async function getKhidmatBantuRequest(id: string): Promise<KhidmatBantuRow | null> {
  const rows = await db
    .select()
    .from(khidmatBantuRequests)
    .where(eq(khidmatBantuRequests.id, id))
    .limit(1);
  const row = rows[0];
  return row ? mapRow(row) : null;
}

function isKhidmatDbNotReady(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("does not exist") &&
    (msg.includes("khidmat_bantu_requests") || msg.includes("activity_date"))
  );
}

/**
 * Data panel admin bagi satu bulan: gilir tunggu-kelulusan (mana-mana tarikh) +
 * rekod bukan-pending pada bulan (ikut activity_date). `dbNotReady` benar jika
 * jadual/lajur belum wujud (migrasi belum dijalankan).
 */
export async function loadKhidmatBantuAdmin(
  year: number,
  month: number,
): Promise<{ pending: KhidmatBantuRow[]; monthRows: KhidmatBantuRow[]; dbNotReady?: boolean }> {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const next = new Date(year, month + 1, 1);
  const nextFirst = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;

  try {
    const [pending, monthRows] = await Promise.all([
      db
        .select()
        .from(khidmatBantuRequests)
        .where(eq(khidmatBantuRequests.status, "pending"))
        .orderBy(asc(khidmatBantuRequests.activityDate)),
      db
        .select()
        .from(khidmatBantuRequests)
        .where(
          and(
            ne(khidmatBantuRequests.status, "pending"),
            gte(khidmatBantuRequests.activityDate, first),
            lt(khidmatBantuRequests.activityDate, nextFirst),
          ),
        )
        .orderBy(asc(khidmatBantuRequests.activityDate)),
    ]);
    return { pending: pending.map(mapRow), monthRows: monthRows.map(mapRow) };
  } catch (error) {
    if (isKhidmatDbNotReady(error)) {
      return { pending: [], monthRows: [], dbNotReady: true };
    }
    throw error;
  }
}

/** Bilangan permohonan menunggu kelulusan — untuk lencana notifikasi admin. */
export async function countPendingKhidmatBantu(): Promise<number> {
  try {
    const rows = await db
      .select({ n: count() })
      .from(khidmatBantuRequests)
      .where(eq(khidmatBantuRequests.status, "pending"));
    return rows[0]?.n ?? 0;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("khidmat_bantu_requests") && msg.includes("does not exist")) {
      return 0;
    }
    throw error;
  }
}

export async function getKhidmatBantuWhatsappAdmin(): Promise<string> {
  const { getSettings } = await import("@/lib/maklumat/queries");
  const { KHIDMAT_BANTU_WHATSAPP_KEY } = await import("@/lib/khidmat-bantu/config");
  const map = await getSettings([KHIDMAT_BANTU_WHATSAPP_KEY]);
  return map.get(KHIDMAT_BANTU_WHATSAPP_KEY)?.trim() ?? "";
}
