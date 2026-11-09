/**
 * Laluan yang perlu log masuk staf, dan ke mana kembali selepas log masuk.
 * Edge-safe (middleware): tiada import db / bcrypt.
 */

const PROTECTED_PREFIXES = ["/admin", "/analisis"];

/**
 * Model public-first: kebanyakan halaman awam TIDAK melalui auth.
 * Pengecualian: /analisis dalaman sahaja (akaun staf); /analisis/ai-tools dan
 * /analisis/delima awam (dikongsi kepada sekolah).
 */
export function needsStaffAuth(pathname: string): boolean {
  if (
    pathname === "/analisis/ai-tools" ||
    pathname.startsWith("/analisis/ai-tools/") ||
    pathname === "/analisis/delima" ||
    pathname === "/analisis/ains"
  ) {
    return false;
  }
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Ke mana pergi selepas log masuk (?from= / ?ke=): hanya laluan dalam portal ini,
 * cth. "/admin/peralatan/sitiawan/permohonan/12" atau "/tg?ke=%2Fadmin". Selain itu
 * (laman lain, "//x", "/\x", ruang atau aksara pelik, terlalu panjang) → `fallback`,
 * supaya alamat tidak boleh menghantar pengguna ke laman luar.
 */
export function safePath(value: unknown, fallback = "/admin"): string {
  return typeof value === "string" && /^\/(?![/\\])[\x21-\x7e]{0,500}$/.test(value)
    ? value
    : fallback;
}
