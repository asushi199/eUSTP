# Reka Bentuk — Fasa 2: Sync jadual + migrasi booking Autosijil

Tarikh: 2026-08-04  
Modul: Tempahan PKG × Autosijil  
Skop: **hanya** (1) sync selepas ubah jadual/lokasi, (4) migrasi sekali booking akan datang  
**Tidak termasuk:** paparan bilangan hadir di eUSTP, login SSO

## Keputusan yang telah disahkan

1. Ubah tarikh/slot/bilik pada booking approved yang sudah ada `autosijilEventId` → update event Autosijil (title, date, location, description).
2. Kegagalan Autosijil **tidak** membatalkan perubahan eUSTP; status sync `failed` + boleh retry.
3. Migrasi sekali: booking `approved`, `date >= hari ini (Asia/Kuala_Lumpur)`, tiada `autosijilEventId` (atau belum synced).
4. Migrasi dijalankan oleh agen melalui skrip (bukan butang admin); `requiresCertificate = false` lalai; sijil boleh diubah kemudian di Autosijil.
5. Skrip idempotent + dry-run dahulu.

## Fakta sedia ada (Fasa 1)

- eUSTP: `syncApprovedBookingToAutosijil`, `createAutosijilEvent`, `cancelAutosijilEvent`
- Autosijil: `POST /api/integrations/eustp/events` (create-or-return), `.../cancel`
- Admin ubah jadual: `rescheduleBookingCore` / `adminUpdateBookingSchedule`
- Tiada API update event untuk integrasi eUSTP lagi

## Seni bina

### 1) Update selepas ubah jadual

```
adminUpdateBookingSchedule / (ubah bilik jika ada)
  → rescheduleBookingCore (atau update room)
  → jika booking.autosijilEventId || syncStatus relevan
       → updateAutosijilEventForBooking(pkgId, bookingId)
```

Autosijil baharu:

`PATCH /api/integrations/eustp/events`  
Body: `{ externalBookingId, title?, eventDate?, location?, description? }`  
Auth: Bearer sama Fasa 1  
Cari event by `(eustp, externalBookingId)` → update; 404 jika tiada.

eUSTP:

- `updateAutosijilEvent(...)` dalam `autosijil-client.ts`
- `pushBookingDetailsToAutosijil(pkgId, bookingId)` — mapping sama create; set synced/failed
- Panggil selepas reschedule berjaya (dan selepas tukar bilik jika laluan itu wujud)

### 2) Migrasi skrip

`scripts/migrate-bookings-to-autosijil.ts`

Flags:

- `--dry-run` — senarai sahaja, tiada API/DB sync write kecuali baca
- `--pkg=<id>` — pilihan tapis satu PKG
- `--limit=N` — had untuk ujian

Query:

```sql
status = 'approved'
AND date >= (today MY)
AND (autosijil_event_id IS NULL OR autosijil_sync_status IS DISTINCT FROM 'synced')
```

Setiap baris: `syncApprovedBookingToAutosijil` dengan `requiresCertificate` kekal false (set false jika null).  
Log ringkas: ok / skip / fail counts.

## Ujian

1. Booking synced → ubah tarikh → Autosijil `event_date` ikut.
2. Autosijil down semasa ubah → eUSTP tarikh berubah, sync failed, retry OK.
3. Dry-run senarai booking akan datang tanpa event.
4. Run migrasi → event wujud, cetak URL ada, `requires_certificate=false`.
5. Run semula → skip / idempotent, tiada event berganda.

## Fail utama

### Autosijil

- `src/app/api/integrations/eustp/events/route.ts` — tambah PATCH (atau fail `update` berasingan; cadangan: PATCH pada route yang sama)
- Document dalam AI_CONTEXT_LOG

### eUSTP

- `lib/tempahan/autosijil-client.ts` — `updateAutosijilEvent`
- `lib/tempahan/autosijil-sync.ts` — `pushBookingDetailsToAutosijil`
- `lib/tempahan/service.ts` — hook selepas reschedule
- `scripts/migrate-bookings-to-autosijil.ts`
- Spec/plan docs + AI_CONTEXT_LOG
