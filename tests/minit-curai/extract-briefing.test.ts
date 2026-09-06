import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  combineBriefingNotes,
  detectBriefingKind,
  extractBriefingText,
} from "../../lib/minit-curai/extract-briefing";

test("detects pdf, pptx and rejects old ppt", () => {
  assert.equal(detectBriefingKind("slaid.pdf", "application/pdf"), "pdf");
  assert.equal(detectBriefingKind("taklimat.PPTX", "application/octet-stream"), "pptx");
  assert.equal(detectBriefingKind("lama.ppt", "application/vnd.ms-powerpoint"), "ppt");
  assert.equal(detectBriefingKind("nota.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"), null);
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
