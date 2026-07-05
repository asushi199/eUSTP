"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { KHIDMAT_BANTU_WHATSAPP_KEY } from "@/lib/khidmat-bantu/config";
import { approveKhidmatCore, rejectKhidmatCore } from "@/lib/khidmat-bantu/service";
import { requireKandunganAccess } from "@/lib/rbac";
import { appSettings } from "@/lib/schema";

type ActionResult = { ok: boolean; error?: string };

function refreshPaths() {
  revalidatePath("/khidmat-bantu");
  revalidatePath("/admin/khidmat-bantu");
  revalidatePath("/admin/khidmat-bantu/tetapan");
}

export async function adminApproveKhidmat(requestId: string): Promise<ActionResult> {
  await requireKandunganAccess();
  try {
    await approveKhidmatCore(requestId);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Kelulusan gagal.",
    };
  }
  refreshPaths();
  return { ok: true };
}

export async function adminRejectKhidmat(requestId: string): Promise<ActionResult> {
  await requireKandunganAccess();
  try {
    await rejectKhidmatCore(requestId);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Penolakan gagal.",
    };
  }
  refreshPaths();
  return { ok: true };
}

export async function saveKhidmatBantuTetapan(
  formData: FormData,
): Promise<ActionResult> {
  await requireKandunganAccess();
  const phone = String(formData.get("whatsappAdminPhone") ?? "")
    .trim()
    .replace(/\D/g, "");

  await db
    .insert(appSettings)
    .values({ key: KHIDMAT_BANTU_WHATSAPP_KEY, value: phone })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: phone, updatedAt: sql`now()` },
    });

  refreshPaths();
  return { ok: true };
}
