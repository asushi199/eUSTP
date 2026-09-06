/**
 * Peranan backend /admin. NexaBot tidak memakai peranan — akaun aktif +
 * Telegram terikat sudah cukup.
 * - Admin / Pegawai : capaian sama (laporan, direktori, semua PKG)
 * - PKG_Admin       : hanya tempahan/peralatan PKG sendiri (`pkgId`)
 */
export const USER_PERANAN = ["Admin", "Pegawai", "PKG_Admin"] as const;
export type UserPeranan = (typeof USER_PERANAN)[number];

export function isKnownPeranan(value: string): value is UserPeranan {
  return (USER_PERANAN as readonly string[]).includes(value);
}

/** Laporan DPD/PSS + Direktori + Khidmat — Admin dan Pegawai (capaian sama). */
export function canManageKandungan(peranan: UserPeranan | null | undefined): boolean {
  return peranan === "Admin" || peranan === "Pegawai";
}

/** Tempahan (admin) — semua staf; skop PKG_Admin dikawal di `pkgId`, bukan di sini. */
export function canManageTempahan(peranan: UserPeranan | null | undefined): boolean {
  return typeof peranan === "string" && isKnownPeranan(peranan);
}

export const PERANAN_LABEL: Record<UserPeranan, string> = {
  Admin: "Pentadbir",
  Pegawai: "Pegawai PPD",
  PKG_Admin: "Pentadbir PKG",
};
