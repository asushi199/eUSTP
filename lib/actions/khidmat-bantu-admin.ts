"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  KHIDMAT_BANTU_TELEGRAM_USER_ID_KEY,
  KHIDMAT_BANTU_WHATSAPP_KEY,
} from "@/lib/khidmat-bantu/config";
import { listKhidmatBantuTelegramResponsibleUsers } from "@/lib/khidmat-bantu/queries";
import { approveKhidmatCore, rejectKhidmatCore } from "@/lib/khidmat-bantu/service";
import { requireKandunganAccess } from "@/lib/rbac";
import { appSettings } from "@/lib/schema";
import { parseTelegramResponsibleUserId } from "@/lib/telegram/recipients";

type ActionResult = { ok: boolean; error?: string };

function refreshPaths() {
  revalidatePath("/khidmat-bantu");
  revalidatePath("/admin/khidmat-bantu");
  revalidatePath("/admin/khidmat-bantu/tetapan");
  revalidatePath("/admin/telegram");
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
  const parsedResponsible = parseTelegramResponsibleUserId(
    String(formData.get("telegramResponsibleUserId") ?? ""),
  );
  if (!parsedResponsible.ok) {
    return { ok: false, error: "Pegawai Telegram tidak sah." };
  }
  const responsibleUserId = parsedResponsible.userId;
  const responsibleUserIdText = responsibleUserId === null ? "" : String(responsibleUserId);
  if (responsibleUserId !== null) {
    const eligibleUsers = await listKhidmatBantuTelegramResponsibleUsers();
    if (!eligibleUsers.some((user) => user.id === responsibleUserId)) {
      return { ok: false, error: "Pegawai yang dipilih tidak mempunyai akses Khidmat Bantu." };
    }
  }

  await Promise.all([
    db
      .insert(appSettings)
      .values({ key: KHIDMAT_BANTU_WHATSAPP_KEY, value: phone })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: phone, updatedAt: sql`now()` },
      }),
    db
      .insert(appSettings)
      .values({ key: KHIDMAT_BANTU_TELEGRAM_USER_ID_KEY, value: responsibleUserIdText })
      .onConflictDoUpdate({
        target: appSettings.key,
        set: { value: responsibleUserIdText, updatedAt: sql`now()` },
      }),
  ]);

  refreshPaths();
  return { ok: true };
}
