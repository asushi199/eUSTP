import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminDesktopNavigation,
  isAdminDesktopNavActive,
} from "../../lib/admin/desktop-navigation";

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

test("highlights desktop sections from their nested admin routes", () => {
  assert.equal(isAdminDesktopNavActive("/admin", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/booking", "/admin"), false);
  assert.equal(isAdminDesktopNavActive("/admin/kandungan/baharu", "/admin/osc"), true);
  assert.equal(isAdminDesktopNavActive("/admin/laporan-akhbar/ABA1007", "/admin/pelaporan"), true);
});
