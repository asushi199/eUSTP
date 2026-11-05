/**
 * Tag cache data (Next Data Cache / `unstable_cache`) — satu sumber kebenaran.
 *
 * Cache panjang (24 jam) + dibatalkan bila data berubah. Laluan pembatalan:
 *  - server action / publish dalam aplikasi → `revalidateTag(tag)` terus;
 *  - skrip import (`npm run db:import-*`) → POST `/api/revalidate` (scripts/lib/revalidate-site.ts);
 *  - ubah terus dalam Supabase / skrip tanpa cangkuk → butang "Kosongkan cache" di
 *    `/admin/backup` atau `npm run cache:clear`.
 * Fail ini bebas `server-only` supaya boleh diimport oleh route handler & action.
 */
export const CACHE_TAGS = {
  /** Ringkasan CoE Analytics + tebus buku halaman utama (data import bulanan). */
  home: "home",
  /** Modul Perkhidmatan halaman utama (tempahan, Khidmat Bantu, pinjaman — TTL pendek). */
  perkhidmatan: "home-perkhidmatan",
  ains: "ains",
  direktori: "direktori",
  resources: "resources-cards",
  media: "media-cards",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

export const ALL_CACHE_TAGS: CacheTag[] = Object.values(CACHE_TAGS);

/** Data yang hanya berubah melalui import/aksi admin: 24 jam sebagai jaring keselamatan. */
export const LONG_REVALIDATE_S = 24 * 60 * 60;
