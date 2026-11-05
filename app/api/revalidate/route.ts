import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ALL_CACHE_TAGS, type CacheTag } from "@/lib/cache-tags";

/**
 * Batalkan cache data selepas skrip import (`npm run db:import-*`) atau ubahan
 * terus dalam Supabase. Dilindungi `CRON_SECRET` (Authorization: Bearer …).
 *
 *   POST /api/revalidate            → semua tag
 *   POST /api/revalidate?tag=ains   → tag tertentu (boleh berulang)
 *
 * Tiada query DB — tidak menambah egress.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const requested = new URL(request.url).searchParams.getAll("tag");
  const tags = requested.length
    ? requested.filter((t): t is CacheTag => (ALL_CACHE_TAGS as string[]).includes(t))
    : ALL_CACHE_TAGS;
  if (tags.length === 0) {
    return NextResponse.json({ ok: false, error: "tag tidak dikenali" }, { status: 400 });
  }

  for (const tag of tags) revalidateTag(tag);
  return NextResponse.json({ ok: true, tags, at: new Date().toISOString() });
}
