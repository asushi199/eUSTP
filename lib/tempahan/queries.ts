import "server-only";

import { and, asc, count, desc, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendees, bookings, pkgs, rooms } from "@/lib/schema";

export type PkgRow = typeof pkgs.$inferSelect;
export type RoomRow = typeof rooms.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;
export type AttendeeRow = typeof attendees.$inferSelect;

export async function listPkgs(): Promise<PkgRow[]> {
  return db.select().from(pkgs).where(eq(pkgs.active, true)).orderBy(asc(pkgs.name));
}

export async function getPkg(pkgId: string): Promise<PkgRow | null> {
  const row = await db.query.pkgs.findFirst({ where: eq(pkgs.id, pkgId) });
  return row && row.active ? row : null;
}

/**
 * Bilangan tempahan menunggu kelulusan — untuk lencana notifikasi admin.
 * `pkgIds` mengehadkan kiraan (mis. PKG_Admin hanya nampak PKG sendiri);
 * senarai kosong bermakna tiada skop, jadi pulangkan 0.
 */
export async function countPendingBookings(pkgIds?: string[] | null): Promise<number> {
  if (pkgIds && pkgIds.length === 0) return 0;
  const base = eq(bookings.status, "pending");
  const where = pkgIds ? and(base, inArray(bookings.pkgId, pkgIds)) : base;
  const rows = await db.select({ n: count() }).from(bookings).where(where);
  return rows[0]?.n ?? 0;
}

export async function listRooms(pkgId: string, includeInactive = false): Promise<RoomRow[]> {
  const where = includeInactive
    ? eq(rooms.pkgId, pkgId)
    : and(eq(rooms.pkgId, pkgId), eq(rooms.active, true));
  return db.select().from(rooms).where(where).orderBy(asc(rooms.sortOrder), asc(rooms.name));
}

export async function getRoomBySlug(pkgId: string, slug: string): Promise<RoomRow | null> {
  const row = await db.query.rooms.findFirst({
    where: and(eq(rooms.pkgId, pkgId), eq(rooms.slug, slug)),
  });
  return row ?? null;
}

/** Tempahan aktif (pending/approved) dari tarikh tertentu — untuk grid kekosongan. */
export async function listActiveBookings(
  pkgId: string,
  fromDate: string,
): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.pkgId, pkgId),
        inArray(bookings.status, ["pending", "approved"]),
        gte(bookings.date, fromDate),
      ),
    )
    .orderBy(asc(bookings.date));
}

export async function getBooking(pkgId: string, id: string): Promise<BookingRow | null> {
  const row = await db.query.bookings.findFirst({
    where: and(eq(bookings.pkgId, pkgId), eq(bookings.id, id)),
  });
  return row ?? null;
}

export async function listBookingsByContact(
  pkgId: string,
  contactNormalized: string,
): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.pkgId, pkgId), eq(bookings.contactNormalized, contactNormalized)),
    )
    .orderBy(desc(bookings.date));
}

/** Permohonan menunggu kelulusan bagi satu nombor telefon — untuk Semak. */
export async function listPendingBookingsByContact(
  pkgId: string,
  contactNormalized: string,
): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.pkgId, pkgId),
        eq(bookings.contactNormalized, contactNormalized),
        eq(bookings.status, "pending"),
      ),
    )
    .orderBy(asc(bookings.date));
}

/** Tempahan diluluskan bagi satu nombor telefon — untuk Semak + pautan kehadiran. */
export async function listApprovedBookingsByContact(
  pkgId: string,
  contactNormalized: string,
): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.pkgId, pkgId),
        eq(bookings.contactNormalized, contactNormalized),
        eq(bookings.status, "approved"),
      ),
    )
    .orderBy(asc(bookings.date));
}

/** Tempahan menunggu kelulusan (mana-mana tarikh) — gilir tindakan admin. */
export async function listPendingBookings(pkgId: string): Promise<BookingRow[]> {
  return db
    .select()
    .from(bookings)
    .where(and(eq(bookings.pkgId, pkgId), eq(bookings.status, "pending")))
    .orderBy(asc(bookings.date));
}

/** Tempahan bukan-pending (approved/rejected/cancelled) bagi satu bulan. */
export async function listPkgMonthBookings(
  pkgId: string,
  year: number,
  month: number,
): Promise<BookingRow[]> {
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const next = new Date(year, month + 1, 1);
  const nextFirst = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.pkgId, pkgId),
        ne(bookings.status, "pending"),
        gte(bookings.date, first),
        lt(bookings.date, nextFirst),
      ),
    )
    .orderBy(asc(bookings.date));
}

/** Kiraan tempahan menunggu bagi setiap PKG — untuk lencana senarai PKG. */
export async function countPendingBookingsByPkg(
  pkgIds: string[],
): Promise<Record<string, number>> {
  if (pkgIds.length === 0) return {};
  const rows = await db
    .select({ pkgId: bookings.pkgId, n: count() })
    .from(bookings)
    .where(and(eq(bookings.status, "pending"), inArray(bookings.pkgId, pkgIds)))
    .groupBy(bookings.pkgId);
  const map: Record<string, number> = {};
  for (const r of rows) map[r.pkgId] = r.n;
  return map;
}

export async function getBookingByAttendanceToken(
  pkgId: string,
  token: string,
): Promise<BookingRow | null> {
  if (!token) return null;
  const row = await db.query.bookings.findFirst({
    where: and(eq(bookings.pkgId, pkgId), eq(bookings.attendanceToken, token)),
  });
  return row ?? null;
}

export async function getBookingByManageToken(
  pkgId: string,
  token: string,
): Promise<BookingRow | null> {
  if (!token) return null;
  const row = await db.query.bookings.findFirst({
    where: and(eq(bookings.pkgId, pkgId), eq(bookings.attendanceManageToken, token)),
  });
  return row ?? null;
}

export async function listAttendees(pkgId: string, bookingId: string): Promise<AttendeeRow[]> {
  return db
    .select()
    .from(attendees)
    .where(and(eq(attendees.pkgId, pkgId), eq(attendees.bookingId, bookingId)))
    .orderBy(asc(attendees.createdAt));
}
