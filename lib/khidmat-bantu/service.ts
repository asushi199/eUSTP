import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { khidmatBantuRequests, type KhidmatBantuDetails } from "@/lib/schema";

export async function approveKhidmatCore(requestId: string) {
  await db
    .update(khidmatBantuRequests)
    .set({
      status: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
    })
    .where(eq(khidmatBantuRequests.id, requestId));
}

export async function rejectKhidmatCore(requestId: string) {
  await db
    .update(khidmatBantuRequests)
    .set({
      status: "rejected",
      rejectedAt: new Date(),
    })
    .where(eq(khidmatBantuRequests.id, requestId));
}

export async function updateKhidmatCore(
  requestId: string,
  data: {
    serviceType: string;
    details: KhidmatBantuDetails;
    activityDate: string;
  },
) {
  const [row] = await db
    .update(khidmatBantuRequests)
    .set({
      serviceType: data.serviceType,
      details: data.details,
      activityDate: data.activityDate,
    })
    .where(eq(khidmatBantuRequests.id, requestId))
    .returning({ id: khidmatBantuRequests.id });
  return row ?? null;
}

export async function deleteKhidmatCore(requestId: string) {
  const [row] = await db
    .delete(khidmatBantuRequests)
    .where(eq(khidmatBantuRequests.id, requestId))
    .returning({
      id: khidmatBantuRequests.id,
      details: khidmatBantuRequests.details,
    });
  return row ?? null;
}
