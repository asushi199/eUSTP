"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { ALL_CACHE_TAGS } from "@/lib/cache-tags";
import { requireAdmin } from "@/lib/rbac";

/**
 * Kosongkan semua cache data (halaman utama, Ains, direktori, Resources, Media).
 * Guna selepas data diubah terus dalam Supabase atau skrip tanpa cangkuk revalidate.
 */
export async function kosongkanCacheData(): Promise<{ ok: boolean; tags: string[] }> {
  await requireAdmin();
  for (const tag of ALL_CACHE_TAGS) revalidateTag(tag);
  revalidatePath("/", "layout");
  return { ok: true, tags: [...ALL_CACHE_TAGS] };
}
