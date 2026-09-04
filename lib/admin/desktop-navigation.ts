export type AdminDesktopNavigationItem = {
  href: "/admin" | "/admin/osc";
  label: "Papan Admin" | "OSC";
};

/** Rangkaian laluan yang dikira sebagai "OSC" untuk sorotan menu. */
export const ADMIN_OSC_PATHS = [
  "/admin/osc",
  "/admin/kandungan",
  "/admin/analisis",
  "/admin/pegawai",
  "/admin/tetapan",
] as const;

/** Laluan CoE Reports / Resources yang dimasuki dari kad Papan Admin. */
export const ADMIN_PAPAN_NESTED_PATHS = [
  "/admin/pelaporan",
  "/admin/laporan-dpd",
  "/admin/laporan-pss",
  "/admin/laporan-akhbar",
  "/admin/resources",
] as const;

function matchPath(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminDesktopNavActive(
  pathname: string,
  href: AdminDesktopNavigationItem["href"],
): boolean {
  if (href === "/admin") {
    return pathname === "/admin" || matchPath(pathname, ADMIN_PAPAN_NESTED_PATHS);
  }
  if (href === "/admin/osc") return matchPath(pathname, ADMIN_OSC_PATHS);
  return false;
}

/** Desktop: Papan Admin + OSC. Pelaporan dipindah ke kad CoE Reports. */
export function getAdminDesktopNavigation(
  canManageKandungan: boolean,
): AdminDesktopNavigationItem[] {
  return [
    { href: "/admin", label: "Papan Admin" },
    ...(canManageKandungan ? [{ href: "/admin/osc" as const, label: "OSC" as const }] : []),
  ];
}
