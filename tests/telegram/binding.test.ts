import assert from "node:assert/strict";
import test from "node:test";
import {
  hashTelegramBindToken,
  isValidTelegramWebhookSecret,
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
