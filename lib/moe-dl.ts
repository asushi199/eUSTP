export const MOE_DL_DOMAIN = "moe-dl.edu.my";

export type AuthKind = "staff" | "moe-dl";

export function isMoeDlEmail(email: string | null | undefined): boolean {
  const value = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!value.endsWith(`@${MOE_DL_DOMAIN}`)) return false;
  const local = value.slice(0, -(MOE_DL_DOMAIN.length + 1));
  return local.length > 0 && !local.includes("@") && !/\s/.test(local);
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim());
}

/** Laluan dalaman yang dibenarkan sebagai tujuan selepas log masuk MOE-DL. */
const MOE_DL_CALLBACK_PREFIXES = ["/direktori", "/laporan/tebus-buku"] as const;

export function safeDirektoriCallbackUrl(from: string | null | undefined): string {
  const value = String(from ?? "").trim();
  if (!MOE_DL_CALLBACK_PREFIXES.some((prefix) => value.startsWith(prefix))) return "/direktori";
  if (value.startsWith("//") || value.includes("://")) return "/direktori";
  return value;
}

/** Tujuan selepas log masuk ialah modul Semak Tebus Buku (bukan Directory). */
export function isTebusBukuCallback(callbackUrl: string): boolean {
  return callbackUrl.startsWith("/laporan/tebus-buku");
}

export function direktoriLoginHref(from?: string): string {
  const callback = safeDirektoriCallbackUrl(from);
  if (callback === "/direktori") return "/direktori/log-masuk";
  return `/direktori/log-masuk?from=${encodeURIComponent(callback)}`;
}
