export type AdminMobileNavigationItem = {
  id: "booking" | "direktori" | "osc" | "pelaporan" | "portal";
  href: string;
  label: string;
};

/** Tab mudah alih memfokuskan pusat urusan, bukan salinan papan admin. */
export function getAdminMobileNavigation(
  canManageKandungan: boolean,
): AdminMobileNavigationItem[] {
  return [
    { id: "booking", href: "/admin/booking", label: "CoE Booking" },
    ...(canManageKandungan
      ? [
          { id: "direktori" as const, href: "/admin/direktori", label: "CoE Direktori" },
          { id: "osc" as const, href: "/admin/osc", label: "OSC" },
          { id: "pelaporan" as const, href: "/admin/pelaporan", label: "Lapor" },
        ]
      : []),
    { id: "portal", href: "/", label: "Portal" },
  ];
}
