export const MINIT_CURAI_UNIT = "Unit Sumber Teknologi Pendidikan";
export const MINIT_CURAI_OFFICER_TITLE = "Penolong Pegawai PPD USTP";

export const MINIT_CURAI_GRADES = ["DG10", "DG12"] as const;

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

export function formatMinitDate(value: string | Date) {
  const ymd = value instanceof Date
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(value)
    : String(value).slice(0, 10);
  return ymd.split("-").reverse().join("/");
}

export function todayYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur" }).format(now);
}

export function emptyMinitItem() {
  return { perkara: "", keputusan: "", tindakan: "", pegawai: "" };
}
