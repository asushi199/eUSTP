import assert from "node:assert/strict";
import test from "node:test";
import {
  getAdminDesktopNavigation,
  isAdminDesktopNavActive,
} from "../../lib/admin/desktop-navigation";

test("uses Papan Admin as the single desktop entry", () => {
  assert.deepEqual(getAdminDesktopNavigation(false), [
    { href: "/admin", label: "Papan Admin" },
  ]);
  assert.deepEqual(getAdminDesktopNavigation(true), [
    { href: "/admin", label: "Papan Admin" },
  ]);
});

test("highlights Papan Admin for CoE Reports, Resources and Analytics nested routes", () => {
  assert.equal(isAdminDesktopNavActive("/admin", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/booking", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/pelaporan", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/laporan-akhbar/ABA1007", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/laporan-ustp/example/edit", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/minit-curai/baharu", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/resources/baharu", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/media", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/media/baharu", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/analisis", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/direktori/pegawai", "/admin"), true);
  assert.equal(isAdminDesktopNavActive("/admin/tetapan", "/admin"), false);
});
