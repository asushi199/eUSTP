import assert from "node:assert/strict";
import test from "node:test";
import {
  parseBotCommand,
  parseBotCommandRemainder,
  parseResourceCallback,
  RESOURCE_SEARCH_COMMANDS,
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
  resourceYearCallbackData,
} from "../../lib/telegram/commands";
import { kategoriKeyboard, monthKeyboard, askFilePrompt } from "../../lib/telegram/resource-keyboard";

test("parses /surat in private chat and groups with a bot username", () => {
  assert.equal(parseBotCommand("/surat", "nexabot"), "surat");
  assert.equal(parseBotCommand("/surat@NexaBot sila", "nexabot"), "surat");
  assert.equal(parseBotCommand("/batal", "nexabot"), "batal");
  assert.equal(parseBotCommand("/surat@OtherBot", "nexabot"), null);
  assert.equal(parseBotCommand("hantar surat", "nexabot"), null);
});

test("treats /cari, /carian and /search as public resource search", () => {
  assert.equal(parseBotCommand("/cari eduspark", "nexabot"), "cari");
  assert.equal(parseBotCommand("/carian@NexaBot jun 2026", "nexabot"), "carian");
  assert.equal(parseBotCommand("/search notebook", "nexabot"), "search");
  assert.equal(parseBotCommandRemainder("/cari@NexaBot jun 2026"), "jun 2026");
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("cari"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("carian"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("search"), true);
});

test("parses resource wizard callback data", () => {
  assert.deepEqual(parseResourceCallback(resourceKategoriCallbackData("surat-sekolah")), {
    type: "kategori",
    slug: "surat-sekolah",
  });
  assert.deepEqual(parseResourceCallback(resourceMonthCallbackData("2026-07")), {
    type: "bulan",
    month: "2026-07",
  });
  assert.deepEqual(parseResourceCallback(resourceYearCallbackData("2025-09")), {
    type: "tahun",
    center: "2025-09",
  });
  assert.deepEqual(parseResourceCallback("rs:x"), { type: "batal" });
  assert.equal(parseResourceCallback("rs:k:pekeliling"), null);
});

test("keeps kategori and month callback data within Telegram's 64-byte limit", () => {
  const kategori = kategoriKeyboard().flat();
  const months = monthKeyboard("2026-09", new Date("2026-09-04T12:00:00+08:00")).flat();
  for (const button of [...kategori, ...months]) {
    assert.ok(button.callback_data.length <= 64, button.callback_data);
  }
  assert.equal(kategori.some((b) => b.text === "USTP"), true);
  assert.equal(kategori.some((b) => b.text === "Sekolah / Guru / Murid"), true);
  assert.equal(months.some((b) => b.text === "September 2026"), true);
  assert.equal(months.some((b) => b.text === "« 2025"), true);
  assert.equal(months.some((b) => b.text === "2027 »"), true);
});
