import withPWAInit from "@ducanh2912/next-pwa";

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
  serverExternalPackages: ["postgres"],
  experimental: {
    serverActions: {
      /** 5 gambar laporan (dimampat klien ≤1.2MB setiap satu) boleh melebihi 2mb lalai. */
      bodySizeLimit: "10mb",
    },
  },
};

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
