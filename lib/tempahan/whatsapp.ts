import { normalizePhoneNumber } from "./booking-rules";

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
  const cleanPhone = normalizePhoneNumber(phone);
  const message = buildWhatsAppMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
