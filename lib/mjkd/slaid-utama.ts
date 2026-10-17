/**
 * Slaid utama RASMI MJKD Bil. 2/2026 (Canva "SLIDE UTAMA MJKD BIL. 2/2026", dieksport PPTX
 * 17 Okt 2026) — disisipkan ke dalam dek mod pembentangan. Imej 1920×1080 dikomposit daripada
 * PPTX ke `public/mjkd/slaid-utama/` (dikecualikan daripada precache PWA); halaman agenda =
 * latar + teks HTML (League Spartan, kedudukan px pada kanvas 1920×1080 seperti dalam PPTX).
 * Jika Canva dikemas kini: eksport PPTX semula dan jana semula imej (lihat AI_CONTEXT_LOG.md).
 */
import type { Bab } from "./pembentangan";

export const AKAR_SLAID_UTAMA = "/mjkd/slaid-utama";
export const VIDEO_SLAID_UTAMA = `${AKAR_SLAID_UTAMA}/lagu.mp4`;

/** Satu kotak teks (px kanvas). `pt` = saiz fon PowerPoint (1 pt = 4/3 px pada 1920 lebar). */
export type TeksUtama = {
  x: number;
  y: number;
  w: number;
  baris: string[];
  pt: number;
  /** Jarak baris tetap (pt). */
  lnPt: number;
  garis?: boolean;
};

export type HalamanUtama = {
  halaman: number;
  bab: Bab;
  tajuk: string;
  gambar: string;
  teks?: TeksUtama[];
  video?: boolean;
};

const MUKA = "muka-depan.jpg";
const AGENDA = "latar-agenda.jpg";

/** Tajuk "AGENDA #n :" + tajuk agenda (lebar kotak ikut PPTX; teks dibalut seperti Canva). */
function agenda(n: number, y: number, w: number, baris: string[]): TeksUtama[] {
  return [
    { x: 141, y, w: 601, baris: [`AGENDA #${n} :`], pt: 55.42, lnPt: 77.59, garis: true },
    { x: 141, y: y + 136, w, baris, pt: 57.41, lnPt: 80.37 },
  ];
}

/** Petugas majlis: label bergaris + nama + jawatan. */
function petugas(label: string, nama: string[], jawatan: string, yJawatan: number): TeksUtama[] {
  return [
    { x: 141, y: 414, w: 500, baris: [label], pt: 46.08, lnPt: 64.51, garis: true },
    { x: 141, y: 526, w: 744, baris: nama, pt: 47.73, lnPt: 66.83 },
    { x: 141, y: yJawatan, w: 744, baris: [jawatan], pt: 27.43, lnPt: 38.4 },
  ];
}

export const HALAMAN_UTAMA: readonly HalamanUtama[] = [
  { halaman: 1, bab: "majlis", tajuk: "Muka Depan", gambar: "01.jpg" },
  { halaman: 2, bab: "majlis", tajuk: "Lagu (video)", gambar: "02.jpg", video: true },
  {
    halaman: 3,
    bab: "majlis",
    tajuk: "Bacaan Doa",
    gambar: AGENDA,
    teks: petugas("BACAAN DOA :", ["TN. HJ. MAHADI ROSLI BIN ZAMRI"], "PEGAWAI SISC+ PPD MANJUNG", 707),
  },
  { halaman: 4, bab: "majlis", tajuk: "Muka Depan", gambar: MUKA },
  {
    halaman: 5,
    bab: "majlis",
    tajuk: "Lafaz Ikrar",
    gambar: AGENDA,
    teks: petugas("LAFAZ IKRAR :", ["EN. NOR HISHAM", "BIN ABDULLAH HADI"], "GURU BESAR SK LADANG HUNTLY", 711),
  },
  { halaman: 6, bab: "majlis", tajuk: "Ikrar Rukun Negara", gambar: "06.jpg" },
  { halaman: 7, bab: "majlis", tajuk: "Ikrar Perkhidmatan Awam", gambar: "07.jpg" },
  { halaman: 8, bab: "majlis", tajuk: "Muka Depan", gambar: MUKA },
  {
    halaman: 9,
    bab: "perutusan",
    tajuk: "Agenda 1: Perutusan Pengerusi",
    gambar: AGENDA,
    teks: agenda(1, 412, 895, ["PERUTUSAN", "PENGERUSI MJKD"]),
  },
  { halaman: 10, bab: "perutusan", tajuk: "Fokus Utama", gambar: "10.jpg" },
  { halaman: 11, bab: "perutusan", tajuk: "1 · Keberadaan Pengetua", gambar: "11.jpg" },
  { halaman: 12, bab: "perutusan", tajuk: "2 · Matriks Tahun 4", gambar: "12.jpg" },
  { halaman: 13, bab: "perutusan", tajuk: "3 · Perancangan Akademik 2027", gambar: "13.jpg" },
  { halaman: 14, bab: "perutusan", tajuk: "4 · Post Mortem Akademik 2026", gambar: "14.jpg" },
  { halaman: 15, bab: "perutusan", tajuk: "5 · Teladan Kepimpinan Instruksional", gambar: "15.jpg" },
  { halaman: 16, bab: "perutusan", tajuk: "6 · KPI Wajib Capai RPM", gambar: "16.jpg" },
  { halaman: 17, bab: "perutusan", tajuk: "7 · KPI Pengarah", gambar: "17.jpg" },
  { halaman: 18, bab: "perutusan", tajuk: "3 Aspek Utama", gambar: "18.jpg" },
  { halaman: 19, bab: "perutusan", tajuk: "Muka Depan", gambar: MUKA },
  {
    halaman: 20,
    bab: "minit",
    tajuk: "Agenda 2: Pembentangan Minit",
    gambar: AGENDA,
    teks: agenda(2, 412, 967, ["PEMBENTANGAN", "MINIT MJKD BIL. 1"]),
  },
  {
    halaman: 21,
    bab: "maklum-balas",
    tajuk: "Agenda 3: Maklum Balas",
    gambar: AGENDA,
    teks: agenda(3, 370, 705, ["PEMBENTANGAN", "MAKLUMBALAS MJKD BIL. 1"]),
  },
  {
    halaman: 22,
    bab: "pembentangan",
    tajuk: "Agenda 4: Sesi Pembentangan",
    gambar: AGENDA,
    teks: agenda(4, 370, 879, ["SESI PEMBENTANGAN"]),
  },
  { halaman: 23, bab: "penutup", tajuk: "Agenda 5: Hal-hal Lain", gambar: AGENDA, teks: agenda(5, 421, 879, ["HAL-HAL LAIN"]) },
  {
    halaman: 24,
    bab: "penutup",
    tajuk: "Agenda 6: Rumusan",
    gambar: AGENDA,
    teks: agenda(6, 420, 879, ["RUMUSAN MJKD BIL.2/2026"]),
  },
  { halaman: 25, bab: "penutup", tajuk: "Tahun Ini Tahun Kita", gambar: "25.jpg" },
];

/** URL imej halaman. */
export const urlGambarUtama = (h: Pick<HalamanUtama, "gambar">) => `${AKAR_SLAID_UTAMA}/${h.gambar}`;

/** Semua URL imej unik (pramuat semasa mod pembentangan dibuka). */
export const SEMUA_GAMBAR_UTAMA: readonly string[] = [...new Set(HALAMAN_UTAMA.map(urlGambarUtama))];

/** Halaman `dari`..`hingga` (termasuk) mengikut susunan Canva. */
export function halamanUtama(dari: number, hingga: number): HalamanUtama[] {
  return HALAMAN_UTAMA.filter((h) => h.halaman >= dari && h.halaman <= hingga);
}
