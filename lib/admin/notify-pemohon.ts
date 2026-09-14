export type NotifyPemohonDecision = "approved" | "rejected" | "cancelled";

export type NotifyPemohonPrompt = {
  href: string;
  decision: NotifyPemohonDecision;
};

export function getNotifyPemohonCopy(decision: NotifyPemohonDecision) {
  const body =
    decision === "approved"
      ? "Permohonan telah diluluskan. Hantar mesej WhatsApp kepada pemohon sekarang, atau tutup dan hantar kemudian dari permohonan ini."
      : decision === "cancelled"
        ? "Permohonan telah dibatalkan. Hantar mesej WhatsApp kepada pemohon sekarang, atau tutup dan hantar kemudian dari permohonan ini."
        : "Permohonan telah ditolak. Hantar mesej WhatsApp kepada pemohon sekarang, atau tutup dan hantar kemudian dari permohonan ini.";
  return {
    title: "Maklumkan pemohon?",
    body,
    confirmLabel: "WhatsApp pemohon",
    dismissLabel: "Tutup",
    missingPhone:
      "Nombor WhatsApp pemohon tidak sah. Tutup dan semak nombor pada permohonan ini.",
  };
}
