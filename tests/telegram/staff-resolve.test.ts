import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTelegramUsername,
  pickDestinationOwnerUserId,
} from "../../lib/telegram/staff-resolve";

test("normalizes Telegram usernames without the at sign", () => {
  assert.equal(normalizeTelegramUsername("@IzrulUstp"), "izrulustp");
  assert.equal(normalizeTelegramUsername("IzrulUstp"), "izrulustp");
  assert.equal(normalizeTelegramUsername("  "), null);
  assert.equal(normalizeTelegramUsername(null), null);
});

test("prefers the designated officer, then any candidate, then fallback", () => {
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: 9,
      candidateUserIds: [3, 4],
      fallbackUserId: 1,
    }),
    9,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      candidateUserIds: [3, 4],
      fallbackUserId: 1,
    }),
    3,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      candidateUserIds: [],
      fallbackUserId: 1,
    }),
    1,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      candidateUserIds: [],
      fallbackUserId: null,
    }),
    null,
  );
});
