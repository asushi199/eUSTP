import assert from "node:assert/strict";
import test from "node:test";
import { hitungKemajuan, kiraStatus, kumpulMengikutZon } from "../../lib/mjkd/ringkasan";
import { labelSasaranPerkara, perkaraUntukSekolah } from "../../lib/mjkd/sasaran";

const sk = { code: "ABA1015", name: "SK SERI SELAMAT" };
const sjkc = { code: "ABC1046", name: "SJKC HWA LIAN 1 PANGKOR" };
const sjkt = { code: "ABD1075", name: "SJKT PANGKOR" };
const smk = { code: "AEA1110", name: "SMK AHMAD BOESTAMAM" };
const tras = { code: "AEE1032", name: "SMK RAJA SHAHRIMAN" };
const misteri = { code: "ZZZ0001", name: "Sekolah Misteri" };

const p = (id: string, sasaran: string, sekolahKhusus: string[] = [], aktif = true) => ({
  id,
  sasaran,
  sekolahKhusus,
  aktif,
});

const perkara = [
  p("semua", "SEMUA"),
  p("sr", "SR"),
  p("sm", "SM"),
  p("sjk", "SJK"),
  p("khusus", "SM", ["AEE1032", "ABA1015"]),
  p("tidak-aktif", "SEMUA", [], false),
];

const ids = (list: { id: string }[]) => list.map((x) => x.id);

test("SK: SEMUA + SR (bukan SM/SJK)", () => {
  assert.deepEqual(ids(perkaraUntukSekolah(perkara, sk)), ["semua", "sr", "khusus"]);
});

test("SJKC dan SJKT: SEMUA + SR + SJK", () => {
  assert.deepEqual(ids(perkaraUntukSekolah(perkara, sjkc)), ["semua", "sr", "sjk"]);
  assert.deepEqual(ids(perkaraUntukSekolah(perkara, sjkt)), ["semua", "sr", "sjk"]);
});

test("SMK: SEMUA + SM", () => {
  assert.deepEqual(ids(perkaraUntukSekolah(perkara, smk)), ["semua", "sm"]);
});

test("sekolah_khusus mengatasi sasaran (tidak mengira jenis)", () => {
  // `khusus` bersasaran SM tetapi senarai khusus menyertakan SK Seri Selamat.
  assert.ok(ids(perkaraUntukSekolah(perkara, sk)).includes("khusus"));
  assert.ok(ids(perkaraUntukSekolah(perkara, tras)).includes("khusus"));
  assert.ok(!ids(perkaraUntukSekolah(perkara, smk)).includes("khusus"));
});

test("sekolah jenis tidak dikenali hanya dapat SEMUA (+ khusus)", () => {
  assert.deepEqual(ids(perkaraUntukSekolah(perkara, misteri)), ["semua"]);
});

test("perkara tidak aktif tidak termasuk", () => {
  for (const s of [sk, sjkc, smk]) {
    assert.ok(!ids(perkaraUntukSekolah(perkara, s)).includes("tidak-aktif"));
  }
});

test("sasaran tidak sah tidak terpakai kepada sesiapa", () => {
  assert.deepEqual(perkaraUntukSekolah([p("x", "ENTAH")], sk), []);
});

test("labelSasaranPerkara", () => {
  assert.equal(labelSasaranPerkara({ sasaran: "SM", sekolahKhusus: [] }), "SM");
  const nama = new Map([["AEE1032", "SMK RAJA SHAHRIMAN"]]);
  assert.equal(
    labelSasaranPerkara({ sasaran: "SM", sekolahKhusus: ["AEE1032", "X1"] }, nama),
    "SMK RAJA SHAHRIMAN, X1",
  );
});

test("kumpulMengikutZon: isih ikut zon, zon kosong di hujung", () => {
  const out = kumpulMengikutZon([
    { code: "A", name: "B", zone: "PKG Lumut" },
    { code: "C", name: "A", zone: "PKG Lumut" },
    { code: "D", name: "Z", zone: "" },
    { code: "E", name: "Y", zone: "PKG Ayer Tawar" },
  ]);
  assert.deepEqual(
    out.map((g) => g.zon),
    ["PKG Ayer Tawar", "PKG Lumut", "Tiada zon"],
  );
  assert.deepEqual(
    out[1]!.sekolah.map((s) => s.name),
    ["A", "B"],
  );
});

test("hitungKemajuan: dijangka, dihantar dan belum hantar mengikut zon", () => {
  const sekolah = [
    { ...sk, zone: "PKG A" },
    { ...smk, zone: "PKG B" },
    { ...misteri, zone: "PKG B" },
  ];
  // Hanya perkara SM khusus dan SM: SK dan misteri tiada perkara -> tidak dijangka.
  const k = hitungKemajuan(sekolah, [p("sm", "SM")], new Set());
  assert.equal(k.dijangka, 1);
  assert.equal(k.dihantar, 0);
  assert.equal(k.belumMengikutZon.length, 1);
  const k2 = hitungKemajuan(sekolah, [p("sm", "SM")], new Set([smk.code]));
  assert.equal(k2.dihantar, 1);
  assert.equal(k2.belum.length, 0);
  const k3 = hitungKemajuan(sekolah, [p("semua", "SEMUA")], new Set([sk.code]));
  assert.equal(k3.dijangka, 3);
  assert.equal(k3.dihantar, 1);
});

test("kiraStatus", () => {
  const k = kiraStatus([
    { status: "SELESAI" },
    { status: "SELESAI" },
    { status: "BELUM" },
    { status: "entah" },
  ]);
  assert.equal(k.SELESAI, 2);
  assert.equal(k.BELUM, 1);
  assert.equal(k.DALAM_PELAKSANAAN, 0);
  assert.equal(k.jumlah, 3);
});
