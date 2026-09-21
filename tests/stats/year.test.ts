import assert from "node:assert/strict";
import test from "node:test";
import { clampStatsYear, fillMonths, parseStatsYear, yearRange } from "../../lib/stats/year";

test("parseStatsYear only accepts years in the list", () => {
  assert.equal(parseStatsYear("2025", [2025, 2026], 2026), 2025);
  assert.equal(parseStatsYear("2024", [2025, 2026], 2026), 2026);
  assert.equal(parseStatsYear("abc", [2026], 2026), 2026);
});

test("clampStatsYear keeps 2024..current", () => {
  assert.equal(clampStatsYear("2025", 2026), 2025);
  assert.equal(clampStatsYear("2023", 2026), 2026);
  assert.equal(clampStatsYear("2027", 2026), 2026);
});

test("yearRange never goes below 2024", () => {
  assert.deepEqual(yearRange(2020, 2026), [2024, 2025, 2026]);
  assert.deepEqual(yearRange(2026, 2026), [2026]);
});

test("fillMonths fills twelve points", () => {
  const points = fillMonths(new Map([[1, 4], [12, 2]]));
  assert.equal(points.length, 12);
  assert.equal(points[0]?.jumlah, 4);
  assert.equal(points[11]?.jumlah, 2);
  assert.equal(points[1]?.jumlah, 0);
});
