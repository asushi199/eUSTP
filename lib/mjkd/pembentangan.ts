/**
 * Mod Pembentangan MJKD 2026 (v2) — logik tulen (tiada akses DB; selamat dibawa ke klien).
 * Satu dek berterusan mengikut bab: Pembukaan → Kehadiran → Minit → Maklum Balas → Pembentangan
 * Sektor → Penutup. Jumlah sekolah SENTIASA dikira daripada data (tiada nombor tetap); tiada zon.
 */
import { kumpulBahan, urlEmbedBahan, urlMuatTurunBahan } from "./bahan";
import { STATUS_MJKD, formatTarikhMs, labelMesyuarat } from "./enums";
import { labelBeberapaHari, labelHariPendek } from "./hari";
import {
  kiraKehadiran,
  kodSekolahHadir,
  tapisRekodHari,
  type KiraanKehadiran,
} from "./kehadiran";
import { kenalJenisSekolah, peringkat } from "./jenis-sekolah";
import { hitungKemajuan, kiraStatus, type BilanganStatus } from "./ringkasan";
import { perkaraUntukSekolah } from "./sasaran";

export const NAMA_MESYUARAT_PENUH = "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung";
export const PANJANG_RINGKAS = 240;

/* --------------------------------- data --------------------------------- */

export type PerkaraPembentangan = {
  id: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
  sasaran: string;
  sekolahKhusus: string[];
  aktif: boolean;
  sort: number;
};

export type MesyuaratPembentangan = {
  bil: number;
  tahun: number;
  tarikh: string;
  tempat: string;
  minitUrl: string;
};

export type SekolahPembentangan = { code: string; name: string; zone?: string };

export type MaklumBalasPembentangan = {
  id: string;
  schoolCode: string;
  namaPengisi?: string;
  jawatanPengisi?: string;
  /** ISO — masa dihantar (untuk "BARU" dan paparan Spotlight). */
  tarikhHantar?: string;
};

export type ItemPembentangan = {
  /** id item (diperlukan untuk togol Sorotan). */
  id?: string;
  maklumBalasId: string;
  perkaraId: string;
  status: string;
  catatan: string;
  pautanBukti: string;
  /** Path Drive gambar bukti (pilihan; data lama tiada). */
  fotoBukti?: string[];
  /** Sorotan (lajur `dipilih`) — tanda sahaja, tidak menentukan susunan slaid. */
  dipilih: boolean;
  susunanBacaan?: number | null;
};

export type BahanPembentangan = {
  id: string;
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hari: string[];
  jenis: string;
  url: string;
  storagePath: string;
  createdAt: string;
};

export type RekodKehadiranSlaid = {
  jenis: string;
  schoolCode: string | null;
  tarikh: string;
  /** Sektor pegawai PPD (daripada `pegawai_ppd.sektor`); kosong = Lain-lain. */
  sektor?: string;
};

/** Muatan penuh mod pembentangan (boleh disiri — dihantar oleh pelayan & disimpan di localStorage). */
export type DataPentas = {
  rujukan: MesyuaratPembentangan;
  perkara: PerkaraPembentangan[];
  sekolah: SekolahPembentangan[];
  maklumBalas: MaklumBalasPembentangan[];
  items: ItemPembentangan[];
  bahan: BahanPembentangan[];
  kehadiran: { hariIni: string; rekod: RekodKehadiranSlaid[] };
  /** ISO — masa data dimuat di pelayan. */
  dimuatPada: string;
};

/**
 * Tandatangan ringan untuk polling: `utama` berubah = muat semula penuh; `hadir` berubah =
 * muat semula kehadiran sahaja.
 */
export type VersiPentas = { utama: string; hadir: string };

/* ------------------------------- jenis slaid ------------------------------- */

export type Bab = "pembukaan" | "kehadiran" | "minit" | "maklum-balas" | "pembentangan" | "penutup";

export const SENARAI_BAB: readonly { id: Bab; label: string }[] = [
  { id: "pembukaan", label: "Pembukaan" },
  { id: "kehadiran", label: "Kehadiran" },
  { id: "minit", label: "Minit" },
  { id: "maklum-balas", label: "Maklum Balas" },
  { id: "pembentangan", label: "Pembentangan Sektor" },
  { id: "penutup", label: "Penutup" },
];

type Asas = { kunci: string; bab: Bab; tajuk: string };

export type SektorHadir = { sektor: string; bil: number };

export type SlaidPembukaan = Asas & {
  jenis: "pembukaan";
  sekolahHadir: number;
  pegawaiHadir: number;
};

export type SlaidKehadiran = Asas & {
  jenis: "kehadiran";
  hariLabel: string;
  sekolahHadir: number;
  pegawaiHadir: number;
  pegawaiSektor: SektorHadir[];
  lain: number;
};

export type SlaidMinit = Asas & {
  jenis: "minit";
  label: string;
  tarikh: string;
  tempat: string;
  minitUrl: string;
  muatTurunUrl: string;
  para: string[];
};

export type BarisAnalisis = {
  perkaraId: string;
  para: string;
  mukaSurat: string;
  perkaraRingkas: string;
  bilangan: BilanganStatus;
  /** Sekolah (terpakai) yang telah menjawab. */
  dihantar: number;
  /** Sekolah yang perkara ini terpakai. */
  dijangka: number;
};

export type Analisis = {
  baris: BarisAnalisis[];
  /** Sekolah yang telah menghantar maklum balas (antara sekolah yang dijangka). */
  sekolahDihantar: number;
  sekolahJumlah: number;
};

export type PapanPemuka = {
  kpi: {
    sekolahDihantar: number;
    sekolahJumlah: number;
    /** Semua jawapan terpakai merentas perkara. */
    bilangan: BilanganStatus;
  };
  perkara: BarisAnalisis[];
};

export type SlaidPapanPemuka = Asas & { jenis: "papan-pemuka" } & PapanPemuka;

export type TileSekolah = {
  kod: string;
  nama: string;
  namaPendek: string;
  /** null = belum menghantar. */
  status: string | null;
  itemId: string | null;
  sorotan: boolean;
  baru: boolean;
};

export type SlaidPerkara = Asas & {
  jenis: "perkara";
  perkaraId: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
  bilangan: BilanganStatus;
  dihantar: number;
  dijangka: number;
  jubin: TileSekolah[];
};

/** Status jubin mozek "Semua soalan" bagi sekolah yang telah menghantar. */
export const STATUS_HANTAR = "HANTAR";

/** Semua soalan: mozek sekolah (klik = semua jawapan satu sekolah). */
export type SlaidSemuaSoalan = Asas & {
  jenis: "semua-soalan";
  bilangan: BilanganStatus;
  sekolahDihantar: number;
  sekolahJumlah: number;
  jubin: TileSekolah[];
};

export type SesiAturCara = {
  /** Kunci slaid bahan. */
  kunci: string;
  nombor: number;
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  jenisLabel: string;
};

export type SlaidAturCara = Asas & {
  jenis: "atur-cara";
  hari: { hari: string; label: string; sesi: SesiAturCara[] }[];
};

export type SlaidBahan = Asas & {
  jenis: "bahan";
  id: string;
  sektorUnit: string;
  namaPembentang: string;
  hariLabel: string;
  jenisLabel: string;
  /** URL benam (iframe) atau null jika perlu dibuka di tab baharu. */
  embedUrl: string | null;
  bukaUrl: string;
  muatTurunUrl: string | null;
  nombor: number;
  daripada: number;
};

export type SlaidPenutup = Asas & {
  jenis: "penutup";
  sekolahHadir: number;
  sekolahDihantar: number;
  /** null = tiada jawapan lagi. */
  peratusSelesai: number | null;
};

export type Slaid =
  | SlaidPembukaan
  | SlaidKehadiran
  | SlaidMinit
  | SlaidPapanPemuka
  | SlaidPerkara
  | SlaidSemuaSoalan
  | SlaidAturCara
  | SlaidBahan
  | SlaidPenutup;

/* --------------------------------- bantuan --------------------------------- */

/** Potong teks panjang pada sempadan perkataan dengan "…". */
export function ringkasTeks(teks: string, maks = PANJANG_RINGKAS): string {
  const t = teks.trim().replace(/\s+/g, " ");
  if (t.length <= maks) return t;
  const potong = t.slice(0, maks);
  const ruang = potong.lastIndexOf(" ");
  return `${(ruang > maks * 0.6 ? potong.slice(0, ruang) : potong).replace(/[\s,;:.\-–]+$/, "")}…`;
}

function isihPerkara<T extends { sort: number; para: string }>(perkara: readonly T[]): T[] {
  return [...perkara].sort((a, b) => a.sort - b.sort || a.para.localeCompare(b.para, "ms"));
}

/** Pautan muat turun minit (Supabase menyokong `?download=<nama fail>`). */
export function urlMuatTurunMinit(m: { bil: number; tahun: number; minitUrl: string }): string {
  if (!m.minitUrl) return "";
  const nama = encodeURIComponent(`Minit-MJKD-Bil${m.bil}-${m.tahun}.pdf`);
  return `${m.minitUrl}${m.minitUrl.includes("?") ? "&" : "?"}download=${nama}`;
}

const AKRONIM_SEKOLAH = new Set([
  "SK",
  "SJK",
  "SJKC",
  "SJK(C)",
  "SJKT",
  "SJK(T)",
  "SM",
  "SMK",
  "SMJK",
  "SMKA",
  "SMA",
  "SMS",
  "SMT",
  "SMV",
  "SBP",
  "SABK",
  "SRA",
  "KV",
  "MRSM",
  "PPD",
  "KPM",
  "FELDA",
  "LKTP",
  "(C)",
  "(T)",
  "II",
  "III",
  "IV",
]);

/** "SK MUHAMMAD SAMAN" -> "SK Muhammad Saman" (akronim jenis sekolah kekal huruf besar). */
export function namaPendek(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const besar = w.toUpperCase();
      if (AKRONIM_SEKOLAH.has(besar) || /\d/.test(w)) return besar;
      return w.toLowerCase().replace(/(^|[-/('.])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
    })
    .join(" ");
}

/**
 * Saiz jubin mozek supaya SEMUA sekolah muat tanpa tatal: pilih bilangan lajur yang memberi fon
 * terbesar (nama 2 baris mesti muat). ~100 sekolah pada 1028×820 -> 7 lajur, fon ≈ 15px;
 * bilangan kecil -> jubin besar (lebar maks 420px).
 */
export function ukuranMozek(
  n: number,
  lebar: number,
  tinggi: number,
): { lajur: number; w: number; h: number; fon: number; gap: number } {
  const gap = 8;
  const bil = Math.max(1, n);
  let terbaik: { lajur: number; w: number; h: number; fon: number } | null = null;
  for (let c = 1; c <= Math.min(14, bil); c += 1) {
    const w = Math.min(420, (lebar - (c - 1) * gap) / c);
    const baris = Math.ceil(bil / c);
    const h = Math.min(120, w * 0.62, (tinggi - (baris - 1) * gap) / baris);
    const fon = Math.min(30, h * 0.33, w / 9.5);
    if (!terbaik || fon > terbaik.fon + 0.2) terbaik = { lajur: c, w, h, fon };
  }
  const t = terbaik!;
  return {
    lajur: t.lajur,
    w: Math.floor(t.w * 10) / 10,
    h: Math.floor(t.h * 10) / 10,
    fon: Math.max(12, Math.round(t.fon * 10) / 10),
    gap,
  };
}

/* ------------------------------- Maklum Balas ------------------------------- */

type InputMaklumBalas = {
  perkara: readonly PerkaraPembentangan[];
  sekolah: readonly SekolahPembentangan[];
  maklumBalas: readonly Pick<MaklumBalasPembentangan, "id" | "schoolCode">[];
  items: readonly ItemPembentangan[];
};

const terpakaiKepada = (p: PerkaraPembentangan, sekolah: readonly SekolahPembentangan[]) =>
  sekolah.filter((s) => perkaraUntukSekolah([p], s).length > 0);

/**
 * Analisis: satu baris bagi setiap perkara aktif — kiraan status dan "dihantar x / y sekolah"
 * (hanya sekolah yang perkara itu terpakai), serta "sekolah telah menghantar x / y".
 */
export function binaAnalisis(input: InputMaklumBalas): Analisis {
  const kodMengikutMb = new Map(input.maklumBalas.map((m) => [m.id, m.schoolCode]));
  const aktif = input.perkara.filter((p) => p.aktif);
  const baris: BarisAnalisis[] = isihPerkara(aktif).map((p) => {
    const kodTerpakai = new Set(terpakaiKepada(p, input.sekolah).map((s) => s.code));
    const itemTerpakai = input.items.filter((it) => {
      const kod = kodMengikutMb.get(it.maklumBalasId);
      return it.perkaraId === p.id && kod !== undefined && kodTerpakai.has(kod);
    });
    return {
      perkaraId: p.id,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkaraRingkas: ringkasTeks(p.perkara, 110),
      bilangan: kiraStatus(itemTerpakai),
      dihantar: itemTerpakai.length,
      dijangka: kodTerpakai.size,
    };
  });
  const kemajuan = hitungKemajuan(
    input.sekolah.map((s) => ({ code: s.code, name: s.name, zone: s.zone ?? "" })),
    aktif,
    new Set(input.maklumBalas.map((m) => m.schoolCode)),
  );
  return { baris, sekolahDihantar: kemajuan.dihantar, sekolahJumlah: kemajuan.dijangka };
}

/** Papan Pemuka Daerah: KPI keseluruhan + baris setiap perkara (tanpa zon). */
export function kiraPapanPemuka(input: InputMaklumBalas): PapanPemuka {
  const a = binaAnalisis(input);
  const bilangan = { jumlah: 0 } as BilanganStatus;
  for (const s of STATUS_MJKD) bilangan[s] = 0;
  for (const b of a.baris) {
    for (const s of STATUS_MJKD) bilangan[s] += b.bilangan[s];
    bilangan.jumlah += b.bilangan.jumlah;
  }
  return {
    kpi: { sekolahDihantar: a.sekolahDihantar, sekolahJumlah: a.sekolahJumlah, bilangan },
    perkara: a.baris,
  };
}

/**
 * Jubin mozek satu perkara: SEMUA sekolah yang perkara itu terpakai (belum menghantar =
 * status null), diisih SR dahulu, kemudian SM (jenis tidak dikenali di hujung), dan dalam
 * setiap peringkat ikut kod sekolah — memudahkan PGB mencari sekolah sendiri.
 */
export function binaMozek(
  p: PerkaraPembentangan,
  sekolah: readonly SekolahPembentangan[],
  maklumBalas: readonly MaklumBalasPembentangan[],
  items: readonly ItemPembentangan[],
  opts: { baru?: ReadonlySet<string> } = {},
): TileSekolah[] {
  const mbMengikutKod = new Map(maklumBalas.map((m) => [m.schoolCode, m]));
  const itemMengikutMb = new Map(
    items.filter((it) => it.perkaraId === p.id).map((it) => [it.maklumBalasId, it]),
  );
  return terpakaiKepada(p, sekolah)
    .map((s) => {
      const mb = mbMengikutKod.get(s.code);
      const it = mb ? itemMengikutMb.get(mb.id) : undefined;
      return {
        kod: s.code,
        nama: s.name,
        namaPendek: namaPendek(s.name),
        status: it ? it.status : null,
        itemId: it?.id ?? null,
        sorotan: Boolean(it?.dipilih),
        baru: Boolean(it && opts.baru?.has(s.code)),
      };
    })
    .sort((a, b) => kedudukanPeringkat(a) - kedudukanPeringkat(b) || a.kod.localeCompare(b.kod));
}

/** 0 = SR, 1 = SM, 2 = jenis tidak dikenali. */
function kedudukanPeringkat(j: { kod: string; nama: string }): number {
  const jenis = kenalJenisSekolah(j.nama, j.kod);
  if (!jenis) return 2;
  return peringkat(jenis) === "SR" ? 0 : 1;
}

/**
 * Jubin mozek "Semua soalan": SEMUA sekolah yang sekurang-kurangnya satu perkara aktif terpakai
 * (sama seperti penyebut KPI "telah menghantar"); status = HANTAR / null. Susunan seperti mozek perkara.
 */
export function binaMozekSekolah(
  perkara: readonly PerkaraPembentangan[],
  sekolah: readonly SekolahPembentangan[],
  maklumBalas: readonly MaklumBalasPembentangan[],
  opts: { baru?: ReadonlySet<string> } = {},
): TileSekolah[] {
  const aktif = perkara.filter((p) => p.aktif);
  const kodHantar = new Set(maklumBalas.map((m) => m.schoolCode));
  return sekolah
    .filter((s) => perkaraUntukSekolah(aktif, s).length > 0)
    .map((s) => {
      const hantar = kodHantar.has(s.code);
      return {
        kod: s.code,
        nama: s.name,
        namaPendek: namaPendek(s.name),
        status: hantar ? STATUS_HANTAR : null,
        itemId: null,
        sorotan: false,
        baru: Boolean(hantar && opts.baru?.has(s.code)),
      };
    })
    .sort((a, b) => kedudukanPeringkat(a) - kedudukanPeringkat(b) || a.kod.localeCompare(b.kod));
}

export type JawapanPerkara = { perkara: PerkaraPembentangan; item: ItemPembentangan | null };

/** Semua jawapan satu sekolah: setiap perkara aktif yang terpakai (ikut susunan minit). */
export function jawapanSemuaPerkara(
  data: Pick<DataPentas, "perkara" | "sekolah" | "maklumBalas" | "items">,
  kod: string,
): { sekolah: SekolahPembentangan | null; mb: MaklumBalasPembentangan | null; baris: JawapanPerkara[] } {
  const sekolah = data.sekolah.find((s) => s.code === kod) ?? null;
  const mb = data.maklumBalas.find((m) => m.schoolCode === kod) ?? null;
  if (!sekolah) return { sekolah, mb, baris: [] };
  const itemIkutPerkara = new Map(
    mb ? data.items.filter((it) => it.maklumBalasId === mb.id).map((it) => [it.perkaraId, it]) : [],
  );
  const baris = isihPerkara(perkaraUntukSekolah(data.perkara.filter((p) => p.aktif), sekolah)).map((p) => ({
    perkara: p,
    item: itemIkutPerkara.get(p.id) ?? null,
  }));
  return { sekolah, mb, baris };
}

/** Urutan Spotlight (←/→): sekolah yang telah menghantar sahaja, ikut susunan mozek. */
export function urutanSpotlight(jubin: readonly TileSekolah[]): string[] {
  return jubin.filter((j) => j.status !== null).map((j) => j.kod);
}

/** Jawapan satu sekolah bagi satu perkara (untuk Spotlight). */
export function jawapanSekolah(
  data: Pick<DataPentas, "sekolah" | "maklumBalas" | "items">,
  perkaraId: string,
  kod: string,
): {
  sekolah: SekolahPembentangan | null;
  mb: MaklumBalasPembentangan | null;
  item: ItemPembentangan | null;
} {
  const sekolah = data.sekolah.find((s) => s.code === kod) ?? null;
  const mb = data.maklumBalas.find((m) => m.schoolCode === kod) ?? null;
  const item = mb
    ? (data.items.find((it) => it.maklumBalasId === mb.id && it.perkaraId === perkaraId) ?? null)
    : null;
  return { sekolah, mb, item };
}

/**
 * Perbezaan antara dua muatan: sekolah yang baru menghantar / mengemas kini maklum balas, dan
 * sekolah yang baru hadir (untuk denyutan "BARU").
 */
export function bezaData(
  lama: Pick<DataPentas, "maklumBalas" | "kehadiran">,
  baru: Pick<DataPentas, "maklumBalas" | "kehadiran">,
): { maklumBalas: Set<string>; hadir: Set<string> } {
  const masaLama = new Map(lama.maklumBalas.map((m) => [m.schoolCode, m.tarikhHantar ?? ""]));
  const maklumBalas = new Set<string>();
  for (const m of baru.maklumBalas) {
    const sebelum = masaLama.get(m.schoolCode);
    if (sebelum === undefined || (m.tarikhHantar ?? "") > sebelum) maklumBalas.add(m.schoolCode);
  }
  const hadirLama = kodSekolahHadir(lama.kehadiran.rekod);
  const hadir = new Set([...kodSekolahHadir(baru.kehadiran.rekod)].filter((k) => !hadirLama.has(k)));
  return { maklumBalas, hadir };
}

/* -------------------------------- Kehadiran -------------------------------- */

/** Kiraan kehadiran bagi satu hari — dipakai slaid Kehadiran dan penyegaran langsung. */
export function kiraanKehadiranHari(
  rekod: readonly RekodKehadiranSlaid[],
  kodSekolah: readonly string[],
  hari: string,
): KiraanKehadiran {
  return kiraKehadiran(tapisRekodHari(rekod, hari), kodSekolah);
}

export const SEKTOR_LAIN = "Lain-lain";

/** Pegawai PPD hadir mengikut sektor (kosong / "Tiada dalam senarai" = Lain-lain, di hujung). */
export function pegawaiMengikutSektor(rekod: readonly RekodKehadiranSlaid[]): SektorHadir[] {
  const peta = new Map<string, number>();
  for (const r of rekod) {
    if (r.jenis !== "PEGAWAI") continue;
    const sektor = r.sektor?.trim() || SEKTOR_LAIN;
    peta.set(sektor, (peta.get(sektor) ?? 0) + 1);
  }
  return [...peta.entries()]
    .map(([sektor, bil]) => ({ sektor, bil }))
    .sort((a, b) => {
      if (a.sektor === SEKTOR_LAIN) return 1;
      if (b.sektor === SEKTOR_LAIN) return -1;
      return b.bil - a.bil || a.sektor.localeCompare(b.sektor, "ms");
    });
}

/* ---------------------------------- Bahan ---------------------------------- */

/** Label jenis bahan untuk atur cara: Canva / Slides / Docs / Sheets / PDF / Pautan. */
export function labelJenisBahan(b: { jenis: string; url: string }): string {
  if (b.jenis === "PDF") return "PDF";
  try {
    const u = new URL(b.url);
    const host = u.hostname.toLowerCase();
    if (host.endsWith("canva.com") || host === "canva.link") return "Canva";
    if (host === "docs.google.com") {
      if (u.pathname.startsWith("/presentation")) return "Slides";
      if (u.pathname.startsWith("/document")) return "Docs";
      if (u.pathname.startsWith("/spreadsheets")) return "Sheets";
    }
    if (host === "drive.google.com") return "Drive";
  } catch {
    /* bukan URL */
  }
  return "Pautan";
}

/* ---------------------------------- Dek ---------------------------------- */

export type InputDek = {
  data: DataPentas;
  /** Kod sekolah yang baru menghantar (denyutan BARU pada mozek). */
  baru?: ReadonlySet<string>;
};

/** Kunci slaid perkara (stabil merentas penyegaran data). */
export const kunciPerkara = (perkaraId: string) => `perkara-${perkaraId}`;
export const KUNCI_SEMUA_SOALAN = "semua-soalan";

/**
 * Dek penuh mengikut bab. `kunci` stabil supaya kedudukan semasa dikekalkan selepas data
 * disegarkan. Perkara: satu slaid bagi SETIAP perkara aktif (walaupun belum ada jawapan).
 */
export function binaDek({ data, baru }: InputDek): Slaid[] {
  const kodSekolah = data.sekolah.map((s) => s.code);
  const kodSah = new Set(kodSekolah);
  const rekodHariIni = tapisRekodHari(data.kehadiran.rekod, data.kehadiran.hariIni);
  const kiraanHariIni = kiraanKehadiranHari(data.kehadiran.rekod, kodSekolah, data.kehadiran.hariIni);
  const papan = kiraPapanPemuka(data);

  const dek: Slaid[] = [
    {
      jenis: "pembukaan",
      kunci: "pembukaan",
      bab: "pembukaan",
      tajuk: "Pembukaan",
      sekolahHadir: kiraanHariIni.sekolahHadir,
      pegawaiHadir: kiraanHariIni.pegawai,
    },
    {
      jenis: "kehadiran",
      kunci: "kehadiran",
      bab: "kehadiran",
      tajuk: "Kehadiran",
      hariLabel: labelHariPendek(data.kehadiran.hariIni),
      sekolahHadir: kiraanHariIni.sekolahHadir,
      pegawaiHadir: kiraanHariIni.pegawai,
      pegawaiSektor: pegawaiMengikutSektor(rekodHariIni),
      lain: kiraanHariIni.lain,
    },
  ];

  const aktif = isihPerkara(data.perkara.filter((p) => p.aktif));
  dek.push({
    jenis: "minit",
    kunci: "minit",
    bab: "minit",
    tajuk: `Pengesahan Minit ${labelMesyuarat(data.rujukan)}`,
    label: labelMesyuarat(data.rujukan),
    tarikh: formatTarikhMs(data.rujukan.tarikh),
    tempat: data.rujukan.tempat,
    minitUrl: data.rujukan.minitUrl,
    muatTurunUrl: urlMuatTurunMinit(data.rujukan),
    para: aktif.map((p) => p.para),
  });

  dek.push({
    jenis: "papan-pemuka",
    kunci: "papan-pemuka",
    bab: "maklum-balas",
    tajuk: "Papan Pemuka Daerah",
    ...papan,
  });
  const barisIkutId = new Map(papan.perkara.map((b) => [b.perkaraId, b]));
  for (const p of aktif) {
    const b = barisIkutId.get(p.id)!;
    dek.push({
      jenis: "perkara",
      kunci: kunciPerkara(p.id),
      bab: "maklum-balas",
      tajuk: `Para ${p.para}`,
      perkaraId: p.id,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkara: p.perkara,
      tindakan: p.tindakan,
      bilangan: b.bilangan,
      dihantar: b.dihantar,
      dijangka: b.dijangka,
      jubin: binaMozek(p, data.sekolah, data.maklumBalas, data.items, { baru }),
    });
  }
  // Semua soalan: di hujung bab Maklum Balas (dibuka dari Papan Pemuka) — aliran ← → perkara kekal.
  dek.push({
    jenis: "semua-soalan",
    kunci: KUNCI_SEMUA_SOALAN,
    bab: "maklum-balas",
    tajuk: "Semua Soalan",
    bilangan: papan.kpi.bilangan,
    sekolahDihantar: papan.kpi.sekolahDihantar,
    sekolahJumlah: papan.kpi.sekolahJumlah,
    jubin: binaMozekSekolah(data.perkara, data.sekolah, data.maklumBalas, { baru }),
  });

  // Bahan: atur cara (ikut hari; bahan dua hari muncul di kedua-duanya) + satu slaid setiap bahan unik.
  const kumpulan = kumpulBahan(data.bahan);
  const urutan: BahanPembentangan[] = [];
  const dilihat = new Set<string>();
  for (const k of kumpulan) {
    for (const s of k.sektor) {
      for (const b of s.bahan) {
        if (!dilihat.has(b.id)) {
          dilihat.add(b.id);
          urutan.push(b);
        }
      }
    }
  }
  const nomborIkutId = new Map(urutan.map((b, i) => [b.id, i + 1]));
  dek.push({
    jenis: "atur-cara",
    kunci: "atur-cara",
    bab: "pembentangan",
    tajuk: "Atur Cara",
    hari: kumpulan.map((k) => ({
      hari: k.hari,
      label: k.label,
      sesi: k.sektor.flatMap((s) =>
        s.bahan.map((b) => ({
          kunci: `bahan-${b.id}`,
          nombor: nomborIkutId.get(b.id)!,
          sektorUnit: b.sektorUnit,
          tajuk: b.tajuk,
          namaPembentang: b.namaPembentang,
          jenisLabel: labelJenisBahan(b),
        })),
      ),
    })),
  });
  urutan.forEach((b, i) => {
    dek.push({
      jenis: "bahan",
      kunci: `bahan-${b.id}`,
      bab: "pembentangan",
      tajuk: b.tajuk,
      id: b.id,
      sektorUnit: b.sektorUnit,
      namaPembentang: b.namaPembentang,
      hariLabel: labelBeberapaHari(b.hari),
      jenisLabel: labelJenisBahan(b),
      embedUrl: urlEmbedBahan(b),
      bukaUrl: b.url,
      muatTurunUrl: urlMuatTurunBahan(b),
      nombor: i + 1,
      daripada: urutan.length,
    });
  });

  const hadirAcara = [...kodSekolahHadir(data.kehadiran.rekod)].filter((k) => kodSah.has(k)).length;
  const { bilangan } = papan.kpi;
  dek.push({
    jenis: "penutup",
    kunci: "penutup",
    bab: "penutup",
    tajuk: "Terima kasih",
    sekolahHadir: hadirAcara,
    sekolahDihantar: papan.kpi.sekolahDihantar,
    peratusSelesai: bilangan.jumlah ? Math.round((bilangan.SELESAI / bilangan.jumlah) * 100) : null,
  });
  return dek;
}

/** Indeks slaid selepas dek dibina semula: ikut `kunci`; jika hilang, slaid pertama bab yang sama. */
export function cariIndeks(dek: readonly Slaid[], kunci: string, bab: Bab, lalai = 0): number {
  const i = dek.findIndex((s) => s.kunci === kunci);
  if (i >= 0) return i;
  const j = dek.findIndex((s) => s.bab === bab);
  return j >= 0 ? j : Math.min(lalai, dek.length - 1);
}
