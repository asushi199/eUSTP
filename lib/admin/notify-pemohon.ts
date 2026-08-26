export type NotifyPemohonDecision = "approved" | "rejected";

export type NotifyPemohonPrompt = {
  href: string;
  decision: NotifyPemohonDecision;
};

export function getNotifyPemohonCopy(decision: NotifyPemohonDecision) {
  const approved = decision === "approved";
  return {
    title: "Maklumkan pemohon?",
    body: approved
      ? "Permohonan telah diluluskan. Hantar mesej WhatsApp kepada pemohon sekarang, atau tutup dan hantar kemudian dari permohonan ini."
      : "Permohonan telah ditolak. Hantar mesej WhatsApp kepada pemohon sekarang, atau tutup dan hantar kemudian dari permohonan ini.",
    confirmLabel: "WhatsApp pemohon",
    dismissLabel: "Tutup",
    missingPhone:
      "Nombor WhatsApp pemohon tidak sah. Tutup dan semak nombor pada permohonan ini.",
  };
}
