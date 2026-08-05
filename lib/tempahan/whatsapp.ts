import { normalizeWhatsAppPhone } from "./booking-rules";

export type WhatsAppSlotEntry = {
  date: string;
  slot: string;
};

export type WhatsAppBookingDetails = {
  name: string;
  room: string;
  purpose: string;
  approvalUrl: string;
  /** Satu hari — kekalkan serasi dengan pemanggil sedia ada. */
  date?: string;
  slot?: string;
  /** Lintas hari — senarai tarikh/slot yang sudah diformat. */
  entries?: WhatsAppSlotEntry[];
};

export type WhatsAppBookingDecision = "approved" | "rejected";

export type WhatsAppBookingDecisionDetails = {
  name: string;
  room: string;
  purpose: string;
  date: string;
  slot: string;
  decision: WhatsAppBookingDecision;
};

export function buildWhatsAppMessage(details: WhatsAppBookingDetails) {
  const entries =
    details.entries && details.entries.length > 0
      ? details.entries
      : details.date && details.slot
        ? [{ date: details.date, slot: details.slot }]
        : [];

  const dateLines =
    entries.length <= 1
      ? [
          `Tarikh: ${entries[0]?.date ?? ""}`,
          `Slot: ${entries[0]?.slot ?? ""}`,
        ]
      : [
          "Tarikh/Slot:",
          ...entries.map((entry) => `- ${entry.date} (${entry.slot})`),
        ];

  return [
    "Permohonan tempahan bilik baharu:",
    `Nama: ${details.name}`,
    `Bilik: ${details.room}`,
    ...dateLines,
    `Tujuan: ${details.purpose}`,
    `Pautan kelulusan: ${details.approvalUrl}`,
  ].join("\n");
}

export function buildWhatsAppShareUrl(phone: string, details: WhatsAppBookingDetails) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  const message = buildWhatsAppMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/** Pautan untuk pentadbir memaklumkan keputusan tempahan kepada pemohon. */
export function buildBookingDecisionWhatsAppUrl(
  phone: string,
  details: WhatsAppBookingDecisionDetails,
) {
  const cleanPhone = normalizeWhatsAppPhone(phone);
  if (!cleanPhone) return "";

  const approved = details.decision === "approved";
  const message = [
    "Makluman tempahan bilik eUSTP Manjung",
    `Salam sejahtera ${details.name},`,
    approved
      ? "Permohonan tempahan bilik anda telah diluluskan."
      : "Permohonan tempahan bilik anda tidak dapat diluluskan.",
    `Bilik: ${details.room}`,
    `Tarikh: ${details.date}`,
    `Slot: ${details.slot}`,
    `Tujuan: ${details.purpose}`,
    approved
      ? "Sila gunakan bilik mengikut tarikh dan slot yang diluluskan. Terima kasih."
      : "Sila hubungi PKG berkenaan jika anda memerlukan maklumat lanjut.",
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
