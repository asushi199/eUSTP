import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/schema";
import { generateAttendanceToken } from "@/lib/tempahan/approval-token";
import { formatSlot } from "@/lib/tempahan/booking-rules";
import {
  cancelAutosijilEvent,
  createAutosijilEvent,
  isAutosijilConfigured,
} from "@/lib/tempahan/autosijil-client";
import { getBooking, getPkg, getRoomBySlug } from "@/lib/tempahan/queries";

export type SyncResult = { ok: boolean; error?: string };

/** Cipta/semak event Autosijil untuk booking yang sudah diluluskan. */
export async function syncApprovedBookingToAutosijil(
  pkgId: string,
  bookingId: string,
): Promise<SyncResult> {
  const booking = await getBooking(pkgId, bookingId);
  if (!booking) return { ok: false, error: "Tempahan tidak dijumpai." };
  if (booking.status !== "approved") {
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
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));
    return { ok: false, error };
  }

  await db
    .update(bookings)
    .set({
      autosijilSyncStatus: "pending",
      autosijilSyncError: null,
    })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));

  try {
    const [pkg, room] = await Promise.all([
      getPkg(pkgId),
      getRoomBySlug(pkgId, booking.roomSlug),
    ]);

    const title = booking.purpose.trim() || "Program PKG";
    const location = [room?.name ?? booking.roomSlug, pkg?.name]
      .filter(Boolean)
      .join(" / ");
    const description = [
      `Pemohon: ${booking.name} (${booking.schoolOrUnit}).`,
      `Slot: ${formatSlot(booking.slot)}.`,
      booking.contact ? `Telefon: ${booking.contact}.` : null,
    ]
      .filter(Boolean)
      .join(" ");

    const created = await createAutosijilEvent({
      externalBookingId: booking.id,
      title,
      eventDate: booking.date,
      location: location || null,
      requiresCertificate: booking.requiresCertificate,
      description,
      pkgId,
      slot: booking.slot,
    });

    const cetakToken = booking.cetakToken ?? generateAttendanceToken();

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
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));

    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Gagal segerakkan Autosijil.";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));
    return { ok: false, error };
  }
}

/** Tutup event Autosijil apabila tempahan dibatalkan. */
export async function cancelAutosijilForBooking(
  pkgId: string,
  bookingId: string,
): Promise<void> {
  const booking = await getBooking(pkgId, bookingId);
  if (!booking?.autosijilEventId && !booking?.autosijilSyncStatus) return;

  if (!isAutosijilConfigured()) {
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: "Autosijil belum dikonfigurasi; event tidak ditutup.",
      })
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));
    return;
  }

  try {
    await cancelAutosijilEvent(bookingId);
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "cancelled",
        autosijilSyncError: null,
        autosijilSyncedAt: new Date(),
      })
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));
  } catch (e) {
    const error = e instanceof Error ? e.message : "Gagal tutup event Autosijil.";
    await db
      .update(bookings)
      .set({
        autosijilSyncStatus: "failed",
        autosijilSyncError: error,
      })
      .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, bookingId)));
  }
}
