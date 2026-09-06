import withPWAInit, { runtimeCaching } from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * PENTING: jangan bundle pemandu DB ke dalam binaan RSC halaman.
   * Pada Next 15.5 + Vercel, `postgres` yang dibundel dalam konteks render
   * halaman menyebabkan query tergantung tanpa ralat (API route OK, halaman
   * hang) — buktinya /api/diag lulus semua semakan sementara halaman DB
   * timeout. Externalize supaya runtime guna modul node_modules sebenar.
   */
  serverExternalPackages: ["postgres", "unpdf"],
  outputFileTracingIncludes: {
    "/**": ["./public/templates/kew-pa-9-am24.pdf", "./public/templates/laporan-ustp-header.jpg"],
  },
  experimental: {
    serverActions: {
      /** 5 gambar laporan (dimampat klien ≤1.2MB setiap satu) boleh melebihi 2mb lalai. */
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      { source: "/osc", destination: "/resources", permanent: true },
      { source: "/osc/:path*", destination: "/resources", permanent: true },
      { source: "/sumber", destination: "/resources", permanent: true },
      { source: "/sumber/:path*", destination: "/resources", permanent: true },
      { source: "/admin/osc", destination: "/admin/resources", permanent: true },
      { source: "/admin/osc/:path*", destination: "/admin/resources", permanent: true },
      { source: "/admin/kandungan", destination: "/admin/resources", permanent: true },
      { source: "/admin/kandungan/:path*", destination: "/admin/resources", permanent: true },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Hub berbeza mengikut sesi; laporan dalaman tidak boleh dibaca daripada cache selepas log keluar.
        urlPattern: ({ url }) => url.pathname === "/laporan" || url.pathname === "/admin/laporan-ustp" || url.pathname.startsWith("/admin/laporan-ustp/") || url.pathname === "/admin/minit-curai" || url.pathname.startsWith("/admin/minit-curai/"),
        handler: "NetworkOnly",
      },
      ...runtimeCaching,
    ],
  },
});

export default withPWA(nextConfig);
