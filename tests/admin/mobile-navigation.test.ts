import assert from "node:assert/strict";
import test from "node:test";
import { getAdminMobileNavigation } from "../../lib/admin/mobile-navigation";

test("uses CoE entries instead of a duplicate Papan tab for content administrators", () => {
  assert.deepEqual(
    getAdminMobileNavigation(true).map((item) => item.href),
    ["/admin/booking", "/admin/direktori", "/admin/osc", "/admin", "/"],
  );
});

test("keeps the reduced mobile navigation for PKG administrators", () => {
  assert.deepEqual(
    getAdminMobileNavigation(false).map((item) => item.href),
    ["/admin/booking", "/"],
  );
});
