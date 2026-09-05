import assert from "node:assert/strict";
import test from "node:test";
import {
  draftCardIdFromFileId,
  draftFileIdForCard,
  draftFileIdForMediaCard,
  draftMediaCardIdFromFileId,
  isFotoDraftStep,
  MEDIA_FOTO_COMMANDS,
  parseBotCommand,
  parseBotCommandRemainder,
  parseMediaFotoCallback,
  parseResourceCallback,
  RESOURCE_HELP_COMMANDS,
  RESOURCE_MANAGE_COMMANDS,
  RESOURCE_SEARCH_COMMANDS,
  mediaDeleteCallbackData,
  mediaDeleteConfirmCallbackData,
  mediaEditMonthCallbackData,
  mediaEditTitleCallbackData,
  resourceDeleteCallbackData,
  resourceDeleteConfirmCallbackData,
  resourceEditMonthCallbackData,
  resourceEditTitleCallbackData,
  resourceKategoriCallbackData,
  resourceMonthCallbackData,
  resourceYearCallbackData,
} from "../../lib/telegram/commands";
import {
  kategoriKeyboard,
  mediaManageKeyboard,
  monthKeyboard,
  resourceManageKeyboard,
} from "../../lib/telegram/resource-keyboard";

test("parses /surat in private chat and groups with a bot username", () => {
  assert.equal(parseBotCommand("/surat", "nexabot"), "surat");
  assert.equal(parseBotCommand("/surat@NexaBot sila", "nexabot"), "surat");
  assert.equal(parseBotCommand("/batal", "nexabot"), "batal");
  assert.equal(parseBotCommand("/foto", "nexabot"), "foto");
  assert.equal(parseBotCommand("/foto@NexaBot", "nexabot"), "foto");
  assert.equal(parseBotCommand("/gambar", "nexabot"), "gambar");
  assert.equal(MEDIA_FOTO_COMMANDS.has("foto"), true);
  assert.equal(MEDIA_FOTO_COMMANDS.has("gambar"), true);
  assert.equal(parseBotCommand("/surat@OtherBot", "nexabot"), null);
  assert.equal(parseBotCommand("hantar surat", "nexabot"), null);
});

test("treats /cari and kumpulan commands as public resource search", () => {
  assert.equal(parseBotCommand("/cari eduspark", "nexabot"), "cari");
  assert.equal(parseBotCommand("/carian@NexaBot jun 2026", "nexabot"), "carian");
  assert.equal(parseBotCommand("/search notebook", "nexabot"), "search");
  assert.equal(parseBotCommand("/ustp", "nexabot"), "ustp");
  assert.equal(parseBotCommand("/surat_ustp", "nexabot"), "surat_ustp");
  assert.equal(parseBotCommand("/sekolah eduspark", "nexabot"), "sekolah");
  assert.equal(parseBotCommand("/spi@NexaBot", "nexabot"), "spi");
  assert.equal(parseBotCommand("/mula", "nexabot"), "mula");
  assert.equal(parseBotCommand("/kemaskini eduspark", "nexabot"), "kemaskini");
  assert.equal(parseBotCommand("/padam", "nexabot"), "padam");
  assert.equal(parseBotCommand("/start", "nexabot"), "start");
  assert.equal(parseBotCommand("/edit", "nexabot"), "edit");
  assert.equal(parseBotCommand("/delete", "nexabot"), "delete");
  assert.equal(RESOURCE_HELP_COMMANDS.has("mula"), true);
  assert.equal(RESOURCE_HELP_COMMANDS.has("start"), false);
  assert.equal(RESOURCE_MANAGE_COMMANDS.has("kemaskini"), true);
  assert.equal(RESOURCE_MANAGE_COMMANDS.has("padam"), true);
  assert.equal(RESOURCE_MANAGE_COMMANDS.has("edit"), false);
  assert.equal(RESOURCE_MANAGE_COMMANDS.has("delete"), false);
  assert.equal(parseBotCommandRemainder("/cari@NexaBot jun 2026"), "jun 2026");
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("cari"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("carian"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("search"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("sekolah"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("spi"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("surat_ustp"), true);
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
  assert.deepEqual(parseResourceCallback(resourceEditTitleCallbackData(42)), {
    type: "ubah_tajuk",
    cardId: 42,
  });
  assert.deepEqual(parseResourceCallback(resourceEditMonthCallbackData(42)), {
    type: "ubah_bulan",
    cardId: 42,
  });
  assert.deepEqual(parseResourceCallback(resourceDeleteCallbackData(42)), {
    type: "padam",
    cardId: 42,
  });
  assert.deepEqual(parseResourceCallback(resourceDeleteConfirmCallbackData(42)), {
    type: "padam_ya",
    cardId: 42,
  });
  assert.equal(draftCardIdFromFileId(draftFileIdForCard(42)), 42);
  assert.equal(draftCardIdFromFileId("AgADBAAD"), null);
  assert.deepEqual(parseMediaFotoCallback(mediaEditTitleCallbackData(9)), {
    type: "ubah_tajuk",
    cardId: 9,
  });
  assert.deepEqual(parseMediaFotoCallback(mediaEditMonthCallbackData(9)), {
    type: "ubah_bulan",
    cardId: 9,
  });
  assert.deepEqual(parseMediaFotoCallback(mediaDeleteCallbackData(9)), {
    type: "padam",
    cardId: 9,
  });
  assert.deepEqual(parseMediaFotoCallback(mediaDeleteConfirmCallbackData(9)), {
    type: "padam_ya",
    cardId: 9,
  });
  assert.equal(parseMediaFotoCallback("rs:et:9"), null);
  assert.equal(draftMediaCardIdFromFileId(draftFileIdForMediaCard(9)), 9);
  assert.equal(draftMediaCardIdFromFileId(draftFileIdForCard(9)), null);
  assert.equal(isFotoDraftStep("foto_bulan"), true);
  assert.equal(isFotoDraftStep("nama"), false);
});

test("keeps kategori and month callback data within Telegram's 64-byte limit", () => {
  const kategori = kategoriKeyboard().flat();
  const months = monthKeyboard("2026-09", new Date("2026-09-04T12:00:00+08:00")).flat();
  const manage = resourceManageKeyboard(42).flat();
  const media = mediaManageKeyboard(9).flat();
  for (const button of [...kategori, ...months, ...manage, ...media]) {
    assert.ok(button.callback_data && button.callback_data.length <= 64, button.callback_data);
  }
  assert.equal(kategori.some((b) => b.text === "USTP"), true);
  assert.equal(kategori.some((b) => b.text === "Sekolah / Guru / Murid"), true);
  assert.equal(months.some((b) => b.text === "September 2026"), true);
  assert.equal(months.some((b) => b.text === "« 2025"), true);
  assert.equal(months.some((b) => b.text === "2027 »"), true);
});
