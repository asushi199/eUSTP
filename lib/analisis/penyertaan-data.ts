/**
 * Data statik: RUMUSAN PENCAPAIAN SEKOLAH MENGIKUT DAERAH — PPPDM & DUTA 2026 Negeri Perak,
 * daerah MANJUNG (fail MANJUNG2026_RUMUSAN_DAERAH.xlsx, dijana 30/09/2026 18:34).
 *
 * Paparan statik seperti `bengkel.ts`: kemas kini di sini apabila fail rumusan baharu dijana.
 * Nama murid sengaja TIDAK disertakan (halaman awam). Rekod guru yang sama tetapi berbeza
 * ejaan nama / nama sekolah (kod sekolah sama) telah digabung — lihat `PENYERTAAN_RINGKASAN.guruBaris`.
 */

export type KodPertandingan =
  | "MYRC"
  | "DSTA"
  | "MYCH"
  | "CAKNA"
  | "ANDROID"
  | "DRONE"
  | "MINECRAFT"
  | "NICTSED";

export type PertandinganRow = {
  kod: KodPertandingan;
  penyertaan: number;
  sekolahUnik: number;
  top5: number;
  /** Termasuk sijil anugerah penyertaan sekolah. */
  sijil: number;
  mata: number;
  /** Kedudukan Manjung antara 12 daerah Perak, seperti dalam fail. */
  kedudukan: number;
  /** Jumlah penyertaan seluruh Perak untuk pertandingan itu. */
  penyertaanNegeri: number;
};

export type SekolahRow = {
  kod: string;
  nama: string;
  jenis: "Rendah" | "Menengah";
  penyertaan: Partial<Record<KodPertandingan, number>>;
  top5: number;
  mata: number;
};

export type Top5Row = {
  pertandingan: KodPertandingan;
  kategori: string | null;
  kedudukan: number;
  anugerah: "JOHAN" | "NAIB JOHAN" | "KETIGA" | "KEEMPAT" | "KELIMA";
  kodSekolah: string;
  guru: string;
  mata: number;
};

export type GuruRow = {
  nama: string;
  kodSekolah: string;
  pasukan: number;
  top5: number;
  mata: number;
  pertandingan: KodPertandingan[];
};

export const PENYERTAAN_RINGKASAN = {
  tajuk: "Rumusan Pencapaian Sekolah mengikut Daerah",
  program: "PPPDM & DUTA 2026 Negeri Perak",
  daerah: "Manjung",
  tarikhJana: "30/09/2026",
  daerahPerak: 12,
  pertandinganBerdata: 8,
  pertandinganJumlah: 8,
  penyertaan: 194,
  sekolahTerlibat: 21,
  top5: 18,
  mata: 54,
  sijilPencapaian: 60,
  sijilSekolah: 6,
  sijilGuruTerbaik: 8,
  sijilJumlah: 74,
  /** Baris helaian GURU dalam fail sebelum penggabungan. */
  guruBaris: 38,
} as const;

export const PERTANDINGAN_DATA: PertandinganRow[] = [
  { kod: "MYRC", penyertaan: 25, sekolahUnik: 9, top5: 9, sijil: 29, mata: 26, kedudukan: 3, penyertaanNegeri: 124 },
  { kod: "DSTA", penyertaan: 7, sekolahUnik: 6, top5: 5, sijil: 21, mata: 15, kedudukan: 5, penyertaanNegeri: 60 },
  { kod: "MYCH", penyertaan: 115, sekolahUnik: 9, top5: 1, sijil: 6, mata: 3, kedudukan: 2, penyertaanNegeri: 459 },
  { kod: "CAKNA", penyertaan: 1, sekolahUnik: 1, top5: 1, sijil: 3, mata: 3, kedudukan: 6, penyertaanNegeri: 21 },
  { kod: "ANDROID", penyertaan: 2, sekolahUnik: 2, top5: 1, sijil: 4, mata: 3, kedudukan: 6, penyertaanNegeri: 27 },
  { kod: "DRONE", penyertaan: 0, sekolahUnik: 0, top5: 0, sijil: 0, mata: 0, kedudukan: 10, penyertaanNegeri: 0 },
  { kod: "MINECRAFT", penyertaan: 43, sekolahUnik: 8, top5: 1, sijil: 3, mata: 4, kedudukan: 3, penyertaanNegeri: 304 },
  { kod: "NICTSED", penyertaan: 1, sekolahUnik: 1, top5: 0, sijil: 0, mata: 0, kedudukan: 5, penyertaanNegeri: 12 },
];

/** Disusun ikut skor (penyertaan + mata) menurun, seperti helaian SEKOLAH. */
export const SEKOLAH_DATA: SekolahRow[] = [
  { kod: "ABA1027", nama: "SK PANGKALAN TLDM", jenis: "Rendah", penyertaan: { MYRC: 3, MYCH: 50 }, top5: 1, mata: 5 },
  { kod: "ABA1021", nama: "SK DATO' ISHAK", jenis: "Rendah", penyertaan: { MYRC: 2, DSTA: 2, MYCH: 14, ANDROID: 1, MINECRAFT: 11 }, top5: 2, mata: 7 },
  { kod: "ABA1035", nama: "SK SERI SAMUDERA", jenis: "Rendah", penyertaan: { MYRC: 11, MINECRAFT: 3 }, top5: 6, mata: 19 },
  { kod: "AEA1110", nama: "SMK AHMAD BOESTAMAM", jenis: "Menengah", penyertaan: { MYRC: 1, DSTA: 1, MYCH: 17, CAKNA: 1 }, top5: 3, mata: 5 },
  { kod: "AEE1026", nama: "SMK METHODIST (ACS) SITIAWAN", jenis: "Menengah", penyertaan: { MYCH: 11, ANDROID: 1, MINECRAFT: 5 }, top5: 1, mata: 3 },
  { kod: "ABA1031", nama: "SK PANGKALAN TLDM II", jenis: "Rendah", penyertaan: { MYRC: 1, MYCH: 15 }, top5: 1, mata: 3 },
  { kod: "AEE1032", nama: "SMK RAJA SHAHRIMAN", jenis: "Menengah", penyertaan: { MINECRAFT: 17 }, top5: 0, mata: 0 },
  { kod: "AEA1114", nama: "SMK SERI SAMUDERA", jenis: "Menengah", penyertaan: { DSTA: 1 }, top5: 1, mata: 5 },
  { kod: "ABB1040", nama: "SK METHODIST ACS LUMUT", jenis: "Rendah", penyertaan: { MINECRAFT: 1 }, top5: 1, mata: 4 },
  { kod: "AFT1001", nama: "SABK MAAHAD ISLAHIAH ADDINIAH", jenis: "Menengah", penyertaan: { MYRC: 1, DSTA: 1 }, top5: 1, mata: 2 },
  { kod: "ABB1039", nama: "SK METHODIST (ACS) SITIAWAN", jenis: "Rendah", penyertaan: { MYRC: 3 }, top5: 1, mata: 1 },
  { kod: "ABA1022", nama: "SK LUMUT", jenis: "Rendah", penyertaan: { MYRC: 1, MYCH: 3 }, top5: 0, mata: 0 },
  { kod: "AEB1033", nama: "SMK DINDINGS", jenis: "Menengah", penyertaan: { MINECRAFT: 3 }, top5: 0, mata: 0 },
  { kod: "ABA1018", nama: "SK MUHAMMAD SAMAN", jenis: "Rendah", penyertaan: { DSTA: 1, MYCH: 1 }, top5: 0, mata: 0 },
  { kod: "ABD1093", nama: "SJKT BERUAS", jenis: "Rendah", penyertaan: { MYCH: 2 }, top5: 0, mata: 0 },
  { kod: "ABA1028", nama: "SK SERI MANJUNG", jenis: "Rendah", penyertaan: { MYRC: 2 }, top5: 0, mata: 0 },
  { kod: "ABA1024", nama: "SK TELAGA NANAS", jenis: "Rendah", penyertaan: { MYCH: 2 }, top5: 0, mata: 0 },
  { kod: "AEB1034", nama: "SMJK AYER TAWAR", jenis: "Menengah", penyertaan: { MINECRAFT: 2 }, top5: 0, mata: 0 },
  { kod: "ABC1049", nama: "SJKC PING MIN PUNDUT", jenis: "Rendah", penyertaan: { DSTA: 1 }, top5: 0, mata: 0 },
  { kod: "ABA1019", nama: "SMK BATU SEPULUH, LEKIR", jenis: "Menengah", penyertaan: { NICTSED: 1 }, top5: 0, mata: 0 },
  { kod: "AEB1027", nama: "SMK CONVENT SITIAWAN", jenis: "Menengah", penyertaan: { MINECRAFT: 1 }, top5: 0, mata: 0 },
];

export const TOP5_DATA: Top5Row[] = [
  { pertandingan: "MYRC", kategori: "Airobotik Robot A.I SR", kedudukan: 1, anugerah: "JOHAN", kodSekolah: "ABA1035", guru: "Nursyafiqah Liyana binti Mohd Shafiq Ong", mata: 5 },
  { pertandingan: "MYRC", kategori: "Airobotik Robot A.I SR", kedudukan: 2, anugerah: "NAIB JOHAN", kodSekolah: "ABA1035", guru: "Nursyafiqah Liyana binti Mohd Shafiq Ong", mata: 4 },
  { pertandingan: "MYRC", kategori: "Airobotik Robot A.I SR", kedudukan: 3, anugerah: "KETIGA", kodSekolah: "ABA1035", guru: "Nursyafiqah Liyana binti Mohd Shafiq Ong", mata: 3 },
  { pertandingan: "MYRC", kategori: "Airobotik Robot A.I SR", kedudukan: 4, anugerah: "KEEMPAT", kodSekolah: "ABA1035", guru: "Ahmad Shah Mimi bin Mohd Rosli", mata: 2 },
  { pertandingan: "MYRC", kategori: "Mikrobotik Pengaturcaraan Strategik SR", kedudukan: 3, anugerah: "KETIGA", kodSekolah: "ABA1035", guru: "Nursyafiqah Liyana binti Mohd Shafiq Ong", mata: 3 },
  { pertandingan: "MYRC", kategori: "Mikrobotik Pengaturcaraan Strategik SR", kedudukan: 4, anugerah: "KEEMPAT", kodSekolah: "ABA1035", guru: "Nursyafiqah Liyana binti Mohd Shafiq Ong", mata: 2 },
  { pertandingan: "MYRC", kategori: "Mikrobotik Pengaturcaraan Strategik SR", kedudukan: 5, anugerah: "KELIMA", kodSekolah: "ABB1039", guru: "Noor Hajratun Ain binti Mohd Hanif", mata: 1 },
  { pertandingan: "MYRC", kategori: "Reka Edukit Cabaran Pengaturcaraan SR", kedudukan: 1, anugerah: "JOHAN", kodSekolah: "ABA1027", guru: "Muhamad Basri bin A Bakar", mata: 5 },
  { pertandingan: "MYRC", kategori: "Reka Edukit Inovasi Kreatif SM", kedudukan: 5, anugerah: "KELIMA", kodSekolah: "AEA1110", guru: "Niram Mazuin binti Mohamed Bederi", mata: 1 },
  { pertandingan: "DSTA", kategori: "Sekolah Menengah 3D dan Stop Motion", kedudukan: 1, anugerah: "JOHAN", kodSekolah: "AEA1114", guru: "Nor Naimmah binti Othman", mata: 5 },
  { pertandingan: "DSTA", kategori: "Sekolah Menengah 3D dan Stop Motion", kedudukan: 5, anugerah: "KELIMA", kodSekolah: "AEA1110", guru: "Nor Fazree Yudin bin Mohd Nor", mata: 1 },
  { pertandingan: "DSTA", kategori: "Sekolah Menengah Lukisan/Animasi 2D", kedudukan: 4, anugerah: "KEEMPAT", kodSekolah: "AFT1001", guru: "Siti Mariam binti Sahar", mata: 2 },
  { pertandingan: "DSTA", kategori: "Sekolah Rendah Lukisan/Animasi 2D", kedudukan: 2, anugerah: "NAIB JOHAN", kodSekolah: "ABA1021", guru: "Amira Shazwani binti Che Abd Ghani", mata: 4 },
  { pertandingan: "DSTA", kategori: "Sekolah Rendah Lukisan/Animasi 2D", kedudukan: 3, anugerah: "KETIGA", kodSekolah: "ABA1021", guru: "Amira Shazwani binti Che Abd Ghani", mata: 3 },
  { pertandingan: "MYCH", kategori: "Rookie Cyber Hero Sekolah Rendah", kedudukan: 3, anugerah: "KETIGA", kodSekolah: "ABA1031", guru: "Muhammad Izzat Amir bin Mahmud", mata: 3 },
  { pertandingan: "CAKNA", kategori: null, kedudukan: 3, anugerah: "KETIGA", kodSekolah: "AEA1110", guru: "Nor Fazree Yudin bin Mohd Nor", mata: 3 },
  { pertandingan: "ANDROID", kategori: "Pembangunan Aplikasi Android Sekolah Menengah", kedudukan: 3, anugerah: "KETIGA", kodSekolah: "AEE1026", guru: "Nur Adila binti Ibrahim", mata: 3 },
  { pertandingan: "MINECRAFT", kategori: "SR Tahap 2", kedudukan: 2, anugerah: "NAIB JOHAN", kodSekolah: "ABB1040", guru: "Noor Hanani binti Badrol Hisham", mata: 4 },
];

export const GURU_DATA: GuruRow[] = [
  { nama: "Nursyafiqah Liyana binti Mohd Shafiq Ong", kodSekolah: "ABA1035", pasukan: 6, top5: 5, mata: 17, pertandingan: ["MYRC"] },
  { nama: "Amira Shazwani binti Che Abd Ghani", kodSekolah: "ABA1021", pasukan: 15, top5: 2, mata: 7, pertandingan: ["DSTA", "ANDROID", "MINECRAFT", "MYRC"] },
  { nama: "Natasya Zulaikha binti Azizan", kodSekolah: "AEE1032", pasukan: 12, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Nur Adila binti Ibrahim", kodSekolah: "AEE1026", pasukan: 6, top5: 1, mata: 3, pertandingan: ["MINECRAFT", "ANDROID"] },
  { nama: "Muhamad Basri bin A Bakar", kodSekolah: "ABA1027", pasukan: 3, top5: 1, mata: 5, pertandingan: ["MYRC"] },
  { nama: "Nor Fazree Yudin bin Mohd Nor", kodSekolah: "AEA1110", pasukan: 2, top5: 2, mata: 4, pertandingan: ["DSTA", "CAKNA"] },
  { nama: "Nor Naimmah binti Othman", kodSekolah: "AEA1114", pasukan: 1, top5: 1, mata: 5, pertandingan: ["DSTA"] },
  { nama: "Noor Hanani binti Badrol Hisham", kodSekolah: "ABB1040", pasukan: 1, top5: 1, mata: 4, pertandingan: ["MINECRAFT"] },
  { nama: "Noraini binti Ahmad", kodSekolah: "AEE1032", pasukan: 3, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Noor Hajratun Ain binti Mohd Hanif", kodSekolah: "ABB1039", pasukan: 2, top5: 1, mata: 1, pertandingan: ["MYRC"] },
  { nama: "Ahmad Shah Mimi bin Mohd Rosli", kodSekolah: "ABA1035", pasukan: 1, top5: 1, mata: 2, pertandingan: ["MYRC"] },
  { nama: "Siti Mariam binti Sahar", kodSekolah: "AFT1001", pasukan: 1, top5: 1, mata: 2, pertandingan: ["DSTA"] },
  { nama: "Muhammad Izzat Amir bin Mahmud", kodSekolah: "ABA1031", pasukan: 0, top5: 1, mata: 3, pertandingan: ["MYCH"] },
  { nama: "Syarifah Zuhaa binti Syed Hamzah", kodSekolah: "AEB1033", pasukan: 3, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Nur Amalina binti Shazalee", kodSekolah: "ABA1035", pasukan: 2, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Thlakavathy A/P Munusamy", kodSekolah: "AEB1034", pasukan: 2, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Wan Noor Izham Ashraf bin Wan Azhar", kodSekolah: "AEE1032", pasukan: 2, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Niram Mazuin binti Mohamed Bederi", kodSekolah: "AEA1110", pasukan: 1, top5: 1, mata: 1, pertandingan: ["MYRC"] },
  { nama: "Ahmad Faizal bin Ahmad Teridi", kodSekolah: "ABA1035", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Aimi Amirah binti Abdul Rahman", kodSekolah: "ABA1035", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Hamizah binti Rifai", kodSekolah: "ABB1039", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Hew Jing Ting, Michelle", kodSekolah: "ABA1021", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Mohd Hariri bin Abdullah", kodSekolah: "ABA1031", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Nik Araffi bin Mat", kodSekolah: "ABA1035", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Nor Amira binti Mat Shukri", kodSekolah: "ABA1022", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Nur Amalina binti Mohd Salleh", kodSekolah: "ABC1049", pasukan: 1, top5: 0, mata: 0, pertandingan: ["DSTA"] },
  { nama: "Nur Hadhirah binti Tamsir", kodSekolah: "ABA1035", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Nur Malihah binti Kamarul Hatta", kodSekolah: "ABA1028", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Nurul Izan binti Ismail", kodSekolah: "AEB1027", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MINECRAFT"] },
  { nama: "Nurul Marliana binti Badruldin", kodSekolah: "ABA1019", pasukan: 1, top5: 0, mata: 0, pertandingan: ["NICTSED"] },
  { nama: "Rafidah binti Ahmad", kodSekolah: "AFT1001", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Raja Nurul Emileen binti R Zainal", kodSekolah: "ABA1035", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
  { nama: "Siti Hazalliana binti Halim", kodSekolah: "ABA1018", pasukan: 1, top5: 0, mata: 0, pertandingan: ["DSTA"] },
  { nama: "Siti Saadiah binti Osman", kodSekolah: "ABA1028", pasukan: 1, top5: 0, mata: 0, pertandingan: ["MYRC"] },
];
