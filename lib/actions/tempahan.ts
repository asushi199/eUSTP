"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { attendees, bookings } from "@/lib/schema";
import { getSessionUser } from "@/lib/rbac";
import { canManageTempahan } from "@/lib/roles";
import {
  createApprovalToken,
  verifyApprovalToken,
} from "@/lib/tempahan/approval-token";
import {
  formatSlot,
  getConflictingBooking,
  normalizePhoneNumber,
  parseSlot,
} from "@/lib/tempahan/booking-rules";
import { formatMalayDate } from "@/lib/tempahan/date";
import {
  getBooking,
  getBookingByAttendanceToken,
  getPkg,
  listActiveBookings,
  listAttendees,
  listApprovedBookingsByContact,
  listPendingBookingsByContact,
  listRooms,
} from "@/lib/tempahan/queries";
import {
  approveBookingCore,
  cancelBookingCore,
  ensureAttendanceTokens,
  friendlyBookingError,
  rejectBookingCore,
} from "@/lib/tempahan/service";
import { buildWhatsAppShareUrl } from "@/lib/tempahan/whatsapp";

/* --------------------------- helpers --------------------------- */

function requiredText(formData: FormData, key: string, max = 500): string {
  return String(formData.get(key) ?? "")
    .trim()
    .slice(0, max);
}

async function resolveBaseUrl(): Promise<string> {
  const env = process.env.APP_BASE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

/* --------------------------- tempah --------------------------- */

export type BookingFormState = {
  ok: boolean;
  message: string;
  whatsappUrl?: string;
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function createBookingAction(
  _previousState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const pkgId = requiredText(formData, "pkg", 50);
  const roomSlug = requiredText(formData, "room", 100);
  const slot = parseSlot(formData.get("slot"));
  const date = requiredText(formData, "date", 10);
  const name = requiredText(formData, "name", 200);
  const schoolOrUnit = requiredText(formData, "school_or_unit", 300);
  const purpose = requiredText(formData, "purpose", 500);
  const contact = requiredText(formData, "contact", 30);
  const contactNormalized = normalizePhoneNumber(contact);

  const pkg = pkgId ? await getPkg(pkgId) : null;
  if (!pkg) return { ok: false, message: "PKG tidak sah." };

  if (
    !roomSlug ||
    !slot ||
    !dateSchema.safeParse(date).success ||
    !name ||
    !schoolOrUnit ||
    !purpose ||
    !contactNormalized
  ) {
    return { ok: false, message: "Sila lengkapkan semua maklumat tempahan." };
  }

  try {
    const rooms = await listRooms(pkgId);
    const room = rooms.find((item) => item.slug === roomSlug);
    if (!room) return { ok: false, message: "Bilik tidak sah." };

    // Semakan mesra — trigger DB (advisory lock) tetap penjamin terakhir.
    const active = await listActiveBookings(pkgId, date);
    const conflict = getConflictingBooking(active, roomSlug, date, slot);
    if (conflict) {
      return {
        ok: false,
        message: `Slot ini telah ditempah atau menunggu kelulusan oleh ${conflict.name} untuk ${conflict.purpose}. Sila pilih masa lain.`,
      };
    }

    const bookingId = randomUUID();
    const { token, hash } = await createApprovalToken(bookingId);

    await db.insert(bookings).values({
      id: bookingId,
      pkgId,
      roomSlug,
      date,
      slot,
      name,
      schoolOrUnit,
      purpose,
      contact: contactNormalized,
      contactNormalized,
      status: "pending",
      approvalTokenHash: hash,
    });

    const baseUrl = await resolveBaseUrl();
    const approvalUrl = `${baseUrl}/tempahan/${pkgId}/approve/${bookingId}?token=${encodeURIComponent(token)}`;
    const adminPhone = pkg.whatsappAdminPhone?.trim() || "";
    const whatsappUrl = adminPhone
      ? buildWhatsAppShareUrl(adminPhone, {
          name,
          room: room.name,
          date: formatMalayDate(date),
          slot: formatSlot(slot),
          purpose,
          approvalUrl,
        })
      : "";

    revalidatePath(`/tempahan/${pkgId}`);
    revalidatePath(`/admin/tempahan/${pkgId}`);

    return {
      ok: true,
      message: adminPhone
        ? "Permohonan diterima. Sila hantar mesej WhatsApp kepada admin untuk kelulusan."
        : "Permohonan diterima. Nombor WhatsApp admin belum ditetapkan — hubungi PKG secara terus.",
      whatsappUrl,
    };
  } catch (error) {
    return { ok: false, message: friendlyBookingError(error) };
  }
}

/* --------------------------- semak --------------------------- */

export type CheckBookingState = {
  ok: boolean;
  message: string;
  bookings: {
    id: string;
    date: string;
    roomSlug: string;
    slot: string;
    purpose: string;
    status: "pending" | "approved";
    whatsappUrl?: string;
    manageUrl?: string;
  }[];
};

export async function semakTempahanAction(
  _previousState: CheckBookingState,
  formData: FormData,
): Promise<CheckBookingState> {
  const pkgId = requiredText(formData, "pkg", 50);
  const contact = normalizePhoneNumber(requiredText(formData, "contact", 30));

  const pkg = pkgId ? await getPkg(pkgId) : null;
  if (!pkg) return { ok: false, message: "PKG tidak sah.", bookings: [] };
  if (!contact) {
    return { ok: false, message: "Sila masukkan nombor telefon.", bookings: [] };
  }

  try {
    const [pendingBookings, approvedBookings, rooms] = await Promise.all([
      listPendingBookingsByContact(pkgId, contact),
      listApprovedBookingsByContact(pkgId, contact),
      listRooms(pkgId, true),
    ]);
    const adminPhone = pkg.whatsappAdminPhone?.trim() || "";
    const roomName = (slug: string) => rooms.find((r) => r.slug === slug)?.name ?? slug;

    if (pendingBookings.length === 0 && approvedBookings.length === 0) {
      return {
        ok: true,
        message: "Tiada permohonan dijumpai untuk nombor ini.",
        bookings: [],
      };
    }

    const baseUrl = await resolveBaseUrl();

    const pendingResults = await Promise.all(
      pendingBookings.map(async (booking) => {
        const { token, hash } = await createApprovalToken(booking.id);
        await db
          .update(bookings)
          .set({ approvalTokenHash: hash })
          .where(and(eq(bookings.pkgId, pkgId), eq(bookings.id, booking.id)));

        const approvalUrl = `${baseUrl}/tempahan/${pkgId}/approve/${booking.id}?token=${encodeURIComponent(token)}`;

        return {
          id: booking.id,
          date: booking.date,
          roomSlug: booking.roomSlug,
          slot: booking.slot,
          purpose: booking.purpose,
          status: "pending" as const,
          whatsappUrl: adminPhone
            ? buildWhatsAppShareUrl(adminPhone, {
                name: booking.name,
                room: roomName(booking.roomSlug),
                date: formatMalayDate(booking.date),
                slot: formatSlot(booking.slot),
                purpose: booking.purpose,
                approvalUrl,
              })
            : undefined,
        };
      }),
    );

    const approvedResults = await Promise.all(
      approvedBookings.map(async (booking) => {
        const withTokens = await ensureAttendanceTokens(pkgId, booking.id);
        return {
          id: booking.id,
          date: booking.date,
          roomSlug: booking.roomSlug,
          slot: booking.slot,
          purpose: booking.purpose,
          status: "approved" as const,
          manageUrl: withTokens.attendanceManageToken
            ? `/tempahan/${pkgId}/urus-hadir/${withTokens.attendanceManageToken}`
            : undefined,
        };
      }),
    );

    const hasApproved = approvedResults.length > 0;

    return {
      ok: true,
      message: hasApproved
        ? "Permohonan dijumpai. Untuk tempahan yang diluluskan, klik «Urus kehadiran» untuk pautan pendaftaran dan kod QR."
        : "Permohonan dijumpai. Hantar semula mesej WhatsApp kepada admin untuk kelulusan.",
      bookings: [...pendingResults, ...approvedResults],
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Permohonan tidak dapat disemak.",
      bookings: [],
    };
  }
}

/* --------------------------- kehadiran --------------------------- */

export type AttendanceFormState = {
  ok: boolean;
  message: string;
  count?: number;
};

export async function registerAttendanceAction(
  _previousState: AttendanceFormState,
  formData: FormData,
): Promise<AttendanceFormState> {
  const pkgId = requiredText(formData, "pkg", 50);
  const token = requiredText(formData, "token", 100);
  const name = requiredText(formData, "name", 200);
  const contact = requiredText(formData, "contact", 100);

  const pkg = pkgId ? await getPkg(pkgId) : null;
  if (!pkg) return { ok: false, message: "PKG tidak sah." };
  if (!name || !contact) {
    return { ok: false, message: "Sila isi nama dan telefon/emel." };
  }

  try {
    const booking = await getBookingByAttendanceToken(pkgId, token);
    if (!booking || booking.status !== "approved") {
      return {
        ok: false,
        message: "Pautan kehadiran tidak sah atau tempahan belum diluluskan.",
      };
    }

    await db.insert(attendees).values({
      pkgId,
      bookingId: booking.id,
      name,
      contact,
    });
    const list = await listAttendees(pkgId, booking.id);
    revalidatePath(`/tempahan/${pkgId}/urus-hadir/${booking.attendanceManageToken}`);

    return {
      ok: true,
      message: "Kehadiran anda telah direkodkan. Terima kasih!",
      count: list.length,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Kehadiran tidak dapat direkodkan.",
    };
  }
}

/* --------------------------- kelulusan melalui pautan --------------------------- */

export async function approveByTokenAction(formData: FormData) {
  const pkgId = requiredText(formData, "pkg", 50);
  const bookingId = requiredText(formData, "bookingId", 100);
  const token = requiredText(formData, "token", 200);
  const decision = requiredText(formData, "decision", 20);

  const resultBase = `/tempahan/${pkgId}/approve/keputusan`;
  const booking = bookingId ? await getBooking(pkgId, bookingId) : null;

  if (
    !booking ||
    !(await verifyApprovalToken(booking.id, token, booking.approvalTokenHash))
  ) {
    redirect(`${resultBase}?status=invalid`);
  }

  // Pautan kelulusan perlu log masuk (pengganti kata laluan per-PKG sistem lama).
  const user = await getSessionUser();
  if (!user) {
    const back = `/tempahan/${pkgId}/approve/${bookingId}?token=${encodeURIComponent(token)}`;
    redirect(`/login?from=${encodeURIComponent(back)}`);
  }
  if (
    !canManageTempahan(user.peranan) ||
    (user.peranan === "PKG_Admin" && user.pkgId !== pkgId)
  ) {
    redirect(`${resultBase}?status=unauthorized`);
  }

  if (booking.status !== "pending") {
    redirect(`${resultBase}?status=processed`);
  }

  try {
    if (decision === "approve") {
      await approveBookingCore(pkgId, booking.id);
      revalidatePath(`/tempahan/${pkgId}`);
      revalidatePath(`/admin/tempahan/${pkgId}`);
      redirect(`${resultBase}?status=approved`);
    }
    if (decision === "reject") {
      await rejectBookingCore(pkgId, booking.id);
      revalidatePath(`/tempahan/${pkgId}`);
      revalidatePath(`/admin/tempahan/${pkgId}`);
      redirect(`${resultBase}?status=rejected`);
    }
  } catch (e) {
    // redirect() melontar NEXT_REDIRECT — biarkan ia naik
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    redirect(`${resultBase}?status=error`);
  }

  redirect(`${resultBase}?status=invalid`);
}

/* --------------------------- batal oleh pemohon --------------------------- */

export async function cancelOwnBookingAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const pkgId = requiredText(formData, "pkg", 50);
  const bookingId = requiredText(formData, "bookingId", 100);
  const contact = normalizePhoneNumber(requiredText(formData, "contact", 30));

  const booking = bookingId ? await getBooking(pkgId, bookingId) : null;
  if (!booking || booking.contactNormalized !== contact) {
    return { ok: false, message: "Tempahan tidak dijumpai." };
  }
  if (booking.status !== "pending") {
    return { ok: false, message: "Hanya tempahan menunggu boleh dibatalkan." };
  }

  await cancelBookingCore(pkgId, bookingId);
  revalidatePath(`/tempahan/${pkgId}`);
  revalidatePath(`/admin/tempahan/${pkgId}`);
  return { ok: true, message: "Tempahan dibatalkan." };
}
