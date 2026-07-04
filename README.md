# eUSTP Manjung

Platform setempat (PWA) Unit Sumber Teknologi Pendidikan, PPD Manjung — menggabungkan
empat perkhidmatan dalam satu aplikasi:

| Modul | Laluan awam | Fungsi |
|---|---|---|
| Laporan DPD | `/laporan-dpd` | Borang & laporan program pendigitalan (web + cetak PDF) |
| Laporan PSS | `/laporan-pss` | Pelaporan aktiviti Pusat Sumber Sekolah |
| Direktori | `/direktori` | Direktori GPICT / GP DELIMa / GPM dengan sejarah versi |
| Tempahan PKG | `/tempahan` | Tempahan bilik 5 PKG daerah Manjung |

Halaman awam **tidak memerlukan log masuk**; backend `/admin` menggunakan log masuk
bersepadu (peranan: Admin / Pegawai PPD / Pentadbir PKG).

## Teknologi

- Next.js 15 (App Router) + React 19 + TypeScript
- Drizzle ORM + Supabase Postgres (satu projek)
- Auth.js v5 (credentials, JWT)
- PWA: `@ducanh2912/next-pwa`
- Reka bentuk: bahasa reka hp (kanvas putih, biru elektrik `#024ad8`, fon Manrope)
- Gambar laporan: Google Drive melalui GAS Web App (`gas/Code.gs`)

## Mula

```bash
npm install
copy .env.local.example .env.local   # isi DATABASE_URL + AUTH_SECRET
npm run db:generate                  # jana migrasi daripada lib/schema.ts
npm run db:migrate
npm run db:seed                      # cipta akaun admin lalai
npm run dev
```

## Skrip

- `npm run db:create-user -- <username> <password> <nama> <jawatan> [peranan] [pkg_id]`
- `npm run typecheck` / `npm run lint` / `npm run build`

## Nota operasi

- Supabase Free tier tidur selepas tidak aktif — tetapkan cron luaran (UptimeRobot)
  ke `GET /api/health` setiap 5 minit waktu pejabat.
- Deploy: Vercel (region `sin1`).
