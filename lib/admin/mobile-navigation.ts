import { TEMPAHAN_HUB } from "@/lib/module-theme";

export type AdminMobileNavigationItem = {
  id: "booking" | "direktori" | "osc" | "papan" | "portal";
  href: string;
  label: string;
};

/** Tab mudah alih memfokuskan pusat urusan, bukan salinan papan admin. */
export function getAdminMobileNavigation(
  canManageKandungan: boolean,
): AdminMobileNavigationItem[] {
  return [
    { id: "booking", href: "/admin/booking", label: TEMPAHAN_HUB.title },
    ...(canManageKandungan
      ? [
          { id: "direktori" as const, href: "/admin/direktori", label: "CoE Direktori" },
          { id: "osc" as const, href: "/admin/osc", label: "OSC" },
          { id: "papan" as const, href: "/admin", label: "Papan" },
        ]
      : []),
    { id: "portal", href: "/", label: "Portal" },
  ];
}
