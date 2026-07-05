"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { pkgs, rooms } from "@/lib/schema";
import { requireTempahanAccess } from "@/lib/rbac";
import { slugifyRoomName } from "@/lib/tempahan/booking-rules";
import { parseCapacityInput } from "@/lib/tempahan/room-capacity";
import { getRoomBySlug } from "@/lib/tempahan/queries";
import { uploadRoomPhoto } from "@/lib/tempahan/room-photos";
import {
  approveBookingCore,
  cancelBookingCore,
  friendlyBookingError,
  rejectBookingCore,
} from "@/lib/tempahan/service";

type ActionResult = { ok: boolean; error?: string };

function refreshBookingPaths(pkgId: string) {
  revalidatePath(`/tempahan/${pkgId}`);
  revalidatePath(`/admin/tempahan/${pkgId}`);
}

/* --------------------------- kelulusan panel admin --------------------------- */

export async function adminApproveBooking(
  pkgId: string,
  bookingId: string,
): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);
  try {
    await approveBookingCore(pkgId, bookingId);
  } catch (e) {
    return { ok: false, error: friendlyBookingError(e) };
  }
  refreshBookingPaths(pkgId);
  return { ok: true };
}

export async function adminRejectBooking(
  pkgId: string,
  bookingId: string,
): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);
  await rejectBookingCore(pkgId, bookingId);
  refreshBookingPaths(pkgId);
  return { ok: true };
}

export async function adminCancelBooking(
  pkgId: string,
  bookingId: string,
): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);
  await cancelBookingCore(pkgId, bookingId);
  refreshBookingPaths(pkgId);
  return { ok: true };
}

/* --------------------------- pengurusan bilik --------------------------- */

const roomSchema = z.object({
  name: z.string().min(1, "Nama bilik diperlukan").max(200),
  shortName: z.string().max(50).default(""),
  category: z.string().max(100).default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

function parseAmenities(formData: FormData): string[] {
  const preset = formData.getAll("amenities").map(String);
  const custom = String(formData.get("amenities_custom") ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set([...preset, ...custom])).slice(0, 20);
}

export async function saveRoom(pkgId: string, formData: FormData): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);

  const parsed = roomSchema.safeParse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    category: formData.get("category"),
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah" };
  }
  const data = parsed.data;
  const existingSlug = String(formData.get("slug") ?? "").trim();
  const capacity = parseCapacityInput(formData.get("capacity"));
  if (!capacity) {
    return { ok: false, error: "Kapasiti (pax) diperlukan." };
  }

  // Gambar (pilihan)
  let imageSrc: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 4 * 1024 * 1024) {
      return { ok: false, error: "Gambar bilik melebihi 4 MB." };
    }
    try {
      const buffer = Buffer.from(await photo.arrayBuffer());
      imageSrc = await uploadRoomPhoto(pkgId, existingSlug || slugifyRoomName(data.name), {
        name: photo.name,
        type: photo.type,
        buffer,
      });
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  const values = {
    name: data.name,
    shortName: data.shortName || data.name.slice(0, 30),
    category: data.category,
    capacity,
    amenities: parseAmenities(formData),
    sortOrder: data.sortOrder,
    ...(imageSrc ? { imageSrc } : {}),
  };

  if (existingSlug) {
    const room = await getRoomBySlug(pkgId, existingSlug);
    if (!room) return { ok: false, error: "Bilik tidak dijumpai." };
    await db
      .update(rooms)
      .set(values)
      .where(and(eq(rooms.pkgId, pkgId), eq(rooms.slug, existingSlug)));
  } else {
    const slug = slugifyRoomName(data.name);
    if (!slug) return { ok: false, error: "Nama bilik tidak sah." };
    const duplicate = await getRoomBySlug(pkgId, slug);
    if (duplicate) return { ok: false, error: "Bilik dengan nama ini sudah wujud." };
    await db.insert(rooms).values({ pkgId, slug, ...values });
  }

  revalidatePath(`/admin/tempahan/${pkgId}/bilik`);
  revalidatePath(`/tempahan/${pkgId}`);
  const slugToRevalidate = existingSlug || slugifyRoomName(data.name);
  if (slugToRevalidate) {
    revalidatePath(`/tempahan/${pkgId}/bilik/${slugToRevalidate}`);
  }
  return { ok: true };
}

/** Soft delete / aktif semula — lindungi rekod tempahan lama. */
export async function toggleRoomActive(
  pkgId: string,
  slug: string,
): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);
  const room = await getRoomBySlug(pkgId, slug);
  if (!room) return { ok: false, error: "Bilik tidak dijumpai." };

  await db
    .update(rooms)
    .set({ active: !room.active })
    .where(and(eq(rooms.pkgId, pkgId), eq(rooms.slug, slug)));

  revalidatePath(`/admin/tempahan/${pkgId}/bilik`);
  revalidatePath(`/tempahan/${pkgId}`);
  return { ok: true };
}

/* --------------------------- tetapan PKG --------------------------- */

export async function updatePkgSettings(
  pkgId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireTempahanAccess(pkgId);

  const phone = String(formData.get("whatsappAdminPhone") ?? "")
    .trim()
    .slice(0, 30);
  if (phone && !/^\+?[0-9 -]{7,20}$/.test(phone)) {
    return { ok: false, error: "Nombor WhatsApp tidak sah." };
  }

  await db
    .update(pkgs)
    .set({ whatsappAdminPhone: phone || null })
    .where(eq(pkgs.id, pkgId));

  revalidatePath(`/admin/tempahan/${pkgId}`);
  revalidatePath(`/admin/tempahan/${pkgId}/tetapan`);
  return { ok: true };
}
