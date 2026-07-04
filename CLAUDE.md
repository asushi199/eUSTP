# CLAUDE.md — eUSTP Manjung

## Projek

PWA Next.js 15 yang menggabungkan 4 modul USTP (Laporan DPD, Laporan PSS, Direktori
GPICT/DELIMa/GPM, Tempahan PKG). Sumber asal berada di
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
- Gambar laporan → Google Drive via `gas/Code.gs` (subPath `[tahun, bulan, modul]`)

## Selepas setiap fasa

`npm run build` + `npm run typecheck` + smoke semua route baharu + catat dalam
`AI_CONTEXT_LOG.md`.
