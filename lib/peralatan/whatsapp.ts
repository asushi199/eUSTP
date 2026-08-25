import { normalizeWhatsAppPhone } from "@/lib/tempahan/booking-rules";

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
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return "";
  const message = buildEquipmentRequestMessage(details);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildEquipmentRequestMessage(details: {
  referenceNo: string;
  applicantName: string;
  orgName: string;
  borrowDate: string;
  expectedReturnDate: string;
  approvalUrl: string;
}): string {
  return [
    "Permohonan pinjaman peralatan baharu:",
    `Rujukan: ${details.referenceNo}`,
    `Pemohon: ${details.applicantName}`,
    `Sekolah / unit: ${details.orgName}`,
    `Tempoh: ${details.borrowDate} hingga ${details.expectedReturnDate}`,
    `Pautan pentadbir: ${details.approvalUrl}`,
  ].join("\n");
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
    decision: "approved" | "rejected" | "handed_over";
  },
): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return "";

  const approved = details.decision === "approved";
  const handedOver = details.decision === "handed_over";
  const message = [
    "Makluman pinjaman peralatan NEXa Manjung",
    `Salam sejahtera ${details.applicantName},`,
    `Rujukan: ${details.referenceNo}`,
    approved || handedOver
      ? "Permohonan pinjaman peralatan anda telah diluluskan."
      : "Permohonan pinjaman peralatan anda tidak dapat diluluskan.",
    `Peralatan: ${details.items.join(", ")}`,
    `Tempoh: ${details.borrowDate} hingga ${details.expectedReturnDate}`,
    ...(approved || handedOver
      ? details.decisionNote
        ? [
            `Catatan: ${details.decisionNote}`,
            "Sila simpan makluman ini untuk rekod anda.",
          ]
        : ["Sila simpan makluman ini untuk rekod anda."]
      : details.decisionNote
        ? [`Catatan: ${details.decisionNote}`]
        : ["Sila hubungi PKG berkenaan jika anda memerlukan maklumat lanjut."]),
    "Terima kasih.",
  ].join("\n");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
