export type AdminMobileNavigationItem = {
  id: "papan" | "portal";
  href: string;
  label: string;
};

/** Tab mudah alih: Papan merangkumi semua modul; Portal kembali ke laman awam. */
export function getAdminMobileNavigation(): AdminMobileNavigationItem[] {
  return [
    { id: "papan", href: "/admin", label: "Papan" },
    { id: "portal", href: "/", label: "Portal" },
  ];
}
