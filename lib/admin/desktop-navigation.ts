export type AdminDesktopNavigationItem = {
  href: "/admin" | "/admin/osc" | "/admin/pelaporan";
  label: "Papan Admin" | "OSC" | "Pelaporan";
};

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
