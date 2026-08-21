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
  room_name: string | null;
  pkg_name: string | null;
  date: string;
  slot: "am" | "pm" | "full_day";
  purpose: string;
  requires_certificate: boolean;
  autosijil_event_id: string | null;
  status: string;
};

async function main() {
  const groupId = process.argv[2];
  const apply = process.argv.includes("--apply");
  if (!groupId) throw new Error("Gunakan: split-booking-group.ts <group-id> [--apply]");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemui.");
  const sql = postgres(url, { max: 1, prepare: false });

  try {
    const rows = await sql<BookingRow[]>`
      select b.id, b.pkg_id, b.room_slug, r.name as room_name, p.name as pkg_name,
        b.date::text, b.slot, b.purpose, b.requires_certificate,
        b.autosijil_event_id, b.status
      from bookings b
      left join rooms r on r.pkg_id = b.pkg_id and r.slug = b.room_slug
      left join pkgs p on p.id = b.pkg_id
      where b.group_id = ${groupId}
      order by b.date
    `;
    if (rows.length < 2 || rows.some((row) => row.status !== "approved" || !row.autosijil_event_id)) {
      throw new Error("Kumpulan tempahan tidak sesuai untuk dipisahkan.");
    }

    console.log(JSON.stringify({ days: rows.map((row) => row.date), mode: apply ? "apply" : "dry-run" }));
    if (!apply) return;
    if (!isAutosijilConfigured()) {
      throw new Error("AUTOSIJIL_BASE_URL / AUTOSIJIL_INTEGRATION_SECRET belum ditetapkan.");
    }

    const oldEventId = rows[0]!.autosijil_event_id!;
    const created = [] as Array<{ row: BookingRow; event: Awaited<ReturnType<typeof createAutosijilEvent>> }>;

    for (const row of rows) {
      const event = await createAutosijilEvent({
        externalBookingId: row.id,
        title: row.purpose.trim() || "Program PKG",
        eventDate: row.date,
        eventEndDate: row.date,
        sessions: [{ date: row.date, slot: row.slot }],
        location: [row.room_name ?? row.room_slug, row.pkg_name].filter(Boolean).join(" / ") || null,
        requiresCertificate: row.requires_certificate,
        description: null,
        pkgId: row.pkg_id,
        slot: row.slot,
      });
      created.push({ row, event });
    }

    // Aktiviti belum bermula. Endpoint ini tetap mengendalikan rekod kehadiran
    // sekiranya wujud, dan hanya membuang event gabungan selepas pemindahan.
    for (const item of created) {
      await mergeLegacyAutosijilEvents(item.row.id, [
        { eventId: oldEventId, sessionDate: item.row.date, slot: item.row.slot },
      ]);
    }

    await sql.begin(async (tx) => {
      for (const { row, event } of created) {
        await tx`
          update bookings
          set group_id = null, cetak_token = ${generateAttendanceToken()},
            autosijil_event_id = ${event.eventId}, autosijil_event_slug = ${event.slug},
            autosijil_public_url = ${event.publicUrl}, autosijil_admin_url = ${event.adminUrl},
            autosijil_sync_status = 'synced', autosijil_sync_error = null,
            autosijil_synced_at = now()
          where id = ${row.id}
        `;
      }
    });

    console.log(JSON.stringify({ splitDays: rows.length }));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
