import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { USTP_CLUSTERS, USTP_EQUIPMENT } from "../../lib/laporan-ustp/options";
import { parseUstpReport, ustpPhotoSubPath, ustpTotalSen } from "../../lib/laporan-ustp/validation";
import { generateUstpPdf, wrapUstpPdfText } from "../../lib/laporan-ustp/pdf";
import type { UstpReport } from "../../lib/schema";

function form() {
  const data = new FormData();
  const fields = {
    pkgCode: "AQA1001", cluster: USTP_CLUSTERS[0], programName: "Bengkel Digital",
    startDate: "2026-09-05", endDate: "2026-09-06", location: "PKG Sitiawan", organiser: "USTP Manjung",
    schoolCount: "5", teacherCount: "30", studentCount: "0", communityCount: "0",
    objectives: "Meningkatkan kemahiran digital.", equipmentUsed: "Tidak",
    os29000Sen: "0.10", os42000Sen: "0.20", os21000Sen: "0", otherSen: "0", otherAllocation: "",
    reflection: "Objektif dicapai.", preparedBy: "Pegawai USTP",
  };
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  data.append("teras", "TERAS 1"); data.append("teras", "TERAS 6");
  return data;
}

test("parses sen exactly and retains multiple DPD pillars", () => {
  const parsed = parseUstpReport(form()); assert.ok(parsed.success);
  assert.equal(ustpTotalSen(parsed.data), 30);
  assert.deepEqual(parsed.data.teras, ["TERAS 1", "TERAS 6"]);
});

test("rejects invalid dates, reversed ranges, foreign options and malformed numbers", () => {
  for (const [field, value] of [
    ["startDate", "2026-02-30"], ["endDate", "2026-09-04"], ["pkgCode", "AQA9999"],
    ["cluster", "UNKNOWN"], ["teacherCount", "-1"], ["teacherCount", "1.5"],
    ["os29000Sen", "-1"], ["os29000Sen", "1.001"], ["otherSen", "20"],
  ]) { const data = form(); data.set(field, value); assert.equal(parseUstpReport(data).success, false, `${field}: ${value}`); }
});

test("requires equipment for Ya and removes stale equipment for Tidak", () => {
  const data = form(); data.set("equipmentUsed", "Ya");
  assert.equal(parseUstpReport(data).success, false);
  data.append("equipment", USTP_EQUIPMENT[0]); data.append("equipment", USTP_EQUIPMENT[18]);
  const yes = parseUstpReport(data); assert.ok(yes.success); assert.equal(yes.data.equipment.length, 2);
  data.set("equipmentUsed", "Tidak");
  const no = parseUstpReport(data); assert.ok(no.success); assert.deepEqual(no.data.equipment, []);
});

test("files use the activity month rather than the upload month", () => {
  assert.deepEqual(ustpPhotoSubPath("2025-12-31", "report-id"), ["Laporan USTP", "2025", "2025-12", "report-id"]);
});

test("wraps long tokens and paragraph breaks without dropping content", async () => {
  const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica);
  const token = "X".repeat(500);
  const lines = wrapUstpPdfText(font, `${token}\n\nTamat laporan`, 100);
  assert.equal(lines.join("").replace(/\s/g, ""), `${token}Tamatlaporan`);
  assert.ok(lines.includes(""));
  assert.ok(lines.every((line) => font.widthOfTextAtSize(line, 9) <= 100));
});

test("generates an A4 report with both photos and additional pages for long content", async () => {
  const parsed = parseUstpReport(form()); assert.ok(parsed.success);
  const report: UstpReport = {
    ...parsed.data, id: "8d9b2329-b170-43ce-a03f-37c92a74f755", photos: [],
    version: 1, createdBy: 1, createdAt: new Date(), updatedAt: new Date(),
  };
  const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==", "base64");
  const short = await PDFDocument.load(await generateUstpPdf(report, [pixel, pixel]));
  const long = await PDFDocument.load(await generateUstpPdf({ ...report, objectives: "Objektif aktiviti untuk semua peserta. ".repeat(450), reflection: "Refleksi program. ".repeat(450) }, [pixel, pixel]));
  assert.ok(long.getPageCount() > short.getPageCount());
  for (const page of long.getPages()) { assert.equal(page.getWidth(), 595.28); assert.equal(page.getHeight(), 841.89); }
  await assert.rejects(generateUstpPdf(report, [pixel]), /Dua gambar/);
});
