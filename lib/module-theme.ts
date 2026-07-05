export type ModuleTheme = {
  accent: string;
  eyebrow: string;
  title: string;
};

export const MODULES = [
  {
    href: "/laporan-dpd",
    title: "Laporan DPD",
    description:
      "Hantar laporan program pendigitalan dan jana laporan rasmi secara automatik.",
    accent: "#DB2777",
    iconKey: "laporan" as const,
  },
  {
    href: "/laporan-pss",
    title: "Laporan PSS",
    description:
      "Pelaporan aktiviti Pusat Sumber Sekolah untuk semua sekolah daerah Manjung.",
    accent: "#7C3AED",
    iconKey: "pss" as const,
  },
  {
    href: "/direktori",
    title: "Direktori GPICT",
    description:
      "Direktori Guru Penyelaras ICT, GP DELIMa dan GPM sekolah — cari dan kemas kini.",
    accent: "#0D9488",
    iconKey: "direktori" as const,
  },
  {
    href: "/tempahan",
    title: "Tempahan PKG",
    description:
      "Tempah bilik dan kemudahan di 5 Pusat Kegiatan Guru daerah Manjung.",
    accent: "#D97706",
    iconKey: "tempahan" as const,
  },
  {
    href: "/sumber",
    title: "Sumber USTP",
    description:
      "Kertas kerja, laporan, hebahan dan bahan sokongan USTP — semua dalam satu tempat.",
    accent: "#0EA5C9",
    iconKey: "sumber" as const,
  },
  {
    href: "/analisis",
    title: "Analisis USTP",
    description:
      "Analisis DELIMa, DCS, Program Ains, Pensijilan Digital dan AI Tools daerah Manjung.",
    accent: "#024AD8",
    iconKey: "analisis" as const,
  },
  {
    href: "/maklumat-asas",
    title: "Maklumat Asas",
    description:
      "Carta organisasi, maklumat PKG/COE, takwim dan pegawai USTP PPD Manjung.",
    accent: "#1565A8",
    iconKey: "maklumat" as const,
  },
] as const;

/** @deprecated Use MODULES from module-theme */
export const HOME_MODULES = MODULES;

export function getModuleThemeForPath(path: string): ModuleTheme {
  const sorted = [...MODULES].sort((a, b) => b.href.length - a.href.length);
  for (const mod of sorted) {
    if (path === mod.href || path.startsWith(`${mod.href}/`)) {
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
  const mod = MODULES.find((m) => m.href === href);
  return mod?.accent ?? "#024AD8";
}
