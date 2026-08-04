/**
 * Kemas kini semua event Autosijil yang terikat booking eUSTP:
 * - kosongkan description (buang maklumat pemohon)
 * - segar semula title / date / location
 *
 *   npx tsx scripts/refresh-autosijil-event-details.ts --dry-run
 *   npx tsx scripts/refresh-autosijil-event-details.ts
 */
import "./load-env";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, pkgs, rooms } from "@/lib/schema";

function parseArgs(argv: string[]) {
  let dryRun = false;
  let pkgId: string | null = null;
  let limit: number | null = null;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--pkg=")) pkgId = arg.slice("--pkg=".length) || null;
    else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    }
  }
  return { dryRun, pkgId, limit };
}

function autosijilConfig() {
  const baseUrl = (process.env.AUTOSIJIL_BASE_URL ?? "").replace(/\/$/, "");
  const secret = process.env.AUTOSIJIL_INTEGRATION_SECRET ?? "";
  return { baseUrl, secret };
}

async function patchAutosijilEvent(body: Record<string, unknown>) {
  const { baseUrl, secret } = autosijilConfig();
  if (!baseUrl || !secret) {
    throw new Error("AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan.");
  }
  const res = await fetch(`${baseUrl}/api/integrations/eustp/events`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: Record<string, string> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, string>) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new Error(json?.error || text || `HTTP ${res.status}`);
  }
}

async function main() {
  const { dryRun, pkgId, limit } = parseArgs(process.argv.slice(2));
  const { baseUrl, secret } = autosijilConfig();
  if ((!baseUrl || !secret) && !dryRun) {
    throw new Error("Autosijil belum dikonfigurasi dalam .env.local");
  }

  const conditions = [isNotNull(bookings.autosijilEventId)];
  if (pkgId) conditions.push(eq(bookings.pkgId, pkgId));

  const baseQuery = db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .orderBy(asc(bookings.date), asc(bookings.pkgId));

  const rows = limit ? await baseQuery.limit(limit) : await baseQuery;

  console.log(
    `[refresh-autosijil] dryRun=${dryRun} pkg=${pkgId ?? "*"} candidates=${rows.length}`,
  );

  if (rows.length === 0) {
    console.log("Tiada event untuk dikemas kini.");
    return;
  }

  if (dryRun) {
    for (const row of rows) {
      console.log(`- ${row.pkgId} ${row.date} ${row.id.slice(0, 8)}… "${row.purpose.slice(0, 50)}"`);
    }
    console.log("Dry-run sahaja — tiada perubahan.");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (const row of rows) {
    try {
      const [pkg] = await db.select().from(pkgs).where(eq(pkgs.id, row.pkgId)).limit(1);
      const [room] = await db
        .select()
        .from(rooms)
        .where(and(eq(rooms.pkgId, row.pkgId), eq(rooms.slug, row.roomSlug)))
        .limit(1);

      const title = row.purpose.trim() || "Program PKG";
      const location = [room?.name ?? row.roomSlug, pkg?.name].filter(Boolean).join(" / ");

      await patchAutosijilEvent({
        externalBookingId: row.id,
        title,
        eventDate: row.date,
        location: location || null,
        description: null,
      });

      await db
        .update(bookings)
        .set({
          autosijilSyncStatus: "synced",
          autosijilSyncError: null,
          autosijilSyncedAt: new Date(),
        })
        .where(and(eq(bookings.pkgId, row.pkgId), eq(bookings.id, row.id)));

      ok += 1;
      console.log(`  OK ${row.pkgId}/${row.id}`);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      fail += 1;
      console.log(`  FAIL ${row.pkgId}/${row.id}: ${error}`);
    }
  }

  console.log(`[refresh-autosijil] selesai: ok=${ok} fail=${fail} total=${rows.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
