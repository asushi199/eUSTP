import assert from "node:assert/strict";
import test from "node:test";
import { EQUIPMENT_ADMIN_SUBMIT_CLASS } from "../../lib/peralatan/admin-button-style";

test("gives every equipment admin action a deliberate button style", () => {
  assert.equal(EQUIPMENT_ADMIN_SUBMIT_CLASS.addUnit, "btn-primary w-full sm:w-auto");
  assert.equal(EQUIPMENT_ADMIN_SUBMIT_CLASS.importUnits, "btn-outline-ink w-full sm:w-auto");
  assert.equal(EQUIPMENT_ADMIN_SUBMIT_CLASS.updateStatus, "btn-outline-ink btn-sm shrink-0");
  assert.equal(EQUIPMENT_ADMIN_SUBMIT_CLASS.addType, "btn-primary w-full sm:w-auto");
  assert.equal(EQUIPMENT_ADMIN_SUBMIT_CLASS.saveManager, "btn-primary w-full sm:w-auto");
});
