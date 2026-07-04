"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSettings } from "@/lib/schema";
import { requireKandunganAccess } from "@/lib/rbac";
import { TETAPAN_KEYS } from "@/lib/maklumat/tetapan-keys";

export async function saveTetapan(formData: FormData): Promise<{ ok: boolean }> {
  await requireKandunganAccess();
  for (const { key } of TETAPAN_KEYS) {
    const raw = formData.get(`tetapan__${key}`);
    if (raw == null) continue;
    const value = String(raw).trim();
    await db
      .insert(appSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value, updatedAt: sql`now()` },
      });
  }
  revalidatePath("/admin/tetapan");
  revalidatePath("/maklumat-asas");
  return { ok: true };
}
