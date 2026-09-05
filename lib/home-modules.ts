export {
  MODULES,
  LAPORAN_SECTIONS,
  TEMPAHAN_SECTIONS,
  OSC_SECTIONS,
  DIREKTORI_SECTIONS,
  DIREKTORI_HUB,
  LAPORAN_HUB,
  TEMPAHAN_HUB,
  RESOURCES_HUB,
  MEDIA_HUB,
} from "./module-theme";

import {
  LAPORAN_SECTIONS,
  MEDIA_HUB,
  MODULES,
  RESOURCES_HUB,
  TEMPAHAN_SECTIONS,
} from "./module-theme";
import { ROLE_INFO } from "./direktori/config";
import {
  MEDIA_KATEGORI,
  MEDIA_SOCIAL_LINKS,
  mediaHref,
} from "./media/kategori";
import { RESOURCES_KATEGORI, resourcesHref } from "./resources/kategori";

export type HomeModuleItem = {
  label: string;
  href?: string;
  external?: boolean;
};

export type HomeModuleCard = {
  href: string;
  internalHref: string;
  title: string;
  accent: string;
  iconKey: (typeof MODULES)[number]["iconKey"];
  cta: string;
  items: HomeModuleItem[];
  /** Pautan "+ Lagi" pada kad — ke halaman penuh modul. */
  moreLabel?: string;
};

export const MEDIA_CARD_ITEMS = [
  { label: MEDIA_KATEGORI[0]!.title, href: mediaHref(MEDIA_KATEGORI[0]!.slug) },
  ...MEDIA_SOCIAL_LINKS.map((item) => ({
    label: item.label,
    href: item.href,
    external: true,
  })),
] as const;

function moduleByHref(href: string) {
  const mod = MODULES.find((m) => m.internalHref === href);
  if (!mod) {
    throw new Error(`Modul tidak dijumpai: ${href}`);
  }
  return mod;
}

const laporan = moduleByHref("/laporan");
const direktori = moduleByHref("/direktori");
const services = moduleByHref("/tempahan");

/**
 * Kad halaman utama — CoE Analytics dipaparkan sebagai jalur sedia ada,
 * bukan kad. QR Centre tidak disertakan.
 */
export const HOME_MODULES: HomeModuleCard[] = [
  {
    href: laporan.href,
    internalHref: laporan.internalHref,
    title: laporan.title,
    accent: laporan.accent,
    iconKey: laporan.iconKey,
    cta: "Lihat Reports",
    items: LAPORAN_SECTIONS.map((s) => ({
      label: s.title,
      href: s.href,
      external: s.external,
    })),
  },
  {
    href: RESOURCES_HUB.href,
    internalHref: RESOURCES_HUB.internalHref,
    title: RESOURCES_HUB.title,
    accent: RESOURCES_HUB.accent,
    iconKey: RESOURCES_HUB.iconKey,
    cta: "Lihat Resources",
    items: RESOURCES_KATEGORI.map((k) => ({
      label: k.title,
      href: resourcesHref(k.slug),
    })),
  },
  {
    href: direktori.href,
    internalHref: direktori.internalHref,
    title: direktori.title,
    accent: direktori.accent,
    iconKey: direktori.iconKey,
    cta: "Lihat Directory",
    items: [
      { label: ROLE_INFO.PGB.label, href: `/direktori/${ROLE_INFO.PGB.slug}` },
      { label: "Penolong Kanan Sekolah", href: "/direktori/sekolah#direktori-pengurusan" },
      { label: ROLE_INFO.GPICT.label, href: `/direktori/${ROLE_INFO.GPICT.slug}` },
      { label: ROLE_INFO.DELIMA.label, href: `/direktori/${ROLE_INFO.DELIMA.slug}` },
      { label: ROLE_INFO.GPM.label, href: `/direktori/${ROLE_INFO.GPM.slug}` },
    ],
  },
  {
    href: services.href,
    internalHref: services.internalHref,
    title: services.title,
    accent: services.accent,
    iconKey: services.iconKey,
    cta: "Lihat Services",
    items: TEMPAHAN_SECTIONS.map((s) => ({
      label: s.title,
      href: s.href,
    })),
  },
  {
    href: MEDIA_HUB.href,
    internalHref: MEDIA_HUB.internalHref,
    title: MEDIA_HUB.title,
    accent: MEDIA_HUB.accent,
    iconKey: MEDIA_HUB.iconKey,
    cta: "Lihat Media",
    moreLabel: "+ Lagi",
    items: MEDIA_CARD_ITEMS.map((item) => ({
      label: item.label,
      href: item.href,
      external: "external" in item ? item.external : false,
    })),
  },
];
