import { normalizePhoneNumber } from "@/lib/tempahan/booking-rules";

export function buildEquipmentRequestWhatsAppUrl(
  phone: string,
  details: {
    referenceNo: string;
    applicantName: string;
    orgName: string;
    borrowDate: string;
    expectedReturnDate: string;
    approvalUrl: string;
  },
): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "";
  const message = [
    "Permohonan pinjaman peralatan baharu:",
    `Rujukan: ${details.referenceNo}`,
    `Pemohon: ${details.applicantName}`,
    `Sekolah / unit: ${details.orgName}`,
    `Tempoh: ${details.borrowDate} hingga ${details.expectedReturnDate}`,
    `Pautan pentadbir: ${details.approvalUrl}`,
  ].join("\n");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
