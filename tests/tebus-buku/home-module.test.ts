import assert from "node:assert/strict";
import test from "node:test";
import { buildTebusBukuHomeModule } from "../../lib/tebus-buku/home-module";

test("builds meeting rows as count/total plus percent", () => {
  const mod = buildTebusBukuHomeModule({
    total: 17498,
    tebusCount: 15729,
    gunaCount: 14852,
    schoolCount: 17,
    sourcedAt: "2026-08-26",
  });
  assert.ok(mod);
  assert.equal(mod.headlineValue, "89.9%");
  assert.equal(mod.headlineLabel, "Sudah tebus");
  assert.deepEqual(
    mod.statRows?.map((row) => [row.title, row.value, row.unit]),
    [
      ["Sudah tebus", "15,729/17,498", "89.9%"],
      ["Sudah guna", "14,852/17,498", "84.9%"],
      ["Tebus, belum guna", "877/17,498", "5.0%"],
      ["Belum tebus", "1,769/17,498", "10.1%"],
    ],
  );
  assert.equal(mod.note, "Data setakat 26/8/2026.");
});

test("hides the card when there is no snapshot", () => {
  assert.equal(
    buildTebusBukuHomeModule({
      total: 0,
      tebusCount: 0,
      gunaCount: 0,
      schoolCount: 0,
      sourcedAt: null,
    }),
    null,
  );
});
