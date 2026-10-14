import assert from "node:assert/strict";
import test from "node:test";
import {
  binaAnalisis,
  binaDek,
  binaMozek,
  bezaData,
  cariIndeks,
  jawapanSekolah,
  kiraPapanPemuka,
  labelJenisBahan,
  namaPendek,
  pegawaiMengikutSektor,
  ringkasTeks,
  ukuranMozek,
  urutanSpotlight,
  type BahanPembentangan,
  type DataPentas,
  type ItemPembentangan,
  type PerkaraPembentangan,
} from "../../lib/mjkd/pembentangan";

const rujukan = {
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
  { id: "m1", schoolCode: "ABA1001", tarikhHantar: "2026-10-10T01:00:00.000Z" },
  { id: "m2", schoolCode: "ABA1002", tarikhHantar: "2026-10-10T02:00:00.000Z" },
  { id: "m3", schoolCode: "ABC1046", tarikhHantar: "2026-10-10T03:00:00.000Z" },
  { id: "m4", schoolCode: "AEA1110", tarikhHantar: "2026-10-10T04:00:00.000Z" },
];

const item = (
  maklumBalasId: string,
  perkaraId: string,
  status: string,
  over: Partial<ItemPembentangan> = {},
): ItemPembentangan => ({
  id: `${maklumBalasId}-${perkaraId}`,
  maklumBalasId,
  perkaraId,
  status,
  catatan: `Catatan ${maklumBalasId}`,
  pautanBukti: "",
  dipilih: false,
  ...over,
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

const data = (over: Partial<DataPentas> = {}): DataPentas => ({
  rujukan,
  perkara: semuaPerkara,
  sekolah,
  maklumBalas,
  items: [],
  bahan: [],
  kehadiran: { hariIni: "2026-10-21", rekod: [] },
  dimuatPada: "2026-10-21T01:00:00.000Z",
  ...over,
});

/* --------------------------------- analisis --------------------------------- */

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

test("kiraPapanPemuka: KPI = jumlah jawapan terpakai; jumlah sekolah daripada data", () => {
  const items = [
    item("m1", "p1", "SELESAI"),
    item("m2", "p1", "DALAM_PELAKSANAAN"),
    item("m4", "p3", "BELUM"),
    item("m3", "p3", "SELESAI"), // tidak terpakai
  ];
  const p = kiraPapanPemuka({ perkara: semuaPerkara, sekolah, maklumBalas, items });
  assert.equal(p.kpi.bilangan.jumlah, 3);
  assert.equal(p.kpi.bilangan.SELESAI, 1);
  assert.equal(p.kpi.bilangan.DALAM_PELAKSANAAN, 1);
  assert.equal(p.kpi.bilangan.BELUM, 1);
  assert.equal(p.kpi.sekolahJumlah, 4);
  // Satu sekolah kurang (cth. KV tidak hadir) -> jumlah ikut data, bukan nombor tetap.
  const kurang = kiraPapanPemuka({ perkara: semuaPerkara, sekolah: sekolah.slice(1), maklumBalas, items });
  assert.equal(kurang.kpi.sekolahJumlah, 3);
  assert.equal(p.perkara.length, 3);
});

/* ---------------------------------- mozek ---------------------------------- */

test("binaMozek: semua sekolah terpakai, belum hantar = null, isih SR -> SM kemudian kod", () => {
  const items = [
    item("m1", "p1", "SELESAI", { dipilih: true }),
    item("m3", "p1", "BELUM"),
  ];
  const j = binaMozek(semuaPerkara[1]!, sekolah, maklumBalas.slice(0, 3), items, {
    baru: new Set(["ABC1046", "ABA1002"]),
  });
  assert.deepEqual(
    j.map((x) => x.kod),
    ["ABA1001", "ABA1002", "ABC1046", "AEA1110"],
  );
  const ikutKod = new Map(j.map((x) => [x.kod, x]));
  assert.equal(ikutKod.get("ABA1001")!.status, "SELESAI");
  assert.equal(ikutKod.get("ABA1001")!.sorotan, true);
  assert.equal(ikutKod.get("ABA1001")!.itemId, "m1-p1");
  assert.equal(ikutKod.get("ABA1002")!.status, null); // ada maklum balas tetapi tiada item p1
  assert.equal(ikutKod.get("ABA1002")!.baru, false); // BARU hanya jika ada jawapan
  assert.equal(ikutKod.get("ABC1046")!.baru, true);
  assert.equal(ikutKod.get("AEA1110")!.status, null);
  assert.equal(ikutKod.get("ABC1046")!.namaPendek, "SJKC Hwa Lian 1 Pangkor");
  assert.deepEqual(urutanSpotlight(j), ["ABA1001", "ABC1046"]);
});

test("binaMozek: perkara SM hanya sekolah menengah; sekolah khusus mengatasi sasaran", () => {
  assert.deepEqual(
    binaMozek(semuaPerkara[2]!, sekolah, maklumBalas, []).map((x) => x.kod),
    ["AEA1110"],
  );
  const khusus = perkara("p9", "6.4", 9, { sasaran: "SM", sekolahKhusus: ["ABA1001", "ABA1002"] });
  assert.equal(binaMozek(khusus, sekolah, maklumBalas, []).length, 2);
});

test("ukuranMozek: ~100 sekolah muat 1028×820 tanpa tatal (7 lajur, fon ≈ 15px)", () => {
  for (const n of [96, 100, 102, 110]) {
    const u = ukuranMozek(n, 1028, 820);
    const baris = Math.ceil(n / u.lajur);
    assert.ok(u.lajur * u.w + (u.lajur - 1) * u.gap <= 1028 + 0.5, `lebar n=${n}`);
    assert.ok(baris * u.h + (baris - 1) * u.gap <= 820 + 0.5, `tinggi n=${n}`);
    assert.ok(u.fon >= 13, `fon n=${n}: ${u.fon}`);
  }
  const seratus = ukuranMozek(100, 1028, 820);
  assert.equal(seratus.lajur, 7);
  assert.ok(Math.abs(seratus.fon - 15) < 1);
});

test("ukuranMozek: bilangan kecil -> jubin besar, lebar maks 420px", () => {
  const sm = ukuranMozek(21, 1028, 820);
  assert.ok(sm.fon > 20);
  const dua = ukuranMozek(2, 1028, 820);
  assert.ok(dua.w <= 420);
  assert.ok(dua.fon >= 25);
  assert.equal(ukuranMozek(0, 1028, 820).lajur, 1);
});

test("namaPendek: Title Case; akronim jenis sekolah kekal huruf besar", () => {
  assert.equal(namaPendek("SK MUHAMMAD SAMAN"), "SK Muhammad Saman");
  assert.equal(namaPendek("SJK(C) CHUNG HWA"), "SJK(C) Chung Hwa");
  assert.equal(namaPendek("SJK (T) LDG SG WANGI II"), "SJK (T) Ldg Sg Wangi II");
  assert.equal(namaPendek("SMKA SLIM RIVER"), "SMKA Slim River");
  assert.equal(namaPendek("SMK DATO' SERI KAMARUDDIN"), "SMK Dato' Seri Kamaruddin");
  assert.equal(namaPendek("SK SERI SAMUDERA  "), "SK Seri Samudera");
  assert.equal(namaPendek("KV SERI MANJUNG"), "KV Seri Manjung");
});

/* ---------------------------------- dek ---------------------------------- */

test("binaDek: susunan bab berterusan; satu slaid setiap perkara aktif; tiada slaid jawapan", () => {
  const items = [item("m1", "p1", "SELESAI", { dipilih: true })];
  const dek = binaDek({
    data: data({
      items,
      bahan: [bahan("1", "Pembelajaran", ["2026-10-21"]), bahan("2", "Perancangan", ["2026-10-22"])],
    }),
  });
  assert.deepEqual(
    dek.map((s) => s.jenis),
    [
      "pembukaan",
      "kehadiran",
      "minit",
      "papan-pemuka",
      "perkara",
      "perkara",
      "perkara",
      "atur-cara",
      "bahan",
      "bahan",
      "penutup",
    ],
  );
  assert.deepEqual(
    dek.filter((s) => s.jenis === "perkara").map((s) => s.tajuk),
    ["Para 1.3", "Para 1.4", "Para 3.3"],
  );
  // Sorotan tidak menambah slaid (tidak mengubah susunan).
  const tanpa = binaDek({ data: data({ items: [item("m1", "p1", "SELESAI")] }) });
  assert.equal(
    tanpa.filter((s) => s.jenis === "perkara").length,
    dek.filter((s) => s.jenis === "perkara").length,
  );
  const kunci = dek.map((s) => s.kunci);
  assert.equal(new Set(kunci).size, kunci.length, "kunci unik");
  const minit = dek.find((s) => s.jenis === "minit")!;
  assert.equal(minit.jenis === "minit" && minit.label, "Bil.1/2026");
  assert.equal(
    minit.jenis === "minit" && minit.muatTurunUrl,
    "https://contoh.my/minit.pdf?download=Minit-MJKD-Bil1-2026.pdf",
  );
});

test("binaDek: kehadiran hari ini; pegawai ikut sektor; penutup ikut semua hari", () => {
  const dek = binaDek({
    data: data({
      kehadiran: {
        hariIni: "2026-10-22",
        rekod: [
          { jenis: "PGB", schoolCode: "ABA1001", tarikh: "2026-10-21" },
          { jenis: "PGB", schoolCode: "ABA1002", tarikh: "2026-10-22" },
          { jenis: "WAKIL", schoolCode: "ABC1046", tarikh: "2026-10-22" },
          { jenis: "PEGAWAI", schoolCode: null, tarikh: "2026-10-22", sektor: "Pembelajaran" },
          { jenis: "PEGAWAI", schoolCode: null, tarikh: "2026-10-22", sektor: "" },
          { jenis: "PEGAWAI", schoolCode: null, tarikh: "2026-10-21", sektor: "Perancangan" },
        ],
      },
      items: [item("m1", "p1", "SELESAI"), item("m2", "p1", "BELUM")],
    }),
  });
  const k = dek.find((s) => s.jenis === "kehadiran")!;
  if (k.jenis !== "kehadiran") throw new Error();
  assert.equal(k.hariLabel, "22 Oktober");
  assert.equal(k.sekolahHadir, 2);
  assert.equal(k.pegawaiHadir, 2);
  assert.deepEqual(k.pegawaiSektor, [
    { sektor: "Pembelajaran", bil: 1 },
    { sektor: "Lain-lain", bil: 1 },
  ]);
  const p = dek.at(-1)!;
  if (p.jenis !== "penutup") throw new Error();
  assert.equal(p.sekolahHadir, 3);
  assert.equal(p.sekolahDihantar, 4);
  assert.equal(p.peratusSelesai, 50);
});

test("binaDek: atur cara ikut hari; bahan dua hari muncul dua kali tetapi satu slaid", () => {
  const dek = binaDek({
    data: data({
      bahan: [
        bahan("1", "Pembelajaran", ["2026-10-22"]),
        bahan("2", "Perancangan", ["2026-10-21", "2026-10-22"], {
          jenis: "PDF",
          url: "https://drive.google.com/file/d/FILEID12345abc/preview",
          storagePath: "drive/FILEID12345abc",
        }),
        bahan("3", "Pembelajaran", ["2026-10-21"], {
          url: "https://www.canva.com/design/DAGabcdefgh/view",
        }),
      ],
    }),
  });
  const a = dek.find((s) => s.jenis === "atur-cara")!;
  if (a.jenis !== "atur-cara") throw new Error();
  assert.deepEqual(
    a.hari.map((h) => h.label),
    ["21 Oktober", "22 Oktober"],
  );
  const sesi2 = a.hari.flatMap((h) => h.sesi).filter((s) => s.kunci === "bahan-2");
  assert.equal(sesi2.length, 2);
  assert.equal(sesi2[0]!.nombor, sesi2[1]!.nombor);
  const slaidBahan = dek.filter((s) => s.jenis === "bahan");
  assert.equal(slaidBahan.length, 3);
  const b3 = slaidBahan.find((s) => s.jenis === "bahan" && s.id === "3")!;
  if (b3.jenis !== "bahan") throw new Error();
  assert.equal(b3.jenisLabel, "Canva");
  assert.equal(b3.embedUrl, "https://www.canva.com/design/DAGabcdefgh/view?embed");
  const b2 = slaidBahan.find((s) => s.jenis === "bahan" && s.id === "2")!;
  if (b2.jenis !== "bahan") throw new Error();
  assert.equal(b2.hariLabel, "21 & 22 Oktober");
  assert.equal(b2.muatTurunUrl, "https://drive.google.com/uc?export=download&id=FILEID12345abc");
});

test("cariIndeks: kekal pada kunci; kunci hilang -> slaid pertama bab yang sama", () => {
  const dek = binaDek({ data: data() });
  const i = cariIndeks(dek, "perkara-p2", "maklum-balas");
  assert.equal(dek[i]!.kunci, "perkara-p2");
  const j = cariIndeks(dek, "perkara-tiada", "maklum-balas");
  assert.equal(dek[j]!.kunci, "papan-pemuka");
});

test("bezaData: sekolah baru menghantar / dikemas kini dan baru hadir", () => {
  const lama = {
    maklumBalas: maklumBalas.slice(0, 2),
    kehadiran: { hariIni: "2026-10-21", rekod: [{ jenis: "PGB", schoolCode: "ABA1001", tarikh: "2026-10-21" }] },
  };
  const baru = {
    maklumBalas: [
      maklumBalas[0]!,
      { ...maklumBalas[1]!, tarikhHantar: "2026-10-21T05:00:00.000Z" },
      maklumBalas[2]!,
    ],
    kehadiran: {
      hariIni: "2026-10-21",
      rekod: [
        { jenis: "PGB", schoolCode: "ABA1001", tarikh: "2026-10-21" },
        { jenis: "WAKIL", schoolCode: "AEA1110", tarikh: "2026-10-21" },
      ],
    },
  };
  const b = bezaData(lama, baru);
  assert.deepEqual([...b.maklumBalas].sort(), ["ABA1002", "ABC1046"]);
  assert.deepEqual([...b.hadir], ["AEA1110"]);
});

test("jawapanSekolah: cari maklum balas + item bagi perkara", () => {
  const d = data({ items: [item("m2", "p1", "DALAM_PELAKSANAAN")] });
  const j = jawapanSekolah(d, "p1", "ABA1002");
  assert.equal(j.sekolah!.name, "SK BERUAS");
  assert.equal(j.item!.status, "DALAM_PELAKSANAAN");
  assert.equal(jawapanSekolah(d, "p2", "ABA1002").item, null);
});

test("pegawaiMengikutSektor & labelJenisBahan", () => {
  assert.deepEqual(
    pegawaiMengikutSektor([
      { jenis: "PEGAWAI", schoolCode: null, tarikh: "x", sektor: "A" },
      { jenis: "PEGAWAI", schoolCode: null, tarikh: "x", sektor: "B" },
      { jenis: "PEGAWAI", schoolCode: null, tarikh: "x", sektor: "B" },
      { jenis: "PGB", schoolCode: "ABA1001", tarikh: "x" },
    ]),
    [
      { sektor: "B", bil: 2 },
      { sektor: "A", bil: 1 },
    ],
  );
  assert.equal(labelJenisBahan({ jenis: "PAUTAN", url: "https://canva.link/abc" }), "Canva");
  assert.equal(
    labelJenisBahan({ jenis: "PAUTAN", url: "https://docs.google.com/presentation/d/x/edit" }),
    "Slides",
  );
  assert.equal(labelJenisBahan({ jenis: "PDF", url: "" }), "PDF");
  assert.equal(labelJenisBahan({ jenis: "PAUTAN", url: "https://contoh.my" }), "Pautan");
});

test("ringkasTeks: pendek kekal, panjang dipotong pada perkataan dengan ellipsis", () => {
  assert.equal(ringkasTeks("  Teks   pendek "), "Teks pendek");
  const panjang = "perkataan ".repeat(60);
  const r = ringkasTeks(panjang, 50);
  assert.ok(r.endsWith("…"));
  assert.ok(r.length <= 51);
  assert.ok(!/\s…$/.test(r));
});

test("binaMozek: SR sebelum SM walaupun kod SM lebih kecil; jenis tidak dikenali di hujung", () => {
  const sek = [
    { code: "AEA0001", name: "SMK ALFA" },
    { code: "ABD9999", name: "SJK(T) ZETA" },
    { code: "ABA5000", name: "SK BETA" },
    { code: "XYZ0001", name: "KOLEJ LAIN" },
  ];
  const j = binaMozek(perkara("px", "1.1", 1), sek, [], []);
  assert.deepEqual(
    j.map((x) => x.kod),
    ["ABA5000", "ABD9999", "AEA0001", "XYZ0001"],
  );
});
