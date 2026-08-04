/**
 * Migrasi sekali: booking approved + tarikh belum luput → Autosijil.
 * Lalai requiresCertificate = false.
 *
 * Penggunaan:
 *   npx tsx scripts/migrate-bookings-to-autosijil.ts --dry-run
 *   npx tsx scripts/migrate-bookings-to-autosijil.ts
 *   npx tsx scripts/migrate-bookings-to-autosijil.ts --pkg=sitiawan --limit=10
 *
 * Skrip ini sengaja tidak import modul `server-only` (Next), supaya boleh dijalankan via tsx.
 */
import "./load-env";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, pkgs, rooms } from "@/lib/schema";

function todayMalaysiaIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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

function formatSlot(slot: string) {
  if (slot === "am") return "Pagi";
  if (slot === "pm") return "Petang";
  if (slot === "full_day") return "Sepanjang Hari";
  return slot;
}

function autosijilConfig() {
  const baseUrl = (process.env.AUTOSIJIL_BASE_URL ?? "").replace(/\/$/, "");
  const secret = process.env.AUTOSIJIL_INTEGRATION_SECRET ?? "";
  return { baseUrl, secret };
}

async function createAutosijilEvent(body: Record<string, unknown>) {
  const { baseUrl, secret } = autosijilConfig();
  if (!baseUrl || !secret) {
    throw new Error("AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan.");
  }
  const res = await fetch(`${baseUrl}/api/integrations/eustp/events`, {
    method: "POST",
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
  if (!json?.eventId || !json.slug || !json.publicUrl || !json.adminUrl) {
    throw new Error("Respons Autosijil tidak lengkap.");
  }
  return json;
}

async function main() {
  const { dryRun, pkgId, limit } = parseArgs(process.argv.slice(2));
  const today = todayMalaysiaIso();
  const { baseUrl, secret } = autosijilConfig();

  if ((!baseUrl || !secret) && !dryRun) {
    throw new Error(
      "AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan dalam .env.local",
    );
  }

  const conditions = [
    eq(bookings.status, "approved"),
    gte(bookings.date, today),
    or(
      isNull(bookings.autosijilEventId),
      sql`${bookings.autosijilSyncStatus} is distinct from ${"synced"}`,
    ),
  ];
  if (pkgId) conditions.push(eq(bookings.pkgId, pkgId));

  const baseQuery = db
    .select()
    .from(bookings)
    .where(and(...conditions))
    .orderBy(asc(bookings.date), asc(bookings.pkgId));

  const rows = limit ? await baseQuery.limit(limit) : await baseQuery;

  console.log(
    `[migrate-autosijil] today(MY)=${today} dryRun=${dryRun} pkg=${pkgId ?? "*"} limit=${limit ?? "none"} candidates=${rows.length}`,
  );
  console.log(`[migrate-autosijil] Autosijil base=${baseUrl || "(belum set)"}`);

  if (rows.length === 0) {
    console.log("Tiada booking untuk dimigrasikan.");
    return;
  }

  for (const row of rows) {
    console.log(
      `- ${row.pkgId} ${row.date} ${row.id.slice(0, 8)}… "${row.purpose.slice(0, 60)}" status=${row.autosijilSyncStatus ?? "null"} event=${row.autosijilEventId ? "yes" : "no"}`,
    );
  }

  if (dryRun) {
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
      const description = [
        `Pemohon: ${row.name} (${row.schoolOrUnit}).`,
        `Slot: ${formatSlot(row.slot)}.`,
        row.contact ? `Telefon: ${row.contact}.` : null,
      ]
        .filter(Boolean)
        .join(" ");

      await db
        .update(bookings)
        .set({
          requiresCertificate: false,
          autosijilSyncStatus: "pending",
          autosijilSyncError: null,
        })
        .where(and(eq(bookings.pkgId, row.pkgId), eq(bookings.id, row.id)));

      const created = await createAutosijilEvent({
        externalBookingId: row.id,
        title,
        eventDate: row.date,
        location: location || null,
        requiresCertificate: false,
        description,
        pkgId: row.pkgId,
        slot: row.slot,
      });

      const cetakToken = row.cetakToken ?? randomBytes(16).toString("base64url");

      await db
        .update(bookings)
        .set({
          cetakToken,
          autosijilEventId: created.eventId,
          autosijilEventSlug: created.slug,
          autosijilPublicUrl: created.publicUrl,
          autosijilAdminUrl: created.adminUrl,
          autosijilSyncStatus: "synced",
          autosijilSyncError: null,
          autosijilSyncedAt: new Date(),
          requiresCertificate: false,
        })
        .where(and(eq(bookings.pkgId, row.pkgId), eq(bookings.id, row.id)));

      ok += 1;
      console.log(`  OK ${row.pkgId}/${row.id} → ${created.publicUrl}`);
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await db
        .update(bookings)
        .set({
          autosijilSyncStatus: "failed",
          autosijilSyncError: error,
        })
        .where(and(eq(bookings.pkgId, row.pkgId), eq(bookings.id, row.id)));
      fail += 1;
      console.log(`  FAIL ${row.pkgId}/${row.id}: ${error}`);
    }
  }

  console.log(`[migrate-autosijil] selesai: ok=${ok} fail=${fail} total=${rows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // biarkan process keluar; pool postgres akan ditutup oleh runtime
  });
