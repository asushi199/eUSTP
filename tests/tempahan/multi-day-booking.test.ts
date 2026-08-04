import assert from "node:assert/strict";
import test from "node:test";
import {
  getBatchConflicts,
  type BookingLike,
} from "../../lib/tempahan/booking-rules";
import {
  isWithinBookingDayLimit,
  listInclusiveDates,
  MAX_BOOKING_DAYS,
} from "../../lib/tempahan/date";

test("listInclusiveDates returns inclusive ISO range", () => {
  assert.deepEqual(listInclusiveDates("2026-08-03", "2026-08-05"), [
    "2026-08-03",
    "2026-08-04",
    "2026-08-05",
  ]);
});

test("listInclusiveDates returns single day when start equals end", () => {
  assert.deepEqual(listInclusiveDates("2026-08-03", "2026-08-03"), ["2026-08-03"]);
});

test("listInclusiveDates returns null for invalid or reversed range", () => {
  assert.equal(listInclusiveDates("bad", "2026-08-03"), null);
  assert.equal(listInclusiveDates("2026-08-05", "2026-08-03"), null);
});

test("booking day limit is 7 inclusive", () => {
  assert.equal(MAX_BOOKING_DAYS, 7);
  assert.equal(isWithinBookingDayLimit(1), true);
  assert.equal(isWithinBookingDayLimit(7), true);
  assert.equal(isWithinBookingDayLimit(8), false);
  assert.equal(isWithinBookingDayLimit(0), false);
});

const sampleBookings: BookingLike[] = [
  {
    roomSlug: "bilik_a",
    date: "2026-08-04",
    slot: "am",
    status: "pending",
    name: "Ali",
    purpose: "Mesyuarat",
  },
];

test("getBatchConflicts lists every conflicting day", () => {
  const conflicts = getBatchConflicts(sampleBookings, "bilik_a", [
    { date: "2026-08-03", slot: "full_day" },
    { date: "2026-08-04", slot: "pm" },
    { date: "2026-08-05", slot: "am" },
  ]);
  assert.equal(conflicts.length, 0);

  const withConflict = getBatchConflicts(sampleBookings, "bilik_a", [
    { date: "2026-08-03", slot: "full_day" },
    { date: "2026-08-04", slot: "full_day" },
    { date: "2026-08-05", slot: "am" },
  ]);
  assert.equal(withConflict.length, 1);
  assert.equal(withConflict[0]?.date, "2026-08-04");
  assert.equal(withConflict[0]?.conflict.name, "Ali");
});
