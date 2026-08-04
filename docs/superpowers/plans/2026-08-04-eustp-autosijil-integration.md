# eUSTP × Autosijil Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Selepas tempahan eUSTP diluluskan, sistem auto-cipta event di Autosijil, benarkan pilihan sijil, jana halaman cetak QR poster, dan alihkan urus kehadiran/sijil ke Autosijil.

**Architecture:** eUSTP kekal sistem induk. Selepas `approve`, server eUSTP memanggil API peribadi Autosijil (`POST /api/integrations/eustp/events`) dengan shared secret; pautan disimpan pada `bookings`. Halaman cetak di eUSTP; senarai kehadiran & sijil hanya di Autosijil.

**Tech Stack:** Next.js 15 (eUSTP) + Drizzle/Postgres; Next.js 16 (Autosijil) + Supabase; `qrcode`; shared Bearer secret.

**Spec:** `docs/superpowers/specs/2026-08-04-eustp-autosijil-integration-design.md`

## Global Constraints

- UI eUSTP 100% Bahasa Melayu
- Kelulusan **tidak** digagalkan jika Autosijil down — status sync `failed` + retry
- Idempotent: `external_source=eustp` + `external_booking_id` unik
- Booking lama dengan `attendanceManageToken` tanpa `autosijilEventId` kekal guna aliran tempatan
- Booking baharu (ada `autosijilEventId` / selepas feature) tidak dedahkan `/urus-hadir` tempatan sebagai aliran utama
- Jangan commit secrets; kemas kini `.env.local.example` sahaja
- Verifikasi eUSTP: `npm run typecheck` + `npm run build`

## File map

### Autosijil (`C:\ClaudeProject\Autosijildankehadiran`)

| Fail | Tanggungjawab |
|------|----------------|
| `supabase/migration.sql` (+ snippet baharu) | Kolum `external_source`, `external_booking_id` + unique index |
| `src/lib/integration-auth.ts` | Semak Bearer secret |
| `src/app/api/integrations/eustp/events/route.ts` | POST create-or-return event |
| `src/app/api/integrations/eustp/events/cancel/route.ts` | POST close event by externalBookingId |
| `.env.local.example` | `EUSTP_INTEGRATION_SECRET` |

### eUSTP (`C:\ClaudeProject\ustpallin1\eustp-manjung`)

| Fail | Tanggungjawab |
|------|----------------|
| `lib/schema.ts` + `drizzle/0021_*.sql` | Medan autosijil + `cetakToken` + `requiresCertificate` |
| `lib/tempahan/autosijil-client.ts` | HTTP client create/cancel |
| `lib/tempahan/autosijil-sync.ts` | Sync selepas approve / cancel / retry |
| `lib/tempahan/service.ts` | `approveBookingCore` terima `requiresCertificate`; jangan jana attendance token baharu |
| `lib/actions/tempahan-admin.ts` | Approve + checkbox; retry sync; cancel → close Autosijil |
| `lib/actions/tempahan.ts` | Approve via WhatsApp form + checkbox; semak status URLs |
| `components/tempahan/AdminBookingActions.tsx` | UI checkbox + butang cetak/lompat/retry |
| `components/tempahan/BookingCard.tsx` | Pautan baharu vs legacy |
| `app/(public)/tempahan/[pkg]/cetak-kehadiran/[cetakToken]/page.tsx` | Poster cetak |
| `components/tempahan/CetakKehadiranPoster.tsx` | Layout poster + print CSS helper |
| `.env.local.example`, `AI_CONTEXT_LOG.md` | Env + log |

---

### Task 1: Autosijil — skema + auth + create/cancel API

**Files:**
- Create: `C:\ClaudeProject\Autosijildankehadiran\src\lib\integration-auth.ts`
- Create: `C:\ClaudeProject\Autosijildankehadiran\src\app\api\integrations\eustp\events\route.ts`
- Create: `C:\ClaudeProject\Autosijildankehadiran\src\app\api\integrations\eustp\events\cancel\route.ts`
- Modify: `C:\ClaudeProject\Autosijildankehadiran\supabase\migration.sql` (append)
- Modify: `C:\ClaudeProject\Autosijildankehadiran\.env.local.example`
- Create: `C:\ClaudeProject\Autosijildankehadiran\supabase\migrations\2026-08-04-eustp-external-booking.sql` (standalone untuk jalankan di SQL Editor)

**Interfaces:**
- Produces:
  - `assertEustpIntegrationAuth(req: Request): boolean`
  - `POST /api/integrations/eustp/events` → `{ eventId, slug, publicUrl, adminUrl }`
  - `POST /api/integrations/eustp/events/cancel` → `{ ok: true }`

- [ ] **Step 1: Append SQL migration**

```sql
alter table public.events
  add column if not exists external_source text,
  add column if not exists external_booking_id text;

create unique index if not exists events_external_booking_uidx
  on public.events (external_source, external_booking_id)
  where external_source is not null and external_booking_id is not null;
```

- [ ] **Step 2: Auth helper**

```ts
export function assertEustpIntegrationAuth(req: Request): boolean {
  const secret = process.env.EUSTP_INTEGRATION_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token.length > 0 && token === secret;
}
```

- [ ] **Step 3: Create event route** — idempotent by `(eustp, externalBookingId)`; insert with `status: open`, `DEFAULT_FIELDS`, `requires_certificate`; return absolute URLs from `NEXT_PUBLIC_APP_URL`.

- [ ] **Step 4: Cancel route** — find by external ids; set `status: closed`; 200 even if missing.

- [ ] **Step 5: Env example** — add `EUSTP_INTEGRATION_SECRET=`

- [ ] **Step 6: Smoke** — `npm run lint` / typecheck jika ada; pastikan route compile.

---

### Task 2: eUSTP — skema booking + migrasi

**Files:**
- Modify: `lib/schema.ts` (`bookings` table)
- Create: `drizzle/0021_autosijil_booking_sync.sql`
- Modify: `.env.local.example`

**Interfaces:**
- Produces columns on `bookings`:
  - `requiresCertificate: boolean default false`
  - `cetakToken: text | null`
  - `autosijilEventId`, `autosijilEventSlug`, `autosijilPublicUrl`, `autosijilAdminUrl`
  - `autosijilSyncStatus`, `autosijilSyncError`, `autosijilSyncedAt`

- [ ] **Step 1: Update Drizzle schema** for fields above + indexes on `cetakToken`, `autosijilEventId`.

- [ ] **Step 2: Write SQL migration** matching schema.

- [ ] **Step 3: Env example**

```
AUTOSIJIL_BASE_URL=http://localhost:3001
AUTOSIJIL_INTEGRATION_SECRET=
```

- [ ] **Step 4: Run** `npm run db:migrate` (atau generate+migrate ikut amalan repo) apabila DB tersedia.

---

### Task 3: eUSTP — Autosijil client + sync helper

**Files:**
- Create: `lib/tempahan/autosijil-client.ts`
- Create: `lib/tempahan/autosijil-sync.ts`
- Create: `tests/tempahan/autosijil-client.test.ts` (unit mapping / URL build jika sesuai)

**Interfaces:**
- Produces:
  - `createAutosijilEvent(input): Promise<{eventId, slug, publicUrl, adminUrl}>`
  - `cancelAutosijilEvent(externalBookingId): Promise<void>`
  - `syncApprovedBookingToAutosijil(pkgId, bookingId): Promise<{ok, error?}>`
  - `cancelAutosijilForBooking(pkgId, bookingId): Promise<void>`

- [ ] **Step 1: Client** — fetch with Bearer; throw on non-OK with body text.

- [ ] **Step 2: Sync** — load booking+room+pkg; call create; set `cetakToken` (generateAttendanceToken reuse), sync fields, status `synced`; on error set `failed` + message; **jangan throw** keluar supaya approve kekal.

- [ ] **Step 3: Cancel helper** — call cancel API; set sync status `cancelled` on success.

---

### Task 4: eUSTP — approve/cancel service + actions

**Files:**
- Modify: `lib/tempahan/service.ts`
- Modify: `lib/actions/tempahan-admin.ts`
- Modify: `lib/actions/tempahan.ts` (decideBookingAction)
- Modify: approve page UI jika perlu checkbox
- Test: `tests/admin/…` atau `tests/tempahan/admin-booking-actions.test.ts` update signatures

**Interfaces:**
- `approveBookingCore(pkgId, id, opts?: { requiresCertificate?: boolean })`
  - Set status approved + `requiresCertificate`
  - **Jangan** set attendance tokens baharu
  - Call `syncApprovedBookingToAutosijil` (fire, catch internal)
- `adminApproveBooking(pkgId, bookingId, requiresCertificate?: boolean)`
- `adminRetryAutosijilSync(pkgId, bookingId)`
- `adminCancelBooking` → juga `cancelAutosijilForBooking`
- Public approve form: checkbox `requiresCertificate`

- [ ] **Step 1: Change approveBookingCore** as above.

- [ ] **Step 2: Wire admin + public approve actions.**

- [ ] **Step 3: Wire cancel to close Autosijil event.**

---

### Task 5: eUSTP — UI admin + BookingCard

**Files:**
- Modify: `components/tempahan/AdminBookingActions.tsx`
- Modify: `components/tempahan/BookingCard.tsx`
- Modify: approve page `app/(public)/tempahan/[pkg]/approve/[id]/page.tsx` jika ada borang keputusan

- [ ] **Step 1: Checkbox «Perlu sijil untuk peserta»** sebelum Lulus.

- [ ] **Step 2: Bila `autosijilSyncStatus=synced`:** pautan Cetak + Urus Autosijil (admin URL, `target=_blank`).

- [ ] **Step 3: Bila `failed`:** mesej + butang Cuba sync semula.

- [ ] **Step 4: BookingCard** — jika `autosijilPublicUrl`/`cetakToken` wujud, tunjuk pautan baharu; else legacy `urus-hadir` jika ada token lama.

---

### Task 6: eUSTP — halaman cetak poster

**Files:**
- Create: `components/tempahan/CetakKehadiranPoster.tsx`
- Create: `app/(public)/tempahan/[pkg]/cetak-kehadiran/[cetakToken]/page.tsx`
- Maybe: print styles in component or `globals.css` scoped class `.cetak-kehadiran`

- [ ] **Step 1: Query booking by pkg + cetakToken**; 404 jika tiada / tiada publicUrl.

- [ ] **Step 2: Layout** ikut foto: tajuk, purpose, tarikh+hari, masa slot, lokasi, QR besar, arahan, nota, optional sijil line.

- [ ] **Step 3: Print button + `@media print` hide chrome.**

---

### Task 7: Docs, CodeGraph, verify

**Files:**
- Modify: `AI_CONTEXT_LOG.md`
- Run: `codegraph sync .` (eUSTP; Autosijil jika ada codegraph)
- Run: `npm run typecheck` + `npm run build` di eUSTP
- Run: Autosijil `npm run build` jika feasible

- [ ] **Step 1: Log keputusan Fasa 1.**

- [ ] **Step 2: typecheck/build.**

- [ ] **Step 3: codegraph sync.**

---

## Manual test checklist

1. Set matching secrets + `AUTOSIJIL_BASE_URL` pointing to Autosijil dev.
2. Jalankan SQL Autosijil external columns.
3. `npm run db:migrate` eUSTP.
4. Lulus booking tanpa sijil → event open, cetak QR → `/e/{slug}`.
5. Lulus dengan sijil → `requires_certificate true`.
6. Retry selepas matikan Autosijil → failed; hidupkan → retry synced.
7. Batalkan → Autosijil closed.
8. Booking lama masih boleh `/urus-hadir`.
