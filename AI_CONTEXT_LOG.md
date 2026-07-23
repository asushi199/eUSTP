# AI Context Log — eUSTP Manjung

Log keputusan & konteks untuk sesi AI akan datang. Tambah entri terbaru di atas.

## 2026-07-07 — OSC jadi dalaman + tab admin mudah alih

**Arahan pengurusan:** "OSC tidak boleh dilihat orang luar." Keputusan: OSC jadi
**dalaman sahaja** (sesiapa yang log masuk boleh lihat — tiada skop peranan tambahan).

- **Gating:** `middleware.ts` — `PROTECTED_PREFIXES` kini termasuk `/osc`,
  `/sumber`, `/analisis`, `/maklumat-asas` (matcher + redirect ke
  `/login?from=…`, sama corak dengan `/admin`). Disahkan: keempat-empat laluan
  redirect ke login; `/direktori` dll kekal awam.
- **Log masuk → mendarat di `/admin/tempahan`** (bukan `/admin`): tukar di
  `middleware.ts`, `login/page.tsx` (callbackUrl default), `LoginForm.tsx`.
- **Buang entri OSC dari permukaan awam:** kad halaman utama
  (`module-theme.ts` HOME_MODULES kini tapis `/osc`; OSC_MODULE dikekalkan dlm
  MODULES utk carian tema), `TopNav`, `BottomTabBar` (5→4 kolum). Dua pautan
  "Lihat analisis penuh" → `/analisis` dibuang (`(public)/page.tsx` +
  `HomeAnalisisBand.tsx`) sebab awam tak boleh capai lagi.
- **KEPUTUSAN pengguna:** jalur "Analisis Semasa" halaman utama (kad ringkasan +
  modal carta penuh) **kekal awam** — walaupun `/analisis` kini dalaman, data
  ringkasan dibenarkan awam.
- **Tab admin mudah alih:** `AdminMobileNav` kini bar 4-tab ikut peranan —
  Papan / Tempahan / OSC / Portal; PKG_Admin tanpa OSC (3 tab). `showOsc`
  dihantar dari `(admin)/layout.tsx` (`canManageKandungan`). Desktop tidak
  berubah.
- **Baharu:** `/admin/osc` (sub-hub OSC: 4 kad urus kandungan + pautan lihat
  halaman OSC), guard `requireKandunganAccess`. Sasaran tab OSC mudah alih.
- Disahkan: `npm run typecheck` + `npm run build` lulus; smoke gating via
  preview (tanpa DB). Tab admin & `/admin/osc` disahkan compile sahaja
  (perlu log masuk untuk semak visual).

## 2026-07-06 — Khidmat Bantu: muat naik surat gagal ("Access denied: DriveApp.")

**Gejala:** muat naik surat permohonan gagal — fail MASUK ke Google Drive tetapi
permohonan TIDAK ditulis ke Supabase. Ralat pada UI sama setiap kali:
`Access denied: DriveApp.`

**Punca (bukan Vercel, bukan kebenaran OAuth):** dalam `gas/Code.gs`,
`file.createFile(blob)` berjaya (sebab itu fail nampak di Drive), tetapi baris
seterusnya `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, …)` dilontar
`Access denied: DriveApp.` kerana dasar domain Google Workspace (akaun MOE)
menyekat perkongsian "sesiapa yang ada pautan". Catch di `doPost` memulangkan
`{ok:false}` → klien tak dapat `storagePath` → borang tak submit → Supabase kosong.
Jadi bukan isahan OAuth (kalau OAuth gagal, `createFile` sendiri takkan jadi).
Bukan juga timeout Vercel 10s — ralat itu datang dari GAS, bukan AbortError.

**Baiki:** jadikan `setSharing` best-effort dalam `gas/Code.gs` — cuba
`ANYONE_WITH_LINK`, fallback `DOMAIN_WITH_LINK`, jika kedua-dua disekat biarkan
fail kekal peribadi; JANGAN gagalkan muat naik. Perlu **redeploy GAS versi baharu**
(Manage deployments → New version); `/exec` URL & `.env.local` tak berubah.

**Sahkan:** POST diagnostik ke `/exec` (pixel PNG kecil) →
sebelum: `{"ok":false,"error":"Access denied: DriveApp."}` (~12s, cold start);
selepas redeploy: `{"ok":true,"path":"drive/…"}` (~5s). Berjaya.

**Kesan sampingan:** `publicUrl` = pautan thumbnail Drive. Jika domain sekat semua
perkongsian pautan, gambar Laporan DPD/PSS yang dipapar dalam `<img>` mungkin tak
render (limitasi dasar domain, bukan akibat perubahan ini). Surat khidmat-bantu
guna pautan `/view` — tak terjejas.

**Bug ke-2 (folder cache → fail masuk Trash):** `resolveFolderPath_` cache ID
folder dalam CacheService (6 jam). Bila pengguna PADAM folder subPath (ke Trash),
`DriveApp.getFolderById(cachedId)` MASIH pulangkan folder yang dalam Trash (tak
lontar ralat), jadi `createFile` cipta fail DI DALAM folder Trash → "berjaya" tapi
fail hilang dari pandangan. Baiki: semak `!cachedFolder.isTrashed()` sebelum guna
ID cache; jika trashed → `cache.remove` + bina semula. (Laluan `getFoldersByName`
tak pulangkan folder Trash, jadi ia sudah betul — hanya jalan pintas cache yang
pincang.)

**Tambahan:** `action:"info"` dalam `gas/Code.gs` — diagnostik pulangkan
`rootFolderUrl` + `targetFolderUrl` + senarai fail, untuk sahkan DI MANA fail
sebenarnya disimpan tanpa teka folder ID. Semua perubahan GAS perlu **redeploy
versi baharu** baru berkesan.

## 2026-07-06 — MonthSection: pemilih bulan/tahun (popover)

Klik label bulan `Julai 2026 ⌄` → popover: penukar tahun `‹ 2026 ›` + grid 12
bulan, klik terus lompat ke mana-mana bulan (untuk semak rekod lama pantas).
Dikongsi kedua modul. API navigasi MonthSection dipermudah: `onPrevMonth` +
`onNextMonth` → satu `onNavigate(year, month)`; anak panah kira sendiri guna
`shiftMonth`. Popover tutup bila klik-luar / Esc / pilih bulan.

## 2026-07-06 — Khidmat Bantu: lajur activity_date + query per-bulan (migrasi 0007)

Khidmat Bantu kini seni bina sama seperti Tempahan: tarikh aktiviti jadi lajur DB
sebenar, jadi tak perlu lagi muat semua rekod ke klien.

- **Skema:** tambah `activity_date date` (nullable) + indeks
  `khidmat_bantu_activity_date_idx (status, activity_date)`.
- **Migrasi `0007_shallow_scarlet_witch.sql`** — DITULIS SEMULA secara manual.
  drizzle-kit `generate` menghasilkan SQL BAHAYA (`CREATE TABLE IF NOT EXISTS`
  untuk jadual sedia ada → lajur takkan ditambah di production; + `rooms ADD
  capacity` yang sudah wujud). Punca: snapshot meta drizzle sudah lapuk (0005/0006
  migrasi custom tanpa kemas kini snapshot). SQL diganti dengan idempotent:
  `ALTER TABLE ADD COLUMN IF NOT EXISTS` + backfill dari `details`
  (`COALESCE(->>'tarikhCadangan', ->>'tarikh')`, dijaga regex ISO) + indeks.
  Migrator rasmi guna .sql (bukan snapshot) jadi selamat untuk apply. Snapshot
  0007 kini penuh → `generate` akan datang sepatutnya lebih bersih.
- **Insert action** menetapkan `activityDate` daripada details.
- **Query:** `loadKhidmatBantuAdmin(year, month)` (pending mana-mana tarikh +
  bukan-pending bulan itu). `listAdminKhidmatBantuRequests` dibuang.
  `isKhidmatDbNotReady` juga kesan lajur `activity_date` hilang → kad "jalankan
  migrasi" sehingga `db:migrate` dijalankan.
- **View & page** Khidmat Bantu kini per-bulan server-driven (`?bulan`), sama
  seperti Tempahan; guna MonthSection yang sama.
- **PENTING:** selepas deploy, jalankan `npm run db:migrate` pada production
  sebelum modul berfungsi (sebelum itu ia papar kad "belum sedia").

## 2026-07-06 — Seragamkan admin Khidmat Bantu + Tempahan (berskop-bulan)

Satu corak paparan admin dikongsi kedua modul: gilir tunggu-kelulusan di atas +
seksyen **berskop-bulan** (navigasi bulan `‹ Julai 2026 ›` + suis Kalendar/Senarai
+ tapis status). Menggantikan akordion Tahun›Bulan›Hari Khidmat Bantu.

- **Komponen kongsi:** `components/admin-month/MonthSection.tsx` (presentasi tulen —
  terima `MonthItem[]` + kad yang telah dirender) dan `lib/month-view.ts` (fungsi
  tulen: `buildMonthGrid`, `groupByDay`, `indexByDay`, `parseBulan/formatBulan`,
  `shiftMonth`, `monthLabelOf`, `inMonth`, `todayParts`).
- **Kalendar sentiasa papar approved**; Senarai tapis status (lalai Diluluskan,
  boleh Ditolak/Semua). Desktop = grid, telefon = agenda bertindan.
- **Khidmat Bantu:** tarikh dalam JSONB → tak sesuai query SQL per-bulan, jadi
  muat semua (volum kecil) + tapis bulan di klien; navigasi bulan = state klien.
  `GroupedRequestList` & `ApprovedCalendar` DIPADAM (diganti MonthSection).
  `date-group.ts` kini hanya pengekstrak medan (getService*).
- **Tempahan:** tarikh = lajur DB → query per-bulan sebenar `?bulan=YYYY-MM`
  (`listPkgMonthBookings`), navigasi bulan tukar param (server refetch). Gilir
  guna `listPendingBookings`. Kad baharu `BookingCard` (kekalkan pautan Urus
  kehadiran/QR + AdminBookingActions) — TIDAK guna semula KhidmatRequestCard.
  `listAdminBookings` lama dibuang.
- **Senarai PKG** (`/admin/tempahan`): lencana merah bilangan menunggu per PKG
  (`countPendingBookingsByPkg`).
- Tukar ganti: Senarai kini berskop-bulan (bukan merentas tahun) — akibat
  semula jadi pemuatan per-bulan. typecheck + build lulus.

## 2026-07-06 — Admin overview: Perkhidmatan di atas + lencana notifikasi

- Kumpulan **Perkhidmatan** dinaikkan ke atas dalam `/admin` (modul dengan
  permohonan menunggu tindakan dilihat dahulu).
- **Lencana merah** bilangan permohonan menunggu pada kad Khidmat Bantu &
  Tempahan PKG. Dikira di pelayan (halaman `force-dynamic`) — bukan polling
  client — jadi selepas admin proses & kembali ke `/admin`, kiraan segar dan
  lencana hilang bila 0.
- Query kiraan baharu: `countPendingKhidmatBantu()`
  (`lib/khidmat-bantu/queries.ts`, `dbNotReady` → 0) dan
  `countPendingBookings(pkgIds?)` (`lib/tempahan/queries.ts`, skop PKG_Admin).

## 2026-07-06 — Admin Khidmat Bantu: senarai terkumpul + kalendar

Reka semula `/admin/khidmat-bantu` untuk selesaikan scroll mendatar jadual di
telefon + beri pandangan bulanan. Spec penuh:
`docs/superpowers/specs/2026-07-06-khidmat-bantu-admin-kalendar-design.md`.

- **Punca scroll:** dua `<table>` 6-lajur dibalut `overflow-x-auto` → digantikan
  kad responsif, tiada lagi scroll mendatar.
- **Satu halaman, dua pandangan** (Kalendar = lalai; Senarai via `?view=senarai`):
  - `Senarai` — gilir "Menunggu kelulusan" kekal di atas (isih ikut tarikh
    aktiviti terdekat), rekod lain dikumpul **Tahun › Bulan › Hari**; tahun
    semasa dibuka lalai, **bulan boleh dilipat** (bulan semasa dibuka lalai)
    supaya banyak bulan tidak berselerak. Tapis status + carian.
  - `Kalendar` — hanya `approved`, ikut tarikh aktiviti. Desktop grid bulanan
    (klik hari → butiran); telefon turun taraf ke aliran agenda bertindan.
- **Fail baharu:** `lib/khidmat-bantu/date-group.ts` (fungsi tulen:
  `getServiceDate/Title/Time/Lokasi`, `groupByServiceDate`, `indexByServiceDate`,
  `buildMonthGrid`), komponen `KhidmatBantuAdminView` / `KhidmatRequestCard` /
  `GroupedRequestList` / `ApprovedCalendar`.
- Tarikh aktiviti dibaca dari `details.tarikhCadangan` (program) / `details.tarikh`
  (mcp) — kedua `<input type="date">` jadi ISO `YYYY-MM-DD` yang boleh dipercayai.
  Tarikh tak sah dikumpul di seksyen "Tarikh tidak sah", tidak masuk kalendar.
- **Tiada** perubahan DB / skema / borang awam. Guna semula
  `listAdminKhidmatBantuRequests()`, `AdminKhidmatActions`, utiliti
  `lib/tempahan/date.ts`.
- Disahkan: `npm run typecheck` + `npm run build` lulus. Smoke penuh halaman
  admin perlu sesi log masuk + DB — tertangguh (gate build ikut konvensi projek).

## 2026-07-05 — Penambahbaikan UI halaman butiran bilik (tempahan)

Tiga polish visual pada aliran `/tempahan/[pkg]/bilik/[slug]` (semua komponen
dikongsi → berkuat kuasa untuk semua PKG):

- **`RoomDetailHero` (hero padat, paparan < xl):** badge kapasiti ("10 pax") &
  butang "N kemudahan" terlalu rapat (hanya `mt-1`). Disusun semula dalam satu
  baris `flex items-center gap-2` dengan pembahagi menegak (`h-4 w-px bg-fog`)
  supaya dua blok maklumat jelas terpisah.
- **`CalendarBoard` (paparan xl):** "Tempah penuh hari" dahulu teks `nowrap`
  yang tersepit dalam lajur TARIKH 88px → terpotong jadi "Tempah penuh har".
  Kini butang berbingkai sebenar (border `primary/35`, latar putih) sepadan gaya
  mudah alih; lajur dilebarkan `88px→108px` (header **dan** baris data diselaras),
  `whitespace-nowrap` dibuang + `leading-tight` supaya teks balut 2 baris dalam
  butang, bukan terpotong.
- **Kontena halaman butiran bilik** (`[slug]/page.tsx`): `max-w-4xl→max-w-6xl`
  (896px→1152px) — jalur putih kiri/kanan di desktop terlalu lebar. Grid kerja
  tempahan ialah `[minmax(0,1fr)_minmax(320px,384px)]`, jadi lebar tambahan masuk
  ke lajur kalendar (borang kekal ≤384px). Kini selaras dengan `/tempahan` &
  `/tempahan/[pkg]` yang guna `max-w-6xl`.
- Disahkan pratonton desktop 1360px: kontena 1152px (dulu 896px), lajur kalendar
  684px (dulu ~430px), jidar sisi ~97px (dulu ~232px), butang penuh-hari 108×42
  teks penuh tanpa terpotong. `npm run typecheck` lulus, tiada ralat konsol.

## 2026-07-05 — Muat naik logo PKG (Supabase Storage)

- Admin PKG kini boleh muat naik logo sendiri di `/admin/tempahan/[pkg]/tetapan`
  (≤2MB) → disimpan ke bucket awam `room-photos` (sama bucket dengan gambar
  bilik) via `uploadPkgLogo` baharu dalam `lib/tempahan/room-photos.ts`; kekal
  di `pkgs.logoSrc` (medan sedia ada, sebelum ini tidak digunakan).
- Logo dipaparkan di senarai `/tempahan` dan header `/tempahan/[pkg]` bila wujud.
- Nota CLAUDE.md "TIADA Supabase Storage" dibetulkan — sudah lapuk sejak
  `uploadRoomPhoto` (gambar bilik) wujud; kini didokumenkan sebagai kekecualian
  bertujuan untuk imej kecil/statik sahaja (bukan laporan/Drive).
- `npm run typecheck` + `npm run build` lulus.

## 2026-07-05 — Kemaskini ikon PWA jenama baharu

- `public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` ditukar
  kepada logo "e" gradien biru-ungu + 4 modul (jenama eUSTP Manjung terkini).
  Sumber logo diresize guna `sharp` (192/512/180px), `app/manifest.ts` dan
  `app/layout.tsx` (apple icon) tidak berubah — laluan fail kekal sama.
- `npm run typecheck` + `npm run build` lulus selepas tukar.

## 2026-07-05 — Migrasi data Direktori dari DashboardGPMICT (SELESAI)

- Skrip: `scripts/migrate-direktori.ts` (sokong `--dry-run`). Sumber = Supabase
  LAMA projek DashboardGPMICT via REST (env dibaca terus dari
  `needtocombine/DashboardGPMICT/.env.local`) — BUKAN seed.sql (data Feb 2025
  sahaja; DB lama ada kemaskini terkini).
- Dipindah: 102 sekolah, 187 versi kontak, 561 peranan; id versi asal
  dikekalkan; `current_version_id` ikut penunjuk lama (fallback: versi terbaru
  tidak disorok). Semua 102 sekolah berpenunjuk selepas migrasi.
- **Normalisasi nama sekolah** (8 dibaiki, fungsi `normalizeSchoolName`):
  "SEKOLAH KEBANGSAAN KAMPONG KOTA"→"SK KAMPONG KOTA", "SJK C"/"SJK(C)"→SJKC,
  "SJK(T)"→SJKT, kuotasi keriting ’→', KPG→KG, "METHODIST(ACS)"→"METHODIST (ACS)".
  Nama dalam `contact_versions.school_name` turut dinormalisasi.
- `scripts/data/laman-web.csv` hanya header (0 baris) — `schools.website`
  kekal kosong, tiada apa untuk diimport.
- Disahkan: `/direktori/gpict` papar 102 rekod, tiada format lama tinggal,
  tiada ralat konsol.

## 2026-07-05 — OSC One Stop Center + jalur Analisis halaman utama

- **OSC:** Sumber USTP + Analisis USTP + Maklumat Asas digabung di bawah satu
  payung "OSC USTP" (One Stop Center). Hub baharu `app/(public)/osc/page.tsx`
  (statik, tiada DB) dengan 3 kad seksyen bertag kategori. Laluan lama
  `/sumber`, `/analisis`, `/maklumat-asas` KEKAL (deep link tidak pecah);
  eyebrow ketiga-tiga halaman kini "OSC USTP · …".
- `lib/module-theme.ts`: `MODULES` kini termasuk entri `/osc`;
  `HOME_MODULES` = 5 kad (DPD, PSS, Direktori, Tempahan, OSC);
  `OSC_SECTIONS` = 3 sub-modul OSC. Hero halaman utama: 07 → 05 modul.
- TopNav: pautan Sumber+Analisis → satu pautan "OSC USTP". BottomTabBar:
  tab Sumber → tab OSC (match /osc|/sumber|/analisis|/maklumat-asas).
- Admin overview (`/admin`) dikumpul ikut seksyen: Pelaporan / OSC One Stop
  Center (Sumber, Analisis, Pegawai, Tetapan Maklumat Asas) / Perkhidmatan
  (Direktori, Tempahan) / Sistem (Pengguna). RBAC tidak berubah.
- **Jalur "Analisis Semasa" halaman utama:** petak DPD/PSS digantikan dengan
  5 kad Analisis USTP (DELIMa, DCS, Ains, Pensijilan, OPTIK); klik kad buka
  modal carta penuh (`components/home/HomeAnalisisBand.tsx`, carta recharts
  dimuat malas via `next/dynamic ssr:false`). Data dari
  `lib/analisis/summary.ts` (`getAnalisisHomeSummary`) — pengiraan selari
  dengan `/analisis`; jika metrik berubah di sana, kemas kini di sini juga.
- Petak statistik DPD/PSS: kod dikekalkan di sebalik flag
  `SHOW_LAPORAN_TILES=false` dalam `app/(public)/page.tsx` — pelaporan 2026
  masih guna Looker Studio; buka semula selepas migrasi.
- Disahkan: `typecheck` + `build` lulus; smoke `/`, `/osc`, modal DELIMa
  (tile + carta trend render dengan data produksi) — tiada ralat konsol.

## 2026-07-05 — Diagnosis produksi: halaman tergantung 300s (SELESAI)

**Gejala:** Di Vercel, semua halaman yang query DB tergantung sehingga 504
(timeout 300s) secara BERSELANG — burst 200 OK selepas cold start, kemudian
tergantung. `/api/health` sentiasa OK. `/laporan-dpd` & `/direktori` OK
(halaman tanpa DB). DB sendiri sihat (ujian tempatan terus ke DB produksi:
semua jenis query ms-level).

**Proses diagnosis (kekalkan corak ini untuk isu serupa):**
1. `/api/diag` (route handler, 5 jenis query) → SEMUA lulus ms-level.
2. `/diag-page` v1 (query sama dalam konteks render halaman) → timeout,
   walaupun `serverExternalPackages: ["postgres"]` sudah aktif → teori
   bundling RSC DITOLAK.
3. `/diag-page` v2 (TCP mentah, HTTPS egress, klien segar, klien global)
   → SEMUA lulus 15 minit kemudian → sifat berselang disahkan; bukan
   rangkaian, bukan bundling, bukan config.

**Punca sebenar (model yang konsisten dengan semua bukti):** Instance
fungsi Vercel menyimpan klien postgres global dengan `max: 1` TANPA
sebarang timeout query. Bila instance dibekukan, pooler Supabase memutus
soket melahu; instance yang dicairkan menulis query ke soket mati dan
menunggu SELAMANYA — dan kerana `max: 1`, SEMUA query instance itu
beratur di belakangnya → instance "beracun" sehingga dikitar semula.
Corak berselang = instance sihat vs beracun.

**Pengerasan dalam lib/db.ts:** `max: 3` (serverless), `idle_timeout: 3`,
`max_lifetime: 60`, `keep_alive: 20`, `connect_timeout: 10` + pembungkus
`withDbTimeout()` untuk halaman kritikal (halaman utama). JANGAN kembalikan
`max: 1` atau naikkan idle_timeout di serverless.

**Nota lain:**
- `serverExternalPackages: ["postgres"]` dikekalkan (tidak berbahaya,
  amalan disyor Next 15).
- Halaman awam TIDAK boleh papar angka palsu semasa ralat — papar notis
  "Statistik tidak dapat dimuatkan" (keputusan pengguna, 2026-07-05).
- `/api/diag` + `/diag-page` = endpoint diagnostik sementara. BUANG selepas
  produksi stabil beberapa hari.
- DB Supabase baharu (Singapura, aws-1-ap-southeast-1): users=1 (admin),
  pkgs=5, kandungan=96, pegawai=5, **schools=0** — senarai sekolah perlu
  diimport (Fasa E) sebelum Direktori/Laporan PSS berguna.
- Vercel: JANGAN klik "Redeploy" pada deployment lama (ia deploy semula
  commit lama) — push commit baharu atau pilih deployment terkini.

## 2026-07-04 — Fasa D: Modul Tempahan PKG (SIAP + diuji)

- Skema: `pkgs` (5 seed, slug berhubung-strip: sitiawan/ayer-tawar/seri-manjung/
  beruas/pantai-remis), `rooms` (amenities jsonb, soft delete), `bookings`
  (slot am/pm/full_day, token kelulusan + 2 token kehadiran), `attendees`.
  Migrasi 0003 + **0004 custom (trigger advisory-lock, diporting verbatim)**.
- Trigger DIUJI: 2 insert serentak slot bertindih → tepat 1 berjaya, 1 ditolak
  dengan mesej BM. Skrip ujian di scratchpad (perlu salin ke scripts/ untuk
  resolusi node_modules, padam selepas guna).
- Kelulusan: pautan WhatsApp `/tempahan/[pkg]/approve/[id]?token=` kini perlu
  LOG MASUK (ganti kata laluan per-PKG lama); panel admin ada butang terus.
  `approveBookingCore` jana 2 token kehadiran semasa lulus (corak sistem asal).
- Laluan awam: /tempahan (pilih PKG), /tempahan/[pkg] (grid 14 hari × bilik ×
  slot + borang), bilik/[slug], semak (ikut telefon), hadir/[token] (QR),
  urus-hadir/[manageToken] (+ /export CSV, tiada login — token ialah kebenaran).
- Admin: /admin/tempahan (skop PKG_Admin), [pkg] (lulus/tolak/batal),
  [pkg]/bilik (CRUD + gambar Supabase Storage, belum diuji — perlu
  NEXT_PUBLIC_SUPABASE_URL + SERVICE_ROLE_KEY + bucket room-photos),
  [pkg]/tetapan (no. WhatsApp).
- Diuji hujung-ke-hujung dalam dev: cipta bilik → tempah slot → lulus admin →
  daftar kehadiran melalui pautan QR (jumlah=1). Semua PASS.
- Akaun ujian dicipta: `ujian.claude` (Admin) — padam/nyahaktif sebelum produksi.
- NOTA: kata laluan akaun `admin` telah ditukar pengguna (bukan lagi nilai seed).

## 2026-07-04 — Fasa E: Portal & Kandungan (migrasi ustp-dashboard_link_googlesheet)

- Modul ke-5 dimigrasi: dashboard Google Sheet lama → Postgres sepenuhnya
  (tiada lagi pergantungan Sheet/CSV/GAS panel). Data sebenar diimport dari
  Sheet asal (13 tab CSV dalam `scripts/data/`, skrip
  `npm run db:seed-dashboard`, idempoten — padam & masuk semula).
- Skema baharu (migrasi `0002_complex_satana.sql`): `kandungan_cards` (satu
  jadual denormalised ikut bentuk Sheet; group-edit subtopik = satu UPDATE),
  `analisis_metrics` (KV) + `analisis_monthly` + `analisis_breakdown`,
  `pegawai`, `app_settings` (KV), dan lajur `schools.website`.
- Laluan awam baharu (semua `revalidate = 300`): `/sumber` + `/sumber/[topik]`
  (6 topik, kad klik-untuk-pratonton — iframe TIDAK dimuat awal), `/analisis`
  (5 modul recharts), `/statistik` (statistik DPD+PSS langsung dari jadual
  laporan — ganti 2 halaman Looker Studio), `/laporan-dpd|pss/senarai`
  (senarai awam berhalaman, pautan ke /cetak), `/maklumat-asas`.
- Halaman utama kini portal: KPI tiles statistik (HTML tulen, TIADA recharts
  di halaman utama — carta hanya di /statistik & /analisis) + 7 kad modul.
- `lib/stats/` — SATU statistik SATU fungsi (definisi mudah ubah kelak).
  `getPssByDimensi()` pulangkan [] buat masa ini (lajur `dimensi` belum wujud;
  komponen carta sembunyi kad bila data kosong). Laporan dikira SERTA-MERTA
  tanpa kelulusan; actions laporan kini revalidate `/`, `/statistik`, senarai.
- Admin baharu (guard `requireKandunganAccess`): `/admin/kandungan`
  (+`/baharu`, `/[id]`, `/subtopik` group-edit), `/admin/analisis`,
  `/admin/pegawai`, `/admin/tetapan` (kunci whitelist dalam
  `lib/maklumat/tetapan-keys.ts`), website sekolah dalam
  `/admin/direktori/sekolah/[code]`.
- Storan: TIADA Supabase Storage digunakan. Imej statik dalam `public/maklumat`
  + `public/pegawai`; kad hanya simpan URL luaran (Drive/Canva/YouTube/Looker).
  Anggaran DB: data kandungan <0.5MB, laporan ~5–10MB/tahun → 500MB cukup >10 tahun.
- NOTA: tab OPTIK Sheet asal ada lajur snapshot kedua (21-Jun-26) yang
  merosakkan paparan lama; hanya lajur pertama (kitaran 2025 lengkap) diimport —
  nombor baharu dikemas kini melalui /admin/analisis.
- Sahkan: build + typecheck lulus; smoke `/`, `/sumber/integrasi` (24 kad,
  0 iframe pramuat, pratonton klik OK), `/analisis` (8 carta), `/statistik`,
  `/maklumat-asas`, senarai 200; `/admin/*` redirect login.

## 2026-07-04 — Pengesahan DB langsung (Supabase pengguna)

- Projek Supabase pengguna disambung. NOTA PENTING: Direct connection
  (`db.xxx.supabase.co:5432`) tidak boleh diselesaikan (ENOTFOUND) — projek baharu
  Supabase lalai IPv6-sahaja untuk direct connection. Guna **Session pooler**
  (`aws-0-ap-northeast-1.pooler.supabase.com:5432`, username `postgres.<ref>`)
  untuk migrasi tempatan DAN runtime. Simpan nota ini untuk deploy Vercel juga.
- `npm run db:migrate` + `npm run db:seed` berjaya. Akaun admin awal dicipta.
- Diuji hujung-ke-hujung dengan DB sebenar (semua PASS):
  - Log masuk → paksa tukar kata laluan → sesi dikemas kini → `/admin` ✓
  - Direktori: tambah sekolah (admin) → borang awam pilih sekolah → hantar →
    versi baharu → paparan di `/direktori/gpict` ✓
  - Laporan PSS: hantar borang (tanpa gambar, GAS belum setup) → laporan web
    `/laporan-pss/1/cetak` render lengkap → admin arkib bulanan + carta ✓
- NOTA DEV PENTING: banyak butang (Log Keluar, Tambah Sekolah, Simpan, Tukar
  Kata Laluan) TIADA `type="submit"` eksplisit dan tiada id unik — automasi
  ringkas `document.querySelector('button')` akan silap klik butang pertama
  dalam DOM (selalunya "Log Keluar" di header). Guna pemadanan teks/`form
  button` bila menguji.
- BELUM diuji: saluran gambar GAS (perlu deploy Web App dahulu) dan modul
  Tempahan (Fasa D, belum dibina).

## 2026-07-04 — Fasa C: Modul Laporan DPD + PSS

- Skema: `laporan_dpd` (medan ikut col-map GAS v3.9), `laporan_pss` (medan ikut
  getSafeData code.gs, schoolCode → schools), `laporan_photos` (dikongsi, modul
  dpd|pss, storagePath "drive/{fileId}"). Migrasi `drizzle/0001_keen_pete_wisdom.sql`.
- Saluran gambar: `lib/laporan/photos.ts` (naming Tahun/Bulan/Modul) +
  `lib/gas-upload.ts` + `lib/storage.ts` (GAS sahaja) + `lib/client/compress-image.ts`
  + `gas/Code.gs` (disalin dari templat, generik). Gambar gagal muat naik TIDAK
  menggagalkan hantaran — dikembalikan sebagai `warnings`.
- Laluan awam: `/laporan-dpd` (borang), `/laporan-dpd/berjaya/[id]`,
  `/laporan-dpd/[id]/cetak` (laporan web + cetak PDF); corak sama untuk PSS.
  PSS guna jadual induk `schools` untuk pemilih sekolah.
- Admin: `/admin/laporan-dpd` (jadual + status BARU/DISEMAK/SELESAI + padam),
  `/admin/laporan-pss` (arkib bulanan + carta recharts bilangan sebulan).
- Padam laporan turut trash fail Drive (best-effort melalui GAS action delete).
- BELUM diuji hujung-ke-hujung: perlu Supabase (DB) + deploy GAS Web App
  (GAS_WEB_APP_URL/GAS_UPLOAD_SECRET) — lihat gas/Code.gs langkah setup.

## 2026-07-04 — Fasa B: Modul Direktori

- Skema: `schools` (jadual induk dikongsi), `contact_versions`, `contact_roles`,
  `admin_actions` (dengan `actorUserId` → users). Migrasi `drizzle/0000_minor_talos.sql`.
- Tingkah laku ikut sistem asal GPMICT: hantaran awam terus jadi versi semasa;
  admin boleh pulih versi lama / tukar nama sekolah / eksport CSV.
- Laluan awam: `/direktori`, `/direktori/[gpm|gpict|gpdelima]`, `/direktori/kemaskini(+/berjaya)`.
- Laluan admin: `/admin/direktori`, `/admin/direktori/sekolah/[code]`,
  `/admin/direktori/export` (route handler CSV, guard `canManageKandungan`).
- Tambahan baharu berbanding asal: borang "Tambah Sekolah" admin (sebab
  initial-data.json asal kosong; data sekolah sebenar diimport Fasa E).
- BELUM diuji dengan DB sebenar (menunggu projek Supabase pengguna) —
  `db:migrate` + ujian round-trip hantar→versi→pulih tertangguh.
- NOTA DEV: jangan jalankan `npm run build` semasa dev server hidup — ia
  menimpa `.next` dan CSS dev hilang (restart dev server untuk pulih).

## 2026-07-04 — Fasa A: Scaffold projek

- Projek dicipta berdasarkan templat `template/egerak-v2` (SentRa).
- Keputusan reka bentuk: bahasa reka **hp** (putih + biru elektrik #024ad8, Manrope),
  elemen dashboard dipinjam dari airtable/linear.
- Model akses: halaman awam tanpa log masuk; `/admin` dengan Auth.js v5
  (peranan Admin / Pegawai / PKG_Admin, PKG_Admin diskop `users.pkgId`).
- Middleware **diterbalikkan** daripada templat: matcher hanya
  `/admin/:path*`, `/login`, `/tukar-kata-laluan` — halaman awam langsung tidak
  melalui auth.
- Skema fasa ini: jadual `users` sahaja. Jadual modul menyusul fasa B–D.
- `pkgs.admin_password_hash` (dari tempahan asal) TIDAK akan diporting — log masuk
  bersepadu menggantikannya.
- Laporan DPD/PSS: data ke Supabase, gambar ke Google Drive via GAS (fasa C);
  output = laman web + cetak PDF, tiada lagi Google Docs/Slides.
- Rancangan penuh: `C:\Users\asush\.claude\plans\template-ustp-pwa-needtocombine-ustp-cozy-aho.md`

## 2026-07-23 — CoE Direktori

- Nama paparan Direktori GPICT ditukar kepada **CoE Direktori**. Halaman awam
  kekal mengikut jawatan, dibahagikan kepada `Pengurusan Sekolah` (PGB, PK
  Pentadbiran, PK HEM, PK Kokurikulum, PK Pendidikan Khas) dan `Penyelaras
  Sekolah` (GPM, GPICT, GP DELIMa).
- Kemaskini dibuat mengikut satu sekolah dan memaparkan semua lapan jawatan;
  admin melihat ringkasan isi serta sejarah versi terperinci, bukan jadual lapan
  lajur yang sukar diselenggara.
- Migrasi `0008_coe_direktori` menambah lima kod jawatan dan
  `contact_roles.phone_normalized` (format `60...`). Paparan awam tidak lagi
  mencetak nombor penuh; ia memberi tindakan Telefon / WhatsApp. Tapis penerima
  WhatsApp pukal masa depan hendaklah menggunakan `phone_normalized`.
- Dilaksana ke DB pada 2026-07-23: migrasi berjaya, kemudian 162 rekod sumber
  PGB/PK sekolah menengah dan PGB sekolah rendah diimport ke 100 sekolah
  (tiada kod sekolah tertinggal). Sebanyak 161 nombor mudah alih dinormalkan;
  satu nombor talian tetap dikosongkan. Susulan semakan sheet Excel, 214 rekod
  PK sekolah rendah turut diimport ke 81 sekolah. `PK_PETANG` telah dibuang
  daripada paparan, input dan rekod hubungan atas arahan pengguna; nilai enum
  DB dikekalkan demi keselamatan migrasi. Setiap sekolah menerima versi kenalan
  baharu supaya sejarah asal kekal boleh dipulihkan.
