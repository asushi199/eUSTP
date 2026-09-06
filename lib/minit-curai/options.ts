export const MINIT_CURAI_UNITS = [
  "USTP PPD Manjung",
  "PKG Sitiawan",
  "PKG Pantai Remis",
  "PKG Ayer Tawar",
  "PKG Beruas",
  "PKG Seri Manjung",
] as const;

export const MINIT_CURAI_KAEDAH = [
  "Mesyuarat",
  "E-mel",
  "WhatsApp",
  "Lain-lain",
] as const;

export type MinitCuraiKaedah = (typeof MINIT_CURAI_KAEDAH)[number];

export const MINIT_CURAI_STEPS = [
  { id: "A", title: "Butiran", hint: "Pegawai, tajuk dan tarikh mesyuarat" },
  { id: "B", title: "Kandungan", hint: "Isu, keputusan dan tindakan susulan" },
  { id: "C", title: "Curai", hint: "Penyebaran dan pengesahan" },
] as const;

export type MinitCuraiStepId = (typeof MINIT_CURAI_STEPS)[number]["id"];

export function formatMinitDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function todayYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now);
}

export function emptyMinitItem() {
  return { perkara: "", keputusan: "", tindakan: "", pegawai: "" };
}
