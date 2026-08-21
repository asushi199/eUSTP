import "./load-env";
import postgres from "postgres";
import { generateAttendanceToken } from "@/lib/tempahan/approval-token";
import {
  createAutosijilEvent,
  isAutosijilConfigured,
  mergeLegacyAutosijilEvents,
} from "@/lib/tempahan/autosijil-client";

type BookingRow = {
  id: string;
  pkg_id: string;
  room_slug: string;
  date: string;
  slot: "am" | "pm" | "full_day";
  name: string;
  school_or_unit: string;
  purpose: string;
  contact_normalized: string;
  status: string;
  requires_certificate: boolean;
  autosijil_event_id: string | null;
  created_at: string;
  pkg_name: string | null;
  room_name: string | null;
};

function isConsecutive(rows: BookingRow[]) {
  return rows.every((row, index) => {
    if (index === 0) return true;
    const previous = new Date(`${rows[index - 1]!.date}T00:00:00Z`).getTime();
    const current = new Date(`${row.date}T00:00:00Z`).getTime();
    return current - previous === 86_400_000;
  });
}

function groupRows(rows: BookingRow[]) {
  const buckets = new Map<string, BookingRow[]>();
  for (const row of rows) {
    const key = [
      row.pkg_id,
      row.room_slug,
      row.created_at,
      row.name,
      row.school_or_unit,
      row.purpose,
      row.contact_normalized,
    ].join("\u0001");
    buckets.set(key, [...(buckets.get(key) ?? []), row]);
  }
  return [...buckets.values()].filter(
    (group) =>
      group.length > 1 &&
      isConsecutive(group) &&
      group.every((row) => row.status === "approved"),
  );
}

function legacyGroupId(firstBookingId: string) {
  // Elak bertembung dengan external_booking_id event harian lama, tetapi kekal
  // deterministik supaya cubaan semula menggunakan event baharu yang sama.
  const last = firstBookingId.at(-1);
  return `${firstBookingId.slice(0, -1)}${last === "0" ? "1" : "0"}`;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemui.");
  const apply = process.argv.includes("--apply");
  const sql = postgres(url, { max: 1, prepare: false });

  try {
    const rows = await sql<BookingRow[]>`
      select b.id, b.pkg_id, b.room_slug, b.date::text, b.slot, b.name, b.school_or_unit,
        b.purpose, b.contact_normalized, b.status, b.requires_certificate,
        b.autosijil_event_id, b.created_at::text, p.name as pkg_name, r.name as room_name
      from bookings b
      left join pkgs p on p.id = b.pkg_id
      left join rooms r on r.pkg_id = b.pkg_id and r.slug = b.room_slug
      where b.group_id is null
      order by b.pkg_id, b.room_slug, b.created_at, b.date
    `;
    const groups = groupRows(rows);
    console.log(
      JSON.stringify({
        legacyGroups: groups.length,
        sourceEvents: groups.reduce(
          (total, group) => total + group.filter((row) => row.autosijil_event_id).length,
          0,
        ),
        mode: apply ? "apply" : "dry-run",
      }),
    );
    if (!apply) return;
    if (!isAutosijilConfigured()) {
      throw new Error("AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan.");
    }

    for (const group of groups) {
      const first = group[0]!;
      const groupId = legacyGroupId(first.id);
      const sessions = group.map((row) => ({ date: row.date, slot: row.slot }));
      const title = first.purpose.trim() || "Program PKG";
      const location = [first.room_name ?? first.room_slug, first.pkg_name].filter(Boolean).join(" / ") || null;

      const created = await createAutosijilEvent({
        externalBookingId: groupId,
        title,
        eventDate: sessions[0]!.date,
        eventEndDate: sessions.at(-1)!.date,
        sessions,
        location,
        requiresCertificate: first.requires_certificate,
        description: null,
        pkgId: first.pkg_id,
        slot: first.slot,
      });

      const sourceEvents = group
        .filter((row) => row.autosijil_event_id)
        .map((row) => ({
          eventId: row.autosijil_event_id!,
          sessionDate: row.date,
          slot: row.slot,
        }));
      if (sourceEvents.length) {
        await mergeLegacyAutosijilEvents(groupId, sourceEvents);
      }

      const cetakToken = generateAttendanceToken();
      await sql.begin(async (tx) => {
        for (const row of group) {
          await tx`
            update bookings
            set group_id = ${groupId}, cetak_token = ${cetakToken},
              autosijil_event_id = ${created.eventId}, autosijil_event_slug = ${created.slug},
              autosijil_public_url = ${created.publicUrl}, autosijil_admin_url = ${created.adminUrl},
              autosijil_sync_status = 'synced', autosijil_sync_error = null,
              autosijil_synced_at = now()
            where id = ${row.id}
          `;
        }
      });
    }

    console.log(JSON.stringify({ mergedGroups: groups.length }));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
