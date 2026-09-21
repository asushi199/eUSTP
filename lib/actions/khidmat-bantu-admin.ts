"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { deleteLaporanPhotoViaGas } from "@/lib/gas-upload";
import {
  canDeleteKhidmatFromAdmin,
  canEditKhidmatFromAdmin,
  rebuildKhidmatDetails,
} from "@/lib/khidmat-bantu/admin";
import {
  KHIDMAT_BANTU_TELEGRAM_USER_ID_KEY,
  KHIDMAT_BANTU_WHATSAPP_KEY,
  SERVICE_TYPES,
} from "@/lib/khidmat-bantu/config";
import {
  getKhidmatBantuRequest,
  listKhidmatBantuTelegramResponsibleUsers,
} from "@/lib/khidmat-bantu/queries";
import {
  approveKhidmatCore,
  deleteKhidmatCore,
  rejectKhidmatCore,
  updateKhidmatCore,
} from "@/lib/khidmat-bantu/service";
import { requireKandunganAccess } from "@/lib/rbac";
import { appSettings, type KhidmatProgramDetails } from "@/lib/schema";
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

function requiredText(formData: FormData, key: string, max = 500): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

const LEGACY_SERVICE_IDS = new Set(["mcp_lain"]);

function isKnownServiceType(id: string) {
  return SERVICE_TYPES.some((s) => s.id === id) || LEGACY_SERVICE_IDS.has(id);
}

export async function adminUpdateKhidmat(
  requestId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireKandunganAccess();

  const request = await getKhidmatBantuRequest(requestId);
  if (!request) return { ok: false, error: "Permohonan tidak dijumpai." };
  if (!canEditKhidmatFromAdmin(request.status)) {
    return { ok: false, error: "Hanya permohonan menunggu atau diluluskan boleh diubah." };
  }

  const serviceType = requiredText(formData, "serviceType", 50);
  const tajuk = requiredText(formData, "tajukProgram", 300);
  const tarikh = requiredText(formData, "activityDate", 20);
  const masa = requiredText(formData, "activityTime", 50);
  const lokasi = requiredText(formData, "lokasi", 300);

  if (!isKnownServiceType(serviceType)) {
    return { ok: false, error: "Jenis perkhidmatan tidak sah." };
  }
  if (!tajuk || !masa || !lokasi) {
    return { ok: false, error: "Sila lengkapkan tajuk, masa dan lokasi." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh)) {
    return { ok: false, error: "Tarikh tidak sah." };
  }

  const details = rebuildKhidmatDetails(serviceType, request.details, {
    tajuk,
    tarikh,
    masa,
    lokasi,
  });

  try {
    const updated = await updateKhidmatCore(requestId, {
      serviceType,
      details,
      activityDate: tarikh,
    });
    if (!updated) return { ok: false, error: "Permohonan tidak dijumpai." };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Kemaskini gagal.",
    };
  }

  refreshPaths();
  return { ok: true };
}

export async function adminDeleteKhidmat(requestId: string): Promise<ActionResult> {
  await requireKandunganAccess();

  const request = await getKhidmatBantuRequest(requestId);
  if (!request) return { ok: false, error: "Permohonan tidak dijumpai." };
  if (!canDeleteKhidmatFromAdmin(request.status)) {
    return { ok: false, error: "Permohonan ini tidak boleh dipadam." };
  }

  try {
    const deleted = await deleteKhidmatCore(requestId);
    if (!deleted) return { ok: false, error: "Permohonan tidak dijumpai." };
    const surat = (deleted.details as KhidmatProgramDetails | undefined)?.suratPermohonan;
    if (surat?.storagePath) {
      await deleteLaporanPhotoViaGas(surat.storagePath);
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Padam gagal.",
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
