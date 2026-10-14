import "server-only";

import { headers } from "next/headers";

/** URL asas aplikasi: `APP_BASE_URL`; jika kosong, guna origin permintaan semasa. */
export async function resolveBaseUrl(): Promise<string> {
  const env = process.env.APP_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/** URL mutlak halaman kehadiran awam. */
export async function urlKehadiranAwam(): Promise<string> {
  return `${await resolveBaseUrl()}/laporan-mjkd/hadir`;
}
