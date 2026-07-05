import { resolveLaporanModuleHref } from "./laporan-entry";

export type ModuleTheme = {
  accent: string;
  eyebrow: string;
  title: string;
};

const dpdEntry = resolveLaporanModuleHref("dpd", "/laporan-dpd");
const pssEntry = resolveLaporanModuleHref("pss", "/laporan-pss");

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

/** @deprecated Use MODULES from module-theme */
export const HOME_MODULES = MODULES;

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
