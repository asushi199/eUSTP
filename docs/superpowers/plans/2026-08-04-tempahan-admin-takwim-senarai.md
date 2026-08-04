# Admin Tempahan Takwim Senarai — Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Compact week-grouped booking list (takwim-style) for admin Tempahan Senarai; mobile always uses it; desktop keeps Kalendar | Senarai.

**Architecture:** Extend shared `MonthSection` with optional `agenda` on `MonthItem` + `forceListOnMobile`. New pure week utils in `lib/month-view.ts`. New `BookingAgendaRow` + week list UI. Wire from `TempahanAdminView` only; Khidmat Bantu unchanged.

**Tech Stack:** Next.js 15, React 19, existing eustp CSS utilities, BM UI.

## Global Constraints

- UI 100% Bahasa Melayu; design system eustp (not egerak classes).
- Do not break Khidmat Bantu `MonthSection` usage.
- No multi-day row merge; no Kalendar grid redesign.
- Pending: desktop full cards, mobile agenda rows.

---

### Task 1: Week grouping utils

**Files:** `lib/month-view.ts`

- [x] Add `WeekGroup<T>`, `groupItemsByWeek`, `weekRangeLabel`, `defaultOpenWeekKey`
- [x] Align weeks with `buildMonthGrid` (Mon–Sun, month-clipped dates)
- [x] Only return weeks with `itemCount > 0`

### Task 2: BookingAgendaRow

**Files:** `components/tempahan/BookingAgendaRow.tsx` (new)

- [x] Compact row: date block, time, purpose, room badge, status dot
- [x] Expand: details + `AdminBookingActions`
- [x] Controlled or local expand; parent can enforce one-open-per-week

### Task 3: WeekAgendaList in MonthSection

**Files:** `components/admin-month/MonthSection.tsx`, optionally `WeekAgendaList.tsx`

- [x] Extend `MonthItem` with optional `agenda`
- [x] `forceListOnMobile` prop; hide Kalendar toggle + calendar on `<sm` when set
- [x] Senarai: if any item has `agenda`, render week list; else legacy day cards

### Task 4: Wire TempahanAdminView

**Files:** `components/tempahan/TempahanAdminView.tsx`

- [x] Fill `agenda` on month items
- [x] Pending dual layout (desktop cards / mobile agenda)
- [x] Pass `forceListOnMobile`

### Task 5: Verify

- [x] `npm run typecheck`
- [x] `npm run build` (if typecheck clean)
- [x] Note in `AI_CONTEXT_LOG.md`
- [x] `codegraph sync .` if structure changed
