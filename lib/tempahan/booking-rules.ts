/** Logik slot & konflik — diporting dari tempahan-pkg-manjung/src/lib/booking-rules.ts. */

export type Slot = "am" | "pm" | "full_day";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type BookingLike = {
  roomSlug: string;
  date: string;
  slot: Slot;
  status: BookingStatus;
  name: string;
  purpose: string;
};

export const slots: Array<{ id: Slot; label: string; shortLabel: string }> = [
  { id: "am", label: "Pagi", shortLabel: "AM" },
  { id: "pm", label: "Petang", shortLabel: "PM" },
  { id: "full_day", label: "Sepanjang Hari", shortLabel: "Hari" },
];

export function slotsOverlap(existingSlot: Slot, requestedSlot: Slot) {
  return (
    existingSlot === requestedSlot ||
    existingSlot === "full_day" ||
    requestedSlot === "full_day"
  );
}

export function blocksSlot(booking: { status: BookingStatus }) {
  return booking.status === "pending" || booking.status === "approved";
}

export function getConflictingBooking<T extends BookingLike>(
  bookings: T[],
  roomSlug: string,
  date: string,
  slot: Slot,
): T | undefined {
  return bookings.find((booking) => {
    if (!blocksSlot(booking)) return false;
    if (booking.roomSlug !== roomSlug || booking.date !== date) return false;
    return slotsOverlap(booking.slot, slot);
  });
}

export function isSlotAvailable(
  bookings: BookingLike[],
  roomSlug: string,
  date: string,
  slot: Slot,
) {
  return !getConflictingBooking(bookings, roomSlug, date, slot);
}

export function getSlotBooking<T extends BookingLike>(
  bookings: T[],
  roomSlug: string,
  date: string,
  slot: Slot,
): T | undefined {
  return bookings.find((booking) => {
    if (!blocksSlot(booking)) return false;
    if (booking.roomSlug !== roomSlug || booking.date !== date) return false;
    if (booking.slot === "full_day") return true;
    return booking.slot === slot;
  });
}

export function formatRoom(
  rooms: Array<{ slug: string; name: string }>,
  roomSlug: string,
) {
  return rooms.find((item) => item.slug === roomSlug)?.name ?? roomSlug;
}

export function formatSlot(slot: Slot) {
  return slots.find((item) => item.id === slot)?.label ?? slot;
}

export function formatBookingStatus(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    pending: "Menunggu kelulusan",
    approved: "Diluluskan",
    rejected: "Ditolak",
    cancelled: "Dibatalkan",
  };
  return labels[status];
}

export function parseSlot(value: unknown): Slot | null {
  return value === "am" || value === "pm" || value === "full_day" ? value : null;
}

export function slugifyRoomName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}
