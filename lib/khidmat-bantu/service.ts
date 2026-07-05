import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { khidmatBantuRequests } from "@/lib/schema";

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
