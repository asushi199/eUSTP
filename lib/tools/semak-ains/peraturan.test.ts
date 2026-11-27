import { test } from "node:test";
import assert from "node:assert/strict";
import type { RekodAins } from "./jenis";
import { janaKomen } from "./komen";
import { ringkaskan, semak } from "./peraturan";
import { STANDARD_DAERAH, gabungStandard } from "./standard";

const RUMUSAN =
  "Cerita ini mengisahkan seekor kancil yang cerdik menyeberang sungai dengan menipu sekumpulan buaya yang lapar di tebing sungai.";
const PENGAJARAN = "Kita hendaklah menggunakan akal fikiran untuk menyelesaikan masalah dengan tenang.";

let n = 0;
function r(p: Partial<RekodAins> = {}): RekodAins {
  n += 1;
  return {
    id: `id-${n}`,
    tajuk: `Buku ${n}`,
    meta: "Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm",
    rumusan: RUMUSAN,
    pengajaran: PENGAJARAN,
    murid: `MURID ${n}`,
    kelas: "TAHUN 5 5A",
    ...p,
  };
}
const satu = (rek: RekodAins, s = STANDARD_DAERAH) => semak([rek], s)[0]!;

test("rekod baik → hijau", () => {
  const k = satu(r());
  assert.equal(k.warna, "hijau");
  assert.deepEqual(k.merah, []);
  assert.deepEqual(k.kuning, []);
  assert.equal(k.bahasa, "bm");
  assert.equal(k.kodTahap, "D5");
});

test("terlalu pendek → merah", () => {
  const k = satu(r({ rumusan: "Kancil menipu buaya.", pengajaran: "Jangan menipu." }));
  assert.equal(k.warna, "merah");
  assert.ok(k.merah.includes("terlalu-pendek"));
});

test("agak pendek → kuning", () => {
  const k = satu(
    r({
      rumusan: "Kancil menipu buaya untuk menyeberang sungai yang luas.",
      pengajaran: "Kita jangan menipu orang lain.",
    }),
  );
  assert.equal(k.warna, "kuning");
  assert.deepEqual(k.kuning, ["agak-pendek"]);
});

test("Pengajaran kosong → merah ruangan-kosong", () => {
  assert.ok(satu(r({ pengajaran: "." })).merah.includes("ruangan-kosong"));
});

test("Pengajaran Cina satu ayat (≥ 5 aksara) bukan ruangan kosong", () => {
  const k = satu(
    r({
      tajuk: "《小王子》",
      rumusan:
        "小王子离开自己的星球，到处旅行，认识了很多不同的人，也明白了什么是真正的友谊和责任。他和狐狸成为朋友，学会了珍惜。最后他回到了自己的星球照顾玫瑰花。",
      pengajaran: "我们要珍惜朋友。",
    }),
  );
  assert.equal(k.bahasa, "zh");
  assert.ok(!k.merah.includes("ruangan-kosong"));
  assert.ok(!k.merah.includes("bahasa-tak-sepadan"));
});

test("tajuk Cina + teks BI → bahasa tidak sepadan; boleh dimatikan", () => {
  const rek = r({
    tajuk: "逃家小兔",
    rumusan: "A little bunny tells his mother that he wants to run away and become a fish in the river.",
    pengajaran: "We should appreciate the love of our parents every day.",
  });
  assert.ok(satu(rek).merah.includes("bahasa-tak-sepadan"));
  assert.ok(!satu(rek, gabungStandard({ bahasaTakSepadan: false })).merah.includes("bahasa-tak-sepadan"));
});

test("templat merentas 3 buku → merah", () => {
  const k = semak([r(), r(), r()], STANDARD_DAERAH);
  assert.ok(k.every((x) => x.merah.includes("templat")));
});

test("aktiviti kelas dibenarkan secara lalai; kuning jika ditetapkan", () => {
  const a = r({ tajuk: "Sang Kancil", murid: "ALI" });
  const b = r({ tajuk: "Sang Kancil", murid: "ABU" });
  assert.equal(semak([a, b], STANDARD_DAERAH)[0]!.warna, "hijau");
  assert.ok(semak([a, b], gabungStandard({ aktivitiKelas: "kuning" }))[0]!.kuning.includes("sama-murid-lain"));
});

test("hantar semula sama: merah secara lalai, boleh diabaikan", () => {
  const a = r({ tajuk: "Sang Kancil", murid: "ALI" });
  const b = r({ tajuk: "Sang Kancil", murid: "ALI" });
  assert.ok(semak([a, b], STANDARD_DAERAH)[1]!.merah.includes("hantar-semula-sama"));
  assert.ok(!semak([a, b], STANDARD_DAERAH)[0]!.merah.includes("hantar-semula-sama"));
  assert.equal(semak([a, b], gabungStandard({ hantarSemulaSama: "abai" }))[1]!.warna, "hijau");
});

test("murid luar biasa → maklumat sahaja, warna tidak berubah", () => {
  const s = gabungStandard({ ambangMuridLuarBiasa: 1 });
  const k = semak([r({ murid: "ALI", rumusan: `${RUMUSAN} Satu.` }), r({ murid: "ALI", rumusan: `${RUMUSAN} Dua.` })], s);
  assert.ok(k[0]!.maklumat.includes("murid-luar-biasa"));
  assert.equal(k[0]!.warna, "hijau");
});

test("ringkaskan", () => {
  const k = semak([r(), r({ rumusan: "Pendek.", pengajaran: "." })], STANDARD_DAERAH);
  assert.deepEqual(ringkaskan(k), { jumlah: 2, hijau: 1, kuning: 0, merah: 1 });
});

test("janaKomen: sebab merah diutamakan, unik, boleh diganti", () => {
  const teks = janaKomen(["terlalu-pendek", "ruangan-kosong"], ["agak-pendek"], STANDARD_DAERAH, {
    "ruangan-kosong": "Lengkapkan.",
  });
  assert.ok(teks.includes("terlalu pendek"));
  assert.ok(teks.endsWith("Lengkapkan."));
  assert.ok(!teks.includes("agak pendek"));
});

test("R4: rumusan sama pengajaran → merah", () => {
  const k = satu(r({ pengajaran: RUMUSAN }));
  assert.ok(k.merah.includes("rumusan-sama-pengajaran"));
});

test("tiada had atas: teks sangat panjang tidak ditanda kerana panjangnya", () => {
  // > 250 perkataan berlainan (sintetik) supaya peraturan teks berulang tidak terpicu.
  const awal = ["ba", "ca", "da", "ga", "ha", "ja", "ka", "la", "ma", "na", "pa", "ra", "sa", "ta", "wa", "ya"];
  const akhir = ["ri", "ku", "mi", "lo", "tu", "ne", "si", "bo", "du", "pe", "gi", "hu", "jo", "ke", "lu", "mo", "nu", "ro"];
  const kata = awal.flatMap((x) => akhir.map((y) => x + y));
  const k = satu(r({ rumusan: `${RUMUSAN} ${kata.join(" ")}.` }));
  assert.ok(k.panjang > 250);
  assert.equal(k.warna, "hijau");
  assert.deepEqual(k.kuning, []);
});

test("R6: teks rawak (gelung) → merah teks-rawak", () => {
  const k = satu(r({ rumusan: "kancil buaya sungai ".repeat(10), pengajaran: PENGAJARAN }));
  assert.ok(k.merah.includes("teks-rawak"));
});

test("Y6: simbol pengisi → kuning", () => {
  const k = satu(r({ rumusan: `${RUMUSAN} ........` }));
  assert.ok(k.kuning.includes("simbol-pengisi"));
});

test("R7: tajuk Tamil + teks BM → bahasa tidak sepadan", () => {
  const k = satu(r({ tajuk: "தமிழ் புத்தகம்" }));
  assert.ok(k.merah.includes("bahasa-tak-sepadan"));
});

test("murid luar biasa dikunci murid|kelas", () => {
  const s = gabungStandard({ ambangMuridLuarBiasa: 1 });
  const k = semak(
    [
      r({ murid: "ALI", kelas: "TAHUN 5 5A", rumusan: `${RUMUSAN} Satu.` }),
      r({ murid: "ALI", kelas: "TAHUN 5 5B", rumusan: `${RUMUSAN} Dua.` }),
    ],
    s,
  );
  assert.ok(!k[0]!.maklumat.includes("murid-luar-biasa"));
});

const RUMUSAN_EN =
  "The story tells about a clever mouse deer who crosses the river by tricking the hungry crocodiles waiting on the bank of the river.";

test("bahasa-bercampur: lalai mati; kuning/merah ikut tetapan; kedua-dua BM tidak kena", () => {
  const campur = () => r({ rumusan: RUMUSAN_EN });
  const lalai = satu(campur());
  assert.ok(!lalai.kuning.includes("bahasa-bercampur") && !lalai.merah.includes("bahasa-bercampur"));
  assert.equal(lalai.warna, "hijau");
  const kuning = satu(campur(), gabungStandard({ bahasaBercampur: "kuning" }));
  assert.ok(kuning.kuning.includes("bahasa-bercampur"));
  const merah = satu(campur(), gabungStandard({ bahasaBercampur: "merah" }));
  assert.ok(merah.merah.includes("bahasa-bercampur"));
  const bm = satu(r(), gabungStandard({ bahasaBercampur: "merah" }));
  assert.ok(!bm.merah.includes("bahasa-bercampur") && !bm.kuning.includes("bahasa-bercampur"));
});
