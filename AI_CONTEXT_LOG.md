# AI Context Log — eUSTP Manjung

Log keputusan & konteks untuk sesi AI akan datang. Tambah entri terbaru di atas.

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
