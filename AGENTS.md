# AGENTS.md — NEXa Manjung

Panduan ringkas untuk agen AI. Baca `CLAUDE.md` untuk peraturan penuh.

- UI dalam Bahasa Melayu; ikut bahasa reka hp (putih + biru #024ad8, maks 2 aksen biru/skrin).
- Public-first: jangan tambah guard auth pada halaman awam.
- Next 15: `await params/searchParams/cookies()/headers()`.
- ESLint: untuk konfigurasi Next.js baharu atau yang diubah, gunakan `eslint.config.mjs` native dan konfigurasi flat daripada plugin. Jangan gunakan `FlatCompat`, `.eslintrc` atau `eslint-config-next` sebagai asas konfigurasi. Selepas mengubah konfigurasi lint, jalankan `eslint .`, `npm run typecheck` dan `npm run build`.
- Skema: `lib/schema.ts` (Drizzle). Migrasi: `npm run db:generate` + `npm run db:migrate`.
- Verifikasi minimum sebelum tuntut siap: `npm run build` + `npm run typecheck`.
- Catat keputusan besar dalam `AI_CONTEXT_LOG.md`.
- **CodeGraph:** indeks `.codegraph/` dikongsi dalam git. Selepas perubahan
  struktur kod (fail baharu/padam, refactor, laluan), gunakan MCP
  `mcp__codegraph__index_project` untuk mengemas kini indeks — jangan panggil
  `codegraph sync .` atau `codegraph index .`, kerana `codegraph.exe` projek
  ialah pelayan MCP dan bukannya CLI. Sertakan `codegraph.db` dalam commit
  apabila pengguna minta commit, jika indeks berubah.
- Data sekolah: `ABA1031` mesti dipaparkan sebagai **SK PANGKALAN TLDM II**
  (angka Rom `II`, bukan angka `11`). Kekalkan ejaan ini dalam jadual `schools`,
  semua versi direktori dan mana-mana import akan datang.

## Peminjaman Peralatan

- Katalog awam terus utamakan carian dan senarai peralatan (nama + jumlah
  tersedia). Jangan paparkan kad statistik jumlah inventori pada bahagian atas
  halaman awam; metrik operasi seperti menunggu kelulusan, sedang dipinjam, lewat
  dan penyelenggaraan hanya sesuai di dashboard pentadbir.
- UI dan nama peralatan kekal dalam Bahasa Melayu. Carian mesti turut menyokong
  kata kunci Inggeris sebagai alias tersembunyi, contohnya `laptop` memadankan
  `Komputer riba`, tanpa memaparkan istilah Inggeris tambahan pada UI.
- Inventori lima PKG dipaparkan secara berpusat tetapi setiap unit mesti mempunyai
  PKG pemilik. Satu permohonan hanya boleh melibatkan satu PKG.
- Pentadbir boleh menambah jenis peralatan dan unit fizikal. Setiap unit hendaklah
  merekodkan sekurang-kurangnya nombor siri, nombor aset apabila tersedia, PKG
  pemilik dan status.
- Stok tersedia mesti dikira daripada status unit fizikal; jangan sediakan medan
  untuk mengubah jumlah stok agregat secara manual.
- Halaman awam hanya memaparkan maklumat dan arahan yang perlu untuk pemohon.
  Jangan dedahkan catatan dalaman, perbualan pentadbir atau arahan log masuk
  pentadbir. Pautan kelulusan backend hanya boleh disertakan dalam WhatsApp
  pemberitahuan kepada pegawai PKG, bukan dipaparkan sebagai kandungan halaman
  awam. Catatan keputusan pegawai hanya boleh dipaparkan kepada pemohon apabila
  permohonannya ditolak. Selepas permohonan dihantar, arahkan pemohon menunggu
  kelulusan dan menyemak status melalui `Semak Permohonan`.
- Pentadbir PKG hanya boleh mengurus inventori PKG sendiri, manakala pentadbir
  utama boleh mengurus semua PKG. Sediakan laluan import pukal untuk nombor siri
  apabila data rasmi diterima.
