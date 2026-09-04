import assert from "node:assert/strict";
import test from "node:test";
import {
  parseBotCommand,
  parseResourceCallback,
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
} from "../../lib/telegram/commands";
import { kategoriKeyboard, monthKeyboard } from "../../lib/telegram/resource-keyboard";

test("parses /surat in private chat and groups with a bot username", () => {
  assert.equal(parseBotCommand("/surat", "nexabot"), "surat");
  assert.equal(parseBotCommand("/surat@NexaBot sila", "nexabot"), "surat");
  assert.equal(parseBotCommand("/batal", "nexabot"), "batal");
  assert.equal(parseBotCommand("/surat@OtherBot", "nexabot"), null);
  assert.equal(parseBotCommand("hantar surat", "nexabot"), null);
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
  assert.deepEqual(parseResourceCallback("rs:x"), { type: "batal" });
  assert.equal(parseResourceCallback("rs:k:pekeliling"), null);
});

test("keeps kategori and month callback data within Telegram's 64-byte limit", () => {
  const kategori = kategoriKeyboard().flat();
  const months = monthKeyboard(new Date("2026-09-04T12:00:00+08:00")).flat();
  for (const button of [...kategori, ...months]) {
    assert.ok(button.callback_data.length <= 64, button.callback_data);
  }
  assert.equal(kategori.some((b) => b.text === "USTP"), true);
  assert.equal(kategori.some((b) => b.text === "Sekolah / Guru / Murid"), true);
});
