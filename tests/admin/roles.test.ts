import assert from "node:assert/strict";
import test from "node:test";
import { canManageKandungan, canManageTempahan } from "../../lib/roles";

test("Admin and Pegawai share kandungan access; PKG_Admin does not", () => {
  assert.equal(canManageKandungan("Admin"), true);
  assert.equal(canManageKandungan("Pegawai"), true);
  assert.equal(canManageKandungan("PKG_Admin"), false);
});

test("tempahan is open to every staff role; PKG scope is pkgId", () => {
  assert.equal(canManageTempahan("Admin"), true);
  assert.equal(canManageTempahan("Pegawai"), true);
  assert.equal(canManageTempahan("PKG_Admin"), true);
  assert.equal(canManageTempahan(null), false);
});
