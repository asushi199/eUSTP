import "server-only";

import { desc, eq } from "drizzle-orm";
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

export async function listAdminKhidmatBantuRequests(): Promise<{
  pending: KhidmatBantuRow[];
  others: KhidmatBantuRow[];
}> {
  const rows = await db
    .select()
    .from(khidmatBantuRequests)
    .orderBy(desc(khidmatBantuRequests.createdAt));

  const mapped = rows.map(mapRow);
  return {
    pending: mapped.filter((r) => r.status === "pending"),
    others: mapped.filter((r) => r.status !== "pending"),
  };
}

export async function getKhidmatBantuWhatsappAdmin(): Promise<string> {
  const { getSettings } = await import("@/lib/maklumat/queries");
  const { KHIDMAT_BANTU_WHATSAPP_KEY } = await import("@/lib/khidmat-bantu/config");
  const map = await getSettings([KHIDMAT_BANTU_WHATSAPP_KEY]);
  return map.get(KHIDMAT_BANTU_WHATSAPP_KEY)?.trim() ?? "";
}
