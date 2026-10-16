import assert from "node:assert/strict";
import test from "node:test";
import { namaPpd, parseCsv } from "../../lib/analisis/delima-csv-parse";

const CSV = `NEGERI,PPD,NAMASEKOLAH,KODSEKOLAH,PENGGUNA AKTIF,TOTAL PENGGUNA,PERATUS
PERAK,PPD KRIAN,SK AIK HWA,ABC3058,7,7,100.00%
PERAK,PPD MANJUNG,"SJK (C) PEI MIN, SITIAWAN",ABC1068,14,20,70%
PERAK,PPD MANJUNG,SK LAIN,abc1069,"1,000",1250,80%
`;

test("parseCsv menyokong medan dalam petikan dengan koma", () => {
  const rows = parseCsv(CSV);
  assert.equal(rows.length, 4);
  assert.equal(rows[2][2], "SJK (C) PEI MIN, SITIAWAN");
});

test("namaPpd daripada slug daerah", () => {
  assert.equal(namaPpd("manjung"), "PPD MANJUNG");
  assert.equal(namaPpd("kuala-kangsar"), "PPD KUALA KANGSAR");
});
