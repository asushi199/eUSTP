import assert from "node:assert/strict";
import test from "node:test";
import {
  ASPEK,
  ITEM_DIISI,
  itemPerluBaiki,
  kiraYa,
  semakLengkap,
  type Jawapan,
} from "../../lib/kunjung-bantu/instrumen";

const maklumat = { namaPgb: "Puan A", namaPkPentadbiran: "", namaAdminDelima: "Encik B" };

function semuaYa(): Jawapan {
  const j: Jawapan = {};
  for (const it of ITEM_DIISI) j[it.id] = { ya: true, catatan: "" };
  j["1.8"] = { ya: true, catatan: "https://sites.google.com/moe-dl.edu.my/sekolah" };
  return j;
}

test("item ids are unique even though JPN reuses 2.1", () => {
  const ids = ASPEK.flatMap((a) => a.items.map((i) => i.id));
  assert.equal(new Set(ids).size, ids.length);
  // Aspek 2 (auto) tidak diisi sekolah.
  assert.ok(!ITEM_DIISI.some((i) => i.id === "2.1"));
  assert.ok(ITEM_DIISI.some((i) => i.id === "1-2.1"));
});

test("semakLengkap requires names, every item and a link for 1.8", () => {
  assert.equal(semakLengkap(maklumat, semuaYa()), null);
  assert.match(semakLengkap({ ...maklumat, namaPgb: " " }, semuaYa()) ?? "", /Pengetua/);
  const tiada = semuaYa();
  delete tiada["3.2"];
  assert.match(semakLengkap(maklumat, tiada) ?? "", /3\.2/);
  const tanpaPautan = { ...semuaYa(), "1.8": { ya: true, catatan: "site sekolah" } };
  assert.match(semakLengkap(maklumat, tanpaPautan) ?? "", /1\.8/);
  const tidak18 = { ...semuaYa(), "1.8": { ya: false, catatan: "" } };
  assert.equal(semakLengkap(maklumat, tidak18), null);
});

test("kiraYa and itemPerluBaiki", () => {
  const j = semuaYa();
  j["5.4"] = { ya: false, catatan: "" };
  assert.deepEqual(kiraYa(j), { ya: ITEM_DIISI.length - 1, jumlah: ITEM_DIISI.length });
  assert.deepEqual(
    itemPerluBaiki({ "1.1": { status: "BAIKI", catatan: "" }, "1.2": { status: "SAH", catatan: "" } }),
    ["1.1"],
  );
});
