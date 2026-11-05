import { unstable_cache } from "next/cache";
import { getAnalisisHomeSummary } from "@/lib/analisis/summary";
import { getPerkhidmatanHomeModules } from "@/lib/analisis/perkhidmatan";
import { getTebusBukuHomeModule } from "@/lib/tebus-buku/queries";

/**
 * Cache data halaman utama (Next Data Cache) — kurangkan egress Supabase.
 *
 * Halaman utama `force-dynamic` dahulu menjalankan berpuluh query (termasuk
 * semua snapshot DCS/DELIMa) pada SETIAP lawatan, termasuk bot. Data ini
 * dikemas kini bulanan (import manual), jadi 15 minit lewat tidak ketara.
 * Ralat tidak dicache (unstable_cache hanya simpan hasil yang berjaya).
 */
const HOME_REVALIDATE_S = 15 * 60;

export const getAnalisisHomeSummaryCached = unstable_cache(
  () => getAnalisisHomeSummary(),
  ["home:analisis-summary"],
  { revalidate: HOME_REVALIDATE_S, tags: ["home"] },
);

export const getPerkhidmatanHomeModulesCached = unstable_cache(
  (year: number) => getPerkhidmatanHomeModules(year),
  ["home:perkhidmatan"],
  { revalidate: HOME_REVALIDATE_S, tags: ["home"] },
);

export const getTebusBukuHomeModuleCached = unstable_cache(
  () => getTebusBukuHomeModule(),
  ["home:tebus-buku"],
  { revalidate: HOME_REVALIDATE_S, tags: ["home"] },
);
