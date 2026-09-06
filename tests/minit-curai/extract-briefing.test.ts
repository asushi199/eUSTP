import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  briefingImageMime,
  combineBriefingNotes,
  detectBriefingKind,
  extractBriefingText,
  isSparseBriefingText,
  planBriefingUploads,
  slicePdfForVision,
} from "../../lib/minit-curai/extract-briefing";

test("detects pdf, pptx, images and rejects old ppt", () => {
  assert.equal(detectBriefingKind("slaid.pdf", "application/pdf"), "pdf");
  assert.equal(detectBriefingKind("taklimat.PPTX", "application/octet-stream"), "pptx");
  assert.equal(detectBriefingKind("lama.ppt", "application/vnd.ms-powerpoint"), "ppt");
  assert.equal(detectBriefingKind("nota.jpg", "image/jpeg"), "image");
  assert.equal(detectBriefingKind("papan.PNG", ""), "image");
  assert.equal(briefingImageMime("foto.webp", "application/octet-stream"), "image/webp");
  assert.equal(detectBriefingKind("animasi.gif", "image/gif"), null);
  assert.equal(detectBriefingKind("nota.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), null);
});

test("plans image uploads and rejects mixed or oversized sets", () => {
  const images = planBriefingUploads([
    { name: "a.jpg", type: "image/jpeg", size: 1200 },
    { name: "b.png", type: "image/png", size: 800 },
  ]);
  assert.equal(images.ok, true);
  if (!images.ok) return;
  assert.equal(images.mode, "images");
  if (images.mode !== "images") return;
  assert.deepEqual(images.mimeTypes, ["image/jpeg", "image/png"]);

  const mixed = planBriefingUploads([
    { name: "slaid.pdf", type: "application/pdf", size: 1000 },
    { name: "nota.jpg", type: "image/jpeg", size: 1000 },
  ]);
  assert.equal(mixed.ok, false);

  const huge = planBriefingUploads([{ name: "besar.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 }]);
  assert.equal(huge.ok, false);
});

test("combines notes and file text without exceeding the clip", () => {
  const combined = combineBriefingNotes("Nota pegawai", "Teks slaid");
  assert.match(combined, /Nota pegawai/);
  assert.match(combined, /Teks slaid/);
  assert.ok(combineBriefingNotes("", "x".repeat(9000)).length <= 8010);
});

test("extracts slide text from a pptx zip", async () => {
  const zip = new JSZip();
  zip.file("ppt/slides/slide1.xml", `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Dasar DPD baharu</a:t><a:t>Semua PKG laksana</a:t></p:sld>`);
  zip.file("ppt/slides/slide2.xml", `<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:t>Hebahan staf</a:t></p:sld>`);
  const bytes = await zip.generateAsync({ type: "uint8array" });
  const extracted = await extractBriefingText(bytes, "pptx");
  assert.equal(extracted.ok, true);
  if (!extracted.ok) return;
  assert.match(extracted.text, /Dasar DPD baharu/);
  assert.match(extracted.text, /Hebahan staf/);
});

test("treats short or empty extract as scanned briefing", () => {
  assert.equal(isSparseBriefingText(""), true);
  assert.equal(isSparseBriefingText("Tajuk sahaja"), true);
  assert.equal(isSparseBriefingText("A".repeat(80)), false);
});

test("keeps only the first pages of a long pdf for vision", async () => {
  const source = await PDFDocument.create();
  for (let index = 0; index < 12; index += 1) source.addPage([300, 200]);
  const sliced = await PDFDocument.load(await slicePdfForVision(await source.save(), 8));
  assert.equal(sliced.getPageCount(), 8);
  const twenty = await PDFDocument.load(await slicePdfForVision(await source.save()));
  assert.equal(twenty.getPageCount(), 12);
});

test("extracts visible text from a simple pdf", async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([400, 200]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("Taklimat USTP Manjung", { x: 20, y: 150, size: 12, font });
  const bytes = await pdf.save();
  const extracted = await extractBriefingText(bytes, "pdf");
  assert.equal(extracted.ok, true);
  if (!extracted.ok) return;
  assert.match(extracted.text, /Taklimat USTP Manjung/);
});
