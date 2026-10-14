/**
 * Pembina slaid mod pembentangan MJKD (tulen — tiada akses DB; selamat dibawa ke klien).
 * Empat tab: Kehadiran (mesyuarat semasa), Minit (mesyuarat rujukan/sebelum), Maklum Balas
 * (mesyuarat rujukan/sebelum) dan Bahan (mesyuarat semasa).
 */
import { urlEmbedBahan, urlMuatTurunBahan, kumpulBahan } from "./bahan";
import { formatTarikhMs, labelMesyuarat, type StatusMjkd } from "./enums";
import { labelBeberapaHari, labelHariPendek } from "./hari";
import { kiraKehadiran, tapisRekodHari, type KiraanKehadiran } from "./kehadiran";
import { hitungKemajuan, kiraStatus, type BilanganStatus } from "./ringkasan";
import { perkaraUntukSekolah } from "./sasaran";

export const NAMA_MESYUARAT_PENUH = "Mesyuarat Jawatankuasa Kurikulum Daerah Manjung";
export const MESEJ_BAHAN = "Belum ada bahan dimuat naik.";
export const PANJANG_RINGKAS = 240;

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
};
export type ItemPembentangan = {
  maklumBalasId: string;
  perkaraId: string;
  status: string;
  catatan: string;
  pautanBukti: string;
  dipilih: boolean;
  susunanBacaan: number | null;
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

/* ------------------------------- jenis slaid ------------------------------- */

export type SlaidKehadiran = {
  jenis: "kehadiran";
  kunci: string;
  mesyuaratId: string;
  tajuk: string;
  /** Tarikh hari ini (label) — kiraan ialah bagi hari ini. */
  hariLabel: string;
  url: string;
  urlPendek: string;
  qr: string;
  kiraan: KiraanKehadiran;
};

export type SlaidTajuk = {
  jenis: "tajuk";
  kunci: string;
  /** cth. "Pengesahan Minit MJKD Bil.1/2026" — mesyuarat yang memiliki minit. */
  pengesahan: string;
  nama: string;
  bilTahun: string;
  tarikh: string;
  tempat: string;
  minitUrl: string;
  /** URL muat turun minit (kosong jika tiada minit). */
  muatTurunUrl: string;
};

export type SlaidPerkara = {
  jenis: "perkara";
  kunci: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
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

export type SlaidAnalisis = {
  jenis: "analisis";
  kunci: string;
  tajuk: string;
  analisis: Analisis;
  /** Ada sekurang-kurangnya satu jawapan dipilih untuk dibaca. */
  adaPilihan: boolean;
};

export type ChipSekolah = {
  kod: string;
  nama: string;
  status: StatusMjkd | string;
  dipilih: boolean;
  susunan: number | null;
  catatan: string;
  pautanBukti: string;
  namaPengisi: string;
  jawatanPengisi: string;
};

export type SlaidGrid = {
  jenis: "grid";
  kunci: string;
  para: string;
  mukaSurat: string;
  perkaraRingkas: string;
  bilangan: BilanganStatus;
  dihantar: number;
  dijangka: number;
  bilDipilih: number;
  chips: ChipSekolah[];
};

export type SlaidJawapan = {
  jenis: "jawapan";
  kunci: string;
  para: string;
  kodSekolah: string;
  namaSekolah: string;
  status: StatusMjkd | string;
  catatan: string;
  /** Teks sahaja — bukan pautan hidup. */
  pautanBukti: string;
  /** Kedudukan dalam bacaan perkara ini (bermula 1) dan jumlah dipilih. */
  nombor: number;
  daripada: number;
};

export type SlaidKosong = {
  jenis: "kosong";
  kunci: string;
  tajuk: string;
  mesej: string;
};

export type BahanIndeksItem = {
  id: string;
  tajuk: string;
  namaPembentang: string;
  /** Indeks slaid bahan tersebut dalam tab Bahan. */
  slaid: number;
};

export type SlaidBahanIndeks = {
  jenis: "bahan-indeks";
  kunci: string;
  kumpulan: {
    hari: string;
    label: string;
    sektor: { sektorUnit: string; bahan: BahanIndeksItem[] }[];
  }[];
};

export type SlaidBahanItem = {
  jenis: "bahan";
  kunci: string;
  id: string;
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hariLabel: string;
  jenisBahan: string;
  /** URL benam (iframe) atau null jika perlu dibuka di tab baharu. */
  embedUrl: string | null;
  bukaUrl: string;
  muatTurunUrl: string | null;
  nombor: number;
  daripada: number;
};

export type SlaidMinit = SlaidTajuk | SlaidPerkara;
export type SlaidMaklumBalas = SlaidAnalisis | SlaidGrid | SlaidJawapan | SlaidKosong;
export type SlaidBahan = SlaidBahanIndeks | SlaidBahanItem | SlaidKosong;
export type SlaidPembentanganSemua =
  | SlaidKehadiran
  | SlaidMinit
  | SlaidMaklumBalas
  | SlaidBahan;

export type Pembentangan = {
  kehadiran: SlaidKehadiran[];
  minit: SlaidMinit[];
  maklumBalas: SlaidMaklumBalas[];
  bahan: SlaidBahan[];
};

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

/* ---------------------------------- Minit ---------------------------------- */

/** Pautan muat turun minit (Supabase menyokong `?download=<nama fail>`). */
export function urlMuatTurunMinit(m: { bil: number; tahun: number; minitUrl: string }): string {
  if (!m.minitUrl) return "";
  const nama = encodeURIComponent(`Minit-MJKD-Bil${m.bil}-${m.tahun}.pdf`);
  return `${m.minitUrl}${m.minitUrl.includes("?") ? "&" : "?"}download=${nama}`;
}

/** Tab Minit: slaid 1 = tajuk (+ PDF); kemudian satu slaid bagi setiap perkara aktif. */
export function binaSlaidMinit(
  mesyuarat: MesyuaratPembentangan,
  perkara: readonly PerkaraPembentangan[],
): SlaidMinit[] {
  const slaid: SlaidMinit[] = [
    {
      jenis: "tajuk",
      kunci: "minit-tajuk",
      pengesahan: `Pengesahan Minit MJKD ${labelMesyuarat(mesyuarat)}`,
      nama: NAMA_MESYUARAT_PENUH,
      bilTahun: `Bil. ${mesyuarat.bil} Tahun ${mesyuarat.tahun}`,
      tarikh: formatTarikhMs(mesyuarat.tarikh),
      tempat: mesyuarat.tempat,
      minitUrl: mesyuarat.minitUrl,
      muatTurunUrl: urlMuatTurunMinit(mesyuarat),
    },
  ];
  for (const p of isihPerkara(perkara.filter((x) => x.aktif))) {
    slaid.push({
      jenis: "perkara",
      kunci: `minit-${p.id}`,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkara: p.perkara,
      tindakan: p.tindakan,
    });
  }
  return slaid;
}

/* ------------------------------- Maklum Balas ------------------------------- */

type InputMaklumBalas = {
  perkara: readonly PerkaraPembentangan[];
  sekolah: readonly SekolahPembentangan[];
  maklumBalas: readonly MaklumBalasPembentangan[];
  items: readonly ItemPembentangan[];
};

/**
 * Analisis: satu baris bagi setiap perkara aktif — kiraan status dan "dihantar x / y sekolah"
 * (hanya sekolah yang perkara itu terpakai), serta "sekolah telah menghantar x / y".
 */
export function binaAnalisis(input: InputMaklumBalas): Analisis {
  const kodMengikutMb = new Map(input.maklumBalas.map((m) => [m.id, m.schoolCode]));
  const aktif = input.perkara.filter((p) => p.aktif);
  const baris: BarisAnalisis[] = isihPerkara(aktif).map((p) => {
    const kodTerpakai = new Set(
      input.sekolah.filter((s) => perkaraUntukSekolah([p], s).length > 0).map((s) => s.code),
    );
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

/**
 * Tab Maklum Balas: slaid 1 = Analisis. Kemudian bagi SETIAP perkara yang ada jawapan: slaid
 * grid cip sekolah (warna = status, bintang = dipilih), diikuti satu slaid bagi setiap jawapan
 * dipilih ikut `susunanBacaan` (tiada susunan di hujung, seri ikut kod sekolah).
 */
export function binaSlaidMaklumBalas(
  input: InputMaklumBalas & { tajuk?: string },
): SlaidMaklumBalas[] {
  const sekolahMengikutKod = new Map(input.sekolah.map((s) => [s.code, s]));
  const mbMengikutId = new Map(input.maklumBalas.map((m) => [m.id, m]));
  const analisis = binaAnalisis(input);
  const adaPilihan = input.items.some(
    (it) => it.dipilih && mbMengikutId.has(it.maklumBalasId),
  );
  const slaid: SlaidMaklumBalas[] = [
    {
      jenis: "analisis",
      kunci: "mb-analisis",
      tajuk: input.tajuk ?? "Analisis Maklum Balas",
      analisis,
      adaPilihan,
    },
  ];

  const barisMengikutId = new Map(analisis.baris.map((b) => [b.perkaraId, b]));
  let adaJawapan = false;

  for (const p of isihPerkara(input.perkara.filter((x) => x.aktif))) {
    const jawapan = input.items
      .filter((it) => it.perkaraId === p.id && mbMengikutId.has(it.maklumBalasId))
      .map((it) => {
        const mb = mbMengikutId.get(it.maklumBalasId)!;
        return { it, mb, sekolah: sekolahMengikutKod.get(mb.schoolCode) };
      });
    if (jawapan.length === 0) continue;
    adaJawapan = true;

    const dipilih = jawapan
      .filter((x) => x.it.dipilih)
      .sort(
        (a, b) =>
          (a.it.susunanBacaan ?? Number.MAX_SAFE_INTEGER) -
            (b.it.susunanBacaan ?? Number.MAX_SAFE_INTEGER) ||
          a.mb.schoolCode.localeCompare(b.mb.schoolCode),
      );
    const baris = barisMengikutId.get(p.id)!;

    const chips: ChipSekolah[] = jawapan
      .map(({ it, mb, sekolah }) => ({
        kod: mb.schoolCode,
        nama: sekolah?.name ?? mb.schoolCode,
        status: it.status,
        dipilih: it.dipilih,
        susunan: it.susunanBacaan,
        catatan: it.catatan,
        pautanBukti: it.pautanBukti,
        namaPengisi: mb.namaPengisi ?? "",
        jawatanPengisi: mb.jawatanPengisi ?? "",
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama, "ms"));

    slaid.push({
      jenis: "grid",
      kunci: `mb-${p.id}-grid`,
      para: p.para,
      mukaSurat: p.mukaSurat,
      perkaraRingkas: ringkasTeks(p.perkara),
      bilangan: baris.bilangan,
      dihantar: baris.dihantar,
      dijangka: baris.dijangka,
      bilDipilih: dipilih.length,
      chips,
    });

    dipilih.forEach(({ it, mb, sekolah }, i) => {
      slaid.push({
        jenis: "jawapan",
        kunci: `mb-${p.id}-${it.maklumBalasId}`,
        para: p.para,
        kodSekolah: mb.schoolCode,
        namaSekolah: sekolah?.name ?? mb.schoolCode,
        status: it.status,
        catatan: it.catatan,
        pautanBukti: it.pautanBukti,
        nombor: i + 1,
        daripada: dipilih.length,
      });
    });
  }

  if (!adaJawapan) {
    slaid.push({
      jenis: "kosong",
      kunci: "mb-kosong",
      tajuk: "Belum ada maklum balas",
      mesej: "Tiada sekolah yang menghantar maklum balas bagi mesyuarat ini lagi.",
    });
  }
  return slaid;
}

/* ---------------------------------- Bahan ---------------------------------- */

/**
 * Tab Bahan: slaid 1 = senarai mengikut hari -> Sektor/Unit; kemudian satu slaid bagi setiap
 * bahan (susunan = susunan kemunculan dalam senarai). Tiada bahan = satu slaid kosong.
 */
export function binaSlaidBahan(bahan: readonly BahanPembentangan[] = []): SlaidBahan[] {
  if (bahan.length === 0) {
    return [{ jenis: "kosong", kunci: "bahan", tajuk: "Bahan MJKD", mesej: MESEJ_BAHAN }];
  }
  const kumpulan = kumpulBahan(bahan);
  // Urutan unik bahan = susunan pertama kali muncul dalam senarai terkumpul.
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
  const indeksSlaid = new Map(urutan.map((b, i) => [b.id, i + 1]));

  const slaid: SlaidBahan[] = [
    {
      jenis: "bahan-indeks",
      kunci: "bahan-indeks",
      kumpulan: kumpulan.map((k) => ({
        hari: k.hari,
        label: k.label,
        sektor: k.sektor.map((s) => ({
          sektorUnit: s.sektorUnit,
          bahan: s.bahan.map((b) => ({
            id: b.id,
            tajuk: b.tajuk,
            namaPembentang: b.namaPembentang,
            slaid: indeksSlaid.get(b.id)!,
          })),
        })),
      })),
    },
  ];
  urutan.forEach((b, i) => {
    slaid.push({
      jenis: "bahan",
      kunci: `bahan-${b.id}`,
      id: b.id,
      sektorUnit: b.sektorUnit,
      tajuk: b.tajuk,
      namaPembentang: b.namaPembentang,
      hariLabel: labelBeberapaHari(b.hari),
      jenisBahan: b.jenis,
      embedUrl: urlEmbedBahan(b),
      bukaUrl: b.url,
      muatTurunUrl: urlMuatTurunBahan(b),
      nombor: i + 1,
      daripada: urutan.length,
    });
  });
  return slaid;
}

/* -------------------------------- Kehadiran -------------------------------- */

export type RekodKehadiranSlaid = { jenis: string; schoolCode: string | null; tarikh: string };

/** Kiraan kehadiran bagi satu hari — dipakai slaid Kehadiran dan penyegaran langsung. */
export function kiraanKehadiranHari(
  rekod: readonly RekodKehadiranSlaid[],
  kodSekolah: readonly string[],
  hari: string,
): KiraanKehadiran {
  return kiraKehadiran(tapisRekodHari(rekod, hari), kodSekolah);
}

export function binaSlaidKehadiran(input: {
  mesyuaratId: string;
  mesyuarat: { bil: number; tahun: number };
  hariIni: string;
  url: string;
  qr: string;
  rekod: readonly RekodKehadiranSlaid[];
  kodSekolah: readonly string[];
}): SlaidKehadiran[] {
  return [
    {
      jenis: "kehadiran",
      kunci: "kehadiran",
      mesyuaratId: input.mesyuaratId,
      tajuk: `Kehadiran MJKD ${labelMesyuarat(input.mesyuarat)}`,
      hariLabel: labelHariPendek(input.hariIni),
      url: input.url,
      urlPendek: input.url.replace(/^https?:\/\//, ""),
      qr: input.qr,
      kiraan: kiraanKehadiranHari(input.rekod, input.kodSekolah, input.hariIni),
    },
  ];
}

/* ------------------------------- Semua slaid ------------------------------- */

/**
 * Semua slaid mod pembentangan. `rujukan` ialah mesyuarat yang memiliki minit dan maklum balas
 * (mesyuarat sebelum, atau mesyuarat itu sendiri jika tiada); `perkara`/`sekolah`/`maklumBalas`/
 * `items` ialah data mesyuarat rujukan. Kehadiran dan bahan milik mesyuarat semasa.
 */
export function binaSlaidPembentangan(input: {
  mesyuarat: { id: string; bil: number; tahun: number };
  rujukan: MesyuaratPembentangan;
  perkara: readonly PerkaraPembentangan[];
  sekolah: readonly SekolahPembentangan[];
  maklumBalas: readonly MaklumBalasPembentangan[];
  items: readonly ItemPembentangan[];
  bahan: readonly BahanPembentangan[];
  kehadiran: {
    hariIni: string;
    url: string;
    qr: string;
    rekod: readonly RekodKehadiranSlaid[];
  };
}): Pembentangan {
  return {
    kehadiran: binaSlaidKehadiran({
      mesyuaratId: input.mesyuarat.id,
      mesyuarat: input.mesyuarat,
      hariIni: input.kehadiran.hariIni,
      url: input.kehadiran.url,
      qr: input.kehadiran.qr,
      rekod: input.kehadiran.rekod,
      kodSekolah: input.sekolah.map((s) => s.code),
    }),
    minit: binaSlaidMinit(input.rujukan, input.perkara),
    maklumBalas: binaSlaidMaklumBalas({
      perkara: input.perkara,
      sekolah: input.sekolah,
      maklumBalas: input.maklumBalas,
      items: input.items,
      tajuk: `Analisis Maklum Balas MJKD ${labelMesyuarat(input.rujukan)}`,
    }),
    bahan: binaSlaidBahan(input.bahan),
  };
}
