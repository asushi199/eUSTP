import assert from "node:assert/strict";
import test from "node:test";
import { getActionFormSubmitLabel } from "../../lib/admin/action-form";

test("keeps the configured label before an action starts", () => {
  assert.equal(getActionFormSubmitLabel(false, "Simpan pegawai"), "Simpan pegawai");
});

test("shows a clear saving label while an action is pending", () => {
  assert.equal(getActionFormSubmitLabel(true, "Simpan pegawai"), "Menyimpan...");
});
