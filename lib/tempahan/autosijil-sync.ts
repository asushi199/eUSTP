import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/schema";
import { generateAttendanceToken } from "@/lib/tempahan/approval-token";
import {
  cancelAutosijilEvent,
  createAutosijilEvent,
  isAutosijilConfigured,
  updateAutosijilEvent,
} from "@/lib/tempahan/autosijil-client";
import {
  getBooking,
  getPkg,
  getRoomBySlug,
  listBookingGroup,
  type BookingRow,
} from "@/lib/tempahan/queries";

export type SyncResult = { ok: boolean; error?: string };

async function relatedBookings(pkgId: string, booking: BookingRow): Promise<BookingRow[]> {
  return booking.groupId ? listBookingGroup(pkgId, booking.groupId) : [booking];
}

function groupWhere(pkgId: string, booking: BookingRow) {
  return booking.groupId
    ? and(eq(bookings.pkgId, pkgId), eq(bookings.groupId, booking.groupId))
    : and(eq(bookings.pkgId, pkgId), eq(bookings.id, booking.id));
}

async function buildAutosijilFields(pkgId: string, rows: BookingRow[]) {
  const booking = rows[0]!;
  const [pkg, room] = await Promise.all([
    getPkg(pkgId),
    getRoomBySlug(pkgId, booking.roomSlug),
  ]);

  const title = booking.purpose.trim() || "Program PKG";
  const location = [room?.name ?? booking.roomSlug, pkg?.name]
    .filter(Boolean)
    .join(" / ");

  // Penerangan awam Autosijil: jangan dedahkan maklumat pemohon.
  // Butiran program (tajuk/tarikh/lokasi) sudah ada medan berasingan.
  const approved = rows.filter((row) => row.status === "approved");
  const sessions = approved.map((row) => ({ date: row.date, slot: row.slot }));
  return {
    title,
    location: location || null,
    description: null as string | null,
    eventDate: sessions[0]?.date ?? booking.date,
    eventEndDate: sessions.at(-1)?.date ?? booking.date,
    sessions,
  };
}

/** Cipta/semak event Autosijil untuk booking yang sudah diluluskan. */
export async function syncApprovedBookingToAutosijil(
  pkgId: string,
  bookingId: string,
): Promise<SyncResult> {
  const booking = await getBooking(pkgId, bookingId);
  if (!booking) return { ok: false, error: "Tempahan tidak dijumpai." };
  const rows = await relatedBookings(pkgId, booking);
  if (!rows.some((row) => row.status === "approved")) {
    return { ok: false, error: "Hanya tempahan diluluskan boleh disegerakkan." };
  }

  if (!isAutosijilConfigured()) {
    const error = "Autosijil belum dikonfigurasi (AUTOSIJIL_BASE_URL / SECRET).";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(groupWhere(pkgId, booking));
    return { ok: false, error };
  }

  await db
    .update(bookings)
    .set({
      autosijilSyncStatus: "pending",
      autosijilSyncError: null,
    })
    .where(groupWhere(pkgId, booking));

  try {
    const fields = await buildAutosijilFields(pkgId, rows);

    const created = await createAutosijilEvent({
      externalBookingId: booking.groupId ?? booking.id,
      title: fields.title,
      eventDate: fields.eventDate,
      eventEndDate: fields.eventEndDate,
      sessions: fields.sessions,
      location: fields.location,
      requiresCertificate: booking.requiresCertificate,
      description: fields.description,
      pkgId,
      slot: booking.slot,
    });

    const cetakToken = rows.find((row) => row.cetakToken)?.cetakToken ?? generateAttendanceToken();

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
      })
      .where(groupWhere(pkgId, booking));

    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Gagal segerakkan Autosijil.";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(groupWhere(pkgId, booking));
    return { ok: false, error };
  }
}

/**
 * Kemas kini butiran event Autosijil selepas ubah jadual/lokasi.
 * Tiada event → tiada tindakan (migrasi/approve akan cipta).
 */
export async function pushBookingDetailsToAutosijil(
  pkgId: string,
  bookingId: string,
): Promise<SyncResult> {
  const booking = await getBooking(pkgId, bookingId);
  if (!booking) return { ok: false, error: "Tempahan tidak dijumpai." };
  const rows = await relatedBookings(pkgId, booking);
  if (!rows.some((row) => row.autosijilEventId)) return { ok: true };

  if (!isAutosijilConfigured()) {
    const error = "Autosijil belum dikonfigurasi (AUTOSIJIL_BASE_URL / SECRET).";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(groupWhere(pkgId, booking));
    return { ok: false, error };
  }

  try {
    const fields = await buildAutosijilFields(pkgId, rows);
    await updateAutosijilEvent({
      externalBookingId: booking.groupId ?? booking.id,
      title: fields.title,
      eventDate: fields.eventDate,
      eventEndDate: fields.eventEndDate,
      sessions: fields.sessions,
      location: fields.location,
      description: fields.description,
      requiresCertificate: booking.requiresCertificate,
    });

    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "synced",
        autosijilSyncError: null,
        autosijilSyncedAt: new Date(),
      })
      .where(groupWhere(pkgId, booking));

    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Gagal kemas kini Autosijil.";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(groupWhere(pkgId, booking));
    return { ok: false, error };
  }
}

/** Tutup event Autosijil apabila tempahan dibatalkan. */
export async function cancelAutosijilForBooking(
  pkgId: string,
  bookingId: string,
): Promise<void> {
  const booking = await getBooking(pkgId, bookingId);
  if (!booking) return;
  const rows = await relatedBookings(pkgId, booking);
  if (rows.some((row) => row.status === "approved")) {
    await pushBookingDetailsToAutosijil(pkgId, bookingId);
    return;
  }
  if (!rows.some((row) => row.autosijilEventId || row.autosijilSyncStatus)) return;

  if (!isAutosijilConfigured()) {
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: "Autosijil belum dikonfigurasi; event tidak ditutup.",
      })
      .where(groupWhere(pkgId, booking));
    return;
  }

  try {
    await cancelAutosijilEvent(booking.groupId ?? booking.id);
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "cancelled",
        autosijilSyncError: null,
        autosijilSyncedAt: new Date(),
      })
      .where(groupWhere(pkgId, booking));
  } catch (e) {
    const error = e instanceof Error ? e.message : "Gagal tutup event Autosijil.";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(groupWhere(pkgId, booking));
  }
}
