import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/schema";
import { getEditableBookingConflict } from "./admin-booking";
import { parseSlot } from "./booking-rules";
import { generateAttendanceToken } from "./approval-token";
import {
  cancelAutosijilForBooking,
  syncApprovedBookingToAutosijil,
} from "./autosijil-sync";
import { getBooking, listActiveBookings } from "./queries";

function attendanceTokensFor(existing: {
  attendanceToken: string | null;
  attendanceManageToken: string | null;
}) {
  return {
    attendanceToken: existing.attendanceToken ?? generateAttendanceToken(),
    attendanceManageToken:
      existing.attendanceManageToken ?? generateAttendanceToken(),
  };
}

/** Pastikan token kehadiran wujud (rekod lama / edge case). */
export async function ensureAttendanceTokens(pkgId: string, id: string) {
  const existing = await getBooking(pkgId, id);
  if (!existing) throw new Error("Tempahan tidak dijumpai.");
  if (existing.attendanceToken && existing.attendanceManageToken) return existing;

  const tokens = attendanceTokensFor(existing);
  await db
    .update(bookings)
    .set(tokens)
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));

  return { ...existing, ...tokens };
}

export type ApproveBookingOptions = {
  requiresCertificate?: boolean;
};

/**
 * Luluskan tempahan. Aliran baharu: sync Autosijil (tidak menjana token kehadiran
 * tempatan). Kegagalan Autosijil tidak menggagalkan kelulusan.
 */
export async function approveBookingCore(
  pkgId: string,
  id: string,
  opts: ApproveBookingOptions = {},
): Promise<void> {
  const existing = await getBooking(pkgId, id);
  if (!existing) throw new Error("Tempahan tidak dijumpai.");

  const requiresCertificate = Boolean(opts.requiresCertificate);

  await db
    .update(bookings)
    .set({
      status: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
      requiresCertificate,
    })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));

  await syncApprovedBookingToAutosijil(pkgId, id);
}

export async function rejectBookingCore(pkgId: string, id: string): Promise<void> {
  await db
    .update(bookings)
    .set({ status: "rejected", rejectedAt: new Date() })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));
}

export async function cancelBookingCore(pkgId: string, id: string): Promise<void> {
  await db
    .update(bookings)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));

  await cancelAutosijilForBooking(pkgId, id);
}

export async function rescheduleBookingCore(
  pkgId: string,
  id: string,
  nextDate: string,
  nextSlotRaw: string,
): Promise<void> {
  const existing = await getBooking(pkgId, id);
  if (!existing) throw new Error("Tempahan tidak dijumpai.");

  const nextSlot = parseSlot(nextSlotRaw);
  if (!nextSlot) throw new Error("Slot tempahan tidak sah.");

  const active = await listActiveBookings(pkgId, nextDate);
  const conflict = getEditableBookingConflict(active, {
    bookingId: id,
    roomSlug: existing.roomSlug,
    date: nextDate,
    slot: nextSlot,
  });
  if (conflict) {
    throw new Error("Slot bilik ini sudah ditempah");
  }

  await db
    .update(bookings)
    .set({ date: nextDate, slot: nextSlot })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));
}

export async function deleteBookingCore(pkgId: string, id: string): Promise<void> {
  await db.delete(bookings).where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));
}

/** Mesej ralat trigger DB (advisory-lock) → mesej mesra pengguna. */
export function friendlyBookingError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("Slot bilik ini sudah ditempah")) {
    return "Slot bilik ini sudah ditempah atau sedang menunggu kelulusan. Sila pilih masa lain.";
  }
  return message || "Tempahan tidak berjaya dihantar.";
}
