/** Jenis data SahPantas AINS — dikongsi enjin, halaman dan protokol mesej. */

export type Bahasa = "zh" | "ta" | "bm" | "en" | "campur" | "lain";
export type Jalur = "D1-2" | "D3-4" | "D5-6" | "M";
export type Warna = "hijau" | "kuning" | "merah";
/** Unit ukuran panjang: perkataan ("kata") atau aksara Han ("zh"). */
export type Ukuran = "kata" | "zh";

/** Satu rekod menunggu seperti dibaca daripada senarai AINS. */
export type RekodAins = {
  id: string;
  tajuk: string;
  /** cth. "Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm" */
  meta: string;
  rumusan: string;
  pengajaran: string;
  murid: string;
  /** cth. "TAHUN 4 4D", "TINGKATAN 2 …", "PERALIHAN …" */
  kelas: string;
};

export type KodSebab =
  | "ruangan-kosong"
  | "terlalu-pendek"
  | "templat"
  | "rumusan-sama-pengajaran"
  | "hantar-semula-sama"
  | "teks-rawak"
  | "bahasa-tak-sepadan"
  | "bahasa-bercampur"
  | "agak-pendek"
  | "terlalu-panjang"
  | "rumusan-sama-2-buku"
  | "sama-murid-lain"
  | "buku-sama-berulang"
  | "simbol-pengisi"
  | "tiada-unsur-pengajaran";

export type KodMaklumat = "murid-luar-biasa" | "frasa-ai";

export type Keputusan = {
  id: string;
  warna: Warna;
  merah: KodSebab[];
  kuning: KodSebab[];
  maklumat: KodMaklumat[];
  bahasa: Bahasa;
  jalur: Jalur;
  /** D1–D6, T1–T5, P atau "?" */
  kodTahap: string;
  panjang: number;
};
