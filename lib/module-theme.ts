import { resolveLaporanModuleHref } from "./laporan-entry";

export type ModuleTheme = {
  accent: string;
  eyebrow: string;
  title: string;
};

const dpdEntry = resolveLaporanModuleHref("dpd", "/laporan-dpd");
const pssEntry = resolveLaporanModuleHref("pss", "/laporan-pss");

/** Hub OSC (One Stop Center) — menggabungkan Sumber, Analisis & Maklumat Asas. */
const OSC_MODULE = {
  href: "/osc",
  internalHref: "/osc",
  external: false,
  title: "OSC USTP",
  description:
    "One Stop Center USTP — sumber, analisis dan maklumat asas dalam satu pusat.",
  accent: "#0EA5C9",
  iconKey: "osc" as const,
} as const;

/** Hub CoE Reports — menggabungkan DPD, PSS, Akhbar & Tebus Buku. */
export const LAPORAN_HUB = {
  href: "/laporan",
  internalHref: "/laporan",
  external: false,
  title: "CoE Reports",
  description:
    "Laporan DPD, Laporan PSS, tinjauan Langganan Akhbar dan semakan tebus baucar buku.",
  accent: "#16A34A",
  iconKey: "laporan" as const,
} as const;

/** Hub CoE Services — perkhidmatan tempahan, pinjaman dan khidmat bantu. */
export const TEMPAHAN_HUB = {
  href: "/tempahan",
  internalHref: "/tempahan",
  external: false,
  title: "CoE Services",
  description:
    "Tempahan premis PKG, permohonan khidmat bantu dan peminjaman peralatan USTP.",
  accent: "#0D9488",
  iconKey: "tempahan" as const,
} as const;

/** Kad awam CoE Resources — pekeliling diambil daripada OSC Bahan Sokongan. */
export const RESOURCES_HUB = {
  href: "/resources",
  internalHref: "/resources",
  external: false,
  title: "CoE Resources",
  description:
    "Surat program, pekeliling dan nota USTP — pekeliling rasmi sudah boleh dibuka.",
  accent: "#EA580C",
  iconKey: "sumber" as const,
} as const;

/** Kad awam CoE Media — koleksi video/gambar dan pautan media. */
export const MEDIA_HUB = {
  href: "/media",
  internalHref: "/media",
  external: false,
  title: "CoE Media",
  description:
    "Koleksi video, gambar program dan pautan media sosial USTP — akan dibuka kemudian.",
  accent: "#DB2777",
  iconKey: "media" as const,
} as const;

export const MODULES = [
  LAPORAN_HUB,
  RESOURCES_HUB,
  MEDIA_HUB,
  {
    href: dpdEntry.href,
    internalHref: "/laporan-dpd",
    external: dpdEntry.external,
    title: "Laporan DPD",
    description:
      "Hantar laporan program pendigitalan dan jana laporan rasmi secara automatik.",
    accent: "#DB2777",
    iconKey: "laporan" as const,
  },
  {
    href: pssEntry.href,
    internalHref: "/laporan-pss",
    external: pssEntry.external,
    title: "Laporan PSS",
    description:
      "Pelaporan aktiviti Pusat Sumber Sekolah untuk semua sekolah daerah Manjung.",
    accent: "#7C3AED",
    iconKey: "pss" as const,
  },
  {
    href: "/laporan-akhbar",
    internalHref: "/laporan-akhbar",
    external: false,
    title: "Laporan Akhbar",
    description:
      "Tinjauan penyelarasan peruntukan Program Langganan Akhbar 2026 (PPD Manjung).",
    accent: "#024AD8",
    iconKey: "akhbar" as const,
  },
  {
    href: "/laporan/tebus-buku",
    internalHref: "/laporan/tebus-buku",
    external: false,
    title: "Semak Tebus Buku",
    description:
      "Cari pelajar sekolah menengah Manjung — semak sama ada sudah tebus dan sudah guna baucar buku.",
    accent: "#6D28D9",
    iconKey: "tebus" as const,
  },
  {
    href: "/direktori",
    internalHref: "/direktori",
    external: false,
    title: "CoE Direktori",
    description:
      "Direktori pentadbir dan penyelaras sekolah — cari dan kemas kini.",
    accent: "#7C3AED",
    iconKey: "direktori" as const,
  },
  TEMPAHAN_HUB,
  {
    href: "/tempahan/bilik",
    internalHref: "/tempahan/bilik",
    external: false,
    title: "Tempahan PKG",
    description:
      "Tempah bilik dan kemudahan di 5 Pusat Kegiatan Guru daerah Manjung.",
    accent: "#D97706",
    iconKey: "tempahan" as const,
  },
  {
    href: "/khidmat-bantu",
    internalHref: "/khidmat-bantu",
    external: false,
    title: "Permohonan Khidmat Bantu",
    description:
      "Mohon ceramah, bengkel, perkhidmatan MCP (siaran langsung & rakaman video), atau lain-lain daripada USTP.",
    accent: "#059669",
    iconKey: "khidmat" as const,
  },
  {
    href: "/tempahan/peralatan",
    internalHref: "/tempahan/peralatan",
    external: false,
    title: "Peminjaman Peralatan",
    description:
      "Semak inventori lima PKG dan mohon pinjaman peralatan Maker Lab secara dalam talian.",
    accent: "#024AD8",
    iconKey: "peralatan" as const,
  },
  OSC_MODULE,
  {
    href: "/sumber",
    internalHref: "/sumber",
    external: false,
    title: "Sumber USTP",
    description:
      "Kertas kerja, laporan, hebahan dan bahan sokongan USTP — semua dalam satu tempat.",
    accent: "#0EA5C9",
    iconKey: "sumber" as const,
  },
  {
    href: "/analisis",
    internalHref: "/analisis",
    external: false,
    title: "CoE Analytics",
    description:
      "Analisis DELIMa, DCS, Program Ains, Pensijilan Digital dan AI Tools daerah Manjung.",
    accent: "#024AD8",
    iconKey: "analisis" as const,
  },
  {
    href: "/maklumat-asas",
    internalHref: "/maklumat-asas",
    external: false,
    title: "Maklumat Asas",
    description:
      "Carta organisasi, maklumat PKG/CoE, takwim dan pegawai USTP PPD Manjung.",
    accent: "#1565A8",
    iconKey: "maklumat" as const,
  },
] as const;

/** Sub-modul yang dinaungi OSC — dipapar dalam hub /osc. */
export const OSC_SECTIONS = MODULES.filter((m) =>
  ["/sumber", "/analisis", "/maklumat-asas"].includes(m.internalHref),
);

/** Sub-modul di bawah hub /laporan — dipapar dalam halaman CoE Reports. */
export const LAPORAN_SECTIONS = MODULES.filter((m) =>
  ["/laporan-dpd", "/laporan-pss", "/laporan-akhbar", "/laporan/tebus-buku"].includes(
    m.internalHref,
  ),
);

/** Sub-modul di bawah hub /tempahan — dipapar dalam halaman CoE Services. */
export const TEMPAHAN_SECTIONS = MODULES.filter((m) =>
  ["/tempahan/bilik", "/khidmat-bantu", "/tempahan/peralatan"].includes(m.internalHref),
);

export function getModuleThemeForPath(path: string): ModuleTheme {
  const sorted = [...MODULES].sort(
    (a, b) => b.internalHref.length - a.internalHref.length,
  );
  for (const mod of sorted) {
    if (path === mod.internalHref || path.startsWith(`${mod.internalHref}/`)) {
      return { accent: mod.accent, eyebrow: mod.title, title: mod.title };
    }
  }
  if (path.startsWith("/laporan")) {
    return {
      accent: LAPORAN_HUB.accent,
      eyebrow: LAPORAN_HUB.title,
      title: LAPORAN_HUB.title,
    };
  }
  if (path.startsWith("/tempahan")) {
    return {
      accent: TEMPAHAN_HUB.accent,
      eyebrow: TEMPAHAN_HUB.title,
      title: TEMPAHAN_HUB.title,
    };
  }
  if (path.startsWith("/statistik")) {
    return {
      accent: "#1565A8",
      eyebrow: "Statistik",
      title: "Statistik Laporan",
    };
  }
  return { accent: "#024AD8", eyebrow: "NEXa Manjung", title: "NEXa Manjung" };
}

export function getModuleAccent(href: string): string {
  const mod = MODULES.find((m) => m.internalHref === href || m.href === href);
  return mod?.accent ?? "#024AD8";
}
