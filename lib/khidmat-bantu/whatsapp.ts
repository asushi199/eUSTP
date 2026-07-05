import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";
import { getApplicantTypeLabel, getServiceTypeLabel } from "./config";

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

export function buildRequestSummary(
  serviceType: string,
  details: Record<string, string>,
): string {
  if (serviceType === "ceramah" || serviceType === "bengkel") {
    const parts = [
      details.tajuk && `Tajuk: ${details.tajuk}`,
      details.tarikhCadangan && `Tarikh: ${details.tarikhCadangan}`,
      details.masaCadangan && `Masa: ${details.masaCadangan}`,
      details.lokasi && `Lokasi: ${details.lokasi}`,
    ].filter(Boolean);
    return parts.join(" · ") || "—";
  }

  const parts = [
    details.tajukProgram && `Program: ${details.tajukProgram}`,
    details.tarikh && `Tarikh: ${details.tarikh}`,
    details.masa && `Masa: ${details.masa}`,
    details.lokasi && `Lokasi: ${details.lokasi}`,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}
