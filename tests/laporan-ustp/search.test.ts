import assert from "node:assert/strict";
import test from "node:test";
import { filterUstpReports, type UstpReportListItem } from "../../lib/laporan-ustp/search";

function report(partial: Partial<UstpReportListItem> & Pick<UstpReportListItem, "id" | "programName">): UstpReportListItem {
  return {
    pkgCode: "AQA1001",
    startDate: "2026-09-05",
    endDate: "2026-09-06",
    preparedBy: "Pegawai USTP",
    location: "PKG Sitiawan",
    organiser: "USTP Manjung",
    cluster: "PROGRAM PEMBELAJARAN PELANTAR DELIMA",
    ...partial,
  };
}

test("matches program name, PKG label and prepared-by tokens", () => {
  const rows = [
    report({
      id: "1",
      programName: "Bengkel AI STEM",
      pkgCode: "AQA1001",
      preparedBy: "Ahmad",
      location: "Dewan Utama",
      organiser: "Jawatankuasa Program",
    }),
    report({
      id: "2",
      programName: "Studio Digital",
      pkgCode: "AQA1005",
      preparedBy: "Fatimah",
      location: "Studio",
      organiser: "Unit Media",
    }),
  ];
  assert.equal(filterUstpReports(rows, "stem").map((r) => r.id).join(), "1");
  assert.equal(filterUstpReports(rows, "seri manjung").map((r) => r.id).join(), "2");
  assert.equal(filterUstpReports(rows, "fatimah").map((r) => r.id).join(), "2");
  assert.equal(filterUstpReports(rows, "aqa1001").map((r) => r.id).join(), "1");
});

test("requires every token and ignores punctuation", () => {
  const rows = [report({ id: "1", programName: "Bengkel AI — STEM", location: "PKG Sitiawan" })];
  assert.equal(filterUstpReports(rows, "bengkel sitiawan").length, 1);
  assert.equal(filterUstpReports(rows, "bengkel beruas").length, 0);
  assert.deepEqual(filterUstpReports(rows, "  "), rows);
});
