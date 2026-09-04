import assert from "node:assert/strict";
import test from "node:test";
import { parseBotCommand, parseBotCommandRemainder, RESOURCE_SEARCH_COMMANDS } from "../../lib/telegram/commands";
import {
  formatResourceSearchReply,
  nexaBotHelpText,
  parseResourceSearchCallback,
  parseResourceSearchIntent,
  resourceSearchCallbackData,
  resourceSearchPageKeyboard,
  sortResourceSearchHits,
} from "../../lib/telegram/resource-search-format";

test("reads the search query after /cari or /cari@bot", () => {
  assert.equal(parseBotCommand("/cari eduspark", "nexabot"), "cari");
  assert.equal(parseBotCommandRemainder("/cari eduspark"), "eduspark");
  assert.equal(parseBotCommandRemainder("/cari@NexaBot jun 2026"), "jun 2026");
  assert.equal(parseBotCommandRemainder("/cari"), "");
});

test("maps category commands and /cari prefixes to a kumpulan", () => {
  assert.deepEqual(parseResourceSearchIntent("cari", ""), { help: true, kategori: null, query: "" });
  assert.deepEqual(parseResourceSearchIntent("cari", "eduspark"), {
    help: false,
    kategori: null,
    query: "eduspark",
  });
  assert.deepEqual(parseResourceSearchIntent("sekolah", "eduspark"), {
    help: false,
    kategori: "surat-sekolah",
    query: "eduspark",
  });
  assert.deepEqual(parseResourceSearchIntent("ustp", ""), {
    help: false,
    kategori: "surat-ustp",
    query: "",
  });
  assert.deepEqual(parseResourceSearchIntent("surat_ustp", ""), {
    help: false,
    kategori: "surat-ustp",
    query: "",
  });
  assert.deepEqual(parseResourceSearchIntent("spi", "2026"), {
    help: false,
    kategori: "pekeliling",
    query: "2026",
  });
  assert.deepEqual(parseResourceSearchIntent("cari", "sekolah eduspark"), {
    help: false,
    kategori: "surat-sekolah",
    query: "eduspark",
  });
  assert.deepEqual(parseResourceSearchIntent("cari", "spi"), {
    help: false,
    kategori: "pekeliling",
    query: "",
  });
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("ustp"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("sekolah"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("spi"), true);
  assert.equal(RESOURCE_SEARCH_COMMANDS.has("nota"), true);
});

test("sorts hits by letter month then upload time, newest first", () => {
  const sorted = sortResourceSearchHits([
    {
      id: 1,
      title: "lama",
      url: "https://example.com/a",
      kategoriTitle: "USTP",
      createdAt: "2026-01-01T00:00:00.000Z",
      letterMonth: "2026-01",
    },
    {
      id: 2,
      title: "baru",
      url: "https://example.com/b",
      kategoriTitle: "USTP",
      createdAt: "2026-03-01T00:00:00.000Z",
      letterMonth: "2026-03",
    },
    {
      id: 3,
      title: "sama bulan, kemudian",
      url: "https://example.com/c",
      kategoriTitle: "USTP",
      createdAt: "2026-03-20T00:00:00.000Z",
      letterMonth: "2026-03",
    },
  ]);
  assert.deepEqual(
    sorted.map((card) => card.id),
    [3, 2, 1],
  );
});

test("formats search hits, help, and paginated numbering", () => {
  assert.match(formatResourceSearchReply("", [], { help: true }), /\/surat_ustp/);
  assert.match(nexaBotHelpText(), /\/kemaskini/);
  assert.match(nexaBotHelpText(), /\/padam/);
  assert.match(formatResourceSearchReply("xyz", []), /Tiada surat sepadan/);
  assert.match(
    formatResourceSearchReply("", [], { kategori: "surat-ustp" }),
    /Tiada surat dalam Surat USTP/,
  );

  const text = formatResourceSearchReply("eduspark", [
    {
      title: "PROGRAM EDUSPARK COE",
      url: "https://drive.google.com/file/d/abc/view",
      kategoriTitle: "Surat Program untuk Sekolah / Guru / Murid",
      createdAt: "2026-09-04T12:00:00.000Z",
      letterMonth: "2026-06",
    },
  ]);
  assert.match(text, /1 surat dijumpai · terkini dahulu/);
  assert.match(text, /PROGRAM EDUSPARK COE/);
  assert.match(text, /Jun 2026/);
  assert.match(text, /drive\.google\.com/);

  const pages = formatResourceSearchReply(
    "tugas",
    Array.from({ length: 9 }, (_, index) => ({
      title: `Surat ${index + 1}`,
      url: `https://drive.google.com/file/d/${index}/view`,
      kategoriTitle: "Surat Program untuk USTP",
      createdAt: "2026-09-04T12:00:00.000Z",
      letterMonth: "2026-09",
    })),
    { page: 2, limit: 8, kategori: "surat-ustp" },
  );
  assert.match(pages, /Muka 2\/2/);
  assert.match(pages, /9\. Surat 9/);
  assert.doesNotMatch(pages, /1\. Surat 1/);
});

test("keeps search page callback data within Telegram's 64-byte limit", () => {
  const data = resourceSearchCallbackData(12, "surat-sekolah", "eduspark jun 2026 program delima");
  assert.equal(data.length <= 64, true);
  assert.deepEqual(parseResourceSearchCallback(data), {
    page: 12,
    kategori: "surat-sekolah",
    query: "eduspark jun 2026 program delima",
  });
  assert.equal(parseResourceSearchCallback("rs:k:surat-ustp"), null);

  const keyboard = resourceSearchPageKeyboard(1, 3, "pekeliling", "spi");
  assert.equal(keyboard[0]?.some((button) => button.text === "»"), true);
  assert.equal(keyboard[0]?.some((button) => button.text === "«"), false);
  for (const button of keyboard.flat()) {
    assert.ok(button.callback_data.length <= 64, button.callback_data);
  }
});
