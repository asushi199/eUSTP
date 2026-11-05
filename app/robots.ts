import type { MetadataRoute } from "next";

/**
 * Kawal egress Supabase: perayap (enjin carian, bot AI) hanya dibenarkan pada
 * halaman yang dicache (utama, Resources, Media) dan halaman statik. Halaman
 * dinamik yang membaca DB pada setiap lawatan, borang, dan laluan peribadi
 * disekat. Bot tidak sopan tidak terikat — had sebenar ialah cache data.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/$", "/resources", "/media", "/maklumat-asas", "/privasi", "/terma"],
      disallow: [
        "/admin",
        "/api",
        "/login",
        "/tukar-kata-laluan",
        "/dev",
        "/kiosk",
        "/analisis",
        "/statistik",
        "/direktori",
        "/laporan",
        "/laporan-dpd",
        "/laporan-pss",
        "/laporan-mjkd",
        "/laporan-akhbar",
        "/khidmat-bantu",
        "/tempahan",
      ],
    },
  };
}
