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

test("keeps OSC beside Papan Admin for content administrators", () => {
  assert.deepEqual(getAdminDesktopNavigation(true), [
    { href: "/admin", label: "Papan Admin" },
    { href: "/admin/osc", label: "OSC" },
  ]);
});

test("highlights Papan Admin for CoE Reports, Resources and Analytics nested routes", () => {
  assert.equal(isAdminDesktopNavActive("/admin", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/booking", "/admin"), false);
  assert.equal(isAdminDesktopNavActive("/admin/pelaporan", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/laporan-akhbar/ABA1007", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/laporan-ustp/example/edit", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/resources/baharu", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/media", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/media/baharu", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/analisis", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/analisis", "/admin/osc"), false);
  assert.equal(isAdminDesktopNavActive("/admin/kandungan/baharu", "/admin/osc"), true);
});
