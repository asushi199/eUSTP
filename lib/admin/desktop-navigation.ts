export type AdminDesktopNavigationItem = {
  href: "/admin";
  label: "Papan Admin";
};

/** Laluan CoE yang dimasuki dari kad Papan Admin. */
export const ADMIN_PAPAN_NESTED_PATHS = [
  "/admin/booking",
  "/admin/tempahan",
  "/admin/peralatan",
  "/admin/khidmat-bantu",
  "/admin/direktori",
  "/admin/pegawai",
  "/admin/pelaporan",
  "/admin/laporan-dpd",
  "/admin/laporan-pss",
  "/admin/laporan-akhbar",
  "/admin/laporan-ustp",
  "/admin/minit-curai",
  "/admin/resources",
  "/admin/media",
  "/admin/analisis",
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
  return false;
}

/** Desktop: Papan Admin sahaja. Resources / Media / Reports di kad Papan. */
export function getAdminDesktopNavigation(
  _canManageKandungan: boolean,
): AdminDesktopNavigationItem[] {
  return [{ href: "/admin", label: "Papan Admin" }];
}
