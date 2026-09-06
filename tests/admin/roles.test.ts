import assert from "node:assert/strict";
import test from "node:test";
import { canManageKandungan, canUseNexaBot } from "../../lib/roles";

test("NexaBot accepts Admin, Pegawai, and PKG_Admin", () => {
  assert.equal(canUseNexaBot("Admin"), true);
  assert.equal(canUseNexaBot("Pegawai"), true);
  assert.equal(canUseNexaBot("PKG_Admin"), true);
  assert.equal(canUseNexaBot(null), false);
  assert.equal(canUseNexaBot(undefined), false);
});

test("kandungan admin stays limited to Admin and Pegawai", () => {
  assert.equal(canManageKandungan("Admin"), true);
  assert.equal(canManageKandungan("Pegawai"), true);
  assert.equal(canManageKandungan("PKG_Admin"), false);
});
