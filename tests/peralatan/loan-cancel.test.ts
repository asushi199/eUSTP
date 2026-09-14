import assert from "node:assert/strict";
import test from "node:test";
import { canCancelEquipmentLoan } from "../../lib/peralatan/status";
import type { EquipmentLoanStatus } from "../../lib/peralatan/types";

const cancellable: EquipmentLoanStatus[] = ["pending", "approved"];
const locked: EquipmentLoanStatus[] = [
  "rejected",
  "cancelled",
  "handed_over",
  "returned",
];

test("allows cancellation until equipment is handed over", () => {
  for (const status of cancellable) {
    assert.equal(canCancelEquipmentLoan(status), true, status);
  }
});

test("locks the request after handover, return, reject or a previous cancel", () => {
  for (const status of locked) {
    assert.equal(canCancelEquipmentLoan(status), false, status);
  }
});
