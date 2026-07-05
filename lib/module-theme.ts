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
    title: "Direktori GPICT",
    description:
      "Direktori Guru Penyelaras ICT, GP DELIMa dan GPM sekolah — cari dan kemas kini.",
    accent: "#0D9488",
    iconKey: "direktori" as const,
  },
  {
    href: "/tempahan",
    internalHref: "/tempahan",
    external: false,
    title: "Tempahan PKG",
    description:
      "Tempah bilik dan kemudahan di 5 Pusat Kegiatan Guru daerah Manjung.",
    accent: "#D97706",
    iconKey: "tempahan" as const,
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

/**
 * Kad halaman utama: 5 laluan — Sumber/Analisis/Maklumat Asas digabung
 * di bawah satu kad OSC (One Stop Center).
 */
export const HOME_MODULES = MODULES.filter(
  (m) => !OSC_SECTIONS.some((s) => s.internalHref === m.internalHref),
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
