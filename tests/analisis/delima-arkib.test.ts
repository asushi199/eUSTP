import assert from "node:assert/strict";
import test from "node:test";
import { DELIMA_ARKIB_2025 } from "../../lib/analisis/delima-arkib-data";
import { DELIMA_ARKIB_TAHUN, isArkibTahun } from "../../lib/analisis/delima-arkib-meta";

test("arkib 2025: 101 sekolah, kod unik, peratus 0-100", () => {
  assert.equal(DELIMA_ARKIB_2025.length, 101);
  assert.equal(new Set(DELIMA_ARKIB_2025.map((r) => r.kod)).size, 101);
  for (const r of DELIMA_ARKIB_2025) {
    assert.match(r.kod, /^[A-Z0-9]{4,12}$/);
    assert.ok(r.nama.trim().length > 0, r.kod);
    for (const v of [r.guru, r.murid]) {
      if (v == null) continue;
      assert.ok(Number.isFinite(v) && v >= 0 && v <= 100, `${r.kod}: ${v}`);
    }
  }
});

test("arkib 2025: pengguna aktif <= jumlah ID dan jumlah padan kad PPD tolak KV (389)", () => {
  let aktif = 0;
  for (const r of DELIMA_ARKIB_2025) {
    assert.ok(r.pengguna, r.kod);
    assert.ok(
      r.pengguna.jumlah > 0 && r.pengguna.aktif >= 0 && r.pengguna.aktif <= r.pengguna.jumlah,
      r.kod,
    );
    aktif += r.pengguna.aktif;
  }
  // 29,673 (kad PPD) tolak Kolej Vokasional Seri Manjung (389) yang tidak disenaraikan.
  assert.equal(aktif, 29673 - 389);
});

test("isArkibTahun hanya benarkan tahun dalam arkib", () => {
  assert.ok(DELIMA_ARKIB_TAHUN.every((t) => isArkibTahun(t)));
  assert.equal(isArkibTahun(2025), true);
  assert.equal(isArkibTahun(2026), false);
  assert.equal(isArkibTahun(Number.NaN), false);
});
