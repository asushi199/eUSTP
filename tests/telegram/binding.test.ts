import assert from "node:assert/strict";
import test from "node:test";
import {
  hashTelegramBindToken,
  isValidTelegramWebhookSecret,
  parseTelegramStartBindToken,
  pkgTelegramDestinationId,
  telegramDestinationLabel,
} from "../../lib/telegram/binding";

test("hashes Telegram binding tokens deterministically without storing the raw token", () => {
  const hash = hashTelegramBindToken("test-token");
  assert.equal(hash, hashTelegramBindToken("test-token"));
  assert.notEqual(hash, "test-token");
  assert.equal(hash.length, 64);
});

test("validates Telegram webhook secrets using exact equality", () => {
  assert.equal(isValidTelegramWebhookSecret("rahsia", "rahsia"), true);
  assert.equal(isValidTelegramWebhookSecret("rahsia-lain", "rahsia"), false);
  assert.equal(isValidTelegramWebhookSecret(null, "rahsia"), false);
});

test("parses Telegram /start bind payloads and ignores other commands", () => {
  assert.equal(
    parseTelegramStartBindToken("/start bind_abcdefghijklmnopqrstuvwxyz012345"),
    "abcdefghijklmnopqrstuvwxyz012345",
  );
  assert.equal(parseTelegramStartBindToken("/start bind_short"), null);
  assert.equal(parseTelegramStartBindToken("/start"), null);
  assert.equal(parseTelegramStartBindToken("hello"), null);
});

test("builds a stable destination id per PKG", () => {
  assert.equal(pkgTelegramDestinationId("sitiawan"), "pkg:sitiawan");
});

test("labels a PKG destination as Admin without repeating PKG", () => {
  assert.equal(
    telegramDestinationLabel("pkg:beruas", "PKG Beruas"),
    "Admin PKG Beruas",
  );
  assert.equal(
    telegramDestinationLabel("pkg:sitiawan", null),
    "modul yang dipilih",
  );
  assert.equal(telegramDestinationLabel("khidmat"), "Khidmat Bantu");
});
