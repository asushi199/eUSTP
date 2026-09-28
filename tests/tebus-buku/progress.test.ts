import assert from "node:assert/strict";
import test from "node:test";
import { percentLabel, splitTebusStatus } from "../../lib/tebus-buku/progress";

test("splits selesai, tebus belum guna, and belum tebus", () => {
  assert.deepEqual(
    splitTebusStatus({ total: 17498, tebusCount: 15729, gunaCount: 14852 }),
    { total: 17498, selesai: 14852, belumGuna: 877, belumTebus: 1769 },
  );
});

test("clamps guna to students who have redeemed", () => {
  assert.deepEqual(splitTebusStatus({ total: 10, tebusCount: 4, gunaCount: 9 }), {
    total: 10,
    selesai: 4,
    belumGuna: 0,
    belumTebus: 6,
  });
});

test("labels small non-zero shares as under one percent", () => {
  assert.equal(percentLabel(0, 100), "0%");
  assert.equal(percentLabel(1, 1000), "<1%");
  assert.equal(percentLabel(1324, 1332), "99%");
});
