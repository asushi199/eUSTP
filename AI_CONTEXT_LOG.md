# AI Context Log — eUSTP Manjung

Log keputusan & konteks untuk sesi AI akan datang. Tambah entri terbaru di atas.

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
