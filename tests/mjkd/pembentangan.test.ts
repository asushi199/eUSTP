import assert from "node:assert/strict";
import test from "node:test";
import {
  MESEJ_BAHAN,
  binaAnalisis,
  binaSlaidBahan,
  binaSlaidKehadiran,
  binaSlaidMaklumBalas,
  binaSlaidMinit,
  binaSlaidPembentangan,
  ringkasTeks,
  type BahanPembentangan,
  type ItemPembentangan,
  type PerkaraPembentangan,
} from "../../lib/mjkd/pembentangan";

const mesyuarat = {
  bil: 1,
  tahun: 2026,
  tarikh: "2026-02-27",
  tempat: "Park Avenue Hotel",
  minitUrl: "https://contoh.my/minit.pdf",
};

const perkara = (id: string, para: string, sort: number, over: Partial<PerkaraPembentangan> = {}) => ({
  id,
  para,
  mukaSurat: "10",
  perkara: `Perkara ${para}`,
  tindakan: "Pengetua dan Guru Besar",
  sasaran: "SEMUA",
  sekolahKhusus: [],
  aktif: true,
  sort,
  ...over,
});

const semuaPerkara = [
  perkara("p2", "1.4", 2),
  perkara("p1", "1.3", 1),
  perkara("p3", "3.3", 3, { sasaran: "SM" }),
  perkara("p4", "9.9", 4, { aktif: false }),
];

const sekolah = [
  { code: "ABA1001", name: "SK DENDANG" },
  { code: "ABA1002", name: "SK BERUAS" },
  { code: "ABC1046", name: "SJKC HWA LIAN 1 PANGKOR" },
  { code: "AEA1110", name: "SMK AHMAD BOESTAMAM" },
];
const maklumBalas = [
  { id: "m1", schoolCode: "ABA1001" },
  { id: "m2", schoolCode: "ABA1002" },
  { id: "m3", schoolCode: "ABC1046" },
  { id: "m4", schoolCode: "AEA1110" },
];

const item = (
  maklumBalasId: string,
  perkaraId: string,
  status: string,
  over: Partial<ItemPembentangan> = {},
): ItemPembentangan => ({
  maklumBalasId,
  perkaraId,
  status,
  catatan: `Catatan ${maklumBalasId}`,
  pautanBukti: "",
  dipilih: false,
  susunanBacaan: null,
  ...over,
});

test("Minit: slaid 1 = tajuk, kemudian perkara aktif ikut susunan", () => {
  const s = binaSlaidMinit(mesyuarat, semuaPerkara);
  assert.equal(s.length, 4); // tajuk + 3 aktif
  const tajuk = s[0]!;
  assert.equal(tajuk.jenis, "tajuk");
  if (tajuk.jenis === "tajuk") {
    assert.equal(tajuk.nama, "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung");
    assert.equal(tajuk.bilTahun, "Bil. 1 Tahun 2026");
    assert.equal(tajuk.tarikh, "27 Februari 2026");
    assert.equal(tajuk.minitUrl, "https://contoh.my/minit.pdf");
  }
  assert.deepEqual(
    s.slice(1).map((x) => (x.jenis === "perkara" ? x.para : "?")),
    ["1.3", "1.4", "3.3"],
  );
});

test("Minit: URL muat turun menambah ?download=", () => {
  const s = binaSlaidMinit(mesyuarat, []);
  assert.equal(
    s[0]!.jenis === "tajuk" && s[0]!.muatTurunUrl,
    "https://contoh.my/minit.pdf?download=Minit-MJKD-Bil1-2026.pdf",
  );
  const tanpa = binaSlaidMinit({ ...mesyuarat, minitUrl: "" }, []);
  assert.equal(tanpa[0]!.jenis === "tajuk" && tanpa[0]!.muatTurunUrl, "");
});

test("Minit: tanpa minit_url, tajuk tetap ada (url kosong)", () => {
  const s = binaSlaidMinit({ ...mesyuarat, minitUrl: "" }, []);
  assert.equal(s.length, 1);
  assert.equal(s[0]!.jenis === "tajuk" && s[0]!.minitUrl, "");
});

test("Minit: tajuk menyatakan mesyuarat pemilik minit", () => {
  const s = binaSlaidMinit(mesyuarat, []);
  assert.equal(s[0]!.jenis === "tajuk" && s[0]!.pengesahan, "Pengesahan Minit MJKD Bil.1/2026");
});

test("Maklum Balas: analisis dahulu; tiada jawapan = slaid kosong selepasnya", () => {
  const s = binaSlaidMaklumBalas({ perkara: semuaPerkara, sekolah, maklumBalas, items: [] });
  assert.deepEqual(
    s.map((x) => x.jenis),
    ["analisis", "kosong"],
  );
  const a = s[0]!;
  assert.equal(a.jenis === "analisis" && a.adaPilihan, false);
});

test("Analisis: baris bagi setiap perkara aktif, kiraan hanya sekolah terpakai", () => {
  const items = [
    item("m1", "p1", "SELESAI"),
    item("m2", "p1", "SELESAI"),
    item("m3", "p1", "BELUM"),
    item("m4", "p3", "SELESAI"),
    item("m3", "p3", "BELUM"), // SJKC menjawab perkara SM -> tidak dikira
  ];
  const a = binaAnalisis({ perkara: semuaPerkara, sekolah, maklumBalas, items });
  assert.deepEqual(
    a.baris.map((b) => b.para),
    ["1.3", "1.4", "3.3"], // p4 tidak aktif
  );
  const [b1, b2, b3] = a.baris;
  assert.equal(b1!.dihantar, 3);
  assert.equal(b1!.dijangka, 4);
  assert.equal(b1!.bilangan.SELESAI, 2);
  assert.equal(b1!.bilangan.BELUM, 1);
  assert.equal(b2!.dihantar, 0);
  assert.equal(b3!.dijangka, 1);
  assert.equal(b3!.dihantar, 1);
  assert.equal(b3!.bilangan.BELUM, 0);
  assert.equal(a.sekolahDihantar, 4);
  assert.equal(a.sekolahJumlah, 4);
});

test("Analisis: sekolah belum menghantar dikira dalam jumlah", () => {
  const a = binaAnalisis({
    perkara: semuaPerkara,
    sekolah,
    maklumBalas: maklumBalas.slice(0, 2),
    items: [item("m1", "p1", "SELESAI")],
  });
  assert.equal(a.sekolahDihantar, 2);
  assert.equal(a.sekolahJumlah, 4);
});

test("Maklum Balas: grid bagi SETIAP perkara berjawapan; jawapan dipilih ikut susunan selepas grid", () => {
  const items = [
    item("m1", "p1", "SELESAI", { dipilih: true, susunanBacaan: 2 }),
    item("m2", "p1", "DALAM_PELAKSANAAN", { dipilih: true, susunanBacaan: 1 }),
    item("m3", "p1", "BELUM"),
    item("m4", "p1", "TIDAK_BERKAITAN"),
    item("m1", "p2", "SELESAI"), // p2 tiada pilihan: grid sahaja
    item("m4", "p3", "SELESAI", { dipilih: true, susunanBacaan: null }),
    item("m3", "p3", "BELUM", { dipilih: true, susunanBacaan: null }), // seri: ikut kod sekolah
  ];
  const s = binaSlaidMaklumBalas({ perkara: semuaPerkara, sekolah, maklumBalas, items });

  assert.deepEqual(
    s.map((x) => x.jenis),
    ["analisis", "grid", "jawapan", "jawapan", "grid", "grid", "jawapan", "jawapan"],
  );
  assert.equal(s[0]!.jenis === "analisis" && s[0]!.adaPilihan, true);

  const g1 = s[1]!;
  assert.equal(g1.jenis === "grid" && g1.para, "1.3");
  if (g1.jenis === "grid") {
    assert.equal(g1.dihantar, 4);
    assert.equal(g1.dijangka, 4);
    assert.equal(g1.bilDipilih, 2);
    assert.equal(g1.chips.length, 4);
    // cip diisih ikut nama sekolah
    assert.deepEqual(
      g1.chips.map((c) => c.nama),
      ["SJKC HWA LIAN 1 PANGKOR", "SK BERUAS", "SK DENDANG", "SMK AHMAD BOESTAMAM"],
    );
    const beruas = g1.chips.find((c) => c.kod === "ABA1002")!;
    assert.equal(beruas.dipilih, true);
    assert.equal(beruas.status, "DALAM_PELAKSANAAN");
    assert.equal(beruas.catatan, "Catatan m2");
  }
  const j1 = s[2]!;
  const j2 = s[3]!;
  assert.equal(j1.jenis === "jawapan" && j1.kodSekolah, "ABA1002"); // susunan 1
  assert.equal(j2.jenis === "jawapan" && j2.kodSekolah, "ABA1001"); // susunan 2
  if (j1.jenis === "jawapan") {
    assert.equal(j1.namaSekolah, "SK BERUAS");
    assert.equal(j1.nombor, 1);
    assert.equal(j1.daripada, 2);
  }

  const g2 = s[4]!;
  assert.equal(g2.jenis === "grid" && g2.para, "1.4");
  assert.equal(g2.jenis === "grid" && g2.bilDipilih, 0);

  const g3 = s[5]!;
  if (g3.jenis === "grid") {
    assert.equal(g3.para, "3.3");
    assert.equal(g3.dijangka, 1);
    assert.equal(g3.dihantar, 1); // jawapan SJKC bagi perkara SM tidak dikira
    assert.equal(g3.chips.length, 2); // tetapi tetap muncul sebagai cip
  }
  assert.equal(s[6]!.jenis === "jawapan" && s[6]!.kodSekolah, "ABC1046");
  assert.equal(s[7]!.jenis === "jawapan" && s[7]!.kodSekolah, "AEA1110");
});

test("Maklum Balas: pautan bukti dikekalkan sebagai teks; jawapan tanpa maklum balas dilangkau", () => {
  const items = [
    item("m1", "p1", "SELESAI", { dipilih: true, susunanBacaan: 1, pautanBukti: "https://x.my/a" }),
    item("tiada", "p1", "SELESAI", { dipilih: true, susunanBacaan: 2 }),
  ];
  const s = binaSlaidMaklumBalas({ perkara: semuaPerkara, sekolah, maklumBalas, items });
  assert.deepEqual(
    s.map((x) => x.jenis),
    ["analisis", "grid", "jawapan"],
  );
  const j = s[2]!;
  assert.equal(j.jenis === "jawapan" && j.pautanBukti, "https://x.my/a");
});

const bahan = (
  id: string,
  sektorUnit: string,
  hari: string[],
  over: Partial<BahanPembentangan> = {},
): BahanPembentangan => ({
  id,
  sektorUnit,
  tajuk: "Tajuk " + id,
  namaPembentang: "En. Ali",
  hari,
  jenis: "PAUTAN",
  url: "https://docs.google.com/presentation/d/abcdefghij1234567/edit",
  storagePath: "",
  createdAt: "2026-10-0" + id + "T08:00:00Z",
  ...over,
});

test("Bahan: tiada bahan = slaid kosong", () => {
  const s = binaSlaidBahan([]);
  assert.equal(s.length, 1);
  assert.equal(s[0]!.jenis === "kosong" && s[0]!.mesej, MESEJ_BAHAN);
});

test("Bahan: indeks ikut hari -> sektor, kemudian satu slaid setiap bahan unik", () => {
  const s = binaSlaidBahan([
    bahan("1", "Pembelajaran", ["2026-10-22"]),
    bahan("2", "Perancangan", ["2026-10-21", "2026-10-22"], {
      jenis: "PDF",
      url: "https://drive.google.com/file/d/FILEID12345abc/preview",
      storagePath: "drive/FILEID12345abc",
    }),
    bahan("3", "Pembelajaran", ["2026-10-21"], { url: "https://www.canva.com/design/x" }),
  ]);
  assert.equal(s[0]!.jenis, "bahan-indeks");
  const indeks = s[0]!;
  if (indeks.jenis === "bahan-indeks") {
    assert.deepEqual(
      indeks.kumpulan.map((k) => k.label),
      ["21 Oktober", "22 Oktober"],
    );
    assert.deepEqual(
      indeks.kumpulan[0]!.sektor.map((x) => x.sektorUnit),
      ["Pembelajaran", "Perancangan"],
    );
    // bahan 2 muncul dalam kedua-dua hari tetapi menunjuk ke slaid yang sama
    const id2 = indeks.kumpulan
      .flatMap((k) => k.sektor.flatMap((x) => x.bahan))
      .filter((b) => b.id === "2");
    assert.equal(id2.length, 2);
    assert.equal(id2[0]!.slaid, id2[1]!.slaid);
  }
  // 3 bahan unik + indeks
  assert.equal(s.length, 4);
  const item3 = s.find((x) => x.jenis === "bahan" && x.id === "3");
  assert.ok(item3 && item3.jenis === "bahan");
  if (item3 && item3.jenis === "bahan") {
    assert.equal(item3.embedUrl, null); // Canva: tab baharu
    assert.equal(item3.muatTurunUrl, null);
  }
  const item2 = s.find((x) => x.jenis === "bahan" && x.id === "2");
  if (item2 && item2.jenis === "bahan") {
    assert.equal(item2.hariLabel, "21 & 22 Oktober");
    assert.equal(item2.embedUrl, "https://drive.google.com/file/d/FILEID12345abc/preview");
    assert.equal(
      item2.muatTurunUrl,
      "https://drive.google.com/uc?export=download&id=FILEID12345abc",
    );
  }
  const item1 = s.find((x) => x.jenis === "bahan" && x.id === "1");
  if (item1 && item1.jenis === "bahan") {
    assert.equal(
      item1.embedUrl,
      "https://docs.google.com/presentation/d/abcdefghij1234567/embed?start=false&loop=false",
    );
  }
});

test("Kehadiran: kiraan bagi hari ini sahaja", () => {
  const s = binaSlaidKehadiran({
    mesyuaratId: "x",
    mesyuarat: { bil: 2, tahun: 2026 },
    hariIni: "2026-10-22",
    url: "https://nexa.my/laporan-mjkd/hadir",
    qr: "data:image/png;base64,AAA",
    rekod: [
      { jenis: "PGB", schoolCode: "ABA1001", tarikh: "2026-10-21" },
      { jenis: "PGB", schoolCode: "ABA1002", tarikh: "2026-10-22" },
      { jenis: "WAKIL", schoolCode: "ABC1046", tarikh: "2026-10-22" },
      { jenis: "PEGAWAI", schoolCode: null, tarikh: "2026-10-22" },
      { jenis: "LAIN", schoolCode: null, tarikh: "2026-10-21" },
    ],
    kodSekolah: sekolah.map((x) => x.code),
  });
  const k = s[0]!;
  assert.equal(k.tajuk, "Kehadiran MJKD 2026");
  assert.equal(k.hariLabel, "22 Oktober");
  assert.equal(k.urlPendek, "nexa.my/laporan-mjkd/hadir");
  assert.equal(k.kiraan.sekolahHadir, 2);
  assert.equal(k.kiraan.sekolahJumlah, 4);
  assert.equal(k.kiraan.pegawai, 1);
  assert.equal(k.kiraan.lain, 0);
});

test("binaSlaidPembentangan: empat tab; minit/maklum balas daripada rujukan", () => {
  const p = binaSlaidPembentangan({
    mesyuarat: { id: "x", bil: 2, tahun: 2026 },
    rujukan: mesyuarat, // Bil.1/2026
    perkara: semuaPerkara,
    sekolah,
    maklumBalas,
    items: [item("m1", "p1", "SELESAI", { dipilih: true, susunanBacaan: 1 })],
    bahan: [bahan("1", "Pembelajaran", ["2026-10-21"])],
    kehadiran: { hariIni: "2026-10-21", url: "https://nexa.my/laporan-mjkd/hadir", qr: "", rekod: [] },
  });
  assert.equal(p.kehadiran.length, 1);
  assert.equal(p.kehadiran[0]!.tajuk, "Kehadiran MJKD 2026");
  assert.equal(p.minit.length, 4);
  assert.equal(
    p.minit[0]!.jenis === "tajuk" && p.minit[0]!.pengesahan,
    "Pengesahan Minit MJKD Bil.1/2026",
  );
  // analisis + grid p1 + jawapan p1
  assert.equal(p.maklumBalas.length, 3);
  assert.equal(p.bahan.length, 2);
  const a = p.maklumBalas[0]!;
  assert.equal(a.jenis === "analisis" && a.tajuk, "Analisis Maklum Balas MJKD Bil.1/2026");
});

test("ringkasTeks: pendek kekal, panjang dipotong pada perkataan dengan ellipsis", () => {
  assert.equal(ringkasTeks("  Teks   pendek "), "Teks pendek");
  const panjang = "perkataan ".repeat(60);
  const r = ringkasTeks(panjang, 50);
  assert.ok(r.endsWith("…"));
  assert.ok(r.length <= 51);
  assert.ok(!/\s…$/.test(r));
});
