# AGENTS.md — eUSTP Manjung

Panduan ringkas untuk agen AI. Baca `CLAUDE.md` untuk peraturan penuh.

- UI dalam Bahasa Melayu; ikut bahasa reka hp (putih + biru #024ad8, maks 2 aksen biru/skrin).
- Public-first: jangan tambah guard auth pada halaman awam.
- Next 15: `await params/searchParams/cookies()/headers()`.
- Skema: `lib/schema.ts` (Drizzle). Migrasi: `npm run db:generate` + `npm run db:migrate`.
- Verifikasi minimum sebelum tuntut siap: `npm run build` + `npm run typecheck`.
- Catat keputusan besar dalam `AI_CONTEXT_LOG.md`.
