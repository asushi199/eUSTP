import assert from "node:assert/strict";
import test from "node:test";
import { resolveTelegramRecipientChatIds } from "../../lib/telegram/recipients";

test("uses the configured PKG responsible person instead of legacy PKG recipients", () => {
  assert.deepEqual(
    resolveTelegramRecipientChatIds("configured-chat", ["legacy-a", "legacy-b"]),
    ["configured-chat"],
  );
});

test("keeps legacy PKG recipients when no responsible person is configured", () => {
  assert.deepEqual(
    resolveTelegramRecipientChatIds(null, ["legacy-a", "legacy-a", "legacy-b"]),
    ["legacy-a", "legacy-b"],
  );
});
