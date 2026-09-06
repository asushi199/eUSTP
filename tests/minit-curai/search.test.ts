import assert from "node:assert/strict";
import test from "node:test";
import { filterMinitCurai, type MinitCuraiListItem } from "../../lib/minit-curai/search";

function report(partial: Partial<MinitCuraiListItem> & Pick<MinitCuraiListItem, "id" | "tajuk">): MinitCuraiListItem {
  return {
    meetingDate: "2026-09-06",
    reporterName: "Ahmad",
    unitSektor: "USTP PPD Manjung",
    anjuran: "JPN Perak",
    tempat: "Dewan JPN",
    ...partial,
  };
}

test("matches tajuk, pelapor, unit and anjuran tokens", () => {
  const rows = [
    report({ id: "1", tajuk: "Taklimat DPD", reporterName: "Ahmad", unitSektor: "PKG Sitiawan" }),
    report({ id: "2", tajuk: "Bengkel Studio", reporterName: "Fatimah", anjuran: "BPK", tempat: "Studio Digital" }),
  ];
  assert.equal(filterMinitCurai(rows, "dpd").map((item) => item.id).join(), "1");
  assert.equal(filterMinitCurai(rows, "fatimah").map((item) => item.id).join(), "2");
  assert.equal(filterMinitCurai(rows, "sitiawan").map((item) => item.id).join(), "1");
  assert.equal(filterMinitCurai(rows, "studio").map((item) => item.id).join(), "2");
});

test("requires every token and ignores punctuation", () => {
  const rows = [report({ id: "1", tajuk: "Taklimat DPD — Manjung", unitSektor: "USTP PPD Manjung" })];
  assert.equal(filterMinitCurai(rows, "taklimat manjung").length, 1);
  assert.equal(filterMinitCurai(rows, "taklimat beruas").length, 0);
  assert.deepEqual(filterMinitCurai(rows, "  "), rows);
});
