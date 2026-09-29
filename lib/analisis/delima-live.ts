import "server-only";

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

export type DelimaLive = {
  daerah: string;
  guru: DelimaLivePop;
  murid: DelimaLivePop;
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
  lencana?: { label?: string };
};

type JadualJson = {
  baris?: JadualBaris[];
  jumlah?: number;
  jumlahHalaman?: number;
  kpi?: { tarikh?: string };
};

type Sumber = { origin: string; slug: string; daerah: string; widgetId: string; sumberUrl: string };

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
  o: { tab: "daerah" | "sekolah"; populasi: "guru" | "murid"; sekolah?: string; halaman?: number },
): string {
  return `${s.origin}/api/p/${s.slug}/jadual/${s.widgetId}?${new URLSearchParams({
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
  const widgetId = html.match(/widgetId[\\"]+:[\\"]+([0-9a-f-]{36})/)?.[1];
  if (!widgetId) return null;
  return { origin: u.origin, slug, daerah, widgetId, sumberUrl: url };
}

function tahapDari(baris: JadualBaris): DelimaTahap {
  const label = baris.lencana?.label;
  if (label === "Tinggi" || label === "Sederhana" || label === "Rendah") return label;
  return baris.peratus >= 75 ? "Tinggi" : baris.peratus >= 40 ? "Sederhana" : "Rendah";
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

/** Ringkasan daerah; null jika sumber tak dapat dicapai/format berubah (pemanggil guna data pangkalan data). */
export async function fetchDelimaLive(
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<DelimaLive | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s) return null;
    const [html, guruJ, muridJ, sekolahJ] = await Promise.all([
      getText(pageUrl(s, s.daerah)),
      getJson<JadualJson>(apiUrl(s, { tab: "daerah", populasi: "guru" })),
      getJson<JadualJson>(apiUrl(s, { tab: "daerah", populasi: "murid" })),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "guru" })),
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
    return {
      daerah: s.daerah,
      guru: p(g),
      murid: p(m),
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
): Promise<{ baris: JadualBaris[]; tempoh: string }> {
  const first = await getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi }));
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, (first.jumlahHalaman ?? 1) - 1) }, (_, i) =>
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi, halaman: i + 2 })),
    ),
  );
  return {
    baris: [first, ...rest].flatMap((j) => j.baris ?? []),
    tempoh: first.kpi?.tarikh ?? "",
  };
}

/** Semua sekolah daerah, guru + murid digabung ikut kod sekolah. */
export async function fetchDelimaSchools(
  sumberUrl?: string,
  daerahSlug?: string,
): Promise<DelimaSchoolList | null> {
  try {
    const s = await resolveSumber(sumberUrl, daerahSlug);
    if (!s) return null;
    const [guru, murid] = await Promise.all([allPages(s, "guru"), allPages(s, "murid")]);
    const peta = new Map<string, DelimaSchoolRow>();
    for (const b of guru.baris) {
      peta.set(b.id, { kod: b.id.toUpperCase(), nama: b.nama, guru: pop(b), murid: null });
    }
    for (const b of murid.baris) {
      const ada = peta.get(b.id);
      if (ada) ada.murid = pop(b);
      else peta.set(b.id, { kod: b.id.toUpperCase(), nama: b.nama, guru: null, murid: pop(b) });
    }
    const schools = [...peta.values()].sort((a, b) => a.nama.localeCompare(b.nama, "ms"));
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
    const [html, guruJ, muridJ] = await Promise.all([
      getText(pageUrl(s, s.daerah, id)),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "guru", sekolah: id })),
      getJson<JadualJson>(apiUrl(s, { tab: "sekolah", populasi: "murid", sekolah: id })),
    ]);
    const g = guruJ.baris?.find((b) => b.id === id);
    const m = muridJ.baris?.find((b) => b.id === id);
    const nama = g?.nama ?? m?.nama;
    if (!nama) return null;
    return {
      school: { kod: id.toUpperCase(), nama, guru: pop(g), murid: pop(m) },
      kadMurid: parseKadMurid(html),
      tempoh: guruJ.kpi?.tarikh ?? muridJ.kpi?.tarikh ?? "",
      sumberUrl: s.sumberUrl,
    };
  } catch {
    return null;
  }
}
