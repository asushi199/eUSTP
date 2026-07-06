"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  APPLICANT_TYPES,
  SERVICE_TYPES,
  isMcpService,
  isProgramService,
} from "@/lib/khidmat-bantu/config";
import { getKhidmatBantuRequest, getKhidmatBantuWhatsappAdmin } from "@/lib/khidmat-bantu/queries";
import {
  buildRequestSummary,
  buildWhatsAppShareUrl,
} from "@/lib/khidmat-bantu/whatsapp";
import { getSessionUser } from "@/lib/rbac";
import { canManageKandungan } from "@/lib/roles";
import type {
  KhidmatBantuDetails,
  KhidmatMcpDetails,
  KhidmatProgramDetails,
  KhidmatSuratPermohonan,
} from "@/lib/schema";
import { khidmatBantuRequests } from "@/lib/schema";
import { createApprovalToken, verifyApprovalToken } from "@/lib/tempahan/approval-token";
import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";
import { approveKhidmatCore, rejectKhidmatCore } from "@/lib/khidmat-bantu/service";
import { uploadSuratPermohonan } from "@/lib/khidmat-bantu/surat-permohonan";
import { isGasStorageConfigured } from "@/lib/gas-upload";

function requiredText(formData: FormData, key: string, max = 500): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

async function resolveBaseUrl(): Promise<string> {
  const env = process.env.APP_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function parseProgramDetails(
  formData: FormData,
  suratPermohonan: KhidmatSuratPermohonan,
): KhidmatProgramDetails | null {
  const tarikhCadangan = requiredText(formData, "activityDate", 20);
  const masaCadangan = requiredText(formData, "activityTime", 50);
  const lokasi = requiredText(formData, "lokasi", 300);
  const tajuk = requiredText(formData, "tajukProgram", 300);

  if (!tarikhCadangan || !masaCadangan || !lokasi || !tajuk) return null;

  return { tarikhCadangan, masaCadangan, lokasi, suratPermohonan, tajuk };
}

function parseMcpDetails(
  formData: FormData,
  suratPermohonan: KhidmatMcpDetails["suratPermohonan"],
): KhidmatMcpDetails | null {
  const tarikh = requiredText(formData, "activityDate", 20);
  const masa = requiredText(formData, "activityTime", 50);
  const lokasi = requiredText(formData, "lokasi", 300);
  const tajukProgram = requiredText(formData, "tajukProgram", 300);

  if (!tarikh || !masa || !lokasi || !tajukProgram) return null;

  return { tarikh, masa, lokasi, suratPermohonan, tajukProgram };
}

function parseSuratFromForm(formData: FormData): KhidmatSuratPermohonan | null {
  const storagePath = requiredText(formData, "suratStoragePath", 200);
  const fileName = requiredText(formData, "suratFileName", 200);
  const originalName = requiredText(formData, "suratOriginalName", 300);
  if (!storagePath.startsWith("drive/") || !fileName || !originalName) return null;
  return { storagePath, fileName, originalName };
}

export type UploadSuratPermohonanResult =
  | { ok: false; error: string }
  | { ok: true; surat: KhidmatSuratPermohonan };

/** Muat naik surat secara berasingan (corak OPR) — elak timeout bila hantar borang. */
export async function uploadSuratPermohonanAction(
  formData: FormData,
): Promise<UploadSuratPermohonanResult> {
  if (!isGasStorageConfigured()) {
    return {
      ok: false,
      error: "GAS belum dikonfigurasi: set GAS_WEB_APP_URL dan GAS_UPLOAD_SECRET.",
    };
  }

  const file = formData.get("file");
  const orgName = requiredText(formData, "orgName", 300);
  const activityDate = requiredText(formData, "activityDate", 20);
  const serviceType = requiredText(formData, "serviceType", 50);

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Fail tidak sah." };
  }
  if (!orgName) {
    return { ok: false, error: "Sila isi nama sekolah/unit dahulu." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    return { ok: false, error: "Sila pilih tarikh cadangan dahulu." };
  }
  if (!SERVICE_TYPES.some((s) => s.id === serviceType)) {
    return { ok: false, error: "Jenis perkhidmatan tidak sah." };
  }

  try {
    const surat = await uploadSuratPermohonan(file, { orgName, activityDate, serviceType });
    return { ok: true, surat };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal memuat naik surat permohonan.",
    };
  }
}

export type KhidmatBantuFormState = {
  ok: boolean;
  message: string;
  whatsappUrl?: string;
};

export async function createKhidmatBantuAction(
  _previousState: KhidmatBantuFormState,
  formData: FormData,
): Promise<KhidmatBantuFormState> {
  const serviceType = requiredText(formData, "serviceType", 50);
  const applicantType = requiredText(formData, "applicantType", 50);
  const schoolCode = requiredText(formData, "schoolCode", 20) || null;
  const orgName = requiredText(formData, "orgName", 300);
  const applicantName = requiredText(formData, "applicantName", 200);
  const contact = requiredText(formData, "contact", 30);
  const email = requiredText(formData, "email", 200);
  const contactNormalized = normalizePhoneNumber(contact);

  if (!SERVICE_TYPES.some((s) => s.id === serviceType)) {
    return { ok: false, message: "Jenis perkhidmatan tidak sah." };
  }
  if (!APPLICANT_TYPES.some((a) => a.id === applicantType)) {
    return { ok: false, message: "Jenis pemohon tidak sah." };
  }
  if (!applicantName || !orgName || !contactNormalized) {
    return { ok: false, message: "Sila lengkapkan maklumat pemohon dan telefon." };
  }
  if (applicantType === "sekolah" && !schoolCode) {
    return { ok: false, message: "Sila pilih sekolah." };
  }

  const activityDate = requiredText(formData, "activityDate", 20);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    return { ok: false, message: "Sila pilih tarikh cadangan." };
  }

  const suratPermohonan = parseSuratFromForm(formData);
  if (!suratPermohonan) {
    return {
      ok: false,
      message: "Sila muat naik surat permohonan dan tunggu sehingga selesai.",
    };
  }

  let details: KhidmatBantuDetails | null = null;
  if (isProgramService(serviceType)) {
    details = parseProgramDetails(formData, suratPermohonan);
  } else if (isMcpService(serviceType)) {
    details = parseMcpDetails(formData, suratPermohonan);
  }

  if (!details) {
    return {
      ok: false,
      message: "Sila lengkapkan tajuk program, tarikh, masa dan lokasi.",
    };
  }

  try {
    const requestId = randomUUID();
    const { token, hash } = await createApprovalToken(requestId);

    await db.insert(khidmatBantuRequests).values({
      id: requestId,
      serviceType,
      applicantType,
      schoolCode,
      orgName,
      applicantName,
      contact: contactNormalized,
      contactNormalized,
      email: email || null,
      details,
      activityDate,
      status: "pending",
      approvalTokenHash: hash,
    });

    const baseUrl = await resolveBaseUrl();
    const approvalUrl = `${baseUrl}/khidmat-bantu/approve/${requestId}?token=${encodeURIComponent(token)}`;
    const adminPhone = await getKhidmatBantuWhatsappAdmin();
    const summary = buildRequestSummary(serviceType, details);
    const whatsappUrl = adminPhone
      ? buildWhatsAppShareUrl(adminPhone, {
          applicantName,
          orgName,
          serviceType,
          applicantType,
          contact: contactNormalized,
          summary,
          approvalUrl,
        })
      : "";

    revalidatePath("/khidmat-bantu");
    revalidatePath("/admin/khidmat-bantu");

    return {
      ok: true,
      message: adminPhone
        ? "Permohonan diterima. Sila hantar mesej WhatsApp kepada admin untuk kelulusan."
        : "Permohonan diterima. Nombor WhatsApp admin belum ditetapkan — hubungi USTP secara terus.",
      whatsappUrl,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("khidmat_bantu_requests") && msg.includes("does not exist")) {
      return {
        ok: false,
        message:
          "Pangkalan data belum dikemaskini untuk modul Khidmat Bantu. Sila hubungi pentadbir USTP.",
      };
    }
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal menghantar permohonan.",
    };
  }
}

export async function approveKhidmatByTokenAction(formData: FormData) {
  const requestId = requiredText(formData, "requestId", 100);
  const token = requiredText(formData, "token", 200);
  const decision = requiredText(formData, "decision", 20);

  const resultBase = "/khidmat-bantu/approve/keputusan";
  const request = requestId ? await getKhidmatBantuRequest(requestId) : null;

  if (
    !request ||
    !(await verifyApprovalToken(request.id, token, request.approvalTokenHash))
  ) {
    redirect(`${resultBase}?status=invalid`);
  }

  const user = await getSessionUser();
  if (!user) {
    const back = `/khidmat-bantu/approve/${requestId}?token=${encodeURIComponent(token)}`;
    redirect(`/login?from=${encodeURIComponent(back)}`);
  }
  if (!canManageKandungan(user.peranan)) {
    redirect(`${resultBase}?status=unauthorized`);
  }

  if (request.status !== "pending") {
    redirect(`${resultBase}?status=processed`);
  }

  try {
    if (decision === "approve") {
      await approveKhidmatCore(request.id);
      revalidatePath("/khidmat-bantu");
      revalidatePath("/admin/khidmat-bantu");
      redirect(`${resultBase}?status=approved`);
    }
    if (decision === "reject") {
      await rejectKhidmatCore(request.id);
      revalidatePath("/khidmat-bantu");
      revalidatePath("/admin/khidmat-bantu");
      redirect(`${resultBase}?status=rejected`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    redirect(`${resultBase}?status=error`);
  }

  redirect(`${resultBase}?status=invalid`);
}
