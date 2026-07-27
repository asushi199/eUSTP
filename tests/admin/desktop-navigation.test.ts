import assert from "node:assert/strict";
import test from "node:test";
import { getAdminDesktopNavigation } from "../../lib/admin/desktop-navigation";

test("uses Papan Admin as the single desktop entry for booking and equipment management", () => {
  assert.deepEqual(getAdminDesktopNavigation(false), [
    { href: "/admin", label: "Papan Admin" },
  ]);
});

test("keeps only the non-overlapping desktop sections for content administrators", () => {
  assert.deepEqual(getAdminDesktopNavigation(true), [
    { href: "/admin", label: "Papan Admin" },
    { href: "/admin/osc", label: "OSC" },
    { href: "/admin/pelaporan", label: "Pelaporan" },
  ]);
});
