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

test("prefers the responsible officer, then PKG admin, then fallback admin", () => {
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: 9,
      pkgAdminIds: [3, 4],
      fallbackAdminId: 1,
    }),
    9,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      pkgAdminIds: [3, 4],
      fallbackAdminId: 1,
    }),
    3,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      pkgAdminIds: [],
      fallbackAdminId: 1,
    }),
    1,
  );
  assert.equal(
    pickDestinationOwnerUserId({
      responsibleUserId: null,
      pkgAdminIds: [],
      fallbackAdminId: null,
    }),
    null,
  );
});
