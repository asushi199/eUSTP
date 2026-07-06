/**
 * Override sementara pautan Laporan DPD/PSS — TopNav desktop, kad halaman utama & hub /laporan (2026).
 *
 * Set `enabled: false` untuk pulih pautan dalaman (/laporan-dpd, /laporan-pss).
 * Laluan dalaman kekal hidup walaupun override aktif — pentadbir boleh uji terus URL.
 */
export const LAPORAN_ENTRY_OVERRIDE = {
  enabled: true,
  dpd: {
    internalHref: "/laporan-dpd",
    lookerHref:
      "https://datastudio.google.com/reporting/97c54e64-01ea-495c-be82-300adf618bc6/page/JbWhE",
  },
  pss: {
    internalHref: "/laporan-pss",
    lookerHref:
      "https://datastudio.google.com/reporting/82432d2f-3362-4e70-9fc4-44a1adb1a36b/page/JbWhE",
  },
} as const;

export type LaporanHubChoice = {
  kind: "dpd" | "pss";
  title: string;
  description: string;
  href: string;
  external: boolean;
  accent: string;
};

export function resolveLaporanModuleHref(
  kind: "dpd" | "pss",
  internalHref: string,
): { href: string; external: boolean } {
  if (!LAPORAN_ENTRY_OVERRIDE.enabled) {
    return { href: internalHref, external: false };
  }
  const entry = LAPORAN_ENTRY_OVERRIDE[kind];
  return { href: entry.lookerHref, external: true };
}

/** Pilihan DPD / PSS untuk halaman hub /laporan (tab mudah alih & laluan terpusat). */
export function getLaporanHubChoices(): LaporanHubChoice[] {
  const dpd = resolveLaporanModuleHref("dpd", LAPORAN_ENTRY_OVERRIDE.dpd.internalHref);
  const pss = resolveLaporanModuleHref("pss", LAPORAN_ENTRY_OVERRIDE.pss.internalHref);
  const looker = LAPORAN_ENTRY_OVERRIDE.enabled;

  return [
    {
      kind: "dpd",
      title: "Laporan DPD",
      description: looker
        ? "Dashboard Pelaporan Dasar Pendidikan Digital — Looker Studio."
        : "Hantar laporan program pendigitalan dan jana laporan rasmi secara automatik.",
      href: dpd.href,
      external: dpd.external,
      accent: "#DB2777",
    },
    {
      kind: "pss",
      title: "Laporan PSS",
      description: looker
        ? "Dashboard Pelaporan Pusat Sumber Sekolah — Looker Studio."
        : "Pelaporan aktiviti Pusat Sumber Sekolah untuk semua sekolah daerah Manjung.",
      href: pss.href,
      external: pss.external,
      accent: "#7C3AED",
    },
  ];
}
