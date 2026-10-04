import assert from "node:assert/strict";
import test from "node:test";
import { namaPpd, parseCsv, ringkasCsvPpd } from "../../lib/analisis/delima-csv-parse";

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

test("ringkasCsvPpd menapis PPD dan menjumlahkan", () => {
  const r = ringkasCsvPpd(CSV, "PPD MANJUNG");
  assert.ok(r);
  assert.equal(r.sekolah.size, 2);
  assert.deepEqual(r.sekolah.get("ABC1068"), { aktif: 14, jumlah: 20, peratus: 70 });
  assert.deepEqual(r.sekolah.get("ABC1069"), { aktif: 1000, jumlah: 1250, peratus: 80 });
  assert.deepEqual(r.jumlah, { aktif: 1014, jumlah: 1270, peratus: 79.8 });
});

test("ringkasCsvPpd null jika PPD tiada atau lajur hilang", () => {
  assert.equal(ringkasCsvPpd(CSV, "PPD TIADA"), null);
  assert.equal(ringkasCsvPpd("a,b\n1,2\n", "PPD MANJUNG"), null);
});

test("namaPpd daripada slug daerah", () => {
  assert.equal(namaPpd("manjung"), "PPD MANJUNG");
  assert.equal(namaPpd("kuala-kangsar"), "PPD KUALA KANGSAR");
});
