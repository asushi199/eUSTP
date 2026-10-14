import assert from "node:assert/strict";
import test from "node:test";
import { julatTarikh } from "../../lib/mjkd/acara";

test("julatTarikh: satu hari, bulan sama, bulan berbeza", () => {
  assert.equal(julatTarikh("2026-10-21", null), "21 Oktober 2026");
  assert.equal(julatTarikh("2026-10-21", "2026-10-22"), "21–22 Oktober 2026");
  assert.equal(julatTarikh("2026-10-31", "2026-11-01"), "31 Oktober – 1 November 2026");
  assert.equal(julatTarikh("2026-10-21", "2026-10-21"), "21 Oktober 2026");
});
