export type PublicNavId =
  | "utama"
  | "analytics"
  | "reports"
  | "resources"
  | "direktori"
  | "services"
  | "media";

export type PublicNavItem = {
  id: PublicNavId;
  href: string;
  label: string;
  shortLabel: string;
  /** Tab bawah telefon; `more` masuk helaian Lagi. */
  mobile: "tab" | "more" | "home";
};

/**
 * Menu awam desktop (bar sisi) dan telefon (tab + Lagi).
 * CoE Analytics kekal jalur halaman utama, bukan kad.
 */
export const PUBLIC_NAV: PublicNavItem[] = [
  {
    id: "utama",
    href: "/",
    label: "Utama",
    shortLabel: "Utama",
    mobile: "home",
  },
  {
    id: "analytics",
    href: "/#coe-analytics",
    label: "CoE Analytics",
    shortLabel: "Analytics",
    mobile: "more",
  },
  {
    id: "reports",
    href: "/laporan",
    label: "CoE Reports",
    shortLabel: "Laporan",
    mobile: "tab",
  },
  {
    id: "resources",
    href: "/resources",
    label: "CoE Resources",
    shortLabel: "Resources",
    mobile: "more",
  },
  {
    id: "direktori",
    href: "/direktori",
    label: "CoE Direktori",
    shortLabel: "Direktori",
    mobile: "tab",
  },
  {
    id: "services",
    href: "/tempahan",
    label: "CoE Services",
    shortLabel: "Services",
    mobile: "tab",
  },
  {
    id: "media",
    href: "/media",
    label: "CoE Media",
    shortLabel: "Media",
    mobile: "more",
  },
];

export const PUBLIC_MOBILE_TAB_ORDER: PublicNavId[] = [
  "utama",
  "reports",
  "services",
  "direktori",
];

export const PUBLIC_MOBILE_TABS = PUBLIC_MOBILE_TAB_ORDER.map(
  (id) => PUBLIC_NAV.find((item) => item.id === id)!,
);

export const PUBLIC_MOBILE_MORE = PUBLIC_NAV.filter((item) => item.mobile === "more");

export function isPublicNavActive(pathname: string, item: PublicNavItem): boolean {
  if (item.id === "utama") return pathname === "/";
  if (item.id === "analytics") return false;
  if (item.id === "services") {
    return pathname.startsWith("/tempahan") || pathname.startsWith("/khidmat-bantu");
  }
  if (item.id === "reports") {
    return pathname.startsWith("/laporan");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
