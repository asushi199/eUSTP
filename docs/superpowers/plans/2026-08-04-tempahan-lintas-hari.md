# Tempahan Lintas Hari — Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Allow public room booking across consecutive days (max 7), with per-day slots, all-or-nothing conflict check, and independent per-day approval.

**Architecture:** Expand `BookingForm` to date start/end + per-day slot rows; `createBookingAction` parses N days, validates conflicts for the whole batch, inserts N rows in one transaction. No schema change.

**Tech Stack:** Next.js 15, React 19, Drizzle, existing `booking-rules` + advisory-lock trigger.

## Global Constraints

- UI 100% Bahasa Melayu
- Max inclusive range: 7 days
- No `batch_id` / schema migration
- Approval remains per booking row
- Match existing form classes (`.input`, `.label`, `.btn-primary`)

---

### Task 1: Date-range helpers + batch conflict helpers

**Files:**
- Modify: `lib/tempahan/date.ts`
- Modify: `lib/tempahan/booking-rules.ts`
- Create: `tests/tempahan/multi-day-booking.test.ts`

- [ ] **Step 1:** Add `listInclusiveDates(start, end)` returning `string[] | null` (null if invalid / end < start). Add `MAX_BOOKING_DAYS = 7` and `isWithinBookingDayLimit(count)`.
- [ ] **Step 2:** Add `getBatchConflicts(bookings, roomSlug, days: {date, slot}[])` returning array of `{ date, slot, conflict }`.
- [ ] **Step 3:** Add pure-logic tests for inclusive range, 7-day limit, and batch conflict all-or-nothing detection.
- [ ] **Step 4:** Run tests / typecheck for these units.

### Task 2: WhatsApp multi-day message

**Files:**
- Modify: `lib/tempahan/whatsapp.ts`

- [ ] **Step 1:** Extend details type to accept either single `date`/`slot` or `entries: { date, slot }[]` (formatted strings).
- [ ] **Step 2:** Message lists all entries under `Tarikh/Slot:`; keep single-day format compatible.

### Task 3: Server action — batch create

**Files:**
- Modify: `lib/actions/tempahan.ts`

- [ ] **Step 1:** Accept `date_start`, `date_end` (optional end = start), and parallel `slot` fields via `FormData.getAll("slots")` + dates from range (server recomputes dates from start/end — do not trust client date list alone).
- [ ] **Step 2:** Validate length ≤ 7, slots length matches day count, each slot parseable.
- [ ] **Step 3:** Load `listActiveBookings(pkgId, dateStart)`; if any `getBatchConflicts` → return BM error listing all conflict days; insert nothing.
- [ ] **Step 4:** `db.transaction`: insert all rows with unique ids + approval hashes; on trigger error rollback + `friendlyBookingError`.
- [ ] **Step 5:** WhatsApp URL uses first booking approval link + all formatted entries.

### Task 4: BookingForm UI

**Files:**
- Modify: `components/tempahan/BookingForm.tsx`

- [ ] **Step 1:** Replace single date with `date` (mula) + `date_end` (tamat, optional).
- [ ] **Step 2:** When end > start, render per-day slot selects; default `full_day`; submit `slots` via multiple inputs named `slots`.
- [ ] **Step 3:** Client-side disable submit if any day conflicts against `bookings` prop.
- [ ] **Step 4:** Keep single-day UX when end empty or equal to start (one slot select).
- [ ] **Step 5:** Prefill: if `prefillDate` set, fill start (and end if single).

### Task 5: Verify

- [ ] `npm run typecheck`
- [ ] `npm run build` (or at least typecheck if build too slow)
- [ ] Manual smoke notes for AI_CONTEXT_LOG if significant
- [ ] `codegraph sync .` if structure changed meaningfully
