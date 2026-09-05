import assert from "node:assert/strict";
import test from "node:test";
import { buildUstpAppSheetUrl, ustpAppSheetManualAllocations } from "../../lib/laporan-ustp/appsheet";

const report = {
  pkgCode: "AQA1001", cluster: "PROGRAM DASAR PENDIDIKAN DIGITAL", programName: "Bengkel Digital",
  startDate: "2026-09-05", endDate: "2026-09-16", location: "PKG Sitiawan", organiser: "USTP Manjung",
  schoolCount: 5, teacherCount: 10, studentCount: 20, communityCount: 0,
  objectives: "Objektif pertama.\nObjektif kedua.", reflection: "Objektif dicapai.",
  teras: ["TERAS 1", "TERAS 6"], equipmentUsed: "Ya", equipment: ["SET KAMERA PTZ", "MONITOR 21 INCI"],
  os29000Sen: 10000, os42000Sen: 20000, os21000Sen: 5000,
  photos: [
    { storagePath: "drive/test-first", publicUrl: "https://drive.google.com/thumbnail?id=test-first&sz=w1600" },
    { storagePath: "drive/test-second", publicUrl: "https://drive.google.com/thumbnail?id=test-second&sz=w1600" },
  ],
};

function defaults(url: string) {
  return JSON.parse(new URLSearchParams(new URL(url).hash.slice(1)).get("defaults")!) as Record<string, string>;
}

test("targets the verified form and maps codes, dates, counts and multiple selections", () => {
  const url = new URL(buildUstpAppSheetUrl(report));
  assert.equal(url.origin, "https://www.appsheet.com");
  assert.equal(url.pathname, "/start/5c64ec78-6110-44c0-8672-95282a8de83b");
  assert.equal(url.search, "");
  assert.equal(new URLSearchParams(url.hash.slice(1)).get("view"), "LAPOR AKTIVITI");
  assert.deepEqual(defaults(url.href), {
    "SSTP/KOD PKG": "AQA1001", "KLUSTER PROGRAM/AKTIVITI": report.cluster,
    "NAMA PROGRAM/AKTIVITI": report.programName, "TARIKH MULA": "09/05/2026", "TARIKH AKHIR": "09/16/2026",
    "TEMPAT": report.location, "PENGANJUR": report.organiser, "BIL SEKOLAH TERLIBAT": "5",
    "BIL. PEGAWAI / GURU TERLIBAT": "10", "BIL. MURID TERLIBAT": "20", "BIL. KOMUNITI TERLIBAT": "0",
    "OBJEKTIF AKTIVITI": report.objectives, "REFLEKSI": report.reflection,
    "TERAS DALAM DPD": "TERAS1 , TERAS6", "PENGGUNAAN PERALATAN COE": "YA",
    "PERALATAN COE YANG DIGUNAKAN": "SET KAMERA PTZ , MONITOR 21 INCI",
    "OS29000 (RM)": "100", "OS42000 (RM)": "200", "OS21000 (RM)": "50",
    "GAMBAR 1": report.photos[0].publicUrl, "GAMBAR 2": report.photos[1].publicUrl,
  });
});

test("preserves original sen and identifies fractional amounts for manual review without rounding", () => {
  const fractional = { ...report, os29000Sen: 10050, os42000Sen: 1, os21000Sen: 0 };
  const values = defaults(buildUstpAppSheetUrl(fractional));
  assert.equal(values["OS29000 (RM)"], undefined);
  assert.equal(values["OS42000 (RM)"], undefined);
  assert.equal(values["OS21000 (RM)"], "0");
  assert.deepEqual(ustpAppSheetManualAllocations(fractional), ["OS29000 (RM): 100.50", "OS42000 (RM): 0.01"]);
  assert.deepEqual(ustpAppSheetManualAllocations(report), []);
  assert.equal(fractional.os29000Sen, 10050);
});

test("does not invent photo defaults when a report has no photos", () => {
  const values = defaults(buildUstpAppSheetUrl({ ...report, photos: [] }));
  assert.equal(values["GAMBAR 1"], undefined);
  assert.equal(values["GAMBAR 2"], undefined);
});

test("Tidak does not carry stale equipment and empty pillars remain empty", () => {
  const values = defaults(buildUstpAppSheetUrl({ ...report, equipmentUsed: "Tidak", teras: [] }));
  assert.equal(values["PENGGUNAAN PERALATAN COE"], "TIDAK");
  assert.equal(values["PERALATAN COE YANG DIGUNAKAN"], "");
  assert.equal(values["TERAS DALAM DPD"], "");
});

test("preserves long paragraphs, Unicode and URL delimiters without adding link parameters", () => {
  const text = 'Laporan "A&B" #view=other + 50% / 中文\n'.repeat(400);
  const url = buildUstpAppSheetUrl({ ...report, objectives: text, reflection: text });
  const params = new URLSearchParams(new URL(url).hash.slice(1));
  assert.equal(params.size, 3);
  assert.equal(params.get("view"), "LAPOR AKTIVITI");
  assert.equal(defaults(url)["OBJEKTIF AKTIVITI"], text);
  assert.equal(defaults(url)["REFLEKSI"], text);
});
