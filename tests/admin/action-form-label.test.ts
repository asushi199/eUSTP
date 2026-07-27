import assert from "node:assert/strict";
import test from "node:test";
import {
  getActionFormSubmitLabel,
  runActionFormAction,
} from "../../lib/admin/action-form";

test("keeps the configured label before an action starts", () => {
  assert.equal(getActionFormSubmitLabel(false, "Simpan pegawai"), "Simpan pegawai");
});

test("shows a clear saving label while an action is pending", () => {
  assert.equal(getActionFormSubmitLabel(true, "Simpan pegawai"), "Menyimpan...");
});

test("returns a readable error when a server action rejects", async () => {
  const result = await runActionFormAction(
    async () => Promise.reject(new Error("database connection lost")),
    new FormData(),
  );

  assert.deepEqual(result, {
    ok: false,
    error: "Tindakan tidak dapat diselesaikan. Sila cuba semula.",
  });
});
