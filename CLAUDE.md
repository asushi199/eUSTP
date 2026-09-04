# CLAUDE.md — NEXa Manjung

## Projek

PWA Next.js 15 yang menggabungkan 5 modul USTP (Laporan DPD, Laporan PSS, Direktori
GPICT/DELIMa/GPM, Tempahan PKG, Portal Sumber/Analisis/Maklumat Asas). Sumber asal berada di
`C:\ClaudeProject\ustpallin1\needtocombine\`; templat seni bina ialah
`C:\ClaudeProject\ustpallin1\template\egerak-v2`.

## Peraturan penting

- **UI 100% Bahasa Melayu.** Komen kod boleh BM atau Inggeris.
- **Public-first:** halaman awam TIDAK melalui auth. Middleware hanya memadankan
  `/admin/:path*`, `/login`, `/tukar-kata-laluan`. Semakan peranan dalam
  `app/(admin)/layout.tsx` + `lib/rbac.ts`.
- **Next 15:** `params` / `searchParams` / `cookies()` / `headers()` ialah Promise —
  mesti `await`. Jangan salin kod Next 14 dari projek asal tanpa suaian.
- **Edge-safe:** jangan import `db`/`bcrypt` dalam `lib/auth.config.ts` atau middleware.
- **Drizzle:** semua jadual dalam `lib/schema.ts`. Trigger (cth. advisory-lock tempahan)
  perlu migrasi custom (`drizzle-kit generate --custom`) — drizzle-kit tidak menjananya.
- **Tiada RLS** — semua akses DB di sisi pelayan melalui Drizzle.

## Reka bentuk (hp DESIGN.md)

- Kanvas putih; **biru `#024ad8` hanya untuk CTA/aksen — maksimum 2 unsur biru setiap skrin**.
- **Kad hub `HOME_MODULES` (halaman utama) — warna per-modul secara halus, bukan blok.**
  Setiap kad kekalkan warna modulnya (accent dalam `lib/module-theme.ts`) untuk
  wayfinding, TETAPI warna hanya pada kawasan kecil supaya tidak menyilau
  (lihat `.portal-module-card*` dalam `app/globals.css`): kepala kad **putih**,
  tajuk **dakwat** (bukan putih atas blok warna); accent hanya pada (1) jalur atas
  3px `::before`, (2) petak ikon (ikon `currentColor` = accent, latar
  `color-mix(...12%,#fff)`), (3) bulet senarai `li::before`, (4) CTA & "+ Lagi".
  JANGAN isi penuh kepala kad dengan warna tepu semula.
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
- **OSC (One Stop Center):** `/osc` ialah hub dalaman yang menaungi `/sumber`,
  `/analisis`, `/maklumat-asas`. Halaman utama papar jalur **CoE Analytics**
  (bukan kad) + 5 kad `HOME_MODULES` (Reports, Resources, Direktori, Services,
  Media). Menu desktop di bar sisi; telefon kekal tab bawah + Lagi.
- Petak statistik DPD/PSS halaman utama disorok (`SHOW_LAPORAN_TILES=false`
  dalam `app/(public)/page.tsx`) — pelaporan 2026 masih guna Looker Studio.

## Selepas setiap fasa

`npm run build` + `npm run typecheck` + smoke semua route baharu + catat dalam
`AI_CONTEXT_LOG.md`.
