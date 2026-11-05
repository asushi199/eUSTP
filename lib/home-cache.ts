import { unstable_cache } from "next/cache";
import { CACHE_TAGS, LONG_REVALIDATE_S } from "@/lib/cache-tags";
import { getAnalisisHomeSummary } from "@/lib/analisis/summary";
import { getPerkhidmatanHomeModules } from "@/lib/analisis/perkhidmatan";
import { getTebusBukuHomeModule } from "@/lib/tebus-buku/queries";

/**
 * Cache data halaman utama (Next Data Cache) — kurangkan egress Supabase.
 *
 * Halaman utama `force-dynamic` dahulu menjalankan berpuluh query (termasuk
 * semua snapshot DCS/DELIMa) pada SETIAP lawatan, termasuk bot. Data ini
 * dikemas kini bulanan (import manual) → cache 24 jam; skrip import & aksi admin
 * membatalkan tag `home` serta-merta (lihat `lib/cache-tags.ts`). Perkhidmatan
 * (tempahan/Khidmat Bantu/pinjaman) berubah setiap hari melalui borang awam → kekal
 * 15 minit (data kecil, tidak perlu tag pada setiap aksi).
 * Ralat tidak dicache (unstable_cache hanya simpan hasil yang berjaya).
 */
const HOME_REVALIDATE_S = 15 * 60;

export const getAnalisisHomeSummaryCached = unstable_cache(
  () => getAnalisisHomeSummary(),
  ["home:analisis-summary"],
  { revalidate: LONG_REVALIDATE_S, tags: [CACHE_TAGS.home] },
);

export const getPerkhidmatanHomeModulesCached = unstable_cache(
  (year: number) => getPerkhidmatanHomeModules(year),
  ["home:perkhidmatan"],
  { revalidate: HOME_REVALIDATE_S, tags: [CACHE_TAGS.perkhidmatan] },
);

export const getTebusBukuHomeModuleCached = unstable_cache(
  () => getTebusBukuHomeModule(),
  ["home:tebus-buku"],
  { revalidate: LONG_REVALIDATE_S, tags: [CACHE_TAGS.home] },
);
