import assert from "node:assert/strict";
import test from "node:test";
import {
  formatKualaLumpurDate,
  parseManjungCsv,
  serializeManjungCsv,
  sourcedAtFromFilename,
  summarizeTebusBuku,
  TebusBukuCsvError,
} from "../../lib/tebus-buku/csv";

const SAMPLE = `PPD,Kod,Nama Sekolah,Nama,Email,Tingkatan,Tebus,Guna
PPD MANJUNG,aeb1033,"SMK, DINDINGS","LEE, HOONG",A@moe-dl.edu.my,T2,Sudah Tebus,Sudah Guna
PPD HULU PERAK,AEA7001,SMK X,ALI,b@moe-dl.edu.my,T3,Sudah Tebus,Belum Guna
PPD MANJUNG,AEB1033,SMK DINDINGS,LEE,a@moe-dl.edu.my,T1,Belum Tebus,Belum Guna
PPD manjung,AEB1034,SMK Y,SITI,c@moe-dl.edu.my,T4,Belum Tebus,Sudah Guna
`;

test("keeps PPD MANJUNG, first email, and quoted commas", () => {
  const rows = parseManjungCsv(SAMPLE);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].schoolCode, "AEB1033");
  assert.equal(rows[0].schoolName, "SMK, DINDINGS");
  assert.equal(rows[0].nama, "LEE, HOONG");
  assert.equal(rows[0].email, "a@moe-dl.edu.my");
  assert.equal(rows[0].tingkatan, "T2");
  assert.equal(rows[0].sudahTebus, true);
  assert.equal(rows[0].sudahGuna, true);
  assert.equal(rows[1].schoolCode, "AEB1034");
  assert.equal(rows[1].sudahTebus, false);
  assert.equal(rows[1].sudahGuna, true);
  assert.deepEqual(summarizeTebusBuku(rows), {
    pelajar: 2,
    sekolah: 2,
    sudahTebus: 1,
    sudahGuna: 2,
  });
});

test("round-trips the filtered CSV", () => {
  const rows = parseManjungCsv(SAMPLE);
  assert.deepEqual(parseManjungCsv(serializeManjungCsv(rows)), rows);
});

test("rejects an unexpected header", () => {
  assert.throws(() => parseManjungCsv("Nama,Email\nA,a@x\n"), TebusBukuCsvError);
});

test("reads snapshot dates from export filenames", () => {
  assert.equal(sourcedAtFromFilename("PPD_MANJUNG_26Ogos2026.csv"), "2026-08-26");
  assert.equal(sourcedAtFromFilename("7 Sept 2026.csv"), "2026-09-07");
  assert.equal(
    sourcedAtFromFilename("Murid_Butiran Tebus_Guna_Table (21092026).csv"),
    "2026-09-21",
  );
  assert.equal(
    sourcedAtFromFilename("Dashboard Operasi Bahagian_Butiran Tebus_Guna_Table (Murid).csv"),
    null,
  );
});

test("formats the Kuala Lumpur calendar date", () => {
  assert.equal(formatKualaLumpurDate(new Date("2026-09-27T16:30:00Z")), "2026-09-28");
  assert.equal(formatKualaLumpurDate(new Date("2026-09-27T15:00:00Z")), "2026-09-27");
});
