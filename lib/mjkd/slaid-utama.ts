/**
 * Slaid utama RASMI MJKD Bil. 2/2026 (Canva "SLIDE UTAMA MJKD BIL. 2/2026", PPTX dieksport
 * 18 Nov 2026, 118 halaman) — disisipkan ke dalam dek mod pembentangan. Setiap halaman ialah imej
 * PENUH 1920×1080 (termasuk teks) dieksport melalui PowerPoint dengan fon terbenam Canva
 * (`scripts/mjkd-slaid-utama-pptx.ps1`), di `public/mjkd/slaid-utama/` (dikecualikan daripada
 * precache PWA). Halaman yang sama (muka depan berulang) berkongsi satu fail. Hal. 95 (pendua SK Lumut) dibuang.
 * Jika Canva dikemas kini: eksport PPTX semula dan jalankan skrip itu (lihat AI_CONTEXT_LOG.md).
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

export const HALAMAN_UTAMA: readonly HalamanUtama[] = [
  { halaman: 1, bab: "majlis", tajuk: "Muka Depan", gambar: "001.jpg" },
  { halaman: 2, bab: "majlis", tajuk: "Lagu (video)", gambar: "002.jpg", video: true },
  { halaman: 3, bab: "majlis", tajuk: "Bacaan Doa", gambar: "003.jpg" },
  { halaman: 4, bab: "majlis", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 5, bab: "majlis", tajuk: "Lafaz Ikrar", gambar: "005.jpg" },
  { halaman: 6, bab: "majlis", tajuk: "Ikrar Rukun Negara", gambar: "006.jpg" },
  { halaman: 7, bab: "majlis", tajuk: "Ikrar Perkhidmatan Awam", gambar: "007.jpg" },
  { halaman: 8, bab: "majlis", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 9, bab: "perutusan", tajuk: "Agenda 1: Perutusan Pengerusi", gambar: "009.jpg" },
  { halaman: 10, bab: "perutusan", tajuk: "Sekalung Tahniah Dato'", gambar: "010.jpg" },
  { halaman: 11, bab: "perutusan", tajuk: "Fokus Utama", gambar: "011.jpg" },
  { halaman: 12, bab: "perutusan", tajuk: "1 · Keberadaan Pengetua", gambar: "012.jpg" },
  { halaman: 13, bab: "perutusan", tajuk: "2 · Matriks Tahun 4", gambar: "013.jpg" },
  { halaman: 14, bab: "perutusan", tajuk: "3 · Perancangan Akademik 2027", gambar: "014.jpg" },
  { halaman: 15, bab: "perutusan", tajuk: "4 · Post Mortem Akademik 2026", gambar: "015.jpg" },
  { halaman: 16, bab: "perutusan", tajuk: "5 · Teladan Kepimpinan Instruksional", gambar: "016.jpg" },
  { halaman: 17, bab: "perutusan", tajuk: "6 · KPI Wajib Capai RPM", gambar: "017.jpg" },
  { halaman: 18, bab: "perutusan", tajuk: "Ringkasan KPI", gambar: "018.jpg" },
  { halaman: 19, bab: "perutusan", tajuk: "Pemakluman PISA, SEA-PLM & TIMSS", gambar: "019.jpg" },
  { halaman: 20, bab: "perutusan", tajuk: "7 · KPI Pengarah", gambar: "020.jpg" },
  { halaman: 21, bab: "perutusan", tajuk: "KPI Pengarah (butiran)", gambar: "021.jpg" },
  { halaman: 22, bab: "perutusan", tajuk: "3 Aspek Utama", gambar: "022.jpg" },
  { halaman: 23, bab: "perutusan", tajuk: "Muka Depan", gambar: "023.jpg" },
  { halaman: 24, bab: "perutusan", tajuk: "Rehat", gambar: "024.jpg" },
  { halaman: 25, bab: "minit", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 26, bab: "minit", tajuk: "Agenda 2: Pembentangan Minit", gambar: "026.jpg" },
  { halaman: 27, bab: "maklum-balas", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 28, bab: "maklum-balas", tajuk: "Agenda 3: Maklum Balas", gambar: "028.jpg" },
  { halaman: 29, bab: "pembentangan", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 30, bab: "pembentangan", tajuk: "Agenda 4: Sesi Pembentangan", gambar: "030.jpg" },
  { halaman: 31, bab: "hal-lain", tajuk: "Muka Depan", gambar: "004.jpg" },
  { halaman: 32, bab: "hal-lain", tajuk: "Agenda 5: Hal-hal Lain", gambar: "032.jpg" },
  { halaman: 33, bab: "hal-lain", tajuk: "Apresiasi Pendigitalan & Pemerkasaan Bacaan", gambar: "033.jpg" },
  { halaman: 34, bab: "hal-lain", tajuk: "Tahniah · SJK(C) Pei Min", gambar: "034.jpg" },
  { halaman: 35, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Ldg. Ayer Tawar", gambar: "035.jpg" },
  { halaman: 36, bab: "hal-lain", tajuk: "Tahniah · SMK Convent Sitiawan", gambar: "036.jpg" },
  { halaman: 37, bab: "hal-lain", tajuk: "Tahniah · SK Dendang", gambar: "037.jpg" },
  { halaman: 38, bab: "hal-lain", tajuk: "Tahniah · SK Nakhoda Muhammad Taib", gambar: "038.jpg" },
  { halaman: 39, bab: "hal-lain", tajuk: "Tahniah · SK Seri Bayu", gambar: "039.jpg" },
  { halaman: 40, bab: "hal-lain", tajuk: "Tahniah · SJK(C) Chinese National", gambar: "040.jpg" },
  { halaman: 41, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Kg. Tun Sambanthan", gambar: "041.jpg" },
  { halaman: 42, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Ldg. Sogomana", gambar: "042.jpg" },
  { halaman: 43, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Pangkor", gambar: "043.jpg" },
  { halaman: 44, bab: "hal-lain", tajuk: "Tahniah · SMK Batu Sepuluh", gambar: "044.jpg" },
  { halaman: 45, bab: "hal-lain", tajuk: "Tahniah · SK Pengkalan Baharu", gambar: "045.jpg" },
  { halaman: 46, bab: "hal-lain", tajuk: "Tahniah · SK Muhammad Saman", gambar: "046.jpg" },
  { halaman: 47, bab: "hal-lain", tajuk: "Tahniah · SJK(C) Min Te", gambar: "047.jpg" },
  { halaman: 48, bab: "hal-lain", tajuk: "Tahniah · SK Panchor", gambar: "048.jpg" },
  { halaman: 49, bab: "hal-lain", tajuk: "Tahniah · SK Sg. Batu", gambar: "049.jpg" },
  { halaman: 50, bab: "hal-lain", tajuk: "Tahniah · SMK Ambrose", gambar: "050.jpg" },
  { halaman: 51, bab: "hal-lain", tajuk: "Tahniah · SMK Pantai Remis", gambar: "051.jpg" },
  { halaman: 52, bab: "hal-lain", tajuk: "Tahniah · SK Batu Sepuluh", gambar: "052.jpg" },
  { halaman: 53, bab: "hal-lain", tajuk: "Tahniah · SK Pangkalan TLDM II", gambar: "053.jpg" },
  { halaman: 54, bab: "hal-lain", tajuk: "Tahniah · SK Kayan", gambar: "054.jpg" },
  { halaman: 55, bab: "hal-lain", tajuk: "Tahniah · SK Seri Serdang", gambar: "055.jpg" },
  { halaman: 56, bab: "hal-lain", tajuk: "Tahniah · SMK Pangkalan TLDM", gambar: "056.jpg" },
  { halaman: 57, bab: "hal-lain", tajuk: "Tahniah · SMK Dindings", gambar: "057.jpg" },
  { halaman: 58, bab: "hal-lain", tajuk: "Tahniah · SMK Ayer Tawar", gambar: "058.jpg" },
  { halaman: 59, bab: "hal-lain", tajuk: "Tahniah · SMK Pangkor", gambar: "059.jpg" },
  { halaman: 60, bab: "hal-lain", tajuk: "Tahniah · SK Methodist (ACS) Sitiawan", gambar: "060.jpg" },
  { halaman: 61, bab: "hal-lain", tajuk: "Tahniah · SK Methodist (ACS) Lumut", gambar: "061.jpg" },
  { halaman: 62, bab: "hal-lain", tajuk: "Tahniah · SMK Methodist (ACS) Sitiawan", gambar: "062.jpg" },
  { halaman: 63, bab: "hal-lain", tajuk: "Tahniah · SJK(C) Uk Ing", gambar: "063.jpg" },
  { halaman: 64, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Maha Ganesa Viddyasalai", gambar: "064.jpg" },
  { halaman: 65, bab: "hal-lain", tajuk: "Tahniah · SJK(T) Ayer Tawar", gambar: "065.jpg" },
  { halaman: 66, bab: "hal-lain", tajuk: "Tahniah · SK Gangga", gambar: "066.jpg" },
  { halaman: 67, bab: "hal-lain", tajuk: "Tahniah · SMK Dato' Idris", gambar: "067.jpg" },
  { halaman: 68, bab: "hal-lain", tajuk: "Tahniah · SMK Kg. Dato' Seri Kamaruddin", gambar: "068.jpg" },
  { halaman: 69, bab: "hal-lain", tajuk: "Tahniah · SK Convent", gambar: "069.jpg" },
  { halaman: 70, bab: "hal-lain", tajuk: "Tahniah · SK Pangkalan TLDM", gambar: "070.jpg" },
  { halaman: 71, bab: "hal-lain", tajuk: "Tahniah · SMK Seri Manjung", gambar: "071.jpg" },
  { halaman: 72, bab: "hal-lain", tajuk: "Tahniah · SMK Raja Shahriman", gambar: "072.jpg" },
  { halaman: 73, bab: "hal-lain", tajuk: "Tahniah · SMK Ahmad Boestamam", gambar: "073.jpg" },
  { halaman: 74, bab: "hal-lain", tajuk: "Tahniah · SMK Seri Samudera", gambar: "074.jpg" },
  { halaman: 75, bab: "hal-lain", tajuk: "Tahniah · SABK Maahad Islahiah Addiniah", gambar: "075.jpg" },
  { halaman: 76, bab: "hal-lain", tajuk: "Tahniah · SK Dato' Ishak", gambar: "076.jpg" },
  { halaman: 77, bab: "hal-lain", tajuk: "Tahniah · SK Seri Samudera", gambar: "077.jpg" },
  { halaman: 78, bab: "hal-lain", tajuk: "Tahniah · SK Seri Samudera (D.U.T.A)", gambar: "078.jpg" },
  { halaman: 79, bab: "hal-lain", tajuk: "Anugerah Emas PPD Manjung", gambar: "079.jpg" },
  { halaman: 80, bab: "hal-lain", tajuk: "Tahniah Semua Penerima Anugerah", gambar: "080.jpg" },
  { halaman: 81, bab: "hal-lain", tajuk: "Muka Depan", gambar: "081.jpg" },
  { halaman: 82, bab: "hal-lain", tajuk: "Anugerah Khatam Al-Quran 2026", gambar: "082.jpg" },
  { halaman: 83, bab: "hal-lain", tajuk: "Khatam · SK Dendang", gambar: "083.jpg" },
  { halaman: 84, bab: "hal-lain", tajuk: "Khatam · SK Kampong Kota", gambar: "084.jpg" },
  { halaman: 85, bab: "hal-lain", tajuk: "Khatam · SK Pangkalan Baharu", gambar: "085.jpg" },
  { halaman: 86, bab: "hal-lain", tajuk: "Khatam · SK Sungai Batu", gambar: "086.jpg" },
  { halaman: 87, bab: "hal-lain", tajuk: "Khatam · SK Ladang Huntly", gambar: "087.jpg" },
  { halaman: 88, bab: "hal-lain", tajuk: "Khatam · SK Sungai Ramai", gambar: "088.jpg" },
  { halaman: 89, bab: "hal-lain", tajuk: "Khatam · SK Sungai Wangi", gambar: "089.jpg" },
  { halaman: 90, bab: "hal-lain", tajuk: "Khatam · SK Lekir", gambar: "090.jpg" },
  { halaman: 91, bab: "hal-lain", tajuk: "Khatam · SK Batu Sepuluh", gambar: "091.jpg" },
  { halaman: 92, bab: "hal-lain", tajuk: "Khatam · SK Sungai Tiram", gambar: "092.jpg" },
  { halaman: 93, bab: "hal-lain", tajuk: "Khatam · SK Dato' Ishak", gambar: "093.jpg" },
  { halaman: 94, bab: "hal-lain", tajuk: "Khatam · SK Lumut", gambar: "094.jpg" },
  { halaman: 96, bab: "hal-lain", tajuk: "Khatam · SK Telaga Nanas", gambar: "096.jpg" },
  { halaman: 97, bab: "hal-lain", tajuk: "Khatam · SK Kayan", gambar: "097.jpg" },
  { halaman: 98, bab: "hal-lain", tajuk: "Khatam · SK Seri Manjung", gambar: "098.jpg" },
  { halaman: 99, bab: "hal-lain", tajuk: "Khatam · SK Gugusan Lekir", gambar: "099.jpg" },
  { halaman: 100, bab: "hal-lain", tajuk: "Khatam · SK Seri Bayu", gambar: "100.jpg" },
  { halaman: 101, bab: "hal-lain", tajuk: "Khatam · SK Convent", gambar: "101.jpg" },
  { halaman: 102, bab: "hal-lain", tajuk: "Khatam · SK St. Francis", gambar: "102.jpg" },
  { halaman: 103, bab: "hal-lain", tajuk: "Khatam · SK Gangga", gambar: "103.jpg" },
  { halaman: 104, bab: "hal-lain", tajuk: "Khatam · SJKC Hwa Lian 1", gambar: "104.jpg" },
  { halaman: 105, bab: "hal-lain", tajuk: "Khatam · SJKC Eng Ling", gambar: "105.jpg" },
  { halaman: 106, bab: "hal-lain", tajuk: "Khatam · SJKC Ping Min", gambar: "106.jpg" },
  { halaman: 107, bab: "hal-lain", tajuk: "Khatam · SJKC Kur Seng", gambar: "107.jpg" },
  { halaman: 108, bab: "hal-lain", tajuk: "Khatam · SJKC Chung Cheng", gambar: "108.jpg" },
  { halaman: 109, bab: "hal-lain", tajuk: "Khatam · SJKC Uk Dih", gambar: "109.jpg" },
  { halaman: 110, bab: "hal-lain", tajuk: "Khatam · SJKC Simpang Lima", gambar: "110.jpg" },
  { halaman: 111, bab: "hal-lain", tajuk: "Khatam · SJKC Kok Ming", gambar: "111.jpg" },
  { halaman: 112, bab: "hal-lain", tajuk: "Khatam · SJKC Min Te", gambar: "112.jpg" },
  { halaman: 113, bab: "hal-lain", tajuk: "Khatam · SJKC Tit Bin", gambar: "113.jpg" },
  { halaman: 114, bab: "hal-lain", tajuk: "Khatam · SJKC Pei Ching", gambar: "114.jpg" },
  { halaman: 115, bab: "hal-lain", tajuk: "Tahniah Semua Penerima (Khatam)", gambar: "115.jpg" },
  { halaman: 116, bab: "penutup", tajuk: "Muka Depan", gambar: "081.jpg" },
  { halaman: 117, bab: "penutup", tajuk: "Agenda 6: Rumusan", gambar: "117.jpg" },
  { halaman: 118, bab: "penutup", tajuk: "Tahun Ini Tahun Kita", gambar: "118.jpg" },
];

/** URL imej halaman. */
export const urlGambarUtama = (h: Pick<HalamanUtama, "gambar">) => `${AKAR_SLAID_UTAMA}/${h.gambar}`;

/** Semua URL imej unik (pramuat semasa mod pembentangan dibuka). */
export const SEMUA_GAMBAR_UTAMA: readonly string[] = [...new Set(HALAMAN_UTAMA.map(urlGambarUtama))];

/** Halaman `dari`..`hingga` (termasuk) mengikut susunan Canva. */
export function halamanUtama(dari: number, hingga: number): HalamanUtama[] {
  return HALAMAN_UTAMA.filter((h) => h.halaman >= dari && h.halaman <= hingga);
}
