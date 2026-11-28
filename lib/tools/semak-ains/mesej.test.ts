import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JENIS_MESEJ, SUMBER, mesejAinsSah } from "./mesej";
import { VERSI_PENANDA_MIN } from "./versi";

const penanda = readFileSync(join(process.cwd(), "public", "tools", "semak-ains", "penanda.js"), "utf8");

test("penanda.js mengandungi semua jenis mesej dan pemalar asas", () => {
  for (const j of JENIS_MESEJ) assert.ok(penanda.includes(`"${j}"`), `jenis "${j}" tiada dalam penanda.js`);
  assert.ok(penanda.includes(`"${SUMBER}"`));
  assert.ok(penanda.includes("__NEXA_ORIGIN__"));
  assert.ok(penanda.includes('"ains.moe.gov.my"'));
  const v = Number(penanda.match(/VERSI_PENANDA\s*=\s*(\d+)/)?.[1]);
  assert.ok(v >= VERSI_PENANDA_MIN);
});

test("mesejAinsSah", () => {
  assert.equal(mesejAinsSah({ sumber: SUMBER, jenis: "rekod", rekod: [], halaman: 1, jumlahHalaman: 1 }), true);
  assert.equal(mesejAinsSah({ sumber: "lain", jenis: "rekod" }), false);
  assert.equal(mesejAinsSah({ sumber: SUMBER, jenis: "laksana" }), false);
  assert.equal(mesejAinsSah(null), false);
});
