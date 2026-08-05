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

export function buildEquipmentDecisionWhatsAppUrl(
  phone: string,
  details: {
    referenceNo: string;
    applicantName: string;
    pkgName: string;
    borrowDate: string;
    expectedReturnDate: string;
    items: string[];
    decisionNote: string;
    decision: "approved" | "rejected";
  },
): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "";

  const approved = details.decision === "approved";
  const message = [
    "Makluman pinjaman peralatan eUSTP Manjung",
    `Salam sejahtera ${details.applicantName},`,
    `Rujukan: ${details.referenceNo}`,
    approved
      ? "Permohonan pinjaman peralatan anda telah diluluskan."
      : "Permohonan pinjaman peralatan anda tidak dapat diluluskan.",
    `Peralatan: ${details.items.join(", ")}`,
    `Tempoh: ${details.borrowDate} hingga ${details.expectedReturnDate}`,
    ...(approved
      ? [`Sila hadir ke ${details.pkgName} pada ${details.borrowDate} untuk urusan pengambilan peralatan.`]
      : details.decisionNote
        ? [`Catatan: ${details.decisionNote}`]
        : ["Sila hubungi PKG berkenaan jika anda memerlukan maklumat lanjut."]),
    "Terima kasih.",
  ].join("\n");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
