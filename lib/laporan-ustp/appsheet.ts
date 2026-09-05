import type { UstpReport } from "@/lib/schema";

type AppSheetReport = Pick<UstpReport,
  "pkgCode" | "cluster" | "programName" | "startDate" | "endDate" |
  "location" | "organiser" | "schoolCount" | "teacherCount" | "studentCount" |
  "communityCount" | "objectives" | "reflection" | "teras" | "equipmentUsed" | "equipment" |
  "os29000Sen" | "os42000Sen" | "os21000Sen" | "photos"
>;

const ALLOCATIONS = [
  ["os29000Sen", "OS29000 (RM)"],
  ["os42000Sen", "OS42000 (RM)"],
  ["os21000Sen", "OS21000 (RM)"],
] as const;

export function ustpAppSheetManualAllocations(report: AppSheetReport) {
  return ALLOCATIONS.filter(([key]) => report[key] % 100 !== 0)
    .map(([key, label]) => `${label}: ${(report[key] / 100).toFixed(2)}`);
}

export function buildUstpAppSheetUrl(report: AppSheetReport) {
  // AppSheet expects MM/DD/YYYY; avoid timezone conversion for date-only values.
  const date = (value: string) => `${value.slice(5, 7)}/${value.slice(8, 10)}/${value.slice(0, 4)}`;
  const defaults: Record<string, string> = {
    "SSTP/KOD PKG": report.pkgCode,
    "KLUSTER PROGRAM/AKTIVITI": report.cluster,
    "NAMA PROGRAM/AKTIVITI": report.programName,
    "TARIKH MULA": date(report.startDate),
    "TARIKH AKHIR": date(report.endDate),
    "TEMPAT": report.location,
    "PENGANJUR": report.organiser,
    "BIL SEKOLAH TERLIBAT": String(report.schoolCount),
    "BIL. PEGAWAI / GURU TERLIBAT": String(report.teacherCount),
    "BIL. MURID TERLIBAT": String(report.studentCount),
    "BIL. KOMUNITI TERLIBAT": String(report.communityCount),
    "OBJEKTIF AKTIVITI": report.objectives,
    "REFLEKSI": report.reflection,
    // These exact list values and separators were verified in the target form.
    "TERAS DALAM DPD": report.teras.map((teras) => teras.replace("TERAS ", "TERAS")).join(" , "),
    "PENGGUNAAN PERALATAN COE": report.equipmentUsed === "Ya" ? "YA" : "TIDAK",
    "PERALATAN COE YANG DIGUNAKAN": report.equipmentUsed === "Ya" ? report.equipment.join(" , ") : "",
  };
  for (const [key, label] of ALLOCATIONS) {
    // The target form rejects decimal notation. Never round actual expenditure.
    if (report[key] % 100 === 0) defaults[label] = String(report[key] / 100);
  }
  report.photos.slice(0, 2).forEach((photo, index) => {
    defaults[`GAMBAR ${index + 1}`] = photo.publicUrl;
  });

  return "https://www.appsheet.com/start/5c64ec78-6110-44c0-8672-95282a8de83b" +
    "#appName=LAPORANPROGRAMSSTP-653903016&view=LAPOR%20AKTIVITI&defaults=" +
    encodeURIComponent(JSON.stringify(defaults));
}
