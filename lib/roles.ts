/**
 * Peranan pengguna NEXa (hanya untuk backend /admin — halaman awam tiada log masuk):
 * - Admin     : pentadbir penuh USTP (semua modul; akaun baharu melalui skrip)
 * - Pegawai   : pegawai PPD — semua modul laporan/direktori
 * - PKG_Admin : pentadbir PKG — hanya modul tempahan bagi PKG sendiri (pkgId)
 */
export const USER_PERANAN = ["Admin", "Pegawai", "PKG_Admin"] as const;
export type UserPeranan = (typeof USER_PERANAN)[number];

export function isKnownPeranan(value: string): value is UserPeranan {
  return (USER_PERANAN as readonly string[]).includes(value);
}

/** Laporan DPD/PSS + Direktori (admin) — Admin dan Pegawai. */
export function canManageKandungan(peranan: UserPeranan): boolean {
  return peranan === "Admin" || peranan === "Pegawai";
}

/** Tempahan (admin) — semua peranan; PKG_Admin terhad kepada pkgId sendiri. */
export function canManageTempahan(peranan: UserPeranan): boolean {
  return isKnownPeranan(peranan);
}

export const PERANAN_LABEL: Record<UserPeranan, string> = {
  Admin: "Pentadbir",
  Pegawai: "Pegawai PPD",
  PKG_Admin: "Pentadbir PKG",
};
