/**
 * Data benih Mesyuarat Jawatankuasa Kurikulum Daerah Bil.1/2026 — dipakai HANYA oleh
 * `scripts/seed-mjkd-2026-bil1.ts`. Komponen/halaman tidak boleh merujuk data ini;
 * semuanya dibaca daripada baris pangkalan data.
 */
import type { SasaranMjkd } from "./enums";

export const MJKD_2026_BIL1_MESYUARAT = {
  bil: 1,
  tahun: 2026,
  tarikh: "2026-02-27",
  tempat: "Park Avenue Hotel, Sungai Petani Kedah",
} as const;

export type PerkaraBenih = {
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
  panduan: string;
  sasaran: SasaranMjkd;
  /** Nama sekolah (padanan tepat, tidak peka huruf besar-kecil) — diselesaikan kepada kod semasa seed. */
  sekolahKhususNama?: string[];
};

export const MJKD_2026_BIL1_PERKARA: PerkaraBenih[] = [
  {
    para: "1.3",
    mukaSurat: "10",
    perkara:
      "Permohonan Guru Cemerlang dan Pensyarah Cemerlang dibuka 16 Mac hingga 24 April 2026. PGB menggalakkan guru yang berminat memohon. PGB juga digalakkan memohon Pengetua Cemerlang, Guru Besar Cemerlang dan JUSA.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan bilangan guru yang memohon dan sama ada PGB turut memohon.",
    sasaran: "SEMUA",
  },
  {
    para: "1.4",
    mukaSurat: "10",
    perkara:
      "Matrik Pembelajaran (Tahun 4 pada tahun ini, Tingkatan 3 pada tahun hadapan): beri kefahaman kepada ibu bapa bahawa matrik bukan penanda aras kedudukan, tetapi untuk pengukuhan dan intervensi.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan cara dan tarikh penerangan kepada ibu bapa.",
    sasaran: "SEMUA",
  },
  {
    para: "1.6",
    mukaSurat: "11",
    perkara:
      "Budayakan PLC: tetapkan sasaran pelaksanaan PLC berdasarkan bilangan guru dan hari persekolahan, dan galakkan kolaborasi Perkongsian Amalan Terbaik dengan sekolah berdekatan.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan sasaran PLC sekolah dan bilangan PLC yang telah dilaksanakan.",
    sasaran: "SEMUA",
  },
  {
    para: "3.3",
    mukaSurat: "13",
    perkara:
      "Pengarah meminta impak Dialog Prestasi Task Force yang telah dilaksanakan, dari aspek peningkatan kefahaman dan pengetahuan, pencapaian dan prestasi sekolah.",
    tindakan: "Pengetua",
    panduan: "Nyatakan impak utama Dialog Prestasi Task Force di sekolah.",
    sasaran: "SM",
  },
  {
    para: "4.1.3 (iii)",
    mukaSurat: "15",
    perkara:
      "Laporan Perbelanjaan PCG 2025: jumlah PCG diterima, peratus penggunaan, isu berbangkit dan tindakan menangani isu. Laporan dihantar melalui kumpulan Telegram PGB.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan sama ada laporan telah dihantar dan peratus penggunaan PCG.",
    sasaran: "SEMUA",
  },
  {
    para: "4.1.3 (vii)",
    mukaSurat: "15",
    perkara:
      "Dasar 60:40 (STEM A): tubuhkan Jawatankuasa Task Force sekolah yang berfokus kepada kecemerlangan atau penambahan enrolmen kelas STEM A serta strategi mencapai Dasar 60:40.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan tarikh penubuhan Task Force dan strategi utama.",
    sasaran: "SEMUA",
  },
  {
    para: "5.5",
    mukaSurat: "17",
    perkara:
      "Muat turun JSU Tingkatan 4 dan modul intervensi, tukar kata laluan esces, dan pastikan kerahsiaan (rujuk surat JPNPK.spb.600-10/2/10 Jilid 4 Bil.74 bertarikh 11 Februari 2026).",
    tindakan: "Semua Pengetua",
    panduan: "Nyatakan status tindakan.",
    sasaran: "SM",
  },
  {
    para: "6.4",
    mukaSurat: "17",
    perkara:
      "Program TRAS: sediakan perancangan takwim, perancangan program dan aktiviti serta One Page Report (OPR), dan kongsikan dengan Timbalan Sektor Pembelajaran.",
    tindakan: "Pengetua SMK Raja Shahriman dan Pengetua SMK Pangkalan TLDM",
    panduan: "Nyatakan status takwim, program dan OPR.",
    sasaran: "SM",
    sekolahKhususNama: ["SMK Raja Shahriman", "SMK Pangkalan TLDM"],
  },
  {
    para: "7.3.4",
    mukaSurat: "20",
    perkara:
      "Sasaran 90% murid Tahap 2 hingga Tingkatan 5 cergas dalam ujian SEGAK. Isu 2025: ujian SEGAK (SK Seri Selamat) dan PAJSK (SK Pengkalan Baharu).",
    tindakan: "Guru Besar SK Seri Selamat dan Guru Besar SK Pengkalan Baharu",
    panduan: "Nyatakan tindakan penambahbaikan yang telah diambil.",
    sasaran: "SR",
    sekolahKhususNama: ["SK Seri Selamat", "SK Pengkalan Baharu"],
  },
  {
    para: "7.3.5",
    mukaSurat: "20",
    perkara:
      "Rancang dan laksanakan program ko-akademik Bahasa Melayu dan Bahasa Inggeris. Guru menggunakan Bahasa Melayu sepenuhnya semasa mengajar BM dan dicerap oleh Guru Besar.",
    tindakan: "Guru Besar SJK(C)/SJK(T)",
    panduan: "Nyatakan program yang dilaksanakan dan pencerapan guru BM.",
    sasaran: "SJK",
  },
  {
    para: "7.4",
    mukaSurat: "20",
    perkara:
      "Pencerapan guru dirancang dan dilaksanakan sepenuhnya menggunakan borang pencerapan: Guru Kanan, kemudian Ketua Panitia, kemudian guru mata pelajaran (terutama BM, BI, Matematik dan Sejarah). Pencerapan beberapa kali setahun, bukan 2 kali.",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan kekerapan pencerapan dan kemajuan setakat ini.",
    sasaran: "SEMUA",
  },
  {
    para: "17.1–17.3, 17.6",
    mukaSurat: "40–42",
    perkara:
      "SEGAK dan BMI 2026: (a) maklumkan guru berkaitan isu pelaksanaan Ujian SEGAK; (b) SEGAK Ujian 1: 6 April – 22 Mei, kunci masuk 6 April – 30 Jun; Ujian 2: 7 September – 30 Oktober, kunci masuk 7 September – 30 November; (c) BMI 5–9T (sekolah rendah): Ujian 1: 6 April – 21 Mei, kunci masuk 6 April – 21 Jun; Ujian 2: 7 September – 30 Oktober, kunci masuk 7 September – 22 November; (d) PGB mengesahkan keputusan dalam tempoh ditetapkan.",
    tindakan: "Pengetua dan Guru Besar (BMI: Guru Besar)",
    panduan: "Nyatakan status Ujian 1 dan Ujian 2 serta pengesahan keputusan.",
    sasaran: "SEMUA",
  },
  {
    para: "22.1",
    mukaSurat: "47",
    perkara: "Wujudkan Jawatankuasa Pendidikan Khas Sekolah (JPKS).",
    tindakan: "Pengetua dan Guru Besar",
    panduan: "Nyatakan tarikh penubuhan atau mesyuarat JPKS.",
    sasaran: "SEMUA",
  },
];
