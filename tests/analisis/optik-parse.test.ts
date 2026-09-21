import assert from "node:assert/strict";
import test from "node:test";
import {
  chartLabelFromDate,
  normalizePlcStatus,
  parseOptikCsvText,
  parseSchoolField,
  plcStatusFromPct,
  serializeOptikSchoolsCsv,
} from "../../lib/analisis/optik-parse";

const SCHOOL_CSV = `Sekolah,✓,∑,% AI,☑ PLC
AEE1026-SEKOLAH MENENGAH KEBANGSAAN METHODIST (ACS),112,118,94.91525423728814,Selesai
AEB1031-SEKOLAH MENENGAH KEBANGSAAN NAN HWA,73,128,57.03125,Belum
AEE1036-SEKOLAH MENENGAH KEBANGSAAN AMBROSE,76,95,80,Selesai
`;

const TEACHER_CSV = `PPD,Sekolah,Nama,Email DELIMA,Status PLC AI
PPD MANJUNG,ABA1001-SEKOLAH KEBANGSAAN DENDANG,ALI,a@moe-dl.edu.my,Selesai
PPD MANJUNG,ABA1001-SEKOLAH KEBANGSAAN DENDANG,SITI,b@moe-dl.edu.my,Belum Selesai
PPD MANJUNG,ABA1002-SEKOLAH KEBANGSAAN BERUAS,AHMAD,c@moe-dl.edu.my,Selesai
PPD MANJUNG,ABA1002-SEKOLAH KEBANGSAAN BERUAS,MINAH,d@moe-dl.edu.my,Selesai
PPD MANJUNG,ABA1002-SEKOLAH KEBANGSAAN BERUAS,KAMAL,e@moe-dl.edu.my,Selesai
PPD MANJUNG,ABA1002-SEKOLAH KEBANGSAAN BERUAS,NORA,f@moe-dl.edu.my,Selesai
PPD MANJUNG,ABA1002-SEKOLAH KEBANGSAAN BERUAS,FAIZ,g@moe-dl.edu.my,Selesai
`;

test("parses paparan daerah CSV and keeps PLC from the file", () => {
  const result = parseOptikCsvText(SCHOOL_CSV);
  assert.equal(result.format, "school_table");
  assert.equal(result.schools.length, 3);
  assert.equal(result.selesaiBil, 261);
  assert.equal(result.totalBil, 341);
  assert.equal(result.sekolahSelesai, 2);
  assert.equal(result.sekolahBelum, 1);
  const nanHwa = result.schools.find((row) => row.schoolCode === "AEB1031");
  assert.equal(nanHwa?.plcStatus, "Belum");
  const ambrose = result.schools.find((row) => row.schoolCode === "AEE1036");
  assert.equal(ambrose?.plcStatus, "Selesai");
  assert.equal(ambrose?.pctAi, 80);
});

test("aggregates teacher lists and derives school PLC at 80%", () => {
  const result = parseOptikCsvText(TEACHER_CSV);
  assert.equal(result.format, "teacher_list");
  assert.equal(result.schools.length, 2);
  const dendang = result.schools.find((row) => row.schoolCode === "ABA1001");
  assert.equal(dendang?.selesaiBil, 1);
  assert.equal(dendang?.totalBil, 2);
  assert.equal(dendang?.plcStatus, "Belum");
  const beruas = result.schools.find((row) => row.schoolCode === "ABA1002");
  assert.equal(beruas?.selesaiBil, 5);
  assert.equal(beruas?.totalBil, 5);
  assert.equal(beruas?.plcStatus, "Selesai");
  assert.equal(result.selesaiBil, 6);
  assert.equal(result.totalBil, 7);
});

test("keeps teacher names and status from a guru CSV", () => {
  const result = parseOptikCsvText(TEACHER_CSV);
  assert.equal(result.teachers.length, 7);
  const dendang = result.teachers.filter((row) => row.schoolCode === "ABA1001");
  assert.equal(dendang.length, 2);
  assert.equal(dendang.some((row) => row.name === "SITI" && row.plcStatus === "Belum"), true);
});

test("round-trips school rows to Looker-style CSV", () => {
  const parsed = parseOptikCsvText(SCHOOL_CSV);
  const again = parseOptikCsvText(serializeOptikSchoolsCsv(parsed.schools));
  assert.equal(again.schools.length, parsed.schools.length);
  assert.equal(again.selesaiBil, parsed.selesaiBil);
  assert.equal(again.teachers.length, 0);
});

test("parses school codes and Malay chart labels", () => {
  assert.deepEqual(parseSchoolField("ABA1031-SEKOLAH KEBANGSAAN PANGKALAN TLDM II"), {
    code: "ABA1031",
    name: "SEKOLAH KEBANGSAAN PANGKALAN TLDM II",
  });
  assert.equal(chartLabelFromDate("2026-04-20"), "Apr 2026");
  assert.equal(chartLabelFromDate("2026-09-21"), "Sep 2026");
  assert.equal(normalizePlcStatus("Belum Selesai"), "Belum");
  assert.equal(plcStatusFromPct(80), "Selesai");
  assert.equal(plcStatusFromPct(79.99), "Belum");
});
