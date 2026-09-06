import assert from "node:assert/strict";
import test from "node:test";
import {
  buildResourcesDrivePath,
  isLetterMonthKey,
  sanitizeResourcesFileName,
} from "../../lib/resources/drive-path";

test("builds Drive folders by group, year, and chosen letter month", () => {
  const path = buildResourcesDrivePath({
    kategori: "surat-ustp",
    letterMonth: "2026-07",
    title: "Jemputan Program DELIMa",
    originalName: "scan.PDF",
    mime: "application/pdf",
  });
  assert.deepEqual(path.subPath, ["CoE-Resources", "Surat-USTP", "2026", "2026-07"]);
  assert.equal(path.fileName, "Jemputan Program DELIMa.pdf");
});

test("stores arkib files by year only", () => {
  const path = buildResourcesDrivePath({
    kategori: "arkib",
    letterMonth: "2025-01",
    title: "Kertas kerja · Bengkel Digital 2025",
    originalName: "kk.pdf",
    mime: "application/pdf",
  });
  assert.deepEqual(path.subPath, ["CoE-Resources", "Arkib", "2025"]);
});

test("sanitizes path characters in the stored file name", () => {
  assert.equal(
    sanitizeResourcesFileName('Surat: Sekolah / Guru', "a.png", "image/png"),
    "Surat- Sekolah - Guru.png",
  );
  assert.equal(isLetterMonthKey("2026-09"), true);
  assert.equal(isLetterMonthKey("2026-13"), false);
});
