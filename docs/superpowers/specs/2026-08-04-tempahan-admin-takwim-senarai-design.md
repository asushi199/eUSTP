# Reka Bentuk — Admin Tempahan: Senarai Mingguan Gaya Takwim

Tarikh: 2026-08-04  
Modul: Tempahan bilik (admin)  
Rujukan UI: `C:\Cursorproject\Manjungallcenter\egerak-v2` takwim (`TakwimClient` + `groupTakwimItemsByWeek`)  
Fail teras:

- `components/tempahan/TempahanAdminView.tsx`
- `components/tempahan/BookingCard.tsx`
- `components/tempahan/AdminBookingActions.tsx`
- `components/admin-month/MonthSection.tsx` (kongsi dengan Khidmat Bantu)

## Masalah

Apabila bilangan tempahan tinggi, setiap `BookingCard` memaparkan butiran penuh + baris tindakan (Lulus/Tolak/Ubah/Batal/Padam/Cetak) sekali gus. Di telefon:

- skrol menegak menjadi sangat panjang;
- sukar meninjau “minggu ini ada apa / bilik mana”;
- kalendar grid sudah disembunyikan (`sm:hidden` agenda), tetapi agenda masih kad penuh — masalah kepadatan tidak selesai.

## Keputusan yang telah disahkan pengguna

| # | Keputusan |
|---|-----------|
| 1 | **Pendekatan:** ubah Senarai dalam `MonthSection` kepada senarai mingguan gaya takwim; **kekalkan** suis Kalendar \| Senarai di desktop. |
| 2 | **Telefon:** **sentiasa** papar senarai mingguan takwim; **jangan** papar suis Kalendar / grid kalendar. |
| 3 | Badge gaya “Tambahan” diganti dengan **nama bilik**. |
| 4 | Baris ringkas → klik untuk kembangkan butiran + tindakan (Ubah / Padam / Cetak / …). |
| 5 | Gilir **Menunggu kelulusan:** desktop kekal `BookingCard` penuh; telefon guna baris ringkas (klik untuk Lulus/Tolak dsb.). |
| 6 | Minggu: **default hanya buka “minggu ini”**; jika bulan dipapar tiada minggu semasa, buka minggu terdekat yang ada tempahan. |

## Di luar skop (sengaja)

- Gabungkan tempahan lintas hari menjadi satu baris (DB masih 1 rekod / hari).
- Ubah rupa/grid Kalendar desktop (kecuali ia terus wujud di `≥sm`).
- Salin kelas visual egerak (slate/brand); kekalkan sistem eustp (Manrope, `#024ad8`, `.card`, status badge sedia ada).
- Tukar perilaku Senarai **Khidmat Bantu** (kekal kad bertindan seperti sekarang melainkan prop baharu diaktifkan).

## Fakta sedia ada

- `MonthSection` dikongsi Tempahan + Khidmat Bantu (`MonthItem`: `id`, `date`, `status`, `chip`, `card: ReactNode`).
- Senarai semasa: `groupByDay` + render `item.card` penuh; tapis status Diluluskan / Ditolak / Semua.
- Kalendar desktop: grid 7 lajur (approved sahaja); klik hari → kad di bawah. Telefon kalendar: agenda hari-ke-hari kad penuh.
- Pending dipisahkan di `TempahanAdminView`; `listPkgMonthBookings` tidak termasuk pending.
- Tindakan bergantung status melalui `AdminBookingActions` (pending → lulus/tolak + sijil; approved → cetak/batal; edit pending\|approved; padam mengikut helper).
- Slot: `am` / `pm` / `full_day` → label sedia ada `formatSlot`.

## Seni bina (pendekatan 1)

```
TempahanAdminView
├─ Pending (desktop): BookingCard penuh (sedia ada)
├─ Pending (mobile): BookingAgendaRow ringkas → expand → AdminBookingActions
└─ MonthSection
   ├─ ≥sm: suis Kalendar | Senarai (sedia ada)
   ├─ <sm: paksa Senarai; sembunyikan suis + MonthCalendar
   ├─ Kalendar ≥sm: tidak berubah (grid + kad hari dipilih)
   └─ Senarai: WeekAgendaList (baharu)
      ├─ status chips (sedia ada)
      ├─ <details> per minggu (MINGGU N · julat · N tempahan)
      └─ baris ringkas → expand → butiran + AdminBookingActions
         (boleh guna BookingCard bare ringkas ATAU panel detail khusus)
```

### Perubahan API `MonthItem` (belakang serasi)

Tambah medan **pilihan** supaya Khidmat Bantu tidak wajib isi:

```ts
export type MonthItem = {
  id: string;
  date: string;
  status: string;
  chip: string;
  card: ReactNode; // kekal: detail/expand + kalendar hari dipilih
  /** Untuk WeekAgendaList — jika tiada, Senarai jatuh balik ke card penuh (Khidmat Bantu). */
  agenda?: {
    title: string;       // tujuan / urusan
    timeLabel: string;   // Pagi | Petang | Sepanjang hari
    badgeLabel: string;  // nama bilik
    meta?: string;       // cth. sekolah · nama (satu baris, truncate)
  };
};
```

Prop pilihan pada `MonthSection`:

- `forceListOnMobile?: boolean` (default `false`) — Tempahan set `true`.
- Apabila `forceListOnMobile` dan viewport `<sm`: `view` berkesan = `"senarai"`; suis Kalendar disembunyikan.

### Util minggu baharu

`lib/month-view.ts` (atau `lib/admin-month/week-group.ts`):

- `groupItemsByWeek(year, month, items): WeekGroup[]` — minggu Isnin–Ahad selaras `buildMonthGrid` / kalendar sedia ada.
- Label: `MINGGU N`, julat tarikh BM (`3 - 9 Ogo`), `itemCount`.
- `defaultOpenWeekKey(groups, todayIso): string | null` — (1) kumpulan yang merangkumi `todayIso` **dan** `itemCount > 0` (selepas tapis status); (2) jika tiada, kumpulan beritem yang **paling hampir** kepada `todayIso`; (3) jika semua kosong, tiada `open` by default.

Jangan import util egerak secara terus (repo berasingan); port pola yang perlu sahaja.

### Komponen baharu (cadangan)

| Komponen | Peranan |
|----------|---------|
| `WeekAgendaList` | Status chips + senarai `<details>` minggu; hanya render agenda jika `item.agenda` ada, else `card`. |
| `BookingAgendaRow` | Baris: blok tarikh \| titik timeline \| masa + tajuk truncate \| badge bilik \| status-dot; klik toggles expand. |
| Expand panel | Meta penuh (sekolah, telefon, tujuan) + `AdminBookingActions` — elak menduplikasi logik tindakan. |

Gaya: ikut eustp (putih, fog borders, aksen primary terhad). Elak >2 unsur biru kuat se-skrin dalam header minggu — guna dakwat untuk tajuk minggu, badge bilik warna lembut (bukan primary solid), status ikut `.status-dot` sedia ada.

### `TempahanAdminView`

- Isi `agenda` pada setiap `MonthItem` dari `BookingRow` + `roomNames` + `formatSlot`.
- Pending: dua cabang layout `hidden sm:block` (kad) / `sm:hidden` (agenda rows). Satu sumber data `pending`.
- Hantar `forceListOnMobile` ke `MonthSection`.

### Khidmat Bantu

- Tiada perubahan wajib: tanpa `agenda` + tanpa `forceListOnMobile`, Senarai kekal kad penuh; telefon kalendar agenda sedia ada kekal.

## Tingkah laku UI terperinci

### Baris ringkas (collapse)

- Kiri: hari nombor besar + bulan pendek + hari minggu (seperti takwim).
- Masa: `formatSlot` (atau “Sepanjang hari” untuk `full_day` jika copy mahu diselaraskan — kekalkan label sedia ada kecuali UX nyata lebih baik).
- Tajuk: `purpose` truncate.
- Badge kanan: **nama bilik** (bukan Rancangan/Tambahan).
- Status: titik/warna kecil (pending / approved / rejected / cancelled) — bukan baris butang.

### Baris berkembang

- Semua medan berguna untuk keputusan: bilik, tarikh, slot, tujuan, nama, sekolah, telefon, status teks.
- `AdminBookingActions` penuh mengikut status (termasuk autosijil/cetak jika ada).
- Satu baris dibuka pada satu masa **dalam minggu yang sama** (pilihan UX; elak banyak toolbar serentak di telefon). Minggu lain boleh kekal terbuka/tertutup bebas.

### Minggu `<details>`

- Summary: `MINGGU {n}` · julat · `{count} tempahan` (opsyenal: bilangan bilik unik — nice-to-have, bukan wajib).
- `defaultOpen` hanya untuk `defaultOpenWeekKey`.
- Pengguna boleh buka/tutup manual; tiada keperluan persist ke URL untuk minggu (elak kompleksiti). URL kekal `?bulan=` + `?view=` (desktop sahaja bermakna).

### Desktop Senarai

- Sama komponen `WeekAgendaList` (bukan kad bertindan).
- Suis Kalendar kekal untuk tinjauan bulanan.

### Desktop Kalendar

- Tidak berubah. Klik hari masih papar `card` (BookingCard bare) di bawah grid.

## Aksesibiliti & telefon

- `<details>`/`<summary>` native untuk minggu; baris expand guna `button` + `aria-expanded`.
- Sasaran sentuh ≥44px untuk summary dan baris.
- Elak hover-only actions.

## Ujian / penerimaan

1. Desktop ≥sm: suis Kalendar \| Senarai wujud; Senarai = minggu + baris ringkas; Kalendar grid + kad hari OK.
2. Telefon: tiada suis Kalendar; terus senarai minggu; default hanya minggu relevan terbuka.
3. Badge = nama bilik; expand tunjuk tindakan betul mengikut status.
4. Pending: desktop kad penuh; telefon baris ringkas → Lulus/Tolak dalam expand.
5. Tapis Diluluskan / Ditolak / Semua masih betul pada Senarai.
6. Khidmat Bantu admin: Senarai/Kalendar tidak rosak (regresi visual ringkas).
7. `npm run typecheck` (+ build jika sentuh import edge).

## Risiko & mitigasi

| Risiko | Mitigasi |
|--------|----------|
| Pecah Khidmat Bantu | `agenda` optional; default Senarai = card; `forceListOnMobile` opt-in |
| Banyak expand serentak di telefon | Satu expand aktif per minggu |
| “Minggu ini” di luar bulan dipapar | Fallback minggu terdekat beritem dalam bulan itu |
| Duplikasi markup BookingCard | Expand guna actions sedia ada; detail medan boleh slim panel, bukan semestinya BookingCard penuh |

## Susunan pelaksanaan (tinggi → rendah)

1. Util `groupItemsByWeek` + `defaultOpenWeekKey` (+ ujian unit ringkas jika ada harness).
2. `BookingAgendaRow` + expand + wire `AdminBookingActions`.
3. `WeekAgendaList`; sambung ke `MonthSection` Senarai bila `agenda` hadir.
4. `forceListOnMobile` + sembunyi suis/kalendar di `<sm`.
5. `TempahanAdminView`: isi `agenda`; pending dual layout.
6. Semakan visual BM + regres Khidmat Bantu.
