import assert from "node:assert/strict";
import test from "node:test";
import { gabungSekolah, tahapDariPeratus, tertinggi } from "../../lib/analisis/delima-merge";

const pop = (aktif: number, jumlah: number) => ({
  aktif,
  jumlah,
  peratus: Math.round((aktif / jumlah) * 1000) / 10,
});

test("tahapDariPeratus: ambang 75 / 40", () => {
  assert.equal(tahapDariPeratus(75), "Tinggi");
  assert.equal(tahapDariPeratus(74.9), "Sederhana");
  assert.equal(tahapDariPeratus(40), "Sederhana");
  assert.equal(tahapDariPeratus(39.9), "Rendah");
});

test("tertinggi: ambil peratus lebih tinggi dan kira semula tahap", () => {
  const r = tertinggi({ ...pop(10, 20), tahap: "Tinggi" } as never, pop(18, 20));
  assert.equal(r?.peratus, 90);
  assert.equal(r?.tahap, "Tinggi");
  // 2.0 menang tetapi label lama sumber salah → tahap tetap dikira daripada peratus.
  const lama = tertinggi({ ...pop(10, 20), tahap: "Tinggi" } as never, pop(4, 20));
  assert.equal(lama?.peratus, 50);
  assert.equal(lama?.tahap, "Sederhana");
});

test("tertinggi: salah satu tiada", () => {
  assert.equal(tertinggi(null, null), null);
  assert.equal(tertinggi(null, pop(1, 10))?.tahap, "Rendah");
  assert.equal(tertinggi(pop(8, 10), undefined)?.tahap, "Tinggi");
});

test("gabungSekolah: buang 3.0 selepas digabung", () => {
  const r = gabungSekolah({
    kod: "ABC1",
    nama: "SK A",
    guru: { ...pop(5, 10), tahap: "Rendah" },
    murid: null,
    guru30: pop(9, 10),
    murid30: pop(3, 10),
  });
  assert.equal(r.guru?.peratus, 90);
  assert.equal(r.guru?.tahap, "Tinggi");
  assert.equal(r.murid?.tahap, "Rendah");
  assert.equal(r.guru30, undefined);
  assert.equal(r.murid30, undefined);
});
