import { normalizePhoneNumber } from "./booking-rules";

export type WhatsAppBookingDetails = {
  name: string;
  room: string;
  date: string;
  slot: string;
  purpose: string;
  approvalUrl: string;
};

export function buildWhatsAppMessage(details: WhatsAppBookingDetails) {
  return [
    "Permohonan tempahan bilik baharu:",
    `Nama: ${details.name}`,
    `Bilik: ${details.room}`,
    `Tarikh: ${details.date}`,
    `Slot: ${details.slot}`,
    `Tujuan: ${details.purpose}`,
    `Pautan kelulusan: ${details.approvalUrl}`,
  ].join("\n");
}

export function buildWhatsAppShareUrl(phone: string, details: WhatsAppBookingDetails) {
  const cleanPhone = normalizePhoneNumber(phone);
  const message = buildWhatsAppMessage(details);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
