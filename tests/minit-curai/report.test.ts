import assert from "node:assert/strict";
import test from "node:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { parseMinitCurai } from "../../lib/minit-curai/validation";
import { generateMinitCuraiPdf, pdfText, wrapMinitPdfText } from "../../lib/minit-curai/pdf";
import type { MinitCurai } from "../../lib/schema";

function form(overrides: Record<string, string> = {}, items = [{
  perkara: "Dasar baharu DPD",
  keputusan: "Semua PKG laksana minggu depan",
  tindakan: "Sedia takwim dan hebahan",
  pegawai: "Pengurus PKG Sitiawan",
}], kaedah = ["Mesyuarat", "WhatsApp"]) {
  const data = new FormData();
  const fields = {
    reporterName: "Ahmad Bin Ali",
    reporterTitle: "DG10",
    unitSektor: "Unit Sumber Teknologi Pendidikan",
    tajuk: "Taklimat Dasar Pendidikan Digital",
    anjuran: "JPN Perak",
    meetingDate: "2026-09-06",
    meetingTime: "9.00 pagi - 12.00 tengah hari",
    tempat: "Dewan JPN Perak",
    chairperson: "Pengarah JPN",
    rujukanFail: "JPN/USTP/2026/12",
    rumusan: "",
    lampiran: "Slaid taklimat",
    targetDate: "2026-09-20",
    disebarkanKepada: "Semua pegawai USTP",
    tarikhCurai: "2026-09-07",
    kaedahLain: "",
    preparedByName: "Ahmad Bin Ali",
    preparedByTitle: "Pegawai USTP",
    preparedAt: "2026-09-07",
    reviewedByName: "",
    reviewedByTitle: "",
    reviewedAt: "",
    ...overrides,
  };
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  data.set("items", JSON.stringify(items));
  kaedah.forEach((item) => data.append("kaedah", item));
  return data;
}

test("parses a complete minit curai and keeps multiple content rows", () => {
  const parsed = parseMinitCurai(form({}, [
    { perkara: "Isu 1", keputusan: "Keputusan 1", tindakan: "Tindakan 1", pegawai: "Unit A" },
    { perkara: "Isu 2", keputusan: "Keputusan 2", tindakan: "Tindakan 2", pegawai: "Unit B" },
  ]));
  assert.ok(parsed.success);
  assert.equal(parsed.data.items.length, 2);
  assert.equal(parsed.data.targetDate, "2026-09-20");
  assert.equal(parsed.data.reviewedAt, null);
  assert.equal(parsed.data.rumusan, "");
});

test("accepts omitted optional dates instead of English Required", () => {
  const data = form({ targetDate: "", reviewedAt: "" });
  data.delete("targetDate");
  data.delete("reviewedAt");
  const parsed = parseMinitCurai(data);
  assert.ok(parsed.success);
  if (!parsed.success) return;
  assert.equal(parsed.data.targetDate, null);
  assert.equal(parsed.data.reviewedAt, null);
});

test("drops autofilled reviewer title when nama penyemak is empty", () => {
  const parsed = parseMinitCurai(form({
    reviewedByName: "",
    reviewedByTitle: "Penolong Pegawai PPD USTP",
  }));
  assert.ok(parsed.success);
  if (!parsed.success) return;
  assert.equal(parsed.data.reviewedByTitle, "");
});

test("accepts omitted kaedah lain when Lain-lain is not selected", () => {
  const data = form();
  data.delete("kaedahLain");
  const parsed = parseMinitCurai(data);
  assert.ok(parsed.success);
  if (!parsed.success) return;
  assert.equal(parsed.data.kaedahLain, "");
});

test("rejects empty content, missing required fields and lain-lain without details", () => {
  assert.equal(parseMinitCurai(form({ tajuk: "" })).success, false);
  assert.equal(parseMinitCurai(form({ reporterTitle: "Pentadbir Sistem" })).success, false);
  assert.equal(parseMinitCurai(form({ unitSektor: "PKG Sitiawan" })).success, false);
  assert.equal(parseMinitCurai(form({}, [])).success, false);
  assert.equal(parseMinitCurai(form({ meetingDate: "2026-02-30" })).success, false);
  const lain = form({ kaedahLain: "" }, undefined, ["Lain-lain"]);
  assert.equal(parseMinitCurai(lain).success, false);
  lain.set("kaedahLain", "Telegram kumpulan");
  assert.ok(parseMinitCurai(lain).success);
});

test("sanitizes arrows, marks and non-Rumi characters so Helvetica can encode", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const text = pdfText("Tindakan → unit\n✓ Selesai\nteks\u200btersembunyi\n王 Chong", font);
  assert.equal(text, "Tindakan -> unit\nv Selesai\ntekstersembunyi\n? Chong");
  assert.doesNotThrow(() => font.encodeText(text.replace(/\n/g, " ")));
});

test("generates PDF when kandungan has Word/AI symbols outside WinAnsi", async () => {
  const parsed = parseMinitCurai(form());
  assert.ok(parsed.success);
  const report: MinitCurai = {
    ...parsed.data,
    id: "8d9b2329-b170-43ce-a03f-37c92a74f755",
    version: 1,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [{
      perkara: "• Objektif kursus drone → penerbitan digital\n✓ Pendaftaran peserta",
      keputusan: "Semua PKG laksana minggu depan — ikut slaid ‘taklimat’.",
      tindakan: "Hebahan WhatsApp + e-mel\u200b kepada staf.\n王 老师",
      pegawai: "Penolong PPD USTP Daerah Manjung",
    }],
  };
  const bytes = await generateMinitCuraiPdf(report);
  const loaded = await PDFDocument.load(bytes);
  assert.ok(loaded.getPageCount() >= 1);
});

test("wraps long tokens and paragraph breaks without dropping content", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const token = "X".repeat(500);
  const lines = wrapMinitPdfText(font, `${token}\n\nTamat minit`, 100);
  assert.equal(lines.join("").replace(/\s/g, ""), `${token}Tamatminit`);
  assert.ok(lines.includes(""));
  assert.ok(lines.every((line) => font.widthOfTextAtSize(line, 9) <= 100));
});

test("generates additional PDF pages for long kandungan", async () => {
  const parsed = parseMinitCurai(form());
  assert.ok(parsed.success);
  const report: MinitCurai = {
    ...parsed.data,
    id: "8d9b2329-b170-43ce-a03f-37c92a74f755",
    version: 1,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const short = await PDFDocument.load(await generateMinitCuraiPdf(report));
  const long = await PDFDocument.load(await generateMinitCuraiPdf({
    ...report,
    items: [{
      perkara: "• Perkara mesyuarat untuk tindakan semua pegawai. ".repeat(80),
      keputusan: "• Keputusan mesyuarat. ".repeat(80),
      tindakan: "• Tindakan susulan. ".repeat(80),
      pegawai: "Pengurus PKG Sitiawan",
    }],
  }));
  assert.ok(long.getPageCount() > short.getPageCount());
  for (const page of long.getPages()) {
    assert.equal(page.getWidth(), 595.28);
    assert.equal(page.getHeight(), 841.89);
  }
});
