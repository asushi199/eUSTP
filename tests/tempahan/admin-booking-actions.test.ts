import assert from "node:assert/strict";
import test from "node:test";
import {
  canDeleteBookingFromAdmin,
  canEditBookingFromAdmin,
  getEditableBookingConflict,
  type AdminEditableBookingLike,
} from "../../lib/tempahan/admin-booking";

const sampleBookings: AdminEditableBookingLike[] = [
  {
    id: "self",
    roomSlug: "bilik_a",
    date: "2026-08-04",
    slot: "am",
    status: "approved",
    name: "Ali",
    purpose: "Mesyuarat",
  },
  {
    id: "other",
    roomSlug: "bilik_a",
    date: "2026-08-05",
    slot: "full_day",
    status: "pending",
    name: "Siti",
    purpose: "Bengkel",
  },
];

test("admin reschedule ignores the booking being edited", () => {
  const conflict = getEditableBookingConflict(sampleBookings, {
    bookingId: "self",
    roomSlug: "bilik_a",
    date: "2026-08-04",
    slot: "am",
  });

  assert.equal(conflict, undefined);
});

test("admin reschedule still blocks when another booking owns the slot", () => {
  const conflict = getEditableBookingConflict(sampleBookings, {
    bookingId: "self",
    roomSlug: "bilik_a",
    date: "2026-08-05",
    slot: "am",
  });

  assert.equal(conflict?.id, "other");
});

test("admin can edit only pending or approved bookings", () => {
  assert.equal(canEditBookingFromAdmin("pending"), true);
  assert.equal(canEditBookingFromAdmin("approved"), true);
  assert.equal(canEditBookingFromAdmin("rejected"), false);
  assert.equal(canEditBookingFromAdmin("cancelled"), false);
});

test("admin can delete any booking status", () => {
  assert.equal(canDeleteBookingFromAdmin("pending"), true);
  assert.equal(canDeleteBookingFromAdmin("approved"), true);
  assert.equal(canDeleteBookingFromAdmin("rejected"), true);
  assert.equal(canDeleteBookingFromAdmin("cancelled"), true);
});
