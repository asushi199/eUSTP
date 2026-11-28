import { test } from "node:test";
import assert from "node:assert/strict";
import { huraiKelas } from "./tahap";

test("huraiKelas: sekolah rendah", () => {
  assert.deepEqual(huraiKelas("TAHUN 1 1A"), { kod: "D1", jalur: "D1-2" });
  assert.deepEqual(huraiKelas("TAHUN 4 4D"), { kod: "D4", jalur: "D3-4" });
  assert.deepEqual(huraiKelas("Tahun 6 Bestari"), { kod: "D6", jalur: "D5-6" });
});

test("huraiKelas: menengah dan peralihan", () => {
  assert.deepEqual(huraiKelas("TINGKATAN 2 CEMERLANG"), { kod: "T2", jalur: "M" });
  assert.deepEqual(huraiKelas("PERALIHAN P1"), { kod: "P", jalur: "M" });
});

test("huraiKelas: tidak dikenali → D5-6", () => {
  assert.deepEqual(huraiKelas(""), { kod: "?", jalur: "D5-6" });
});
