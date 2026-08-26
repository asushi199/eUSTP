import { normalizeWhatsAppPhone } from "@/lib/tempahan/booking-rules";
import type { KhidmatBantuDetails, KhidmatProgramDetails } from "@/lib/schema";
import { getApplicantTypeLabel, getServiceTypeLabel, isMcpService } from "./config";

export type WhatsAppKhidmatDetails = {
  applicantName: string;
  orgName: string;
  serviceType: string;
  applicantType: string;
  contact: string;
  summary: string;
  approvalUrl: string;
};

export function buildWhatsAppMessage(details: WhatsAppKhidmatDetails) {
  return [
    "Permohonan khidmat bantu baharu:",
    `Nama: ${details.applicantName}`,
    `Unit: ${details.orgName}`,
    `Jenis pemohon: ${getApplicantTypeLabel(details.applicantType)}`,
    `Perkhidmatan: ${getServiceTypeLabel(details.serviceType)}`,
    `Telefon: ${details.contact}`,
    `Ringkasan: ${details.summary}`,
    `Pautan kelulusan: ${details.approvalUrl}`,
  ].join("\n");
}

export function buildWhatsAppShareUrl(phone: string, details: WhatsAppKhidmatDetails) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const message = buildWhatsAppMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export type WhatsAppKhidmatDecision = "approved" | "rejected";

export type WhatsAppKhidmatDecisionDetails = {
  applicantName: string;
  orgName: string;
  serviceLabel: string;
  title: string;
  date: string;
  decision: WhatsAppKhidmatDecision;
};

/** Pautan untuk pentadbir memaklumkan keputusan khidmat bantu kepada pemohon. */
export function buildKhidmatDecisionWhatsAppUrl(
  phone: string,
  details: WhatsAppKhidmatDecisionDetails,
) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  if (!cleanPhone) return "";

  const approved = details.decision === "approved";
  const message = [
    "Makluman khidmat bantu NEXa Manjung",
    `Salam sejahtera ${details.applicantName},`,
    approved
      ? "Permohonan khidmat bantu anda telah diluluskan."
      : "Permohonan khidmat bantu anda tidak dapat diluluskan.",
    `Perkhidmatan: ${details.serviceLabel}`,
    `Tajuk: ${details.title}`,
    `Unit: ${details.orgName}`,
    `Tarikh: ${details.date}`,
    approved
      ? "Sila simpan makluman ini untuk rekod anda. Terima kasih."
      : "Sila hubungi USTP PPD Manjung jika anda memerlukan maklumat lanjut.",
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildRequestSummary(serviceType: string, details: KhidmatBantuDetails): string {
  if (isMcpService(serviceType)) {
    const d = details as Extract<KhidmatBantuDetails, { tarikh: string }>;
    const parts = [
      d.tajukProgram && `Tajuk: ${d.tajukProgram}`,
      d.tarikh && `Tarikh: ${d.tarikh}`,
      d.masa && `Masa: ${d.masa}`,
      d.lokasi && `Lokasi: ${d.lokasi}`,
      d.suratPermohonan?.originalName && `Surat: ${d.suratPermohonan.originalName}`,
    ].filter(Boolean);
    return parts.join(" · ") || "—";
  }

  const d = details as KhidmatProgramDetails;
  const parts = [
    d.tajuk && `Tajuk: ${d.tajuk}`,
    d.tarikhCadangan && `Tarikh: ${d.tarikhCadangan}`,
    d.masaCadangan && `Masa: ${d.masaCadangan}`,
    d.lokasi && `Lokasi: ${d.lokasi}`,
    d.suratPermohonan?.originalName && `Surat: ${d.suratPermohonan.originalName}`,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}
