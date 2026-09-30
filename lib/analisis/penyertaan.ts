import type { AnalisisHomeModule } from "./summary";
import {
  GURU_DATA,
  PENYERTAAN_RINGKASAN as R,
  PERTANDINGAN_DATA,
  SEKOLAH_DATA,
  TOP5_DATA,
  type GuruRow,
  type KodPertandingan,
  type PertandinganRow,
  type SekolahRow,
} from "./penyertaan-data";

/* ---------- Format ---------- */

export function bilangan(n: number): string {
  return n.toLocaleString("ms-MY");
}

/** Satu tempat perpuluhan, cth. "9.3%". */
export function peratus(n: number): string {
  return `${n.toLocaleString("ms-MY", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

/* ---------- Terbitan ---------- */

export type PertandinganAnalisis = PertandinganRow & {
  /** Sumbangan pertandingan kepada jumlah penyertaan / Top 5 / mata Manjung (%). */
  kongsiPenyertaan: number;
  kongsiTop5: number;
  kongsiMata: number;
  /** Top 5 ÷ penyertaan (%). null jika tiada penyertaan. */
  kadar: number | null;
  /** Manjung ÷ penyertaan Perak (%). null jika Perak tiada rekod. */
  kongsiNegeri: number | null;
};

export type SekolahAnalisis = SekolahRow & {
  jumlah: number;
  skor: number;
  kadar: number;
};

export type GuruAnalisis = GuruRow & {
  kedudukan: number;
  skor: number;
  sekolah: string;
};

const NAMA_SEKOLAH = new Map(SEKOLAH_DATA.map((s) => [s.kod, s.nama]));
export const namaSekolah = (kod: string): string => NAMA_SEKOLAH.get(kod) ?? kod;

export const PERTANDINGAN: PertandinganAnalisis[] = PERTANDINGAN_DATA.map((p) => ({
  ...p,
  kongsiPenyertaan: pctOf(p.penyertaan, R.penyertaan),
  kongsiTop5: pctOf(p.top5, R.top5),
  kongsiMata: pctOf(p.mata, R.mata),
  kadar: p.penyertaan > 0 ? pctOf(p.top5, p.penyertaan) : null,
  kongsiNegeri: p.penyertaanNegeri > 0 ? pctOf(p.penyertaan, p.penyertaanNegeri) : null,
}));

export const SEKOLAH: SekolahAnalisis[] = SEKOLAH_DATA.map((s) => {
  const jumlah = Object.values(s.penyertaan).reduce((a, b) => a + (b ?? 0), 0);
  return { ...s, jumlah, skor: jumlah + s.mata, kadar: jumlah > 0 ? pctOf(s.top5, jumlah) : 0 };
});

/** Kedudukan gaya pertandingan (skor sama = kedudukan sama), seperti helaian GURU. */
export const GURU: GuruAnalisis[] = (() => {
  const ranked = GURU_DATA.map((g) => ({
    ...g,
    skor: g.pasukan + g.mata,
    sekolah: namaSekolah(g.kodSekolah),
    kedudukan: 0,
  })).sort((a, b) => b.skor - a.skor);
  ranked.forEach((g, i) => {
    g.kedudukan = i > 0 && ranked[i - 1].skor === g.skor ? ranked[i - 1].kedudukan : i + 1;
  });
  return ranked;
})();

const ANUGERAH_TURUTAN = ["JOHAN", "NAIB JOHAN", "KETIGA", "KEEMPAT", "KELIMA"] as const;
export const ANUGERAH = ANUGERAH_TURUTAN.map((nama) => ({
  nama,
  bil: TOP5_DATA.filter((t) => t.anugerah === nama).length,
}));

export { TOP5_DATA, R as PENYERTAAN_RINGKASAN };

/* ---------- Analisis ---------- */

function jumlahKod(kod: KodPertandingan[], medan: "penyertaan" | "top5" | "mata"): number {
  return PERTANDINGAN.filter((p) => kod.includes(p.kod)).reduce((a, p) => a + p[medan], 0);
}

function jenisSekolah(jenis: SekolahRow["jenis"]) {
  const list = SEKOLAH.filter((s) => s.jenis === jenis);
  const penyertaan = list.reduce((a, s) => a + s.jumlah, 0);
  const top5 = list.reduce((a, s) => a + s.top5, 0);
  return { bil: list.length, penyertaan, top5, mata: list.reduce((a, s) => a + s.mata, 0), kadar: pctOf(top5, penyertaan) };
}

export function analisisPenyertaan() {
  const kadarKeseluruhan = pctOf(R.top5, R.penyertaan);
  const jumlahNegeri = PERTANDINGAN.reduce((a, p) => a + p.penyertaanNegeri, 0);

  /* Pertandingan berskala besar vs pertandingan teknikal berkualiti tinggi. */
  const kualiti: KodPertandingan[] = ["MYRC", "DSTA"];
  const volum: KodPertandingan[] = ["MYCH", "MINECRAFT"];
  const kualitiPen = jumlahKod(kualiti, "penyertaan");
  const volumPen = jumlahKod(volum, "penyertaan");
  const kualitiTop5 = jumlahKod(kualiti, "top5");
  const volumTop5 = jumlahKod(volum, "top5");

  const ikutJumlah = [...SEKOLAH].sort((a, b) => b.jumlah - a.jumlah);
  const tigaTeratas = ikutJumlah.slice(0, 3);
  const tigaPen = tigaTeratas.reduce((a, s) => a + s.jumlah, 0);
  const terbaik = [...SEKOLAH].filter((s) => s.jumlah >= 5).sort((a, b) => b.kadar - a.kadar)[0];

  const rendah = jenisSekolah("Rendah");
  const menengah = jenisSekolah("Menengah");
  const sekolahTop5 = SEKOLAH.filter((s) => s.top5 > 0).length;
  const sekolahBerbilang = SEKOLAH.filter((s) => Object.keys(s.penyertaan).length >= 2).length;

  const dapatan: { tajuk: string; teks: string }[] = [
    {
      tajuk: "Skala penyertaan yang besar",
      teks: `${bilangan(R.penyertaan)} penyertaan daripada ${R.sekolahTerlibat} sekolah — ${peratus(pctOf(R.penyertaan, jumlahNegeri))} daripada ${bilangan(jumlahNegeri)} penyertaan seluruh Perak, walaupun Manjung hanya satu daripada ${R.daerahPerak} daerah.`,
    },
    {
      tajuk: "Kualiti tertumpu pada MYRC dan DSTA",
      teks: `Kedua-duanya hanya ${peratus(pctOf(kualitiPen, R.penyertaan))} penyertaan tetapi menghasilkan ${kualitiTop5} daripada ${R.top5} Top 5 (${peratus(pctOf(kualitiTop5, R.top5))}) dan ${peratus(pctOf(jumlahKod(kualiti, "mata"), R.mata))} mata.`,
    },
    {
      tajuk: "Volum tinggi, penukaran rendah pada MYCH dan Minecraft",
      teks: `${bilangan(volumPen)} penyertaan (${peratus(pctOf(volumPen, R.penyertaan))}) tetapi hanya ${volumTop5} Top 5 — kadar ${peratus(pctOf(volumTop5, volumPen))}, berbanding ${peratus(kadarKeseluruhan)} keseluruhan.`,
    },
    {
      tajuk: "Penyertaan tertumpu pada beberapa sekolah",
      teks: `${tigaTeratas.map((s) => s.nama).join(", ")} menyumbang ${peratus(pctOf(tigaPen, R.penyertaan))} penyertaan. ${terbaik.nama} paling cekap: ${terbaik.jumlah} penyertaan menghasilkan ${terbaik.top5} Top 5 dan ${terbaik.mata} mata (${peratus(pctOf(terbaik.mata, R.mata))} daripada jumlah mata daerah).`,
    },
    {
      tajuk: "Sekolah rendah dan menengah seimbang dari segi kadar",
      teks: `Sekolah rendah: ${rendah.penyertaan} penyertaan, ${rendah.top5} Top 5 (${peratus(rendah.kadar)}). Sekolah menengah: ${menengah.penyertaan} penyertaan, ${menengah.top5} Top 5 (${peratus(menengah.kadar)}). ${sekolahTop5} daripada ${R.sekolahTerlibat} sekolah memperoleh Top 5; ${sekolahBerbilang} sekolah menyertai dua pertandingan atau lebih.`,
    },
  ];

  const kadarRendah = PERTANDINGAN.filter((p) => p.kadar != null && p.kadar < kadarKeseluruhan && p.penyertaan >= 40);
  const susulan: { tajuk: string; teks: string }[] = [
    {
      tajuk: "Tingkatkan penukaran penyertaan kepada pencapaian",
      teks: `${kadarRendah.map((p) => `${p.kod} (${peratus(p.kadar as number)})`).join(" dan ")} mempunyai penyertaan terbanyak tetapi kadar Top 5 paling rendah. Pertimbangkan latihan pra-pertandingan dan perkongsian amalan daripada sekolah berprestasi.`,
    },
    {
      tajuk: "Perluas dan ratakan jangkauan sekolah",
      teks: `${R.sekolahTerlibat - sekolahTop5} sekolah belum memperoleh Top 5. Manfaatkan guru pembimbing berpengalaman (cth. ${GURU[0].nama}) sebagai mentor kepada sekolah baharu.`,
    },
    {
      tajuk: "Kembangkan pertandingan berpenyertaan rendah",
      teks: "DRONE tiada penyertaan Manjung; NICTSED, CAKNA dan ANDROID hanya 1–2 penyertaan, dengan kedudukan daerah 5 hingga 10 — ruang penambahbaikan paling jelas.",
    },
    {
      tajuk: "Lengkapkan kualiti data pendaftaran",
      teks: "Nama guru pembimbing MYCH tiada dalam pendaftaran, dan borang MYCH, CAKNA, ANDROID dan Minecraft tiada ruangan daerah. Penambahbaikan borang akan menjadikan analisis guru dan daerah lebih tepat.",
    },
  ];

  const nota = [
    `Sumber: fail ${R.tajuk}, ${R.program}, dijana ${R.tarikhJana}. ${R.pertandinganBerdata} daripada ${R.pertandinganJumlah} pertandingan mempunyai data.`,
    `Kadar kejayaan = Top 5 ÷ penyertaan. Mata: Johan 5, Naib Johan 4, Ketiga 3, Keempat 2, Kelima 1.`,
    `Bagi MYCH, CAKNA, ANDROID dan Minecraft, borang tiada ruangan daerah — daerah ditentukan daripada digit ke-4 kod sekolah.`,
    `Kedudukan daerah ialah antara ${R.daerahPerak} daerah Perak, seperti dalam fail rumusan.`,
    `Nama guru MYCH tiada dalam pendaftaran; helaian guru tidak merangkumi penyertaan MYCH.`,
    `Helaian guru mempunyai ${R.guruBaris} baris; ${R.guruBaris - GURU.length} rekod digabung kerana guru dan kod sekolah yang sama tetapi ejaan nama berbeza (${GURU.length} guru unik).`,
    `Jenis sekolah (rendah/menengah) dikelaskan mengikut nama sekolah. Nama murid tidak dipaparkan.`,
  ];

  return { kadarKeseluruhan, jumlahNegeri, dapatan, susulan, nota, rendah, menengah };
}

/* ---------- Kad halaman utama ---------- */

export const penyertaanHomeModule: AnalisisHomeModule = {
  id: "penyertaan",
  label: "Penyertaan Pertandingan",
  headlineValue: bilangan(R.penyertaan),
  headlineLabel: `Penyertaan · ${R.sekolahTerlibat} sekolah`,
  yearLabel: `${R.program} · ${R.daerah}`,
  tiles: [
    { label: "Penyertaan", value: bilangan(R.penyertaan) },
    { label: "Sekolah terlibat", value: bilangan(R.sekolahTerlibat) },
    { label: "Top 5", value: bilangan(R.top5) },
    { label: "Mata pencapaian", value: bilangan(R.mata) },
  ],
  bars: [],
  note: `Data setakat ${R.tarikhJana}.`,
};
