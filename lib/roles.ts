/**
 * Peranan pengguna eUSTP (hanya untuk backend /admin — halaman awam tiada log masuk):
 * - Admin     : pentadbir penuh USTP (semua modul + pengurusan pengguna)
 * - Pegawai   : pegawai PPD — semua modul laporan/direktori, tanpa pengurusan pengguna
 * - PKG_Admin : pentadbir PKG — hanya modul tempahan bagi PKG sendiri (pkgId)
 */
export const USER_PERANAN = ["Admin", "Pegawai", "PKG_Admin"] as const;
export type UserPeranan = (typeof USER_PERANAN)[number];

export function isKnownPeranan(value: string): value is UserPeranan {
  return (USER_PERANAN as readonly string[]).includes(value);
}

export function isFullAdmin(peranan: UserPeranan): boolean {
  return peranan === "Admin";
}

/** Laporan DPD/PSS + Direktori (admin) — Admin dan Pegawai. */
export function canManageKandungan(peranan: UserPeranan): boolean {
  return peranan === "Admin" || peranan === "Pegawai";
}

/** Tempahan (admin) — semua peranan; PKG_Admin terhad kepada pkgId sendiri. */
export function canManageTempahan(peranan: UserPeranan): boolean {
  return isKnownPeranan(peranan);
}

export function canManageUsers(peranan: UserPeranan): boolean {
  return peranan === "Admin";
}

export const PERANAN_LABEL: Record<UserPeranan, string> = {
  Admin: "Pentadbir",
  Pegawai: "Pegawai PPD",
  PKG_Admin: "Pentadbir PKG",
};
