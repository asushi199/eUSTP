# Reka Bentuk — Integrasi eUSTP Tempahan × Autosijil Kehadiran/Sijil

Tarikh: 2026-08-04  
Modul: Tempahan PKG (eustp-manjung) + Sistem e-Sijil & Kehadiran (Autosijildankehadiran)  
Keputusan pengguna: Approach 1 (API auto-cipta event) + senarai kehadiran hanya di Autosijil

## Masalah

Kepimpinan mahu memansuhkan sistem `senarai kehadiran` tempatan di eUSTP, dan
menghubungkan tempahan bilik dengan Autosijil supaya:

1. Selepas tempahan diluluskan, sistem menjana kertas cetak “Pendaftaran Kehadiran
   Peserta” (QR besar, gaya poster berdiri) secara automatik.
2. Pentadbir boleh memilih sama ada program itu **perlu sijil** atau tidak.
3. Urusan kehadiran / sijil dialihkan ke Autosijil (sistem yang sudah wujud untuk
   diploma/sijil), bukan dibina semula di eUSTP.

## Keputusan yang telah disahkan

1. **eUSTP ialah sistem induk** — tempahan, kelulusan, pilihan sijil, halaman cetak,
   dan pautan lompat.
2. **Autosijil ialah sistem penerima** — event, borang QR, senarai kehadiran, CSV,
   penjanaan/muat turun sijil.
3. **Senarai kehadiran hanya dipaparkan di Autosijil.** eUSTP hanya menyediakan
   butang “Pergi ke kehadiran / sijil”.
4. **Pendekatan teknikal:** selepas `approved`, eUSTP memanggil API peribadi
   Autosijil untuk mencipta (atau mendapatkan semula) event; simpan pautan pada
   booking.
5. **Tidak gabungkan repo / tidak iframe** Autosijil ke dalam eUSTP pada fasa 1.
6. **Tidak selaraskan akaun login** antara dua sistem pada fasa 1.
7. **Tidak sync semula tarikh/lokasi** ke Autosijil selepas kelulusan pada fasa 1
   (fasa 2).
8. **UI 100% Bahasa Melayu** di eUSTP; Autosijil kekalkan gaya BM sedia ada.

## Fakta sedia ada

### eUSTP (`eustp-manjung`)

- `bookings` sudah ada `attendanceToken` + `attendanceManageToken`; lulusan memanggil
  `approveBookingCore` → `ensureAttendanceTokens`.
- Halaman awam: `/tempahan/[pkg]/hadir/[token]`,
  `/tempahan/[pkg]/urus-hadir/[manageToken]` (+ CSV export).
- Jadual `attendees` tempatan (nama + contact sahaja).
- Sudah ada `qrcode` + komponen `QrCode`.
- Slot: `am` | `pm` | `full_day` (`formatSlot` dalam `lib/tempahan/booking-rules.ts`).

### Autosijil (`Autosijildankehadiran`)

- `events` + `attendees` di Supabase; status: `draft` | `open` | `closed` | `released`.
- Sudah ada `requires_certificate` (boolean).
- Cipta program: `createEvent` (server action admin); QR di `QrPanel` → `/e/[slug]`.
- Medan borang lalai: Nama Penuh (`role: name`) + Sekolah / Unit.
- Tiada API integrasi luar lagi; tiada medan `external_booking_id`.

## Seni bina (Fasa 1)

```
Admin Lulus (eUSTP)
  + checkbox "Perlu sijil"
        │
        ▼
approveBookingCore
  status = approved
        │
        ▼
syncBookingToAutosijil(booking)
  POST Autosijil /api/integrations/eustp/events
  Authorization: Bearer <EUSTP_AUTOSIJIL_SHARED_SECRET>
  body: { externalBookingId, title, eventDate, location, requiresCertificate, ... }
        │
        ▼
Autosijil create-or-return event (idempotent by externalBookingId)
  status = open (kehadiran dibuka terus)
  requires_certificate = flag dari eUSTP
        │
        ▼
Simpan pada bookings:
  autosijilEventId, autosijilEventSlug,
  autosijilPublicUrl, autosijilAdminUrl,
  requiresCertificate, autosijilSyncStatus, autosijilSyncedAt
        │
        ▼
UI eUSTP (approved):
  [Cetak Pendaftaran Kehadiran] → /tempahan/.../cetak-kehadiran
  [Urus Kehadiran / Sijil] → autosijilAdminUrl (tab baharu)
```

### Unit & tanggungjawab

| Unit | Repo | Tanggungjawab |
|------|------|----------------|
| `POST /api/integrations/eustp/events` | Autosijil | Cipta/pulang event; auth shared secret; idempotent |
| `POST .../events/:id/cancel` (pilihan fasa 1 ringkas) | Autosijil | Tutup event (`closed`) bila tempahan dibatalkan |
| `lib/tempahan/autosijil-client.ts` | eUSTP | HTTP client + mapping payload |
| `syncBookingToAutosijil` | eUSTP | Dipanggil selepas approve; tulis medan sync |
| Skema `bookings` (medan baharu) | eUSTP | Simpan pautan & status sync |
| Halaman cetak kehadiran | eUSTP | Poster A4/print CSS; QR → `autosijilPublicUrl` |
| Admin / pemohon UI actions | eUSTP | Checkbox sijil + butang cetak/lompat |
| Senarai kehadiran tempatan | eUSTP | **Berhenti diguna untuk booking baharu** (lihat Deprecation) |

## Model data

### eUSTP — tambah pada `bookings`

| Medan | Jenis | Nota |
|-------|-------|------|
| `requiresCertificate` | `boolean not null default false` | Dipilih semasa lulus |
| `autosijilEventId` | `text` nullable | UUID event Autosijil |
| `autosijilEventSlug` | `text` nullable | Untuk paparan / debug |
| `autosijilPublicUrl` | `text` nullable | URL QR / peserta |
| `autosijilAdminUrl` | `text` nullable | URL admin Autosijil |
| `autosijilSyncStatus` | `text` nullable | `pending` \| `synced` \| `failed` \| `cancelled` |
| `autosijilSyncError` | `text` nullable | Mesej ralat terakhir (jika failed) |
| `autosijilSyncedAt` | `timestamptz` nullable | |

Token tempatan `attendanceToken` / `attendanceManageToken` kekal pada skema untuk
rekod lama sahaja. Aliran lulusan baharu **tidak lagi menjana** token ini dan
tidak mendedahkan pautan `/hadir` atau `/urus-hadir` tempatan.

### Autosijil — tambah pada `events`

| Medan | Jenis | Nota |
|-------|-------|------|
| `external_source` | `text` nullable | Nilai tetap `"eustp"` |
| `external_booking_id` | `text` nullable | UUID booking eUSTP |
| Unique partial index | `(external_source, external_booking_id)` WHERE both NOT NULL | Idempotency |

## Kontrak API Autosijil

### Auth

- Header: `Authorization: Bearer <shared secret>`
- Secret disimpan di kedua-dua `.env`:
  - eUSTP: `AUTOSIJIL_BASE_URL`, `AUTOSIJIL_INTEGRATION_SECRET`
  - Autosijil: `EUSTP_INTEGRATION_SECRET` (sama nilai)
- Tiada akses anon / cookie admin untuk endpoint ini.

### `POST /api/integrations/eustp/events`

Request JSON:

```json
{
  "externalBookingId": "uuid",
  "title": "PROGRAM ...",
  "eventDate": "2026-07-21",
  "location": "Bilik Multimedia / PKG Sitiawan",
  "requiresCertificate": true,
  "description": "opsyen — boleh isi tujuan + pemohon",
  "pkgId": "sitiawan",
  "slot": "full_day"
}
```

Gelagat:

1. Jika sudah ada event dengan `external_source=eustp` + `external_booking_id` sama
   → **pulangkan event sedia ada** (jangan cipta kedua).
2. Jika baharu → insert event:
   - `slug` dijana seperti sedia ada (`newSlug`)
   - `form_fields` = DEFAULT_FIELDS Autosijil
   - `status` = `open` (QR boleh diguna serta-merta)
   - `requires_certificate` = flag dari request
   - `template_id` = null (admin pilih kemudian di Autosijil jika perlu sijil)
3. Response 200:

```json
{
  "eventId": "uuid",
  "slug": "...",
  "publicUrl": "https://autosijil.../e/{slug}",
  "adminUrl": "https://autosijil.../admin/events/{id}"
}
```

### `POST /api/integrations/eustp/events/cancel` (Fasa 1 minimum)

Request: `{ "externalBookingId": "uuid" }`  
Gelagat: cari event → set `status = closed` (kehadiran ditutup). Jangan padam
attendees. Jika tiada event → 200 no-op.

### Mapping medan dari booking eUSTP

| Autosijil | Sumber eUSTP |
|-----------|--------------|
| `title` | `booking.purpose` (trim; jika kosong fallback nama program generik) |
| `event_date` | `booking.date` |
| `location` | `"{room.name} / {pkg.name}"` |
| `requires_certificate` | checkbox admin semasa lulus |
| `description` | `Pemohon: {name} ({schoolOrUnit}). Slot: {formatSlot(slot)}.` |

## UI eUSTP

### Semasa lulus (admin + pautan WhatsApp approve jika berkaitan)

- Tambah checkbox: **Perlu sijil untuk peserta** (default: tidak ditandakan).
- Selepas lulus berjaya:
  - Jika sync OK → tunjuk butang cetak + lompat Autosijil.
  - Jika sync gagal → booking tetap `approved`, status sync `failed`, tunjuk
    mesej + butang **Cuba sync semula**.

### Halaman cetak

Laluan Fasa 1 (awam berasaskan token, tanpa login):

`/tempahan/[pkg]/cetak-kehadiran/[cetakToken]`

Tambah medan `cetakToken text nullable` + index; dijana apabila sync Autosijil
berjaya. Pegawai PKG boleh buka/cetak dari WhatsApp atau dari kad tempahan admin
tanpa log masuk eUSTP. Jika sync belum berjaya, halaman cetak tidak tersedia.

Kandungan poster (ikut foto rujukan):

1. Logo PKG / USTP (kecil, tengah) — guna logo PKG jika ada
2. Tajuk: `PENDAFTARAN KEHADIRAN PESERTA`
3. Nama program (purpose), tarikh + hari BM, masa (dari slot), lokasi
4. QR besar → `autosijilPublicUrl`
5. Arahan: `SILA IMBAS/SCAN KOD QR DI ATAS UNTUK MENDAFTAR KEHADIRAN ANDA.`
6. Nota peraturan fasiliti (teks tetap BM)
7. Jika `requiresCertificate`: satu baris tambahan kecil —
   `Kehadiran diperlukan untuk kelayakan sijil.`
8. Butang skrin: `Cetak` (`window.print`) + `Buka halaman kehadiran`

CSS: `@media print` — sembunyikan nav/footer/butang; satu halaman A4 portrait.

### Deprecation aliran lama

Untuk booking yang **diluluskan selepas feature ini hidup**:

- Jangan paparkan `/urus-hadir` tempatan sebagai aliran utama.
- Jangan hantar WhatsApp yang mengandungi pautan urus-hadir tempatan; ganti dengan
  pautan cetak + (pilihan) pautan admin Autosijil.
- Booking lama yang sudah ada `attendanceToken` tanpa `autosijilEventId` kekal
  berfungsi pada laluan lama sehingga diputuskan migrasi manual.

## Ralat & ketahanan

1. **Kelulusan tidak digagalkan hanya kerana Autosijil down.**  
   Booking tetap approved; `autosijilSyncStatus = failed`; admin boleh retry.
2. **Idempotency:** approve/retry tidak mencipta event berganda
   (`external_booking_id`).
3. **Pembatalan tempahan (Fasa 1):** panggil cancel API; jika gagal, log + status
   `failed` pada sync, admin boleh retry kemudian.
4. **Rahsia:** jangan commit secret; contoh hanya dalam `.env.example`.

## Ujian (Fasa 1)

1. Lulus tanpa sijil → event Autosijil `requires_certificate=false`, status `open`,
   cetak QR betul.
2. Lulus dengan sijil → `requires_certificate=true`; lompat admin Autosijil OK.
3. Lulus dua kali / retry sync → satu event sahaja.
4. Autosijil offline → booking approved + sync failed + retry berjaya kemudian.
5. Batalkan booking → event Autosijil `closed`.
6. Cetak: layout A4 sepadan poster rujukan; QR scan buka `/e/{slug}`.
7. Booking lama (pre-feature) masih boleh guna urus-hadir tempatan.

## Fasa 2 (di luar skop pelaksanaan segera)

- Sync semula tarikh/lokasi/tajuk bila admin ubah jadual booking approved.
- Paparan ringkas bilangan hadir di eUSTP (read-only API).
- SSO / deep-link login Autosijil.
- Migrasi pukal booking lama ke Autosijil.

## Skop fail utama (anggaran)

### Autosijil

- `supabase/migration.sql` (+ migrasi baharu) — kolum external_*
- `src/app/api/integrations/eustp/events/route.ts`
- `src/app/api/integrations/eustp/events/cancel/route.ts`
- `src/lib/integration-auth.ts`
- `.env.local.example`

### eUSTP

- `lib/schema.ts` + migrasi Drizzle
- `lib/tempahan/autosijil-client.ts`
- `lib/tempahan/service.ts` / `lib/actions/tempahan-admin.ts` — hook sync
- `components/tempahan/AdminBookingActions.tsx` — checkbox + butang
- `app/(public)/tempahan/[pkg]/cetak-kehadiran/[token]/page.tsx` (+ print CSS)
- `components/tempahan/BookingCard.tsx` / WhatsApp copy — pautan baharu
- `.env.local.example`, `AI_CONTEXT_LOG.md`

## Kriteria siap Fasa 1

- [ ] Admin boleh pilih perlu/tidak sijil semasa lulus
- [ ] Event Autosijil dicipta automatik (atau dipulangkan jika wujud)
- [ ] Halaman cetak poster QR tersedia dan boleh dicetak
- [ ] Lompat ke Autosijil untuk urus kehadiran/sijil
- [ ] Aliran kehadiran tempatan tidak lagi menjadi aliran utama untuk booking baharu
- [ ] `npm run build` + `npm run typecheck` lulus di eUSTP; build/test relevan di Autosijil
