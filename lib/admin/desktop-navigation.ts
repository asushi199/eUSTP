export type AdminDesktopNavigationItem = {
  href: "/admin" | "/admin/osc" | "/admin/pelaporan";
  label: "Papan Admin" | "OSC" | "Pelaporan";
};

/** Rangkaian laluan yang dikira sebagai "OSC" untuk sorotan menu. */
export const ADMIN_OSC_PATHS = [
  "/admin/osc",
  "/admin/kandungan",
  "/admin/analisis",
  "/admin/pegawai",
  "/admin/tetapan",
] as const;

/** Rangkaian laluan yang dikira sebagai "Pelaporan" untuk sorotan menu. */
export const ADMIN_PELAPORAN_PATHS = [
  "/admin/pelaporan",
  "/admin/laporan-dpd",
  "/admin/laporan-pss",
  "/admin/laporan-akhbar",
] as const;

function matchPath(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isAdminDesktopNavActive(
  pathname: string,
  href: AdminDesktopNavigationItem["href"],
): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/osc") return matchPath(pathname, ADMIN_OSC_PATHS);
  if (href === "/admin/pelaporan") return matchPath(pathname, ADMIN_PELAPORAN_PATHS);
  return false;
}

/** Desktop mengekalkan satu pintu masuk Papan Admin untuk urusan CoE Booking. */
export function getAdminDesktopNavigation(
  canManageKandungan: boolean,
): AdminDesktopNavigationItem[] {
  return [
    { href: "/admin", label: "Papan Admin" },
    ...(canManageKandungan
      ? [
          { href: "/admin/osc" as const, label: "OSC" as const },
          { href: "/admin/pelaporan" as const, label: "Pelaporan" as const },
        ]
      : []),
  ];
}
