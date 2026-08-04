import {
  getConflictingBooking,
  type BookingLike,
  type BookingStatus,
  type Slot,
} from "./booking-rules";

export type AdminEditableBookingLike = BookingLike & {
  id: string;
};

export function canEditBookingFromAdmin(status: BookingStatus) {
  return status === "pending" || status === "approved";
}

export function canDeleteBookingFromAdmin(_status: BookingStatus) {
  return true;
}

export function getEditableBookingConflict<T extends AdminEditableBookingLike>(
  bookings: T[],
  target: {
    bookingId: string;
    roomSlug: string;
    date: string;
    slot: Slot;
  },
): T | undefined {
  return getConflictingBooking(
    bookings.filter((booking) => booking.id !== target.bookingId),
    target.roomSlug,
    target.date,
    target.slot,
  );
}
