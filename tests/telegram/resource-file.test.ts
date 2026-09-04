import assert from "node:assert/strict";
import test from "node:test";
import { resolveSuratMime } from "../../lib/khidmat-bantu/surat-mime";
import {
  extractTelegramResourceFile,
  normalizeTelegramDocumentName,
} from "../../lib/telegram/resource-file";

test("accepts Telegram PDF mime aliases and octet-stream with a .pdf name", () => {
  assert.equal(resolveSuratMime("a.pdf", "application/PDF"), "application/pdf");
  assert.equal(resolveSuratMime("a.pdf", "application/x-pdf"), "application/pdf");
  assert.equal(resolveSuratMime("surat.pdf", "application/octet-stream"), "application/pdf");
  assert.equal(resolveSuratMime("nota.docx", "application/octet-stream"), null);
});

test("adds .pdf when Telegram omits the document extension", () => {
  assert.equal(
    normalizeTelegramDocumentName("Program EDUSPARK COE", "application/octet-stream"),
    "Program EDUSPARK COE.pdf",
  );
  assert.equal(normalizeTelegramDocumentName("scan.PDF", ""), "scan.PDF");
});

test("reads a PDF that the user replied to with /surat", () => {
  const file = extractTelegramResourceFile(
    {
      reply_to_message: {
        document: {
          file_id: "file-1",
          file_name: "Program EDUSPARK COE",
          mime_type: "application/octet-stream",
          file_size: 1024,
        },
      },
    },
    { includeReply: true },
  );
  assert.equal(file?.fileId, "file-1");
  assert.equal(file?.fileName, "Program EDUSPARK COE.pdf");
  assert.equal(file?.mimeType, "application/pdf");
  assert.equal(extractTelegramResourceFile({ reply_to_message: { document: { file_id: "file-1" } } }), null);
});
