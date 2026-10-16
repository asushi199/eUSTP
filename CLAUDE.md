# CLAUDE.md — NEXa Manjung

## Projek

PWA Next.js 15 yang menggabungkan 5 modul USTP (Laporan DPD, Laporan PSS, Direktori
GPICT/DELIMa/GPM, Tempahan PKG, Portal Sumber/Analisis/Maklumat Asas). Sumber asal berada di
`C:\ClaudeProject\ustpallin1\needtocombine\`; templat seni bina ialah
`C:\ClaudeProject\ustpallin1\template\egerak-v2`.

## Peraturan penting

- **UI 100% Bahasa Melayu.** Komen kod boleh BM atau Inggeris.
- **Ejaan CoE:** Centre of Excellence dipaparkan sebagai **`CoE`**, bukan
  `COE`/`coe`. Jangan `text-transform: uppercase` pada teks yang mengandungi
  `CoE` (akan jadi `COE`). Id/slug/fail kekal huruf kecil.
- **Public-first:** halaman awam TIDAK melalui auth. Middleware hanya memadankan
  `/admin/:path*`, `/login`, `/tukar-kata-laluan`. Semakan peranan dalam
  `app/(admin)/layout.tsx` + `lib/rbac.ts`.
- **Next 15:** `params` / `searchParams` / `cookies()` / `headers()` ialah Promise —
  mesti `await`. Jangan salin kod Next 14 dari projek asal tanpa suaian.
- **Edge-safe:** jangan import `db`/`bcrypt` dalam `lib/auth.config.ts` atau middleware.
- **Drizzle:** semua jadual dalam `lib/schema.ts`. Trigger (cth. advisory-lock tempahan)
  perlu migrasi custom (`drizzle-kit generate --custom`) — drizzle-kit tidak menjananya.
- **RLS sebagai kunci PostgREST, bukan autorisasi aplikasi.** Semua akses DB
  di sisi pelayan melalui Drizzle (peranan `postgres` memintas RLS). Jadual
  `public` mesti `ENABLE ROW LEVEL SECURITY` tanpa polisi, supaya Data API
  (anon/authenticated) tidak dapat baca/tulis. Jadual baharu sertakan ini
  dalam migrasi (lihat `0038_enable_rls_lock_postgrest`).

## Reka bentuk (hp DESIGN.md)

- Kanvas putih; **biru `#024ad8` hanya untuk CTA/aksen — maksimum 2 unsur biru setiap skrin**.
- **Pengecualian sah (keputusan pengurusan): kad hub `HOME_MODULES` (halaman utama)
  guna kepala kad berwarna penuh.** `.portal-module-card-head` = `background:
  var(--module-accent)` tepu + teks putih, satu warna per modul (accent dalam
  `lib/module-theme.ts`). Ini dikehendaki pengurusan — JANGAN tenangkan/nyahtepu
  atau tukar kepada kepala putih; dahulu pernah diubah suai tetapi ditolak.
- Dakwat `#1a1a1a`, kelabu `graphite/steel/fog/cloud`; kad radius 8–16px, butang 4px, 44px tinggi.
- Fon: Manrope (`--font-sans`). Butang: uppercase, tracking 0.7px.
- Kelas sedia ada dalam `app/globals.css`: `.btn-primary/.btn-ink/.btn-outline/.btn-outline-ink`,
  `.card`, `.input`, `.textarea`, `.label`, `.status-badge`, `.status-dot`, `.link-blue`.
- Halaman ditutup dengan jalur dakwat gelap (`SiteFooter`).
- Status: pending=graphite, approved/SELESAI=primary, rejected=bloom-deep.

## Struktur

- `app/(public)/…` — awam (TopNav + BottomTabBar + SiteFooter)
- `app/(auth)/login` — log masuk
- `app/(admin)/admin/…` — backend (perlu log masuk)
- `lib/actions/…` — server actions per modul
- `lib/tempahan/…` — logik porting dari tempahan-pkg-manjung
- **Storan fail — Supabase Storage ialah default** (bucket awam `room-photos`;
  perlukan `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` JWT
  `eyJ...` dalam `.env.local`). Guna Google Drive (via `gas/Code.gs`) **hanya**
  untuk kes bervolum besar/berterusan (cth. gambar laporan DPD/PSS, subPath
  `[tahun, bulan, modul]`) — sebab pelan Supabase Storage kami ialah **free
  tier** (kuota storan terhad). Contoh sedia ada: gambar bilik tempahan
  (`lib/tempahan/room-photos.ts` `uploadRoomPhoto`) dan logo PKG
  (`uploadPkgLogo`, `pkgs.logoSrc`).
- `lib/stats/` — satu statistik satu fungsi; carta recharts di `/statistik`,
  `/analisis` dan modal Analisis halaman utama (`HomeAnalisisBand`, dimuat
  malas via `next/dynamic` — JANGAN import recharts terus dalam halaman utama).
- **OSC sudah dimansuhkan.** `/osc` dan `/sumber` dihalakan ke `/resources`.
  Halaman utama papar jalur **CoE Analytics** (bukan kad) + 5 kad
  `HOME_MODULES` (Reports, Resources, Direktori, Services, Media). Menu
  desktop di bar sisi; telefon kekal tab bawah + Lagi. `/analisis` kekal
  dalaman (staf).
- **Program Ains — dasar data tahunan** (jadual `analisis_ains_*`, import via
  `npm run db:import-ains`). Data terperinci murid hanya disimpan untuk
  **tahun semasa**; tahun lalu diarkib supaya DB tidak membengkak setiap tahun:
  - `analisis_ains_murid` + `analisis_ains_murid_bulanan` = nama + e-mel murid
    (~42 MB untuk satu tahun, ~25k murid × 7 bulan). Dipadam bagi tahun yang
    diarkib; tahun itu tiada lagi senarai/graf murid.
  - `analisis_ains_sekolah` (~0.2 MB setahun) **dikekalkan** — ringkasan
    sekolah × bulan: carta, ranking & senarai sekolah untuk tahun lalu masih
    berfungsi. Ini yang dimaksudkan "data kasar" (macam 2025 yang hanya ada
    ringkasan).
  - Langkah arkib tahun T (buat selepas laporan Dis T selesai, sebelum atau
    semasa import Jan T+1): (1) `npm run db:backup-pgdump:upload` dan sahkan
    fail ada di Drive — sandaran itu menyimpan butiran murid T; (2) padam
    `analisis_ains_murid_bulanan` WHERE tahun = T, kemudian padam
    `analisis_ains_murid` yang tiada baris bulanan lagi; (3) `VACUUM (FULL,
    ANALYZE)` pada kedua-dua jadual; (4) catat dalam `AI_CONTEXT_LOG.md`.
  - Skrip `scripts/archive-ains-tahun.ts` BELUM ditulis (patut ada `--dry-run`
    dan enggan padam jika tiada sandaran terkini). UI tahun diarkib juga belum
    disuaikan: tukar "Tiada murid sepadan" kepada nota "Butiran murid telah
    diarkibkan" (`components/analisis/AinsExplore.tsx`).
  - Butiran murid = data peribadi: jangan komit CSV/eksport murid ke git;
    simpan hanya dalam sandaran Drive peribadi.
  - Import bulanan: upsert murid guna `setWhere nama IS DISTINCT FROM` —
    jangan buang, UPDATE tanpa perubahan menjana tuple mati (bloat 6× pernah
    berlaku; dibaiki 2026-10-13).
- **DELIMa — sumber tunggal d3.delima.edu.my (rasmi KPM).** Perlu log masuk pengguna, jadi
  tiada cron: setiap bulan pegawai log masuk dalam pelayar, Claude baca Utama (PPD + setiap
  sekolah, 1 Jan → hari ini), simpan `scripts/data/delima-d3-YYYY-MM-DD.csv`, lalu
  `npm run db:import-delima-d3 -- <fail>` (semak jumlah + padan kod). Paparan = snapshot d3
  terbaharu (`getDelimaTerkini`). DELIMa Perak tidak lagi dibaca. Eksport CSV pengguna d3 (SPP)
  mengandungi No. KP — jangan komit / jangan papar. Buat masa ini paparan **bilangan sahaja**
  (tiada senarai nama guru belum log masuk); senarai nama hanya jika diminta → "Pelan 2" dalam
  `AI_CONTEXT_LOG.md` (2026-10-16).
- **DCS — sumber dcs.moe.edu.my (5 akaun PKG Manjung).** Perlu log masuk pengguna setiap akaun
  (Claude TIDAK memasukkan kata laluan). Claude baca Dashboard/Progress/Top Schools/Ranking, simpan
  `scripts/data/dcs-YYYY-MM-DD.json`, lalu `npm run db:import-dcs -- <fail>`. Paparan = snapshot
  terkini setiap tahun (`getDcsTerkiniIkutTahun`); 2025 = metrik lama `analisis_metrics` (dcs).
- Petak statistik DPD/PSS halaman utama disorok (`SHOW_LAPORAN_TILES=false`
  dalam `app/(public)/page.tsx`) — pelaporan 2026 masih guna Looker Studio.
- **MJKD 2026 = satu acara, satu rekod `mjkd_mesyuarat`** (kehadiran, minit +
  perkara Bil.1/2026, maklum balas, bahan). Jangan pecah semula kepada Bil.1/Bil.2
  — keputusan pengurusan. Label minit dalam `lib/mjkd/acara.ts` (`MINIT_RUJUKAN`).
  Halaman awam `/laporan-mjkd` HANYA minit + maklum balas (kehadiran/bahan
  dipaparkan dalam mod pembentangan sahaja) dan IKUT reka bentuk standard.
  **Mod pembentangan sahaja** ialah **pengecualian reka bentuk** (acara seluruh
  daerah: kanvas tetap 1920×1080, logo KPM/PPD, aksen emas; tema terang lalai,
  T = pentas gelap) — jangan "betulkan" ikut had biru / kanvas putih. Kod di
  `components/mjkd/pembentangan/`, spesifikasi `MJKD/PLAN-pembentangan-v2.md`;
  semak reka letak tanpa DB di `/dev/pentas` (dev sahaja). Catatan maklum balas wajib 5W1H (≥ 30 aksara); gambar bukti di
  Drive dengan token HMAC (`lib/mjkd/foto-token.ts`). Halaman admin MJKD: query
  BERURUTAN dalam `withDbTimeout` + `loading.tsx` (elak tab "tergantung").

## Selepas setiap fasa

`npm run build` + `npm run typecheck` + smoke semua route baharu + catat dalam
`AI_CONTEXT_LOG.md`.
