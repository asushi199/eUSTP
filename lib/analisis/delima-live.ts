import "server-only";

import { fetchDelimaV30 } from "./delima-csv";
import { gabungSekolah, tahapDariPeratus } from "./delima-merge";

/**
 * Data DELIMa langsung daripada papan pemuka awam DELIMa Perak (dipautkan terus,
 * tanpa muat naik manual). URL sumber + slug daerah boleh ditukar pentadbir di
 * /admin/analisis → DELIMa (kunci `delima_live_url`, `delima_daerah`).
 */
export const DELIMA_LIVE_DEFAULT_URL =
  "https://delimaperak.vercel.app/p/dashboard-aktif-delima-guru";
export const DELIMA_LIVE_DEFAULT_DAERAH = "manjung";

const REVALIDATE_SAAT = 3600;

export type DelimaLivePop = { aktif: number; jumlah: number; peratus: number };

/** Kad "Aktif Murid" (berbanding sasaran) di bahagian atas papan pemuka sumber. */
export type DelimaKadMurid = DelimaLivePop & {
  /** Nama daerah/sekolah yang dipaparkan kad. */
  nama: string;
  sasaran: number | null;
  capai: boolean;
  kemasKini: string;
};

/**
 * Guru yang pernah log masuk DELIMa 2.0 ATAU 3.0 (widget KPI JPN yang bertajuk "Data Aktif Delima 3.0";
 * disahkan = jumlah - guru "Belum Login" kedua-duanya). Sasaran KPI dikira atas angka gabungan ini,
 * bukan atas 2.0 atau 3.0 sahaja.
 */
export type DelimaGuruGabung = DelimaLivePop & {
  sasaran: number | null;
  capai: boolean;
  kemasKini: string;
};

export type DelimaLive = {
  daerah: string;
  guru: DelimaLivePop;
  murid: DelimaLivePop;
  /** Jumlah daerah DELIMa 3.0 (CSV Google Sheet); null jika sumber tak dapat dicapai. */
  v30: { guru: DelimaLivePop; murid: DelimaLivePop } | null;
  /** Guru gabungan 2.0 + 3.0 beserta sasaran KPI; null jika halaman sumber tiada widget itu. */
  guruGabung: DelimaGuruGabung | null;
  kadMurid: DelimaKadMurid | null;
  bilSekolah: number | null;
  /** Tempoh data, cth. "1 Jan – 31 Ogos 2026". */
  tempoh: string;
  sumberUrl: string;
};

export type DelimaTahap = "Tinggi" | "Sederhana" | "Rendah";

export type DelimaSchoolPop = DelimaLivePop & { tahap: DelimaTahap };

export type DelimaSchoolRow = {
  kod: string;
  nama: string;
  guru: DelimaSchoolPop | null;
  murid: DelimaSchoolPop | null;
  /** DELIMa 3.0 (tiada tahap); undefined bagi snapshot lama atau jika CSV tak dapat dicapai. */
  guru30?: DelimaLivePop | null;
  murid30?: DelimaLivePop | null;
};

export type DelimaSchoolList = {
  schools: DelimaSchoolRow[];
  tempoh: string;
  daerah: string;
};

export type DelimaSchoolDetail = {
  school: DelimaSchoolRow;
  kadMurid: DelimaKadMurid | null;
  tempoh: string;
  sumberUrl: string;
};

type JadualBaris = {
  id: string;
  nama: string;
  kecil?: string;
  jumlahCapai: number;
  jumlahPopulasi: number;
  peratus: number;
  capai?: boolean;
  lencana?: { label?: string };
};

type JadualJson = {
  baris?: JadualBaris[];
  jumlah?: number;
  jumlahHalaman?: number;
  kpi?: { tarikh?: string; targetPeratus?: number };
};

type Sumber = {
  origin: string;
  slug: string;
  daerah: string;
  widgetId: string;
  /** Widget KPI gabungan 2.0 + 3.0 (tajuk menyebut 3.0); undefined jika tiada pada halaman. */
  widgetGabung?: string;
  sumberUrl: string;
};

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SAAT },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getJson<T>(url: string): Promise<T> {
  return JSON.parse(await getText(url)) as T;
}

function pageUrl(s: { origin: string; slug: string }, daerah: string, sekolah = ""): string {
  const q = new URLSearchParams({ daerah });
  if (sekolah) q.set("sekolah", sekolah);
  return `${s.origin}/p/${s.slug}?${q}`;
}

function apiUrl(
  s: Sumber,
  o: {
    tab: "daerah" | "sekolah";
    populasi: "guru" | "murid";
    sekolah?: string;
    halaman?: number;
    /** Guna widget gabungan 2.0 + 3.0 (bukan widget 2.0). */
    gabung?: boolean;
  },
): string {
  return `${s.origin}/api/p/${s.slug}/jadual/${(o.gabung && s.widgetGabung) || s.widgetId}?${new URLSearchParams({
    tab: o.tab,
    populasi: o.populasi,
    daerah: s.daerah,
    sekolah: o.sekolah ?? "",
    carian: "",
    status: "",
    halaman: String(o.halaman ?? 1),
  })}`;
}

/** Tapis pautan sumber → origin/slug, dan cari widgetId jadual dalam HTML (server-rendered). */
async function resolveSumber(sumberUrl?: string, daerahSlug?: string): Promise<Sumber | null> {
  const url = sumberUrl?.trim() || DELIMA_LIVE_DEFAULT_URL;
  const daerah = (daerahSlug?.trim() || DELIMA_LIVE_DEFAULT_DAERAH).toLowerCase();
  const u = new URL(url);
  const slug = u.pathname.match(/^\/p\/([^/]+)/)?.[1];
  if (!slug) return null;
  const html = await getText(pageUrl({ origin: u.origin, slug }, daerah));
  const widgets = [
    ...html.matchAll(/widgetId[\\"]+:[\\"]+([0-9a-f-]{36})[\\"]+,[\\"]+tajuk[\\"]+:[\\"]+([^\\"]+)/g),
  ].map((m) => ({ id: m[1], tajuk: m[2] }));
  const widgetGabung = widgets.find((w) => /3\.0/.test(w.tajuk))?.id;
  const widgetId = [...html.matchAll(/widgetId[\\"]+:[\\"]+([0-9a-f-]{36})/g)]
    .map((m) => m[1])
    .find((id) => id !== widgetGabung);
  if (!widgetId) return null;
  return { origin: u.origin, slug, daerah, widgetId, widgetGabung, sumberUrl: url };
}

function tahapDari(baris: JadualBaris): DelimaTahap {
  const label = baris.lencana?.label;
  if (label === "Tinggi" || label === "Sederhana" || label === "Rendah") return label;
  return tahapDariPeratus(baris.peratus);
}

function pop(b: JadualBaris | undefined): DelimaSchoolPop | null {
  return b
    ? { aktif: b.jumlahCapai, jumlah: b.jumlahPopulasi, peratus: b.peratus, tahap: tahapDari(b) }
    : null;
}

/** Cabut kad "Aktif Murid" daripada HTML halaman (tiada API JSON untuknya). */
function parseKadMurid(html: string): DelimaKadMurid | null {
  const t = html.replace(/<!-- -->/g, "");
  const kad = t.match(/Aktif Murid<\/h2>(.*?)<\/section>/s)?.[1];
  if (!kad) return null;
  const nama = kad.match(/<p class="text-xs text-slate-400">(.*?) · Murid/s)?.[1]?.trim();
  const sasaran = kad.match(/Sasaran (\d+(?:\.\d+)?)%/)?.[1];
  const peratus = kad.match(/text-3xl[^>]*>(\d+(?:\.\d+)?)%/)?.[1];
  const angka = kad.match(/>([\d,]+) daripada ([\d,]+)/);
  const kemasKini = kad.match(/kemas kini (\d{4}-\d{2}-\d{2})/)?.[1];
  if (!peratus || !angka) return null;
  const n = (s: string) => Number(s.replace(/,/g, ""));
  return {
    nama: nama?.replace(/&amp;/g, "&") ?? "",
    aktif: n(angka[1]),
    jumlah: n(angka[2]),
    peratus: Number(peratus),
    sasaran: sasaran ? Number(sasaran) : null,
    capai: !/Belum Capai/.test(kad),
    kemasKini: kemasKini ?? "",
  };
}

/**
 * Bilangan sekolah yang capai sasaran KPI (peratus aktif >= sasaran), dikira terus daripada senarai sekolah.
 * Sumber JPN kini menggabungkan DELIMa 2.0 + 3.0 dan tidak lagi memaparkan kad "Aktif Murid" / tanda capai
 * yang boleh dipercayai (targetPeratus = 0), jadi sasaran dibandingkan sendiri.
 */
export function bilSekolahCapai(
  senarai: DelimaSchoolList | null | undefined,
  populasi: "guru" | "murid",
  sasaran: number | null | undefined,
): number | null {
  if (!senarai || senarai.schools.length === 0 || sasaran == null || !Number.isFinite(sasaran) || sasaran <= 0)
    return null;
  return senarai.schools.filter((r) => (r[populasi]?.peratus ?? -1) >= sasaran).length;
}

/** Ringkasan daerah; null jika sumber tak dapat dicapai/format berubah (pemanggil guna data pangkalan data). */
export async function fetchDelimaLive(
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<DelimaLive | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s) return null;
    const [html, guruJ, muridJ, sekolahJ, v30, gabungJ] = await Promise.all([
      getText(pageUrl(s, s.daerah)),
      getJson<JadualJson>(apiUrl(s, { tab: "daerah", populasi: "guru" })),
      getJson<JadualJson>(apiUrl(s, { tab: "daerah", populasi: "murid" })),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "guru" })),
      fetchDelimaV30(s.daerah),
      // Gagal baca widget gabungan tidak patut menjejaskan angka 2.0.
      s.widgetGabung
        ? getJson<JadualJson>(apiUrl(s, { tab: "daerah", populasi: "guru", gabung: true })).catch(() => null)
        : Promise.resolve(null),
    ]);
    const pick = (j: JadualJson) => j.baris?.find((b) => b.id === s.daerah) ?? j.baris?.[0];
    const g = pick(guruJ);
    const m = pick(muridJ);
    if (!g || !m) return null;
    const p = (b: JadualBaris): DelimaLivePop => ({
      aktif: b.jumlahCapai,
      jumlah: b.jumlahPopulasi,
      peratus: b.peratus,
    });
    const gb = gabungJ ? pick(gabungJ) : undefined;
    return {
      daerah: s.daerah,
      guru: p(g),
      murid: p(m),
      guruGabung: gb
        ? {
            ...p(gb),
            sasaran: gabungJ?.kpi?.targetPeratus || null,
            capai: gb.capai === true,
            kemasKini: gabungJ?.kpi?.tarikh ?? "",
          }
        : null,
      v30: v30 ? { guru: v30.jumlahGuru, murid: v30.jumlahMurid } : null,
      kadMurid: parseKadMurid(html),
      bilSekolah: typeof sekolahJ.jumlah === "number" ? sekolahJ.jumlah : null,
      tempoh: guruJ.kpi?.tarikh ?? "",
      sumberUrl: s.sumberUrl,
    };
  } catch {
    return null;
  }
}

async function allPages(
  s: Sumber,
  populasi: "guru" | "murid",
  gabung = false,
): Promise<{ baris: JadualBaris[]; tempoh: string }> {
  const first = await getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi, gabung }));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, (first.jumlahHalaman ?? 1) - 1) }, (_, i) =>
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi, halaman: i + 2, gabung })),
    ),
  );
  return {
    baris: [first, ...rest].flatMap((j) => j.baris ?? []),
    tempoh: first.kpi?.tarikh ?? "",
  };
}

/**
 * Bilangan sekolah yang capai sasaran KPI guru (gabungan 2.0 + 3.0, tanda `capai` widget JPN).
 * null jika sumber tiada widget gabungan atau gagal dibaca.
 */
export async function fetchDelimaGuruCapai(
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<number | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s?.widgetGabung) return null;
    const { baris } = await allPages(s, "guru", true);
    return baris.length > 0 ? baris.filter((b) => b.capai === true).length : null;
  } catch {
    return null;
  }
}

/** Semua sekolah daerah, guru + murid digabung ikut kod sekolah. */
export async function fetchDelimaSchools(
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<DelimaSchoolList | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s) return null;
    const [guru, murid, v30] = await Promise.all([
      allPages(s, "guru"),
      allPages(s, "murid"),
      fetchDelimaV30(s.daerah),
    ]);
    const peta = new Map<string, DelimaSchoolRow>();
    for (const b of guru.baris) {
      peta.set(b.id, { kod: b.id.toUpperCase(), nama: b.nama, guru: pop(b), murid: null });
    }
    for (const b of murid.baris) {
      const ada = peta.get(b.id);
      if (ada) ada.murid = pop(b);
      else peta.set(b.id, { kod: b.id.toUpperCase(), nama: b.nama, guru: null, murid: pop(b) });
    }
    if (v30) {
      for (const r of peta.values()) {
        r.guru30 = v30.guru.get(r.kod) ?? null;
        r.murid30 = v30.murid.get(r.kod) ?? null;
      }
    }
    const schools = [...peta.values()].sort((a, b) => a.kod.localeCompare(b.kod, "en", { numeric: true }));
    return { schools, tempoh: guru.tempoh || murid.tempoh, daerah: s.daerah };
  } catch {
    return null;
  }
}

/** Butiran satu sekolah: baris guru/murid + kad "Aktif Murid" sekolah itu. */
export async function fetchDelimaSchoolDetail(
  kod: string,
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<DelimaSchoolDetail | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s) return null;
    const id = kod.trim().toLowerCase();
    const [html, guruJ, muridJ, v30] = await Promise.all([
      getText(pageUrl(s, s.daerah, id)),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "guru", sekolah: id })),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "murid", sekolah: id })),
      fetchDelimaV30(s.daerah),
    ]);
    const g = guruJ.baris?.find((b) => b.id === id);
    const m = muridJ.baris?.find((b) => b.id === id);
    const nama = g?.nama ?? m?.nama;
    if (!nama) return null;
    return {
      school: {
        kod: id.toUpperCase(),
        nama,
        guru: pop(g),
        murid: pop(m),
        ...(v30
          ? {
              guru30: v30.guru.get(id.toUpperCase()) ?? null,
              murid30: v30.murid.get(id.toUpperCase()) ?? null,
            }
          : {}),
      },
      kadMurid: parseKadMurid(html),
      tempoh: guruJ.kpi?.tarikh ?? muridJ.kpi?.tarikh ?? "",
      sumberUrl: s.sumberUrl,
    };
  } catch {
    return null;
  }
}

/** Bilangan sekolah ikut tahap aktif bagi carta taburan (guru dan murid). */
export function delimaTaburan(
  list: DelimaSchoolList | null | undefined,
): { title: string; seriesName: string; data: { label: string; jumlah: number }[] }[] {
  if (!list || list.schools.length === 0) return [];
  const tahap: [DelimaTahap, string][] = [
    ["Tinggi", "Tinggi (≥75%)"],
    ["Sederhana", "Sederhana (40–74%)"],
    ["Rendah", "Rendah (<40%)"],
  ];
  const sekolah = list.schools.map(gabungSekolah);
  return (["guru", "murid"] as const).map((k) => ({
    title: `Taburan Sekolah · ${k === "guru" ? "Guru" : "Murid"} Aktif`,
    seriesName: "Sekolah",
    data: tahap.map(([t, label]) => ({
      label,
      jumlah: sekolah.filter((s) => s[k]?.tahap === t).length,
    })),
  }));
}
