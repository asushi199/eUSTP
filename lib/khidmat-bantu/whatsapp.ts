import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";
import type { KhidmatBantuDetails } from "@/lib/schema";
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
  const cleanPhone = normalizePhoneNumber(phone);
  const message = buildWhatsAppMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildRequestSummary(serviceType: string, details: KhidmatBantuDetails): string {
  if (isMcpService(serviceType)) {
    const d = details as Extract<KhidmatBantuDetails, { tarikh: string }>;
    const parts = [
      d.tarikh && `Tarikh: ${d.tarikh}`,
      d.masa && `Masa: ${d.masa}`,
      d.lokasi && `Lokasi: ${d.lokasi}`,
      d.suratPermohonan?.originalName && `Surat: ${d.suratPermohonan.originalName}`,
    ].filter(Boolean);
    return parts.join(" · ") || "—";
  }

  const d = details as Extract<KhidmatBantuDetails, { tarikhCadangan: string }>;
  const parts = [
    d.tarikhCadangan && `Tarikh: ${d.tarikhCadangan}`,
    d.masaCadangan && `Masa: ${d.masaCadangan}`,
    d.lokasi && `Lokasi: ${d.lokasi}`,
    d.suratPermohonan?.originalName && `Surat: ${d.suratPermohonan.originalName}`,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}
