import assert from "node:assert/strict";
import test from "node:test";
import { parseBotCommand, parseBotCommandRemainder } from "../../lib/telegram/commands";
import { formatResourceSearchReply } from "../../lib/telegram/resource-search-format";

test("reads the search query after /cari or /cari@bot", () => {
  assert.equal(parseBotCommand("/cari eduspark", "nexabot"), "cari");
  assert.equal(parseBotCommandRemainder("/cari eduspark"), "eduspark");
  assert.equal(parseBotCommandRemainder("/cari@NexaBot jun 2026"), "jun 2026");
  assert.equal(parseBotCommandRemainder("/cari"), "");
});

test("formats search hits and an empty state", () => {
  assert.match(formatResourceSearchReply("", []), /\/cari/);
  assert.match(formatResourceSearchReply("xyz", []), /Tiada surat sepadan/);

  const text = formatResourceSearchReply("eduspark", [
    {
      title: "PROGRAM EDUSPARK COE",
      url: "https://drive.google.com/file/d/abc/view",
      kategoriTitle: "Surat Program untuk Sekolah / Guru / Murid",
      createdAt: "2026-09-04T12:00:00.000Z",
      letterMonth: "2026-06",
    },
  ]);
  assert.match(text, /1 surat dijumpai/);
  assert.match(text, /PROGRAM EDUSPARK COE/);
  assert.match(text, /Jun 2026/);
  assert.match(text, /drive\.google\.com/);
});
