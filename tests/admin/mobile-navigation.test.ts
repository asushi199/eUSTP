import assert from "node:assert/strict";
import test from "node:test";
import { getAdminMobileNavigation } from "../../lib/admin/mobile-navigation";

test("keeps only Papan and Portal on the admin mobile bar", () => {
  assert.deepEqual(
    getAdminMobileNavigation().map((item) => item.href),
    ["/admin", "/"],
  );
  assert.deepEqual(
    getAdminMobileNavigation().map((item) => item.label),
    ["Papan", "Portal"],
  );
});
