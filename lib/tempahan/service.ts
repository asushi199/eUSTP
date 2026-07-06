import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/schema";
import { generateAttendanceToken } from "./approval-token";
import { getBooking } from "./queries";

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

/** Luluskan tempahan + jana token kehadiran (jika belum ada). */
export async function approveBookingCore(pkgId: string, id: string): Promise<void> {
  const existing = await getBooking(pkgId, id);
  if (!existing) throw new Error("Tempahan tidak dijumpai.");

  await db
    .update(bookings)
    .set({
      status: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
      ...attendanceTokensFor(existing),
    })
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)));
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
}

/** Mesej ralat trigger DB (advisory-lock) → mesej mesra pengguna. */
export function friendlyBookingError(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (message.includes("Slot bilik ini sudah ditempah")) {
    return "Slot bilik ini sudah ditempah atau sedang menunggu kelulusan. Sila pilih masa lain.";
  }
  return message || "Tempahan tidak berjaya dihantar.";
}
