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

/** Hub CoE Booking — menggabungkan perkhidmatan tempahan USTP. */
const TEMPAHAN_HUB = {
  href: "/tempahan",
  internalHref: "/tempahan",
  external: false,
  title: "CoE Booking",
  description:
    "Tempahan bilik PKG, permohonan khidmat bantu dan peminjaman peralatan USTP.",
  accent: "#D97706",
  iconKey: "tempahan" as const,
} as const;

export const MODULES = [
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
    href: "/direktori",
    internalHref: "/direktori",
    external: false,
    title: "CoE Direktori",
    description:
      "Direktori pentadbir dan penyelaras sekolah — cari dan kemas kini.",
    accent: "#0D9488",
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
    description: "Perkhidmatan peminjaman peralatan USTP akan disediakan tidak lama lagi.",
    accent: "#7C3AED",
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
    title: "Analisis USTP",
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
      "Carta organisasi, maklumat PKG/COE, takwim dan pegawai USTP PPD Manjung.",
    accent: "#1565A8",
    iconKey: "maklumat" as const,
  },
] as const;

/** Sub-modul yang dinaungi OSC — dipapar dalam hub /osc. */
export const OSC_SECTIONS = MODULES.filter((m) =>
  ["/sumber", "/analisis", "/maklumat-asas"].includes(m.internalHref),
);

/** Sub-modul di bawah hub /tempahan — dipapar dalam halaman tempahan. */
export const TEMPAHAN_SECTIONS = MODULES.filter((m) =>
  ["/tempahan/bilik", "/khidmat-bantu", "/tempahan/peralatan"].includes(m.internalHref),
);

/**
 * Kad halaman utama — sub-modul OSC & Tempahan digabung di hub masing-masing.
 * OSC (/osc) kini dalaman sahaja (perlu log masuk) — jadi tidak dipapar
 * sebagai kad awam; diuruskan melalui /admin/osc. OSC_MODULE dikekalkan dalam
 * MODULES supaya carian tema (getModuleAccent/getModuleThemeForPath) berfungsi.
 * Bilangan kad = HOME_MODULES.length.
 */
export const HOME_MODULES = MODULES.filter(
  (m) =>
    m.internalHref !== "/osc" &&
    !OSC_SECTIONS.some((s) => s.internalHref === m.internalHref) &&
    !TEMPAHAN_SECTIONS.some((s) => s.internalHref === m.internalHref),
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
    return { accent: "#DB2777", eyebrow: "Pelaporan", title: "Pelaporan" };
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
  return { accent: "#024AD8", eyebrow: "eUSTP Manjung", title: "eUSTP Manjung" };
}

export function getModuleAccent(href: string): string {
  const mod = MODULES.find((m) => m.internalHref === href || m.href === href);
  return mod?.accent ?? "#024AD8";
}
