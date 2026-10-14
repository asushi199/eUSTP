import assert from "node:assert/strict";
import test from "node:test";
import {
  cadanganSektor,
  idDriveDariPath,
  kumpulBahan,
  sahkanBahanInput,
  sahkanPautanBahan,
  sektorBolehBaca,
  terbitkanUrlEmbed,
  urlEmbedBahan,
  urlMuatTurunBahan,
} from "../../lib/mjkd/bahan";
import { janaKodMuatNaik, normalKodMuatNaik, semakKodMuatNaik } from "../../lib/mjkd/bahan-kod";
import {
  hariMesyuarat,
  huraiPilihanHari,
  labelBeberapaHari,
  labelHariPendek,
  lebihAwal,
  mesyuaratSebelumLalai,
  nilaiPilihanHari,
  pilihanTarikhPembentangan,
} from "../../lib/mjkd/hari";
import {
  hariLalaiKehadiran,
  kiraKehadiran,
  tafsirHariDipilih,
  tapisRekodHari,
} from "../../lib/mjkd/kehadiran";

/* ------------------------------------ hari ------------------------------------ */

test("hariMesyuarat: satu hari bila tamat kosong/sebelum mula/tidak sah", () => {
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-21", tarikhTamat: null }), ["2026-10-21"]);
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-21", tarikhTamat: "2026-10-21" }), ["2026-10-21"]);
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-21", tarikhTamat: "2026-10-20" }), ["2026-10-21"]);
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-21", tarikhTamat: "bukan" }), ["2026-10-21"]);
  assert.deepEqual(hariMesyuarat({ tarikh: "tidak sah", tarikhTamat: null }), []);
});

test("hariMesyuarat: dua hari, rentas bulan dan had 14 hari", () => {
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-21", tarikhTamat: "2026-10-22" }), [
    "2026-10-21",
    "2026-10-22",
  ]);
  assert.deepEqual(hariMesyuarat({ tarikh: "2026-10-31", tarikhTamat: "2026-11-02" }), [
    "2026-10-31",
    "2026-11-01",
    "2026-11-02",
  ]);
  assert.equal(hariMesyuarat({ tarikh: "2026-01-01", tarikhTamat: "2026-12-31" }).length, 14);
});

test("label hari: 21 Oktober, 21 & 22 Oktober, rentas bulan", () => {
  assert.equal(labelHariPendek("2026-10-21"), "21 Oktober");
  assert.equal(labelBeberapaHari(["2026-10-21", "2026-10-22"]), "21 & 22 Oktober");
  assert.equal(labelBeberapaHari(["2026-10-31", "2026-11-01"]), "31 Oktober & 1 November");
  assert.equal(labelBeberapaHari(["2026-10-21"]), "21 Oktober");
});

test("pilihan tarikh pembentangan: setiap hari + semua hari bila 2 atau lebih", () => {
  const dua = pilihanTarikhPembentangan(["2026-10-21", "2026-10-22"]);
  assert.deepEqual(
    dua.map((p) => p.label),
    ["21 Oktober", "22 Oktober", "21 & 22 Oktober"],
  );
  assert.deepEqual(dua[2]!.hari, ["2026-10-21", "2026-10-22"]);
  assert.deepEqual(
    pilihanTarikhPembentangan(["2026-10-21"]).map((p) => p.label),
    ["21 Oktober"],
  );
  assert.deepEqual(pilihanTarikhPembentangan([]), []);
});

test("huraiPilihanHari: hanya hari mesyuarat diterima", () => {
  const hari = ["2026-10-21", "2026-10-22"];
  assert.deepEqual(huraiPilihanHari(nilaiPilihanHari(hari), hari), hari);
  assert.deepEqual(huraiPilihanHari("2026-10-22", hari), ["2026-10-22"]);
  assert.deepEqual(huraiPilihanHari("2026-10-23", hari), []);
  assert.deepEqual(huraiPilihanHari("2026-10-21,2026-10-23", hari), []);
  assert.deepEqual(huraiPilihanHari("", hari), []);
});

test("mesyuaratSebelumLalai: terkini sebelum (tahun, bil)", () => {
  const senarai = [
    { id: "a", tahun: 2026, bil: 1 },
    { id: "b", tahun: 2025, bil: 3 },
    { id: "c", tahun: 2026, bil: 2 },
  ];
  assert.equal(mesyuaratSebelumLalai(senarai, { tahun: 2026, bil: 2 })?.id, "a");
  assert.equal(mesyuaratSebelumLalai(senarai, { tahun: 2026, bil: 3 })?.id, "c");
  assert.equal(mesyuaratSebelumLalai(senarai, { tahun: 2026, bil: 1 })?.id, "b");
  assert.equal(mesyuaratSebelumLalai(senarai, { tahun: 2025, bil: 1 }), null);
  assert.equal(mesyuaratSebelumLalai(senarai, { tahun: 2026, bil: 2, id: "c" })?.id, "a");
});

/* ------------------------------ kehadiran per hari ------------------------------ */

test("kehadiran per hari: tapis, hari lalai dan tafsiran parameter", () => {
  const rekod = [
    { jenis: "PGB", schoolCode: "A1", tarikh: "2026-10-21" },
    { jenis: "PGB", schoolCode: "B2", tarikh: "2026-10-22" },
    { jenis: "WAKIL", schoolCode: "A1", tarikh: "2026-10-22" },
    { jenis: "PEGAWAI", schoolCode: null, tarikh: "2026-10-22" },
  ];
  assert.equal(tapisRekodHari(rekod, "2026-10-21").length, 1);
  assert.equal(tapisRekodHari(rekod, "2026-10-22").length, 3);
  assert.equal(tapisRekodHari(rekod, null).length, 4);

  const hari1 = kiraKehadiran(tapisRekodHari(rekod, "2026-10-21"), ["A1", "B2", "C3"]);
  assert.equal(hari1.sekolahHadir, 1);
  const hari2 = kiraKehadiran(tapisRekodHari(rekod, "2026-10-22"), ["A1", "B2", "C3"]);
  assert.equal(hari2.sekolahHadir, 2); // A1 (WAKIL) + B2
  assert.equal(hari2.pegawai, 1);
  const semua = kiraKehadiran(tapisRekodHari(rekod, null), ["A1", "B2", "C3"]);
  assert.equal(semua.sekolahHadir, 2);

  const hari = ["2026-10-21", "2026-10-22"];
  assert.equal(hariLalaiKehadiran(hari, "2026-10-22"), "2026-10-22");
  assert.equal(hariLalaiKehadiran(hari, "2026-10-01"), null);
  assert.equal(tafsirHariDipilih("semua", hari, "2026-10-22"), null);
  assert.equal(tafsirHariDipilih("2026-10-21", hari, "2026-10-22"), "2026-10-21");
  assert.equal(tafsirHariDipilih("2026-12-01", hari, "2026-10-22"), "2026-10-22");
  assert.equal(tafsirHariDipilih(undefined, hari, "2026-10-01"), null);
});

/* ---------------------------------- URL bahan ---------------------------------- */

test("sahkanPautanBahan: https sahaja, mana-mana hos", () => {
  assert.equal(sahkanPautanBahan("https://www.canva.com/design/abc").ok, true);
  assert.equal(sahkanPautanBahan("  https://docs.google.com/x ").ok, true);
  assert.equal(sahkanPautanBahan("http://contoh.my").ok, false);
  assert.equal(sahkanPautanBahan("javascript:alert(1)").ok, false);
  assert.equal(sahkanPautanBahan("ftp://a.b").ok, false);
  assert.equal(sahkanPautanBahan("bukan url").ok, false);
  assert.equal(sahkanPautanBahan("").ok, false);
  assert.equal(sahkanPautanBahan("https://user:pass@contoh.my").ok, false);
  assert.equal(sahkanPautanBahan("https://a.my/" + "x".repeat(1100)).ok, false);
});

test("terbitkanUrlEmbed: Google Slides/Docs/Sheets/Drive", () => {
  const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz";
  assert.equal(
    terbitkanUrlEmbed(`https://docs.google.com/presentation/d/${id}/edit?usp=sharing`),
    `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false`,
  );
  assert.equal(
    terbitkanUrlEmbed(`https://docs.google.com/document/d/${id}/edit`),
    `https://docs.google.com/document/d/${id}/preview`,
  );
  assert.equal(
    terbitkanUrlEmbed(`https://docs.google.com/spreadsheets/d/${id}/edit#gid=0`),
    `https://docs.google.com/spreadsheets/d/${id}/preview`,
  );
  assert.equal(
    terbitkanUrlEmbed(`https://docs.google.com/presentation/d/e/2PACX-1vAbCdEfGh/pub?start=true`),
    "https://docs.google.com/presentation/d/e/2PACX-1vAbCdEfGh/embed?start=false&loop=false",
  );
  assert.equal(
    terbitkanUrlEmbed(`https://drive.google.com/file/d/${id}/view?usp=sharing`),
    `https://drive.google.com/file/d/${id}/preview`,
  );
  assert.equal(
    terbitkanUrlEmbed(`https://drive.google.com/open?id=${id}`),
    `https://drive.google.com/file/d/${id}/preview`,
  );
});

test("terbitkanUrlEmbed: hos lain, folder, http dan tiruan hos tidak dibenam", () => {
  assert.equal(terbitkanUrlEmbed("https://www.canva.com/design/DAF/view"), null);
  assert.equal(terbitkanUrlEmbed("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMn"), null);
  assert.equal(terbitkanUrlEmbed("http://docs.google.com/presentation/d/1AbCdEfGhIjKlMn/edit"), null);
  assert.equal(
    terbitkanUrlEmbed("https://docs.google.com.evil.my/presentation/d/1AbCdEfGhIjKlMn/edit"),
    null,
  );
  assert.equal(terbitkanUrlEmbed("https://docs.google.com/forms/d/1AbCdEfGhIjKlMn/edit"), null);
  assert.equal(terbitkanUrlEmbed("bukan url"), null);
});

test("PDF Drive: pratonton, muat turun dan id daripada storage_path", () => {
  assert.equal(idDriveDariPath("drive/ABC123_x-y"), "ABC123_x-y");
  assert.equal(idDriveDariPath("supabase/xyz"), null);
  assert.equal(idDriveDariPath("drive/a/b"), null);
  assert.equal(
    urlMuatTurunBahan({ jenis: "PDF", storagePath: "drive/ABC123" }),
    "https://drive.google.com/uc?export=download&id=ABC123",
  );
  assert.equal(urlMuatTurunBahan({ jenis: "PAUTAN", storagePath: "drive/ABC123" }), null);
  assert.equal(urlMuatTurunBahan({ jenis: "PDF", storagePath: "" }), null);
  assert.equal(
    urlEmbedBahan({ jenis: "PDF", url: "https://drive.google.com/file/d/ABCDEFGHIJK1/preview" }),
    "https://drive.google.com/file/d/ABCDEFGHIJK1/preview",
  );
  assert.equal(urlEmbedBahan({ jenis: "PAUTAN", url: "https://www.canva.com/x" }), null);
});

/* ------------------------------- sektor & kumpulan ------------------------------- */

test("sektorBolehBaca dan cadanganSektor", () => {
  assert.equal(sektorBolehBaca("PPD_PENTADBIRAN"), "PPD Pentadbiran");
  assert.equal(sektorBolehBaca("PENGURUSAN_SEKOLAH"), "Pengurusan Sekolah");
  assert.equal(sektorBolehBaca("  pembelajaran "), "Pembelajaran");
  assert.deepEqual(
    cadanganSektor(["Pembelajaran", "Perancangan"], ["PEMBELAJARAN", " Unit ICT "]),
    ["Pembelajaran", "Perancangan", "Unit ICT"],
  );
});

test("sahkanBahanInput: medan wajib dan hari mesti hari mesyuarat", () => {
  const hari = ["2026-10-21", "2026-10-22"];
  const ok = sahkanBahanInput(
    { sektorUnit: " Unit  ICT ", tajuk: "Laporan", namaPembentang: "Ali", hariNilai: "2026-10-21,2026-10-22" },
    hari,
  );
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.data.sektorUnit, "Unit ICT");
    assert.deepEqual(ok.data.hari, hari);
  }
  for (const rosak of [
    { sektorUnit: "", tajuk: "T", namaPembentang: "N", hariNilai: "2026-10-21" },
    { sektorUnit: "S", tajuk: " ", namaPembentang: "N", hariNilai: "2026-10-21" },
    { sektorUnit: "S", tajuk: "T", namaPembentang: "", hariNilai: "2026-10-21" },
    { sektorUnit: "S", tajuk: "T", namaPembentang: "N", hariNilai: "2026-10-25" },
    { sektorUnit: "S", tajuk: "T", namaPembentang: "N", hariNilai: "" },
  ]) {
    assert.equal(sahkanBahanInput(rosak, hari).ok, false);
  }
});

test("kumpulBahan: hari -> sektor; bahan dua hari muncul di kedua-duanya", () => {
  const b = (id: string, sektorUnit: string, hari: string[], t: string) => ({
    id,
    sektorUnit,
    hari,
    createdAt: t,
  });
  const k = kumpulBahan([
    b("1", "Unit ICT", ["2026-10-22"], "2026-10-02T00:00:00Z"),
    b("2", "unit ict", ["2026-10-21", "2026-10-22"], "2026-10-01T00:00:00Z"),
    b("3", "Pembelajaran", ["2026-10-21"], "2026-10-03T00:00:00Z"),
  ]);
  assert.deepEqual(
    k.map((x) => x.label),
    ["21 Oktober", "22 Oktober"],
  );
  assert.deepEqual(
    k[0]!.sektor.map((s) => s.sektorUnit),
    ["Pembelajaran", "unit ict"],
  );
  // sektor sama (tidak peka huruf) digabung; dalam sektor ikut masa dimuat naik
  assert.deepEqual(
    k[1]!.sektor[0]!.bahan.map((x) => x.id),
    ["2", "1"],
  );
});

/* ------------------------------- kod muat naik bahan ------------------------------- */

test("kod muat naik: jana format XXXX-XXXX tanpa aksara keliru", () => {
  for (let i = 0; i < 50; i += 1) {
    const kod = janaKodMuatNaik();
    assert.match(kod, /^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
  }
  assert.notEqual(janaKodMuatNaik(), janaKodMuatNaik());
});

test("semakKodMuatNaik: normalisasi, salah, kosong dan panjang berbeza", () => {
  assert.equal(normalKodMuatNaik(" ab-cd 12 "), "ABCD12");
  assert.equal(semakKodMuatNaik("abcd-2345", "ABCD-2345"), true);
  assert.equal(semakKodMuatNaik("ABCD2345", "ABCD-2345"), true);
  assert.equal(semakKodMuatNaik("ABCD-2346", "ABCD-2345"), false);
  assert.equal(semakKodMuatNaik("ABCD", "ABCD-2345"), false);
  assert.equal(semakKodMuatNaik("ABCD-2345-EXTRA", "ABCD-2345"), false);
  assert.equal(semakKodMuatNaik("", ""), false); // kod dijangka kosong ditolak
  assert.equal(semakKodMuatNaik("apa-apa", ""), false);
  assert.equal(semakKodMuatNaik("", "ABCD-2345"), false);
});

test("lebihAwal: ikut tahun, kemudian Bil.; diri sendiri dan mesyuarat kemudian ditolak", () => {
  assert.equal(lebihAwal({ tahun: 2026, bil: 1 }, { tahun: 2026, bil: 2 }), true);
  assert.equal(lebihAwal({ tahun: 2025, bil: 3 }, { tahun: 2026, bil: 1 }), true);
  assert.equal(lebihAwal({ tahun: 2026, bil: 2 }, { tahun: 2026, bil: 1 }), false);
  assert.equal(lebihAwal({ tahun: 2026, bil: 2 }, { tahun: 2026, bil: 2 }), false);
  assert.equal(lebihAwal({ tahun: 2027, bil: 1 }, { tahun: 2026, bil: 4 }), false);
});
