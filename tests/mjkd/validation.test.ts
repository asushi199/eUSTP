import assert from "node:assert/strict";
import test from "node:test";
import { csvMaklumBalasMjkd } from "../../lib/mjkd/csv";
import {
  formatTarikhMs,
  hariIniKl,
  labelMesyuarat,
  maklumBalasTerbuka,
} from "../../lib/mjkd/enums";
import { namaKunci } from "../../lib/mjkd/nama-kunci";
import { isPautanHttp, sahkanMaklumBalas, urlFotoBukti } from "../../lib/mjkd/validation";

const terpakai = [
  { id: "p1", para: "1.3" },
  { id: "p2", para: "4.1.3 (iii)" },
];

const baik = (over: Record<string, unknown> = {}) => ({
  namaPengisi: "  Ali bin Abu ",
  jawatanPengisi: "Guru Besar",
  items: [
    { perkaraId: "p1", status: "SELESAI", catatan: "Apa: 5 guru memohon GC. Bila: Mac.", pautanBukti: "" },
    { perkaraId: "p2", status: "TIDAK_BERKAITAN", catatan: "", pautanBukti: "" },
  ],
  ...over,
});

test("penghantaran sah: nama di-trim, catatan tidak wajib bagi TIDAK_BERKAITAN", () => {
  const r = sahkanMaklumBalas(baik(), terpakai);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.namaPengisi, "Ali bin Abu");
    assert.equal(r.data.items.length, 2);
    assert.equal(r.data.items[1]!.catatan, "");
  }
});

test("nama dan jawatan pengisi wajib", () => {
  const a = sahkanMaklumBalas(baik({ namaPengisi: "   " }), terpakai);
  assert.equal(a.ok, false);
  const b = sahkanMaklumBalas(baik({ jawatanPengisi: "" }), terpakai);
  assert.equal(b.ok, false);
});

test("setiap perkara terpakai mesti ada status", () => {
  const r = sahkanMaklumBalas(baik({ items: [baik().items[0]] }), terpakai);
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /4\.1\.3 \(iii\)/);
});

test("status tidak sah ditolak", () => {
  const items = [baik().items[0], { perkaraId: "p2", status: "ENTAH", catatan: "x", pautanBukti: "" }];
  assert.equal(sahkanMaklumBalas(baik({ items }), terpakai).ok, false);
});

test("catatan min 30 aksara (5W1H) kecuali TIDAK_BERKAITAN", () => {
  for (const status of ["SELESAI", "DALAM_PELAKSANAAN", "BELUM"]) {
    const items = [
      { perkaraId: "p1", status, catatan: "pendek", pautanBukti: "" },
      baik().items[1],
    ];
    const r = sahkanMaklumBalas(baik({ items }), terpakai);
    assert.equal(r.ok, false, status);
  }
  const ok = sahkanMaklumBalas(
    baik({
      items: [{ perkaraId: "p1", status: "BELUM", catatan: "123456789012345678901234567890", pautanBukti: "" }, baik().items[1]],
    }),
    terpakai,
  );
  assert.equal(ok.ok, true);
});

test("catatan hanya ruang kosong dikira kosong", () => {
  const items = [
    { perkaraId: "p1", status: "SELESAI", catatan: "          ", pautanBukti: "" },
    baik().items[1],
  ];
  assert.equal(sahkanMaklumBalas(baik({ items }), terpakai).ok, false);
});

test("pautan bukti: pilihan, tetapi mesti http(s)", () => {
  const dengan = (pautanBukti: string) =>
    sahkanMaklumBalas(
      baik({
        items: [
          { perkaraId: "p1", status: "SELESAI", catatan: "Apa: 5 guru memohon GC. Bila: Mac.", pautanBukti },
          baik().items[1],
        ],
      }),
      terpakai,
    );
  assert.equal(dengan("").ok, true);
  assert.equal(dengan("https://drive.google.com/x").ok, true);
  assert.equal(dengan("http://contoh.my/a").ok, true);
  assert.equal(dengan("javascript:alert(1)").ok, false);
  assert.equal(dengan("ftp://contoh.my").ok, false);
  assert.equal(dengan("bukan url").ok, false);
  assert.equal(isPautanHttp("https://a.b"), true);
});

test("catatan 29 aksara ditolak", () => {
  const items = [
    { perkaraId: "p1", status: "SELESAI", catatan: "x".repeat(29), pautanBukti: "" },
    baik().items[1],
  ];
  assert.equal(sahkanMaklumBalas(baik({ items }), terpakai).ok, false);
});

test("gambar bukti: pilihan, maks 3, mesti path Drive", () => {
  const dengan = (fotoBukti: string[]) =>
    sahkanMaklumBalas(
      baik({
        items: [
          { perkaraId: "p1", status: "SELESAI", catatan: "Apa: 5 guru memohon GC. Bila: Mac.", pautanBukti: "", fotoBukti },
          baik().items[1],
        ],
      }),
      terpakai,
    );
  const f = (n: number) => `drive/1AbCdEfGhIjK${n}`;
  const r = dengan([f(1), f(2), f(1)]);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.data.items[0]!.fotoBukti, [f(1), f(2)]);
  assert.equal(dengan([f(1), f(2), f(3), f(4)]).ok, false);
  assert.equal(dengan(["https://evil.my/x.jpg"]).ok, false);
  assert.equal(dengan(["drive/../x"]).ok, false);
  const tanpa = sahkanMaklumBalas(baik(), terpakai);
  assert.ok(tanpa.ok && tanpa.data.items[0]!.fotoBukti.length === 0);
  assert.equal(urlFotoBukti(f(1), 400), `https://drive.google.com/thumbnail?id=1AbCdEfGhIjK1&sz=w400`);
});

test("perkara luar senarai atau berganda ditolak", () => {
  const luar = baik({
    items: [...baik().items, { perkaraId: "p9", status: "SELESAI", catatan: "Apa: 5 guru memohon GC. Bila: Mac.", pautanBukti: "" }],
  });
  assert.equal(sahkanMaklumBalas(luar, terpakai).ok, false);
  const ganda = baik({ items: [...baik().items, baik().items[0]] });
  assert.equal(sahkanMaklumBalas(ganda, terpakai).ok, false);
});

test("input bukan objek ditolak", () => {
  assert.equal(sahkanMaklumBalas(null, terpakai).ok, false);
  assert.equal(sahkanMaklumBalas({}, terpakai).ok, false);
});

test("namaKunci: huruf besar, trim, ruang berganda", () => {
  assert.equal(namaKunci("  Ali   bin  abu "), "ALI BIN ABU");
  assert.equal(namaKunci("ALI BIN ABU"), namaKunci("ali bin abu"));
  assert.equal(namaKunci("Ali\tbin\nAbu"), "ALI BIN ABU");
});

test("maklumBalasTerbuka: suis dan tarikh tutup (hari akhir masih dibenarkan)", () => {
  const sebelum = new Date("2026-03-10T03:00:00Z"); // 10 Mac, KL
  assert.equal(maklumBalasTerbuka({ maklumBalasDibuka: false, tarikhTutupMaklumBalas: null }, sebelum), false);
  assert.equal(maklumBalasTerbuka({ maklumBalasDibuka: true, tarikhTutupMaklumBalas: null }, sebelum), true);
  assert.equal(maklumBalasTerbuka({ maklumBalasDibuka: true, tarikhTutupMaklumBalas: "2026-03-10" }, sebelum), true);
  assert.equal(maklumBalasTerbuka({ maklumBalasDibuka: true, tarikhTutupMaklumBalas: "2026-03-09" }, sebelum), false);
  // 23:30 UTC = 07:30 keesokan hari di KL
  assert.equal(hariIniKl(new Date("2026-03-10T23:30:00Z")), "2026-03-11");
});

test("label dan format tarikh", () => {
  assert.equal(labelMesyuarat({ bil: 1, tahun: 2026 }), "Bil.1/2026");
  assert.equal(formatTarikhMs("2026-02-27"), "27 Februari 2026");
});

test("CSV: BOM, header, escape petikan dan halang formula", () => {
  const csv = csvMaklumBalasMjkd([
    {
      kodSekolah: "ABA1001",
      namaSekolah: 'SK "A", B',
      jenis: "SK",
      zon: "PKG Lumut",
      para: "1.3",
      mukaSurat: "10",
      perkara: "Perkara",
      status: "SELESAI",
      catatan: "=HYPERLINK(\"x\")",
      pautanBukti: "",
      namaPengisi: "+Ali",
      jawatanPengisi: "Guru Besar",
      tarikhHantar: "2026-03-01",
      dipilih: true,
      susunanBacaan: 2,
    },
  ]);
  assert.ok(csv.startsWith("﻿Kod sekolah,"));
  const baris = csv.split("\r\n");
  assert.equal(baris.length, 3);
  assert.ok(baris[1]!.includes('"SK ""A"", B"'));
  assert.ok(baris[1]!.includes("Selesai"));
  assert.ok(baris[1]!.includes("'=HYPERLINK"));
  assert.ok(baris[1]!.includes("'+Ali"));
  assert.ok(baris[1]!.endsWith(",Ya,2"));
});
