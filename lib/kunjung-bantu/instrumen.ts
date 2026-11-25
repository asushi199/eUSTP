/**
 * Instrumen Kunjung Bantu Pengurusan Sumber dan Teknologi Pendidikan (JPN Perak) —
 * lampiran surat JPNPk.SSTP.100-1/5/1 Jld.3 (75), "Pemerkasaan Pendigitalan DELIMa dalam PdP
 * serta Pengurusan Organisasi Sekolah Tahun 2026–2027".
 *
 * Fail tulen (tiada DB) — selamat diimport komponen klien.
 * `no` = penomboran asal JPN (dikekalkan supaya pegawai boleh banding dengan borang kertas;
 * JPN menggunakan "2.1" dua kali — `id` unik dalaman membezakannya).
 */

export const SESI_KUNJUNG_BANTU = "2026-2027";
export const NAMA_INSTRUMEN = "Kunjung Bantu DELIMa";
export const TAJUK_RASMI =
  "Instrumen Kunjung Bantu Pengurusan Sumber dan Teknologi Pendidikan";
export const RUJUKAN_SURAT = "JPNPk.SSTP.100-1/5/1 Jld.3 (75)";
export const ACCENT_KUNJUNG_BANTU = "#0F766E";

export type ItemInstrumen = {
  id: string;
  no: string;
  item: string;
  /** Panduan ringkas untuk sekolah (pilihan). */
  panduan?: string;
  /** Placeholder ruang catatan/bukti. */
  placeholderCatatan?: string;
  /** Pautan rujukan berkaitan item. */
  pautan?: { label: string; href: string };
  /** Jika "Ya", catatan wajib berupa pautan (cth. dashboard sekolah). */
  wajibPautan?: boolean;
};

export type AspekInstrumen = {
  bil: number;
  tajuk: string;
  /** Label tab (ringkas, untuk telefon). */
  tajukPendek: string;
  subtajuk?: string;
  /** Aspek "auto": nilai diambil daripada data d3 DELIMa — sekolah tidak mengisi. */
  auto?: boolean;
  items: ItemInstrumen[];
};

export const TELEGRAM_SSTP = "https://t.me/SSTPJPNPerak";

export const ASPEK: AspekInstrumen[] = [
  {
    bil: 1,
    tajuk: "Pengurusan Sekolah",
    tajukPendek: "Pengurusan",
    items: [
      { id: "1.1", no: "1.1", item: "Jawatankuasa DELIMa" },
      { id: "1.2", no: "1.2", item: "Fail / e-fail DELIMa (Punca Kuasa KPM/JPN)" },
      { id: "1.3", no: "1.3", item: "Carta organisasi" },
      { id: "1.4", no: "1.4", item: "Perancangan strategik", panduan: "Pelan strategik DELIMa 2026–2027." },
      { id: "1.5", no: "1.5", item: "Laporan / e-laporan pelaksanaan / aktiviti DELIMa" },
      { id: "1.6", no: "1.6", item: "Mesyuarat / minit mesyuarat" },
      {
        id: "1.7",
        no: "1.7",
        item: "Program DELIMa dalam takwim sekolah",
        panduan: "Cth. Minggu ICT/DELIMa, pelancaran & promosi DELIMa 2027, LDP DELIMa.",
      },
      {
        id: "1.8",
        no: "1.8",
        item: "Dashboard (site rasmi sekolah) #1sekolah1sites",
        placeholderCatatan: "Pautan site rasmi sekolah (https://…)",
        wajibPautan: true,
      },
      {
        id: "1.9",
        no: "1.9",
        item: "Jadual penggunaan DELIMa (sekurang-kurangnya sebulan sekali seorang guru)",
        panduan: "Dilaksana bermula Januari 2027.",
      },
      {
        id: "2.0",
        no: "2.0",
        item: "Pemantauan oleh Pengetua / Guru Besar bagi pelaksanaan jadual pada para 1.9",
        placeholderCatatan: "Jadual pemantauan / pautan bukti",
      },
      { id: "2.0a", no: "2.0a", item: "Pengurusan digital dalam kurikulum" },
      { id: "2.0b", no: "2.0b", item: "Pengurusan digital dalam hal ehwal murid" },
      { id: "2.0c", no: "2.0c", item: "Pengurusan digital dalam kokurikulum" },
      {
        id: "1-2.1",
        no: "2.1",
        item: "Menyertai group Telegram SSTP JPN Perak",
        pautan: { label: "t.me/SSTPJPNPerak", href: TELEGRAM_SSTP },
      },
    ],
  },
  {
    bil: 2,
    tajuk: "Pembudayaan DELIMa",
    tajukPendek: "Pembudayaan",
    subtajuk: "Dashboard Status Penggunaan DELIMa / Perak Drift",
    auto: true,
    items: [
      { id: "2.1", no: "2.1", item: "Peratus semasa penggunaan guru" },
      { id: "2.2", no: "2.2", item: "Peratus semasa penggunaan murid" },
      { id: "2.3", no: "2.3", item: "Peratus keseluruhan semasa sekolah" },
    ],
  },
  {
    bil: 3,
    tajuk: "Promosi",
    tajukPendek: "Promosi",
    items: [
      { id: "3.1", no: "3.1", item: "Promosi / pelancaran DELIMa" },
      { id: "3.2", no: "3.2", item: "Kursus dalaman kepada guru" },
      { id: "3.3", no: "3.3", item: "Aktiviti / kursus dalaman kepada murid" },
      { id: "3.4", no: "3.4", item: "Papan kenyataan, sudut, bilik DELIMa" },
      { id: "3.5", no: "3.5", item: "Pertandingan berkaitan DELIMa" },
    ],
  },
  {
    bil: 4,
    tajuk: "Penggunaan DELIMa Pengurusan Sekolah",
    tajukPendek: "Penggunaan",
    subtajuk: "ID CM DELIMa",
    items: [
      { id: "4.1", no: "4.1", item: "DELIMa dalam pengurusan" },
      { id: "4.2", no: "4.2", item: "DELIMa dalam kurikulum" },
      {
        id: "4.3",
        no: "4.3",
        item: "DELIMa dalam kokurikulum",
        panduan: "Cth. pendaftaran murid kelab/persatuan/permainan secara dalam talian.",
      },
      {
        id: "4.4",
        no: "4.4",
        item: "DELIMa dalam HEM",
        panduan: "Termasuk kaunseling: site kerjaya/pengajian & site kaunselor di dashboard sekolah.",
      },
    ],
  },
  {
    bil: 5,
    tajuk: "Pensijilan DELIMa Guru",
    tajukPendek: "Pensijilan",
    subtajuk: "DCTP, Google, Microsoft, Apple dan lain-lain",
    items: [
      { id: "5.1", no: "5.1", item: "DELIMa Certified Training Programme (DCTP)" },
      { id: "5.2", no: "5.2", item: "Google" },
      { id: "5.3", no: "5.3", item: "Microsoft" },
      { id: "5.4", no: "5.4", item: "Apple" },
      { id: "5.5", no: "5.5", item: "Lain-lain" },
    ],
  },
  {
    bil: 6,
    tajuk: "Keistimewaan Sekolah",
    tajukPendek: "Keistimewaan",
    items: [
      { id: "6.1", no: "6.1", item: "Kolaboratif / jaringan / jalinan" },
      { id: "6.2", no: "6.2", item: "Web / portal / dashboard DELIMa" },
      { id: "6.3", no: "6.3", item: "Inovasi" },
      { id: "6.4", no: "6.4", item: "Pencapaian dan anugerah" },
      { id: "6.5", no: "6.5", item: "Sumbangan bahan PdP di Ruang Ilmu DELIMa" },
    ],
  },
];

/** Item yang diisi sekolah (Ya/Tidak) — tidak termasuk aspek auto. */
export const ITEM_DIISI: ItemInstrumen[] = ASPEK.filter((a) => !a.auto).flatMap((a) => a.items);
export const ID_ITEM_DIISI = new Set(ITEM_DIISI.map((i) => i.id));

export type JawapanItem = { ya: boolean | null; catatan: string };
export type Jawapan = Record<string, JawapanItem>;

export type MaklumatSekolah = {
  namaPgb: string;
  namaPkPentadbiran: string;
  namaAdminDelima: string;
};

/** Semakan pegawai satu item: SAH = disahkan; BAIKI = perlu dibaiki oleh sekolah. */
export type StatusSemakItem = "SAH" | "BAIKI";
export type SemakanItem = { status: StatusSemakItem | null; catatan: string };
export type Semakan = Record<string, SemakanItem>;

export type StatusRekod = "DIHANTAR" | "PERLU_PEMBETULAN" | "DISAHKAN";

export const STATUS_LABEL: Record<StatusRekod | "BELUM" | "DRAF", string> = {
  BELUM: "Belum diisi",
  DRAF: "Draf",
  DIHANTAR: "Menunggu semakan",
  PERLU_PEMBETULAN: "Perlu pembetulan",
  DISAHKAN: "Disahkan",
};

export function isStatusRekod(v: string): v is StatusRekod {
  return v === "DIHANTAR" || v === "PERLU_PEMBETULAN" || v === "DISAHKAN";
}

/** Peratus DELIMa (d3) satu sekolah, dibekukan semasa disahkan. */
export type DelimaSekolah = {
  tempoh: string;
  guru: { aktif: number; jumlah: number; peratus: number } | null;
  murid: { aktif: number; jumlah: number; peratus: number } | null;
  keseluruhan: { aktif: number; jumlah: number; peratus: number } | null;
};

export function nilaiAuto(
  d: DelimaSekolah | null,
  id: string,
): { aktif: number; jumlah: number; peratus: number } | null {
  if (!d) return null;
  if (id === "2.1") return d.guru;
  if (id === "2.2") return d.murid;
  if (id === "2.3") return d.keseluruhan;
  return null;
}

export function formatPeratus(p: number): string {
  return `${p.toLocaleString("ms-MY", { maximumFractionDigits: 1 })}%`;
}

export function isPautan(v: string): boolean {
  return /^https?:\/\/\S+\.\S+/i.test(v.trim());
}

/** Satu item lengkap: Ya/Tidak dipilih, dan pautan sah jika item memerlukannya. */
export function itemLengkap(it: ItemInstrumen, jawapan: Jawapan): boolean {
  const j = jawapan[it.id];
  if (!j || j.ya === null) return false;
  return !(it.wajibPautan && j.ya && !isPautan(j.catatan));
}

/** Aspek lengkap: semua item diisi (aspek auto sentiasa lengkap). */
export function aspekLengkap(a: AspekInstrumen, jawapan: Jawapan): boolean {
  return a.auto === true || a.items.every((it) => itemLengkap(it, jawapan));
}

export function maklumatLengkap(m: MaklumatSekolah): boolean {
  return Boolean(m.namaPgb.trim() && m.namaAdminDelima.trim());
}

/** Semak jawapan sebelum dihantar. Pulangkan mesej ralat pertama, atau null jika sah. */
export function semakLengkap(maklumat: MaklumatSekolah, jawapan: Jawapan): string | null {
  if (!maklumat.namaPgb.trim()) return "Sila isi nama Pengetua / Guru Besar.";
  if (!maklumat.namaAdminDelima.trim()) return "Sila isi nama Admin DELIMa.";
  for (const it of ITEM_DIISI) {
    if (itemLengkap(it, jawapan)) continue;
    if (jawapan[it.id]?.ya == null) {
      return `Sila tandakan Ya atau Tidak bagi item ${it.no} (${it.item}).`;
    }
    return `Item ${it.no}: sila masukkan pautan (bermula https://).`;
  }
  return null;
}

export function kiraYa(jawapan: Jawapan): { ya: number; jumlah: number } {
  let ya = 0;
  for (const it of ITEM_DIISI) if (jawapan[it.id]?.ya === true) ya += 1;
  return { ya, jumlah: ITEM_DIISI.length };
}

/** Item yang ditanda "Perlu dibaiki" oleh pegawai. */
export function itemPerluBaiki(semakan: Semakan): string[] {
  return ITEM_DIISI.filter((it) => semakan[it.id]?.status === "BAIKI").map((it) => it.id);
}
