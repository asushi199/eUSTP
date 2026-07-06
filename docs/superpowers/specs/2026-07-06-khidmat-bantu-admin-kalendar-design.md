# Reka Bentuk — Admin Khidmat Bantu: Senarai Berkumpulan + Kalendar Bulanan

Tarikh: 2026-07-06
Modul: Khidmat Bantu (admin)
Fail teras: `app/(admin)/admin/khidmat-bantu/page.tsx`

## Masalah

1. **Jadual scroll mendatar di telefon.** Halaman admin Khidmat Bantu memapar dua
   `<table>` 6-lajur dibalut `overflow-x-auto`. Di skrin telefon jadual mesti
   di-scroll mendatar (tidak ideal), dan bahagian "Sejarah Permohonan" jadi
   sangat panjang apabila permohonan bertambah.
2. **Tiada pandangan sepintas lalu.** Admin mahu, sebaik log masuk, melihat
   khidmat bantu yang **telah diluluskan** disusun ikut bulan — seperti kalendar.

## Keputusan yang telah disahkan pengguna

- Kalendar berdasarkan **tarikh aktiviti** (`details.tarikhCadangan` untuk servis
  kumpulan `program`; `details.tarikh` untuk kumpulan `mcp`), **hanya status
  `approved`**.
- Kalendar diletak **dalam halaman yang sama** melalui suis `Senarai / Kalendar`
  (bukan halaman `/admin` atau halaman berasingan).
- Senarai disusun **Tahun › Bulan › Hari**; default hanya papar tahun semasa,
  tahun lain boleh dipilih/ditapis.
- Baris tunggu kelulusan (`pending`) kekal di **atas** sebagai baris gilir
  tindakan dan **tidak** masuk pengumpulan tahun/bulan.
- Kalendar di telefon **turun taraf ke aliran agenda bertindan** (bukan grid
  7-lajur yang dimampatkan).
- Pilihan pandangan diingat melalui query URL `?view=kalendar`.

## Fakta data (disahkan)

- `details.tarikhCadangan` dan `details.tarikh` datang dari `<input type="date">`
  yang `required` (`components/khidmat-bantu/KhidmatBantuForm.tsx`), jadi keduanya
  ialah rentetan ISO `YYYY-MM-DD` yang boleh dipercayai untuk pengumpulan &
  pemetaan kalendar.
- `listAdminKhidmatBantuRequests()` (`lib/khidmat-bantu/queries.ts`) sudah
  memulangkan semua rekod (`pending` + `others`) dengan `dbNotReady` fallback.
  Tiada perubahan pertanyaan DB, skema, atau borang permohonan diperlukan.
- Status enum: `pending | approved | rejected | cancelled`. Warna status ikut
  `CLAUDE.md`: pending=graphite, approved=primary, rejected=bloom-deep.

## Seni bina

Satu halaman, dua pandangan berkongsi satu sumber data.

```
AdminKhidmatBantuPage (server component — sedia ada, dikemas)
├─ requireKandunganAccess()
├─ listAdminKhidmatBantuRequests()  → { pending, others, dbNotReady }
├─ groupApprovedByDate(approved)    → Tahun › Bulan › Hari  (fungsi tulen baharu)
└─ <KhidmatBantuAdminView>          → client component (suis Senarai/Kalendar)
   ├─ ViewToggle (Senarai | Kalendar)  — segari dengan tajuk; kekalkan ?view
   ├─ <PendingQueue>                    — sentiasa di atas, kedua-dua pandangan
   ├─ Senarai:  <GroupedRequestList>
   └─ Kalendar: <ApprovedCalendar>
```

### Unit & tanggungjawab

- **`lib/khidmat-bantu/date-group.ts`** (fungsi tulen, boleh diuji unit)
  - `getServiceDate(row): string | null` — pulangkan `tarikhCadangan`/`tarikh`
    ikut `getServiceGroup`, null jika hilang/tak sah.
  - `groupApprovedByDate(rows): YearGroup[]` di mana
    `YearGroup = { year: number; total: number; months: MonthGroup[] }`,
    `MonthGroup = { month: number; label: string; total: number; days: DayGroup[] }`,
    `DayGroup = { date: string; label: string; rows: KhidmatBantuRow[] }`.
    Diisih menurun ikut tahun & bulan, hari menaik dalam bulan.
  - Tiada `server-only`; tiada IO — supaya boleh diuji tanpa DB.

- **`components/khidmat-bantu/KhidmatBantuAdminView.tsx`** (client)
  - Terima `pending`, `others`, dan hasil `groupApprovedByDate` sebagai props
    (data ditarik di server; komponen ini hanya susun atur + keadaan UI).
  - Simpan pilihan pandangan dalam URL (`useSearchParams` + `router.replace`,
    tanpa muat semula halaman). Default `senarai`.
  - Keadaan tapis (status, carian, tahun terpilih) di sini.

- **`components/khidmat-bantu/PendingQueue.tsx`**
  - Kad bertindan, diisih menaik ikut tarikh aktiviti (paling hampir dahulu).
  - Setiap kad membawa `<AdminKhidmatActions requestId status />` sedia ada.
  - Kosong → "Tiada permohonan menunggu."

- **`components/khidmat-bantu/GroupedRequestList.tsx`**
  - Tajuk tapis: status (Semua / Diluluskan / Ditolak) + kotak carian
    (tajuk / organisasi / nama pemohon). Default tapis = **Semua** (kekalkan
    tingkah laku "Sejarah Permohonan" sedia ada yang memapar semua bukan-pending;
    pending sudah dipapar dalam gilir di atas).
  - Pemilih tahun; default tahun semasa dibuka, tahun lain terkumpul
    (`<details>` atau butang toggle) dan hanya render bila dibuka.
  - Susunan Tahun › Bulan › Hari; setiap hari memapar kad permohonan
    (reka letak yang sama seperti PendingQueue tetapi tanpa butang tindakan bila
    bukan pending).
  - Nota: senarai boleh papar semua status mengikut tapis; kalendar hanya
    approved. "Sejarah" lama = status !== pending; di sini disatukan bawah tapis.

- **`components/khidmat-bantu/ApprovedCalendar.tsx`** (client)
  - Input: `YearGroup[]` yang telah ditapis approved sahaja.
  - Keadaan: bulan aktif (`year`, `month`), default bulan semasa.
  - Navigasi `‹ Julai 2026 ›` + pemilih tahun.
  - **Desktop/tablet (≥640px):** grid 7 lajur (mula Isnin). Setiap sel: nombor
    hari + sehingga 2 cip tajuk servis + `+N`. Klik hari → panel senarai hari itu
    di bawah grid. Hari ini digariskan dengan aksen biru.
  - **Telefon (<640px):** turun taraf ke aliran agenda — senarai hari yang ada
    aktiviti sahaja, setiap hari header `12 Julai · Sabtu` diikuti kad servis
    (guna semula kad hari daripada senarai). Tiada grid mampat.
  - Bulan tanpa aktiviti → keadaan kosong ringkas.

### Reka bentuk visual (ikut `CLAUDE.md` gaya hp)

- Kanvas putih; biru `#024ad8` hanya untuk suis aktif + cip approved
  (maksimum 2 unsur biru per skrin). Cip kalendar: latar biru sangat cair,
  teks biru gelap.
- Kad radius 12–16px, butang 44px tinggi, guna kelas sedia ada
  (`.card`, `.btn-*`, `.status-badge`, `.input`).
- Fon Manrope; butang uppercase tracking 0.7px.
- Status: pending=graphite, approved=primary, rejected=bloom-deep.

## Aliran data

1. Server component ambil semua rekod sekali (`listAdminKhidmatBantuRequests`).
2. Asingkan `pending` (untuk gilir) daripada `approved` (untuk kalendar &
   penapis default senarai).
3. `groupApprovedByDate` jalankan di server; hantar struktur terkumpul + baris
   mentah ke client view.
4. Client view kawal suis pandangan, tapis, dan bulan aktif — tanpa panggilan
   pelayan tambahan (semua data sudah ada di klien; senarai admin bervolum kecil).

## Pengendalian ralat & kes tepi

- `dbNotReady`: kekalkan kad amaran migrasi sedia ada; jangan render suis.
- Tarikh aktiviti hilang/tak sah pada rekod approved: tapis keluar daripada
  kalendar; masih papar dalam senarai di bawah kumpulan "Tarikh tidak sah"
  supaya tidak hilang senyap.
- Zon waktu: parse `YYYY-MM-DD` sebagai tarikh tempatan (pisah rentetan, elak
  `new Date("YYYY-MM-DD")` yang ditafsir UTC dan boleh anjak sehari).
- Senarai kosong / tiada approved bulan semasa: keadaan kosong bermaklumat,
  bukan "Nothing here yet".

## Ujian

- Unit (`lib/khidmat-bantu/date-group.ts`):
  - Pengumpulan betul merentas tahun/bulan/hari; isihan menurun tahun/bulan,
    menaik hari.
  - Pemilihan tarikh ikut kumpulan servis (program vs mcp).
  - Rekod tarikh hilang/tak sah → kumpulan "Tarikh tidak sah", bukan ranap.
  - Zon waktu: `2026-07-01` tidak anjak ke Jun.
- Manual/smoke:
  - Telefon: tiada scroll mendatar pada senarai; kalendar jadi agenda.
  - Desktop: grid bulan papar cip; klik hari papar butiran.
  - Suis Senarai/Kalendar kekal selepas muat semula (`?view=`).
  - Tapis tahun/status/carian.
- `npm run build` + `npm run typecheck` + smoke route
  `/admin/khidmat-bantu` (ikut CLAUDE.md "Selepas setiap fasa").

## Skop (YAGNI)

Termasuk: susun semula pandangan admin, pengumpulan tarikh, kalendar approved,
penapis, ingat pandangan via URL.

TIDAK termasuk: perubahan skema/DB, borang permohonan awam, eksport/cetak
kalendar, drag-drop penjadualan semula, paginasi sisi-pelayan, notifikasi.
Boleh dipertimbang kemudian jika volum benar-benar besar.
