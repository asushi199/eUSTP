# Reka Bentuk — Tempahan Bilik Lintas Hari

Tarikh: 2026-08-04  
Modul: Tempahan PKG (awam)  
Keputusan pengguna: Approach C (semakan konflik sekelompok, kelulusan per hari) + UI Approach A

## Masalah

Pemohon tidak boleh menempah bilik merentas beberapa hari dalam satu borang.
Contoh keperluan: Isnin hingga Rabu, dengan slot berbeza setiap hari.
Kini setiap hari mesti dihantar sebagai permohonan berasingan.

## Keputusan yang telah disahkan

1. **Model data:** kekalkan satu baris `bookings` setiap hari+slot. Tiada `batch_id`, tiada perubahan skema.
2. **Semakan konflik:** semasa hantar, semak **semua** hari dalam julat. Jika mana-mana hari konflik → **tiada rekod** ditulis (all-or-nothing).
3. **Kelulusan:** tetap **per hari** (admin boleh lulus/tolak hari berbeza secara berasingan).
4. **UI (Approach A):** medan tarikh mula + tarikh tamat; sistem senaraikan setiap hari; setiap baris ada pemilih slot (default `full_day`).
5. **Had julat:** maksimum **7 hari** (termasuk mula dan tamat).
6. **WhatsApp:** satu mesej menyenaraikan semua tarikh+slot; pautan kelulusan ke tempahan **hari pertama**.
7. **Semak Permohonan:** kekal senarai per baris (satu baris setiap hari) — tiada penggabungan UI dalam skop ini.
8. **Bahasa UI:** Bahasa Melayu.

## Fakta sedia ada

- `bookings.date` (satu tarikh) + `bookings.slot` (`am` | `pm` | `full_day`).
- Konflik aplikasi: `getConflictingBooking` dalam `lib/tempahan/booking-rules.ts`.
- Penjamin DB: trigger `prevent_booking_conflict` (advisory lock per pkg+room+date) dalam `drizzle/0004_booking_conflict_trigger.sql`.
- Borang: `components/tempahan/BookingForm.tsx` → `createBookingAction` dalam `lib/actions/tempahan.ts`.
- Utiliti tarikh: `listDateRange`, `addDays`, `formatMalayDate` dalam `lib/tempahan/date.ts`.

## Seni bina

```
BookingForm (client)
  dateStart, dateEnd
  daySlots: { date, slot }[]  — dijana apabila julat sah
  hidden inputs: dates[], slots[]  ATAU JSON day_slots
       │
       ▼
createBookingAction
  parse & validate julat (≤7 hari, end ≥ start)
  listActiveBookings(pkg, dateStart) → semak setiap hari
  jika ada konflik → return error (0 insert)
  transaction: insert N rows + approval tokens
  WhatsApp: mesej berbilang baris, pautan ke booking pertama
```

### Unit & tanggungjawab

| Unit | Tanggungjawab |
|------|----------------|
| `listInclusiveDates(start, end)` | Senarai ISO dates inklusif; pulang null jika invalid |
| `validateBookingRange(days)` | Had 7 hari, slot sah, tiada tarikh kosong |
| `getBatchConflicts(...)` | Senarai konflik untuk setiap (room, date, slot) |
| `createBookingAction` | Parse multi-day form; all-or-nothing insert |
| `BookingForm` | UI tarikh mula/tamat + baris slot harian |
| `buildWhatsAppMessage` | Sokong berbilang tarikh/slot dalam satu mesej |

## Aliran borang

1. **Sehari sahaja:** `dateEnd` kosong atau sama dengan `dateStart` → satu slot (kelakuan sedia ada).
2. **Lintas hari:** pilih `dateEnd` > `dateStart` → senarai baris muncul (tarikh baca sahaja + `<select>` slot).
3. Slot default setiap hari: `full_day`.
4. Amaran konflik pra-hantar (client) jika booking aktif dalam props bertindih mana-mana hari; butang hantar dilumpuhkan.
5. Ralat pelayan menyenaraikan **semua** hari yang konflik (bukan hanya yang pertama).

## Insert & ralat

- Muatkan booking aktif dari `dateStart` (query sedia ada `listActiveBookings`).
- Semak setiap hari dengan `getConflictingBooking`.
- Insert dalam **satu transaksi** (`db.transaction`). Jika trigger DB raise pada mana-mana baris → rollback keseluruhan → mesej mesra (sedia ada `friendlyBookingError`).
- Setiap baris dapat `approvalTokenHash` sendiri (kelulusan bebas).

## WhatsApp

Format mesej (contoh 3 hari):

```
Permohonan tempahan bilik baharu:
Nama: …
Bilik: …
Tarikh/Slot:
- 04 Ogos 2026 (Sepanjang Hari)
- 05 Ogos 2026 (Pagi)
- 06 Ogos 2026 (Petang)
Tujuan: …
Pautan kelulusan: …/approve/{idHariPertama}?token=…
```

Nota: pautan hanya untuk hari pertama; admin melihat hari lain dalam senarai pending `/admin/tempahan/[pkg]`.

## Di luar skop

- Perubahan skema / `batch_id`
- Kelulusan berkumpulan di admin
- Penggabungan paparan Semak
- Slot berbeza bilik dalam satu permohonan
- Julat > 7 hari

## Kriteria penerimaan

1. Pemohon boleh pilih Isnin–Rabu dengan slot berbeza setiap hari dalam satu hantar.
2. Jika Selasa sudah ditempah → tiada baris Isnin/Selasa/Rabu ditulis; mesej nyatakan konflik Selasa.
3. Jika semua kosong → 3 baris `pending` wujud; admin boleh lulus Isnin & tolak Selasa secara berasingan.
4. Tempahan sehari kekal berfungsi seperti sebelum ini.
5. UI dalam Bahasa Melayu; ikut kelas borang sedia ada (`.input`, `.label`, `.btn-primary`).
