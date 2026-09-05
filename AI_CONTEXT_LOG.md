# AI Context Log — NEXa Manjung

## 2026-09-05 — CoE Media: YouTube ikut suis iframe

- Senarai CoE Media / Resources (`gallery`): kad YouTube lalai tertutup
  seperti surat — tiada thumbnail/iframe. **Buka pratonton iframe** memuat
  semua iframe YouTube sekali gus (tanpa autoplay). **Tutup** meruntuhkan
  semula. **Lihat penuh** kekal untuk satu video.
- OSC / pratonton tunggal (tiada gallery) kekal thumbnail + Main video.

## 2026-09-05 — CoE Media: koleksi bulanan + pautan sosial

- Video OSC (`youtube` / tajuk "Video") dipindah ke `media_cards`
  (kategori `koleksi`), termasuk Bicara Buku YouTube dan Video Inovasi.
  Kad TikTok / YouTube dalam OSC Bahan Sokongan dipadam; Ruang Ilmu kekal.
- Halaman awam `/media` ikut corak CoE Resources: carian + tapisan bulan,
  kad koleksi, pautan TikTok / Facebook / YouTube, dan dua item akan datang
  (TVPSS, laman sesawang). Tiada lagi Telegram Info.
- Papan Admin ada kad CoE Media (`/admin/media`) — tambah/sunting/padam
  mengikut bulan, dengan tapisan carian + bulan.
- Pautan: TikTok `https://www.tiktok.com/@ustpmanjung`, Facebook
  `https://www.facebook.com/p/Ustp-Ppd-Manjung-61557576780622/`,
  YouTube saluran OSC sedia ada.
- Migrasi `0041_tiny_angel`: jadual `media_cards` + RLS + pindahan data.

## 2026-09-04 — CoE Resources: iframe lalai tertutup

- Senarai surat tidak lagi memuatkan iframe dalam kad semasa buka halaman.
  Butang **Buka pratonton iframe** di atas membuka pratonton apabila perlu;
  **Tutup pratonton iframe** meruntuhkannya semula.
- **Muat Turun** dan **Lihat penuh** kekal pada setiap kad tanpa iframe.

## 2026-09-04 — Pin search_path fungsi trigger

- Amaran SECURITY Supabase `Function Search Path Mutable` pada
  `prevent_booking_conflict` dan `enforce_equipment_loan_school_name`.
- Fungsi tanpa `search_path` mewarisi laluan sesi; skema berniat jahat
  boleh merampas nama objek tidak berkelayakan.
- Migrasi `0039_pin_function_search_path`: `SET search_path = ''` + rujukan
  `public.` / `pg_catalog.`. Logik trigger tidak berubah.

## 2026-09-04 — Kunci RLS PostgREST (bukan autorisasi aplikasi)

- Amaran CRITICAL Supabase `RLS Disabled in Public` pada
  `public.equipment_loan_events` (dan jadual `public` lain): skema terdedah
  kepada Data API tanpa RLS.
- Aplikasi tidak guna PostgREST; akses hanya Drizzle via `DATABASE_URL`.
- Migrasi `0038_enable_rls_lock_postgrest`: `ENABLE ROW LEVEL SECURITY` +
  `REVOKE` daripada `anon`/`authenticated` pada semua jadual aplikasi.
  Tiada polisi — baris kosong untuk Data API. Peranan `postgres` memintas RLS.
- Amaran INFO `RLS Enabled No Policy` selepas ini adalah disengajakan.

## 2026-09-04 — CoE Resources: Muat Turun + Lihat penuh

- **Muat Turun** (pautan Drive export) dan **Lihat penuh** (lightbox iframe)
  kekal sama sama ada pratonton iframe dalam kad dibuka atau ditutup.
  Tutup iframe hanya menyembunyikan pratonton dalam kad, bukan menukar
  fungsi pautan.
- "Lihat surat" kurang sesuai — surat sudah kelihatan apabila iframe dibuka.
  "Lihat penuh" ialah istilah biasa untuk paparan besar.

## 2026-09-04 — CoE Resources: kad iframe terus + Pratonton besar

- Senarai surat lalai **membuka iframe dalam kad** (bukan lightbox).
  Butang **Tutup pratonton iframe** di atas meruntuhkan iframe jika
  senarai terlalu panjang untuk carian telefon.
- **Pratonton** membesarkan iframe penuh, dengan Sebelumnya / Seterusnya.
  Fungsi Zum & geser (imej pan-zoom) dibuang.

## 2026-09-04 — CoE Resources: pratonton iframe + surat sebelumnya

- Pratonton dibuka sebagai kad iframe Drive (muka surat penuh), bukan
  imej muka pertama. Zum & geser kekal sebagai pilihan.
- Butang **Sebelumnya** / **Seterusnya** sepasang di bawah + anak panah
  kiri/kanan pada kad, supaya surat sebelumnya sama mudah dengan yang
  seterusnya (anak panah kecil di puncak mudah terlepas; leret kanan
  pada telefon boleh disalah anggap sebagai kembali pelayar).

## 2026-09-04 — CoE Resources: pratonton boleh digeer kiri-kanan

- Butang Pratonton membuka lightbox penuh (bukan iframe kecil dalam kad).
- Surat Drive dipaparkan sebagai imej resolusi tinggi: seret untuk geser,
  cubit / butang + − / dwiketik untuk zum. Dalam senarai, seret kiri/kanan
  (skala 1×) atau anak panah untuk surat seterusnya.
- Jika imej Drive gagal, jatuh kepada iframe pratonton.

## 2026-09-04 — NexaBot: /cari surat CoE Resources

- `/cari`, `/carian` atau `/search` diikuti kata kunci (kumpulan atau
  peribadi) mencari kad awam CoE Resources, sama seperti portal
  (tajuk, bulan, kumpulan). Keputusan **terkini dahulu**, 8 sehalaman,
  butang « » untuk muka seterusnya (callback `rc:` — ahli kumpulan
  tidak perlu ikat akaun).
- Arahan kumpulan: `/ustp`, `/sekolah`, `/spi` (`/pekeliling`), `/nota`.
  `/cari sekolah eduspark` juga ditapis ke kumpulan itu. Menu bot
  menyenaraikan `/cari` `/ustp` `/sekolah` `/spi` `/nota`.
- Elak konflik dengan bot lain: NexaBot guna `/mula` `/kemaskini` `/padam`
  (bukan `/start` `/edit` `/delete`). Ikat akaun kekal `/start bind_…`
  dalam sembang peribadi. Butang Ubah tajuk / Ubah bulan / Padam selepas
  muat naik.

## 2026-09-04 — NexaBot: /surat pada balasan PDF

- Balas mesej PDF dengan `/surat` kini mengambil fail daripada
  `reply_to_message`. Nama fail tanpa sambungan + mime octet-stream
  (lazim di Telegram) dianggap PDF, bukan ditolak.

## 2026-09-04 — NexaBot kumpulan: /surat mesti dibalas + ikat akaun

- Dalam kumpulan, fail PDF dengan kapsyen `/surat` kerap tidak sampai
  bot (privacy mode). Aliran yang betul: hantar `/surat`, kemudian
  **balas** mesej bot dengan fail.
- Pengguna yang belum ikat Telegram peribadi kini dapat mesej ralat
  dalam kumpulan (bukan senyap). Mesej bot ikut topik forum
  (`message_thread_id`).

## 2026-09-04 — NexaBot: bulan 7+7 dengan butang tahun

- Pemilih bulan surat: 15 bulan berpusat (7 sebelum, bulan semasa, 7
  selepas), tertua dahulu supaya bulan tengah di tengah grid. Butang
  `« tahun` / `tahun »` menukar muka surat setahun.

## 2026-09-04 — NexaBot: padam mesej wizard selepas simpan

- Selepas surat berjaya, bot memadam arahan kumpulan/bulan/nama dan
  status muat naik. Yang kekal: fail asal + mesej "Surat telah disimpan"
  (pautan Drive/portal). Dalam kumpulan, bot perlu kebenaran padam mesej
  untuk buang tajuk yang ditaip pengguna.

## 2026-09-04 — Khidmat Bantu: folder Drive modul dahulu

- Surat permohonan GAS kini ke `Khidmat-Bantu/<tahun>/<YYYY-MM>/`,
  bukan `tahun/bulan/Khidmat-Bantu`, supaya tidak bercampur dengan
  Pinjaman Peralatan, CoE Resources dan folder tahun laporan.

## 2026-09-04 — CoE Resources: NexaBot muat naik surat program

- Surat Program USTP dan Surat Program Sekolah/Guru/Murid boleh dihantar
  melalui NexaBot (`/surat`) dalam sembang peribadi atau kumpulan. Bot
  menanya kumpulan, bulan surat (boleh berbeza daripada bulan muat naik)
  dan nama, kemudian menyimpan fail ke Google Drive
  `CoE-Resources/<kumpulan>/<tahun>/<YYYY-MM>/` dan menerbitkan kad awam.
- Hanya staf Admin/Pegawai yang sudah ikat Telegram di `/admin/telegram`
  boleh memuat naik. Dalam kumpulan, hantar `/surat` dulu kemudian balas
  dengan fail (privacy mode Telegram).
- Borang admin juga menerima fail + bulan surat; pautan manual kekal.
- Webhook perlu `callback_query`: jalankan `npm run telegram:set-webhook`
  selepas deploy.

## 2026-09-04 — CoE Resources: buang kategori Sijil Digital Program

- Kategori `sijil` dikeluarkan daripada senarai CoE Resources (awam, hab
  utama dan borang admin). Sijil program diurus di Autosijil, bukan di sini.

## 2026-09-04 — CoE Resources: carian tajuk + bulan

- Carian diletakkan di hab `/resources` dan subhalaman kategori. Hab
  kekal senarai kumpulan sehingga pengguna menaip atau pilih bulan;
  keputusan merentas semua kategori. Subhalaman menapis surat dalam
  kumpulan itu sahaja.
- Padanan kabur pada tajuk, nama fail, kategori dan bulan (tarikh muat
  naik MYT atau bulan yang tertulis pada tajuk). Tiada medan tarikh surat
  berasingan.

## 2026-09-04 — CoE Resources: kad kategori lompat ke subhalaman

- Halaman awam `/resources` tidak lagi membuka/menutup accordion. Ketik kad
  kategori (cth. Pekeliling / Siaran STP) membawa ke `/resources/[kategori]`.
- Subhalaman hanya memaparkan bahan kategori itu; senarai hub kekal ringkas.
- Pentadbir di `/admin/resources` kekal accordion untuk urus kad di tempat.

## 2026-09-04 — Admin: CoE Booking → CoE Services

- Kad Papan Admin, tab mudah alih dan hab `/admin/booking` menggunakan
  nama **CoE Services**, sama seperti portal awam. Laluan `/admin/booking`
  tidak berubah.

## 2026-09-04 — Ejaan CoE (bukan COE)

- Nama paparan Centre of Excellence dikunci sebagai **CoE**. CSS `uppercase`
  pada tajuk kad, eyebrow `PageHeader`, label sisi dan seumpamanya ditanggalkan
  supaya tidak terpapar `COE`. Id/slug kekal huruf kecil.

## 2026-09-04 — CoE Resources: kad kategori + kad anak di dalam

- Bar tab mendatar kategori di `/admin/resources` (sukar pada telefon)
  diganti kad kategori. Ketik kad untuk buka/tutup; kad surat anak
  dipaparkan di dalam kad yang sama.
- Halaman awam `/resources` ikut corak yang sama — tidak lagi hanya
  pautan ke subhalaman. `/resources/[kategori]` membuka kad kategori
  berkenaan.

## 2026-09-04 — CoE Resources berasingan + CoE Reports di Papan Admin

- Surat punca kuasa / SPI dipindah dari OSC Bahan Sokongan ke jadual
  `resources_cards` (kategori pekeliling). OSC tidak lagi memaparkan kumpulan
  itu. Pentadbir urus kad di `/admin/resources` — tajuk + pautan sahaja,
  dengan pratonton surat.
- Papan Admin menambah kad **CoE Resources** dan **CoE Reports**. Menu
  Pelaporan di bar sisi/tab telefon dimansuhkan; laluan `/admin/pelaporan`
  kekal sebagai hab laporan.

## 2026-09-04 — Direktori: log masuk MOE-DL

- Nombor telefon / WhatsApp direktori tidak lagi dihantar ke pelayar tanpa
  sesi. Senarai sekolah dan nama jawatan kekal boleh dilihat.
- Guru log masuk Google dengan domain `@moe-dl.edu.my` (`prompt=select_account`
  + `hd`). Staf USTP terus guna `/login`; sesi MOE-DL tidak membuka `/admin`.
- Telegram/WhatsApp in-app browser dihalakan buka Chrome/Safari sebelum OAuth.
- Borang kemas kini direktori juga memerlukan log masuk yang sama.

## 2026-09-04 — Menu sisi desktop admin

- Header desktop admin diganti bar sisi kiri, sama corak portal pengguna
  (`portal-sidebar`): logo + Pentadbiran, Portal Pengguna / Papan Admin / OSC /
  Pelaporan, gambar jenama di bawah.
- Bar atas desktop hanya menu pengguna. Telefon kekal header + tab bawah.

## 2026-09-04 — Kad CoE halaman utama + menu sisi

- Halaman utama ikut taksonomi CoE baharu (tanpa QR Centre). **CoE Analytics**
  ialah nama baharu jalur analisis sedia ada — tiada kad tambahan.
- Kad berwarna (kepala warna + senarai sub-pilihan): CoE Reports, CoE
  Resources, CoE Direktori, CoE Services (naman lama CoE Booking), CoE Media.
- Resources dan Media ialah halaman placeholder (`/resources`, `/media`);
  kandungan akan diisi kemudian. OSC `/sumber` kekal dalaman.
- Desktop: menu dari header ke bar sisi kiri. Telefon: Utama / Laporan /
  Services / Direktori + **Lagi** (Analytics, Resources, Media).
- Direktori senarai sekolah kekal awam; nombor telefon dilindungi MOE-DL.
- Notifikasi dan kalendar GPT tidak dibuat dalam fasa ini.

## 2026-08-27 — Senarai admin Laporan Akhbar: baki 2024–2025

- `/admin/laporan-akhbar` kini memaparkan **Baki 2024–2025 (RM)** di samping
  lajur Baki 2026. Nilai diambil daripada `baki_peruntukan_2024_2025_rm`
  yang sudah diisi sekolah; sekolah belum hantar kekal `—`.

## 2026-08-27 — Siaran WhatsApp: tampal senarai sekolah

- Panel Siaran WhatsApp di `/admin/direktori` menerima tampalan senarai sekolah
  (satu baris satu sekolah). Nama pendek/panjang, `SJK (C)`, kod sekolah dan
  ejaan berbeza dipadankan secara kabur kepada jadual rasmi.
- Padanan unik terus dipilih. Nama yang mengenai lebih daripada satu sekolah
  (cth. `HWA LIAN` tanpa 1/2) dipaparkan untuk dipilih. Baris yang tidak
  dijumpai ditanda supaya pentadbir boleh betulkan.
- Penghantaran kekal `wa.me` seorang demi seorang.

## 2026-08-26 — Semak Tebus Buku: baucar buku, bukan buku digital

- Tag kad **Semak Tebus Buku** di hub `/laporan` ditukar kepada **Baucar Buku**.
  Penerangan kad, halaman senarai sekolah dan metadata ikut menyebut tebus/guna
  baucar buku, bukan buku digital.

## 2026-08-26 — Semak Tebus Buku (CoE Laporan)

- Kad baharu **Semak Tebus Buku** di hub `/laporan`. Bukan borang — direktori
  semakan status tebus/guna baucar buku untuk 21 sekolah menengah Manjung.
- Alur: pilih sekolah → senarai pelajar sekolah itu, dengan carian nama,
  tingkatan dan status. Emel tidak didedahkan di halaman awam. Sekolah boleh
  muat turun CSV mengikut tapisan semasa.
- Data snapshot CSV (26 Ogos 2026) diimport ke jadual `tebus_buku_pelajar`.
  Kemas kini: `npm run db:import-tebus-buku` (atau lalui fail CSV sebagai argumen).
- Senarai sekolah dihalaman awam diisih ikut kod sekolah.

## 2026-08-26 — Popup WhatsApp pemohon dari panel admin

- Lulus/tolak dari panel admin (tempahan, khidmat bantu, pinjaman peralatan)
  kini membuka popup **Maklumkan pemohon?** supaya pentadbir boleh hantar
  WhatsApp terus, atau tutup dan hantar kemudian dari permohonan itu.
- Popup dipasang pada layout admin (`NotifyPemohonProvider`) supaya ia tidak
  hilang apabila kad pending dimuat semula selepas `revalidatePath`.
- Pautan kelulusan Telegram kekal ke halaman keputusan; butang WhatsApp pada
  kad/halaman permohonan tidak dibuang.

## 2026-08-26 — WhatsApp pemohon selepas lulus/tolak

- Selepas pentadbir lulus atau tolak, butang **WhatsApp pemohon** (mesej
  praset) dipaparkan terus: pautan kelulusan Telegram (halaman keputusan),
  kad admin Khidmat Bantu, dan halaman kelulusan jika sudah diproses.
- Tempahan bilik di panel admin dan halaman terperinci pinjaman peralatan
  sudah ada butang ini; peralatan kini lebih ketara selepas keputusan.
- Nombor pemohon tidak didedahkan pada halaman keputusan tanpa sesi pentadbir.

## 2026-08-26 — Buang pautan Pengguna yang tiada halaman

- Menu avatar admin ada item **Pengguna** ke `/admin/users`, tetapi halaman
  itu tidak wujud. Akaun backend kekal dicipta melalui `scripts/create-user.ts`.
- Pautan dan helper RBAC yang hanya untuk halaman itu (`canManageUsers`,
  `requireUserManagement`, `requireAdmin`, `isFullAdmin`) dibuang.

## 2026-08-22 — Senarai permohonan aset: muatan mengikut bulan

- Halaman admin tidak lagi memuatkan seluruh sejarah PKG pada mula. Bulan
  aktif (lalai: bulan semasa) dimuatkan sekali, lalu status/carian ditapis di
  pelayar.
- `Semua bulan` mengekalkan susunan alur kerja merentas bulan (menunggu
  kelulusan dahulu, ditolak paling bawah), tetapi hanya 25 rekod setiap muka
  surat dari pelayan. Status dan carian pada paparan ini dihantar ke pelayan
  tanpa butang Tapis (carian ditangguh 300ms).
- Barisan menunggu kelulusan kekal pertanyaan kecil (5 rekod) tanpa mengira
  bulan.

## 2026-08-22 — Senarai permohonan aset: susunan alur + tapisan segera

- `/admin/peralatan/[pkg]/permohonan` memuatkan semua permohonan PKG sekali,
  kemudian menapis di pelayar. Menukar bulan, status atau kata carian tidak
  memanggil semula pangkalan data, jadi butang `Tapis` dibuang.
- Susunan senarai mengikut alur kerja: menunggu kelulusan, diluluskan, telah
  diserahkan, dibatalkan, dipulangkan, kemudian ditolak di bawah sekali. Dalam
  status yang sama, rekod terbaharu kekal di atas.
- Carian sekolah meniru direktori: padanan segera pada kod sekolah, nama
  sekolah, nama pemohon atau nombor rujukan, dengan kiraan rekod semasa.

## 2026-08-22 — Tapisan admin Laporan Akhbar

- `/admin/laporan-akhbar` menambah tapisan senarai: Semua / Belum hantar /
  Sudah hantar, plus carian kod/nama/zon. URL `?status=belum-hantar` boleh
  dikongsi untuk senarai sekolah yang belum mengisi tinjauan.

## 2026-08-21 — Tempahan lintas hari: satu QR AutoSijil

- Baris tempahan lintas hari kini berkongsi `group_id`. Kelulusan satu hari
  meluluskan seluruh kumpulan dan menyegerakkan satu event AutoSijil dengan
  senarai tarikh/slot. Semua hari berkongsi pautan dan token poster yang sama.
- Poster QR memaparkan julat tarikh serta jadual setiap hari. Pembatalan atau
  pindaan satu hari akan menyegerakkan semula jadual event yang sama.
- Skrip `merge-legacy-booking-groups.ts` hanya memilih rekod sejarah yang
  dicipta dalam transaksi sama dan bertarikh berturutan. Ia memindahkan
  kehadiran ke event baharu sebelum membuang event lama dan menyatukan poster.

## 2026-08-21 — Kemaskini Laporan Akhbar tanpa tiket berulang

- Selepas kod sekolah dan nombor tiket berjaya disahkan pada halaman semakan,
  pautan **Kemaskini borang** kini membawa kedua-dua nilai tersebut ke borang.
  Halaman kemaskini mengesahkan semula padanan tiket di pelayan, lalu mengunci
  carian/sekolah dan nombor tiket supaya responden boleh terus mengemas kini
  data tanpa menukarnya atau memasukkan tiket kali kedua.

## 2026-08-17 — Laporan Akhbar: tahun 2026 + data 2024–2025

- Template eksport ditukar kepada `docs/fixed template penyelarasan akhbar.xlsx`
  (disalin ke `public/templates/laporan-akhbar-2026.xlsx`).
- Lajur amaun sedia ada dilabel **2026**; dua medan baharu wajib diisi sekolah:
  **Terimaan tahun 2024–2025** dan **Baki peruntukan tahun 2024–2025**.
- Eksport `Data Sekolah` kini A–Q (Status/Tarikh/Catatan beralih ke O–Q).
- Migrasi `0029_laporan_akhbar_tahun_2425` menambah dua lajur pada `laporan_akhbar`.

## 2026-08-11 — CoE Laporan hub (desktop + home)

- Halaman utama & TopNav desktop kini memaparkan **CoE Laporan** (bukan dua kad
  DPD/PSS berasingan), sama corak CoE Booking → hub `/laporan` dengan 3 pilihan:
  DPD, PSS, Akhbar.
- `LAPORAN_SECTIONS` + `LAPORAN_HUB` dalam `lib/module-theme.ts`; BottomTabBar
  dilabel semula "CoE Laporan".

## 2026-08-11 — Laporan Akhbar: jawatan Pegawai PPD automatik

- Medan Pegawai (semakan PPD) auto isi
  `Penolong PPD (Unit Sumber dan Teknologi)` — bukan nama akaun log masuk.
- Eksport Excel juga resolve nilai lama (cth. “Pentadbir USTP”) kepada jawatan
  rasmi.

## 2026-08-11 — Laporan Akhbar: perakuan + nombor tiket

- Borang awam menambah kotak **Perakuan pemohon** (wajib tick) di bawah Catatan,
  dengan semakan pelayan. Label UI “nombor resit” diganti kepada **nombor tiket**
  (lajur DB kekal `receipt_token`).
- Halaman berjaya: peringatan kuat + salin / muat turun `.txt` / cetak (semua di
  sisi klien; tiada storan pelayan).

## 2026-08-11 — Laporan Akhbar (Langganan Akhbar 2026)

- Modul baharu tinjauan penyelarasan peruntukan Program Langganan Akhbar 2026
  untuk **PPD Manjung sahaja** (spec:
  `docs/superpowers/specs/2026-08-11-laporan-akhbar-design.md`).
- Awam: `/laporan-akhbar` (satu borang gabungan), `/laporan-akhbar/berjaya`,
  `/laporan-akhbar/semak` (kod + nombor tiket). Hub `/laporan` menambah kad
  ketiga (laluan dalaman; DPD/PSS kekal Looker override).
- Admin: `/admin/laporan-akhbar` senarai ikut kod, detail semakan PPD,
  `/admin/laporan-akhbar/export` jana Excel dari template JPN (SheetJS/`xlsx`).
  Sheet **Tindakan JPN** dibiarkan kosong. Tiada lampiran.
- Skema `laporan_akhbar` + migrasi `0027_laporan_akhbar`. Enum ketat dari sheet
  `Senarai` (Ya/Tidak, Status, Kategori SR/SM PKB).
- Template disalin ke `public/templates/laporan-akhbar-2026.xlsx`.

## 2026-08-08 — Jenama rasmi NEXa + logo baharu

- Portal ditukar nama paparan daripada eUSTP kepada **NEXa** (`APP_DISPLAY_NAME` /
  `APP_SHORT_NAME` / `PWA_APP_NAME` dalam `lib/branding.ts`).
- Logo PWA (`public/icons/icon-192.png`, `icon-512.png`, `apple-touch-icon.png`)
  dan aset aplikasi (`public/nexa-logo.png`) diganti dengan logo rasmi NEXa.
- Header (`BrandWordmark`), footer, metadata tajuk halaman, mesej WhatsApp
  dan penjana KEW.PA-9 dikemas kini kepada NEXa Manjung.
- Hero bulatan (`HeroVisual`) kekal logo USTP Manjung (`/ustp-logo.png`) —
  logo penuh NEXa tidak sesuai dalam bulatan orbit.
- Laluan integrasi Autosijil (`/api/integrations/eustp/...`) dan nama pakej repo
  kekal tidak diubah (kontrak luaran / folder git).

## 2026-08-06 — Catatan pemulangan KEW.PA-9

- Semasa pentadbir mengesahkan pemulangan, dialog pilihan membolehkan catatan
  sehingga 500 aksara direkodkan bersama transaksi pemulangan.
- Catatan disimpan pada `equipment_loan_requests.return_note`, dimasukkan dalam
  jejak audit `equipment_returned`, dan dipaparkan sekali sebagai kotak teks
  merentasi ruang `Catatan` pada halaman pertama KEW.PA-9. Ia tidak diulang
  mengikut unit atau baris aset.
- Migrasi `0022_acoustic_aaron_stack` menambah lajur tersebut dengan nilai lalai
  kosong supaya rekod sedia ada kekal serasi.

## 2026-08-05 — Makluman keputusan melalui WhatsApp

- Selepas tempahan bilik diluluskan atau ditolak, panel pentadbir memaparkan
  butang WhatsApp kepada pemohon dengan mesej keputusan, bilik, tarikh, slot dan
  tujuan yang telah diisi.
- Selepas pinjaman peralatan diluluskan, ditolak atau diserahkan, halaman
  keputusan admin memaparkan butang WhatsApp kepada pemohon. Mesej kelulusan
  mengarahkan pemohon hadir ke PKG pada tarikh pinjaman untuk mengambil
  peralatan; mesej penolakan memasukkan catatan keputusan jika ada; mesej
  selepas serahan mengesahkan peralatan telah diserahkan.
- Integrasi menggunakan pautan `wa.me` sedia ada: mesej dijana secara automatik,
  tetapi pentadbir masih perlu menekan Send dalam WhatsApp.
- Nombor telefon tempatan Malaysia yang diisi sebagai `01…` kini ditukar kepada
  format WhatsApp `601…` semasa pautan dijana. Normalisasi carian pangkalan data
  tidak diubah supaya rekod permohonan lama terus boleh disemak.

## 2026-08-04 — Admin Tempahan: senarai mingguan gaya takwim

Senarai admin tempahan bilik diganti kepada baris ringkas bergrup minggu
(rujukan egerak-v2 takwim). Badge = nama bilik; klik expand untuk butiran +
tindakan. Desktop kekal Kalendar | Senarai; telefon sentiasa senarai minggu.
Pending: desktop kad penuh, telefon agenda ringkas. Default buka minggu semasa.
Spec/plan: `docs/superpowers/specs/2026-08-04-tempahan-admin-takwim-senarai-design.md`,
`docs/superpowers/plans/2026-08-04-tempahan-admin-takwim-senarai.md`.
Fail: `lib/month-view.ts`, `WeekAgendaList`, `AgendaRow`, `BookingAgendaRow`,
`MonthSection` (`forceListOnMobile` + `agenda`), `TempahanAdminView`.
Khidmat Bantu tidak diubah (tiada `agenda`).

## 2026-08-04 — Fasa 2 Autosijil: sync jadual + migrasi

Ubah tarikh/slot pada booking yang sudah ada event Autosijil akan `PATCH`
butiran event. Skrip migrasi sekali:
`npx tsx scripts/migrate-bookings-to-autosijil.ts [--dry-run] [--pkg=…]`
untuk booking approved + tarikh ≥ hari ini (MY) tanpa event; sijil lalai tidak.
Penerangan Autosijil **tidak** menyertakan maklumat pemohon; skrip
`refresh-autosijil-event-details.ts` membersihkan description lama.
Spec: `docs/superpowers/specs/2026-08-04-eustp-autosijil-phase2-sync-migrate-design.md`.

## 2026-08-04 — Integrasi Autosijil (kehadiran + sijil)

Tempahan yang diluluskan auto-cipta event di Autosijildankehadiran melalui API
integrasi (Bearer secret). Admin pilih «Perlu sijil» semasa lulus. eUSTP jana
halaman cetak poster QR (`/tempahan/[pkg]/cetak-kehadiran/[cetakToken]`); senarai
kehadiran & sijil hanya di Autosijil. Booking lama kekal aliran `/urus-hadir`
tempatan. Spec/plan:
`docs/superpowers/specs/2026-08-04-eustp-autosijil-integration-design.md`,
`docs/superpowers/plans/2026-08-04-eustp-autosijil-integration.md`.
Migrasi eUSTP: `drizzle/0021_autosijil_booking_sync.sql`. Autosijil SQL:
`supabase/migrations/2026-08-04-eustp-external-booking.sql`.

## 2026-08-04 — Jadual tempahan gaya Sentra (hybrid B)

Paparan jadual bilik awam diganti kepada jadual padat (Tarikh × AM/PM)
seperti egerak-v2/Sentra, sambil kekalkan suis **7 hari / Bulan** dan warna
status eUSTP (kosong=primary, menunggu=amber, diluluskan=steel). Klik slot
berwarna buka dialog butiran. Fail: `CalendarBoard.tsx`,
`RoomBookingWorkspace.tsx`.

## 2026-08-04 — Tempahan bilik lintas hari

Pemohon boleh pilih tarikh mula–tamat (maks 7 hari), slot berbeza setiap hari.
Semakan konflik all-or-nothing; insert N baris `bookings` dalam satu transaksi;
kelulusan kekal per hari. Spec:
`docs/superpowers/specs/2026-08-04-tempahan-lintas-hari-design.md`.
Fail utama: `BookingForm.tsx`, `lib/actions/tempahan.ts`,
`lib/tempahan/{date,booking-rules,whatsapp}.ts`.

## 2026-07-29 — Timeout pada action pinjaman awam

Selepas fix halaman mohon: tambah `withDbTimeout` + query berurutan pada
`createEquipmentLoanAction` / `checkEquipmentLoansAction` supaya hantar/semak
borang tidak tergantung bila soket pooler mati. Admin hub kekal tanpa
perubahan (trafik rendah).

## 2026-07-29 — Fix hang `/tempahan/peralatan/mohon` (5m timeout)

**Gejala:** klik peralatan di katalog awam → tiada reaksi. Vercel log:
`GET /tempahan/peralatan/mohon` Execution Duration **5m / 5m** (RSC dari
`/tempahan/peralatan`). Bukan masalah tambah unit / catatan.

**Punca:** halaman mohon guna `Promise.all` (catalog + pkgs + schools); catalog
sendiri juga `Promise.all` 3 query. Pooler serverless ~3 sambungan → query
tersekat pada soket mati, tunggu sehingga had Vercel.

**Baiki:** sama seperti fix admin `cecd1f5` — query berurutan + `withDbTimeout`
+ UI fallback. Fail: `lib/peralatan/loan-form-data.ts`,
`lib/peralatan/queries.ts` (`listEquipmentCatalog` serial),
`app/(public)/tempahan/peralatan/mohon/page.tsx`, katalog awam juga
dibungkus timeout.

## 2026-07-29 — Katalog awam peralatan: senarai ringkas

Arahan pengurusan: halaman awam `/tempahan/peralatan` terlalu padat. Keputusan:

- Paparan kad (kod, deskripsi, bar stok, pecahan per-PKG, butang) diganti
  dengan **senarai**: nama (+ model kecil) + jumlah tersedia semua PKG.
- Stok 0 disembunyikan. Carian kekal; tapisan PKG dibuang.
- Klik baris → `/tempahan/peralatan/mohon?item=…`; PKG dipilih dalam borang.
- `LoanApplicationForm` kini utamakan PKG yang ada stok untuk `defaultItemId`
  apabila `pkg` tiada dalam query.

## 2026-07-27 — Penyusunan navigasi Admin mengikut CoE

- Hub baharu `/admin/booking` mengumpulkan pengurusan **Khidmat Bantu**,
  **Tempahan Bilik** dan **Aset**. Admin/Pegawai melihat ketiga-tiganya;
  `PKG_Admin` hanya melihat Tempahan Bilik dan Aset dalam skop PKG sendiri.
- Lencana merah notifikasi dikekalkan: hub menunjukkan jumlah menunggu bagi
  setiap urusan dan kad `CoE Booking` di `/admin` menunjukkan jumlah gabungan.
- **Mudah alih:** buang tab `Papan` yang bertindih. Bar bawah kini
  `CoE Booking`, `CoE Direktori`, `OSC`, `Lapor`, `Portal` (PKG_Admin hanya
  `CoE Booking` dan `Portal`).
- **Desktop:** buang pautan header `Tempahan` dan `Peralatan`; kedua-duanya
  diakses melalui kad `CoE Booking` pada `Papan Admin`. `OSC` dan `Pelaporan`
  kekal sebagai ruang kerja terus.
- Dilindungi oleh ujian konfigurasi navigasi dan hub; perubahan UI dihantar
  dalam commit `c018608`, `6db59c9` dan `cbb8083`.

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

## 2026-07-23 — Pembetulan nama sekolah ABA1031

- Nama rasmi ialah **SK PANGKALAN TLDM II** (angka Rom `II`), bukan
  `SK PANGKALAN TLDM 11`. Nama dalam jadual `schools` dan semua versi direktori
  diseragamkan; peraturan kekal direkodkan dalam `AGENTS.md`.

## 2026-07-24 — CoE Booking

- Hub `/tempahan` dinamakan **CoE Booking** dan menghimpunkan Tempahan Bilik
  PKG, Permohonan Khidmat Bantu serta Peminjaman Peralatan. Peminjaman
  Peralatan kini merupakan halaman placeholder awam dengan status “Akan datang”.

## 2026-07-26 — Pratonton UI Peminjaman Peralatan

- Placeholder Peminjaman Peralatan diganti dengan prototaip UI berdata olok-olok:
  inventori awam di `/tempahan/peralatan`, permohonan di
  `/tempahan/peralatan/mohon`, dan pratonton kelulusan di
  `/tempahan/peralatan/pratonton-kelulusan`.
- Inventori disatukan untuk lima PKG tetapi setiap stok tetap memaparkan PKG
  pemilik. Satu permohonan hanya boleh memilih satu PKG.
- Pemohon memilih jenis dan kuantiti peralatan; nombor siri hanya diperuntukkan
  oleh pentadbir ketika kelulusan. Stok belum dianggap dipinjam pada peringkat
  permohonan.
- Tandatangan tidak dibuat semasa kelulusan. Aliran tandatangan digital akan
  bermula ketika serahan fizikal dan disambung ketika pemulangan.
- Catatan prototaip ini digantikan oleh pelaksanaan Fasa 1 di bawah pada hari yang
  sama.

## 2026-07-26 — Carian Katalog dan Peraturan Inventori

- Tiga kad statistik awam (`Jenis peralatan`, `Unit tersedia`, `Lokasi pinjaman`)
  dibuang kerana tidak membantu pemohon membuat tindakan. Katalog kini terus
  memaparkan carian, tapisan PKG dan senarai peralatan.
- Carian katalog menyokong alias Inggeris tersembunyi tanpa mengubah UI Bahasa
  Melayu. Contoh yang telah diuji: `laptop` memadankan `Komputer riba`. Alias
  turut disediakan untuk 3D printer, remote control car, microcontroller dan set
  elektronik.
- Diputuskan bahawa pentadbir akan boleh menambah jenis peralatan dan unit
  fizikal, termasuk nombor siri, nombor aset, PKG pemilik dan status. Senarai
  nombor siri juga perlu menyokong import Excel secara pukal.
- Jumlah stok tidak akan diedit secara manual. Stok tersedia akan dikira daripada
  rekod dan status unit untuk mengelakkan percanggahan inventori.
- Skop akses: pentadbir PKG mengurus PKG sendiri; pentadbir utama mengurus semua
  lima PKG. Metrik operasi seperti menunggu kelulusan, sedang dipinjam, lewat dan
  penyelenggaraan akan diletakkan di dashboard pentadbir, bukan katalog awam.

## 2026-07-26 — Pelaksanaan Fasa 1 Peminjaman Peralatan

- Prototaip diganti dengan modul berasaskan Drizzle/Supabase. Migrasi
  `0011_equipment_loans` menambah jenis peralatan, unit fizikal, permohonan,
  item permohonan, peruntukan nombor siri, jejak audit dan maklumat pegawai
  peralatan pada jadual `pkgs`.
- Migrasi menyemai enam jenis peralatan daripada SAP Maker Lab tetapi tidak
  mencipta stok rekaan. Stok awam hanya muncul selepas unit sebenar berserta
  nombor siri didaftarkan.
- Borang awam `/tempahan/peralatan/mohon` menyimpan permohonan sebenar, menyemak
  stok tersedia dan menghasilkan pautan WhatsApp kepada pegawai PKG. Satu
  permohonan kekal terhad kepada satu PKG.
- Kawasan log masuk `/admin/peralatan` membenarkan pentadbir menambah jenis,
  mendaftar unit, mengubah status bukan pinjaman, mengemas kini pegawai,
  mengimport Excel/CSV dan memproses permohonan.
- Kelulusan wajib memperuntukkan bilangan unit sebenar yang tepat. Transaksi
  pangkalan data menukar unit daripada `available` kepada `reserved`; kemas kini
  bersyarat mencegah dua pentadbir menempah unit yang sama serentak.
- Templat import tersedia di `/templates/import-peralatan.csv`. No. siri
  peralatan wajib, manakala no. aset kerajaan kekal pilihan sehingga senarai
  rasmi diterima.
- Pratonton kelulusan awam telah dibuang. Kelulusan sebenar hanya boleh dicapai
  melalui kawasan pentadbir dan mengikut skop PKG pengguna.
- Tandatangan digital, serahan/pemulangan dan penjanaan KEW.PA-9 belum
  dilaksanakan; skema status dan jejak audit telah disediakan untuk Fasa 2.
- Migrasi telah dijana dan disemak tetapi **belum dijalankan pada Supabase
  produksi**. Jalankan `npm run db:migrate` selepas semakan sebelum menggunakan
  modul.

## 2026-07-29 — Fasa 2 Peminjaman Peralatan: KEW.PA-9

- Templat rasmi ialah `AM 2.4 Lampiran A`. Susun atur sistem menggunakan
  `docs/borang pinjaman peralatan coe.xlsx` yang telah disemak terhadap medan
  dokumen rasmi. Salinan PDF statik di
  `public/templates/kew-pa-9-am24.pdf` digunakan sebagai latar; runtime Vercel
  hanya menindih data dan tidak memerlukan Excel/Word/LibreOffice.
- Keputusan pimpinan menggantikan tandatangan dalam talian. Semasa permohonan,
  pemohon wajib memasukkan MyKad dan menandakan Akuan Pemohon tentang penjagaan,
  penggunaan, pemulangan serta tanggungjawab akibat kecuaian atau salah guna.
- MyKad penuh disulitkan menggunakan AES-256-GCM dengan kunci terbitan rahsia
  aplikasi. UI pentadbir hanya menerima empat digit terakhir. Rekod audit
  menyimpan versi teks akuan, masa persetujuan, kaedah, hash IP dan user-agent.
- Serahan dan pemulangan menggunakan pengesahan kotak oleh pentadbir, bukannya
  tandatangan skrin. Transaksi stok dan jejak audit masih dilaksanakan secara
  atomik.
- KEW.PA-9 hanya boleh dijana selepas pemulangan. PDF mengandungi butiran aset
  dan tarikh tetapi keempat-empat ruang tandatangan dibiarkan kosong untuk
  Peminjam, Pelulus, Pemulang dan Penerima menandatangani satu salinan bercetak.
- Penjanaan PDF kekal berasingan daripada transaksi pemulangan supaya kelewatan
  Google Apps Script/Drive tidak membatalkan rekod atau pemulihan stok.
- Templat menyediakan 20 baris aset pada satu muka surat A4. Permohonan
  melebihi 20 unit menghasilkan halaman sambungan lengkap dengan kepala borang
  dan tandatangan berulang; nombor `Bil` diteruskan pada halaman berikutnya.
- Migrasi `0012_equipment_kew_pa9` menambah
  `equipment_loan_signatures` dan `equipment_loan_documents`; pengguna
  mengesahkan migrasi ini telah dijalankan pada Supabase produksi. Jadual
  tandatangan dikekalkan untuk keserasian tetapi tidak lagi digunakan oleh
  aliran baharu.
- Migrasi `0013_equipment_applicant_declaration` menambah medan MyKad tersulit
  dan bukti Akuan Pemohon. Migrasi ini belum dijalankan pada produksi.
- Halaman awam `Semak Permohonan Saya` mencari rekod secara tepat menggunakan
  nombor telefon ternormal dan memaparkan status, PKG, tempoh, item serta
  catatan keputusan tanpa mendedahkan MyKad.

## 2026-07-29 — Susun Semula Pengurusan Inventori dan Permohonan

- Halaman PKG `/admin/peralatan/[pkg]` dijadikan ringkasan operasi. Halaman ini
  hanya memaparkan metrik, pintasan pengurusan dan lima permohonan terkini;
  senarai penuh tidak lagi dimuatkan pada halaman ringkasan.
- Pengurusan inventori dipecahkan lagi mengikut tugas. Laluan
  `/admin/peralatan/[pkg]/unit` hanya mengandungi daftar unit, import, jenis
  peralatan dan pegawai. Senarai carian/status berada pada
  `/admin/peralatan/[pkg]/unit/senarai` dan memuatkan 10 rekod setiap muka surat
  supaya senarai ratusan unit tidak memanjangkan halaman pengurusan.
- Senarai permohonan dipindahkan ke
  `/admin/peralatan/[pkg]/permohonan`. Tapisan menggunakan bulan tarikh pinjaman,
  status, nombor rujukan, nama pemohon atau sekolah. Permohonan menunggu
  kelulusan kekal dipaparkan sebagai barisan tindakan tanpa mengira bulan.
- Borang awam pinjaman menggunakan empat langkah sebenar: maklumat pemohon,
  tempoh dan tujuan, pilihan peralatan, kemudian akuan dan semakan. Data borang
  dikekalkan apabila pemohon bergerak antara langkah dan hanya dihantar pada
  langkah akhir.
- Semakan awam kekal menggunakan nombor telefon, bukan nama sahaja, untuk
  mengurangkan pendedahan rekod pemohon lain. Hasil carian kini boleh ditapis
  dan dikumpulkan mengikut bulan permohonan.

## 2026-07-29 — Kategori, Model dan Unit Peralatan

- Inventori peralatan kini mempunyai tiga aras: kategori umum yang dipilih
  pemohon, model/kumpulan aset yang menyimpan kod dan spesifikasi, serta unit
  fizikal bernombor siri. Pemohon memohon `Komputer riba`, bukan jenama tertentu.
- Semasa kelulusan, pentadbir boleh memperuntukkan mana-mana model aktif dalam
  kategori yang sama. Pilihan unit memaparkan model dan nombor siri; KEW.PA-9
  menggunakan model unit yang benar-benar diperuntukkan.
- Katalog awam menggabungkan stok semua model dalam satu kad kategori. Butiran
  boleh dikembangkan untuk melihat setiap model, spesifikasi, kandungan dan
  ketersediaan mengikut PKG.
- Admin dan Pegawai boleh menambah atau mengubah kategori, model, kod aset,
  spesifikasi, kandungan dan status aktif. PKG_Admin hanya mengurus unit fizikal
  PKG sendiri dan tidak boleh mengubah metadata katalog global.
- Lima jenis aset Lampiran C didaftarkan di bawah PKG Sitiawan dengan kuantiti
  20/120/120/120/20. Nombor siri menggunakan pola `<kod aset>-<bilangan>`.
- Dua komputer riba ASUS yang telah ditempah sebelum import dikekalkan ID dan
  hubungan pinjamannya sebagai `001002002-1` dan `001002002-2`; nombor siri
  pengilang disimpan dalam catatan. Jumlah komputer riba kekal 20.
- Pemindahan unit antara PKG hanya dibenarkan untuk unit tersedia dan direkodkan
  dalam `equipment_unit_transfers`. Migrasi `0014` hingga `0016` telah dijalankan
  dan semakan integriti mengesahkan tiada jenis atau item permohonan tanpa
  kategori.

## 2026-07-30 - Peminjaman Peralatan: sempadan paparan awam

- Kuantiti pada borang awam kini boleh ditaip terus, selain butang tambah/tolak.
- Nombor siri di panel pentadbir disusun mengikut nilai angka pada hujung nombor
  siri (contohnya `1` hingga `120`), bukan susunan teks (`1`, `10`, `100`).
- Selepas permohonan dihantar, pemohon boleh menghantar WhatsApp pemberitahuan
  kepada pegawai PKG, kemudian menunggu kelulusan dan menggunakan `Semak
  Permohonan`. Pautan kelulusan pentadbir kekal dalam WhatsApp supaya pegawai
  boleh memproses permohonan dengan cepat, tetapi tidak dipaparkan sebagai
  kandungan halaman awam. Catatan keputusan dalaman dalam semakan awam dibuang.
- Peraturan kekal ditambah ke `AGENTS.md`: kandungan dalaman, perbualan
  pentadbir, pautan backend dan arahan log masuk tidak boleh dipaparkan kepada
  pemohon awam.

## 2026-07-30 - Semakan permohonan mengikut bulan

- Semakan pinjaman peralatan hanya memaparkan catatan pegawai apabila status
  permohonan ialah `Ditolak`; catatan untuk status lain kekal dalaman.
- Semakan pinjaman dan tempahan menggunakan navigasi bulan dengan anak panah.
  Hanya bulan yang mempunyai rekod dipaparkan; bulan semasa diutamakan, atau
  bulan rekod terkini jika tiada rekod dalam bulan semasa.

## 2026-07-30 - Peruntukan unit pinjaman automatik

- Panel kelulusan peralatan menyediakan butang `Isi baki secara automatik`.
  Ia mengekalkan pilihan manual sedia ada dan mengisi slot selebihnya dengan
  nombor siri unit tersedia mengikut susunan sedia ada.

## 2026-08-04 — KEW.PA-9 semasa pinjaman aktif

- Selepas serahan (`handed_over`), pentadbir boleh muat turun / simpan KEW.PA-9
  rasmi. Tarikh pemulangan dikosongkan sehingga status `returned`.
- Selepas pemulangan, jana semula versi `final` supaya tarikh pemulangan diisi.
  Tiada label "draf/pratonton"; kedua-dua versi ialah borang rasmi.
- Aliran stok/serahan/pemulangan tidak berubah; penjanaan PDF kekal berasingan.
- Medan **Nama Pengeluar** pada KEW.PA-9 ialah pegawai yang mengeluarkan aset
  (`pkgs.equipment_manager_name`), bukan model/jenama peralatan.

## 2026-08-04 — Admin tempahan boleh ubah tarikh dan padam rekod

- Panel admin tempahan bilik kini membenarkan pentadbir mengubah tarikh dan slot
  bagi tempahan berstatus `pending` atau `approved` terus dari kad tempahan.
- Semakan konflik semasa ubah tarikh mengabaikan rekod yang sedang diedit tetapi
  tetap menyekat slot yang sudah ditempah atau menunggu kelulusan oleh pihak lain.
- Pentadbir kini boleh memadam tempahan secara kekal dengan pengesahan tambahan;
  rekod kehadiran berkaitan turut dipadam melalui hubungan `cascade`.
- Label tindakan pada kad tempahan dipendekkan kepada `Ubah`, `Batal` dan
  `Padam` supaya lebih padat tanpa menukar UI kepada bahasa Inggeris.
- Verifikasi dilengkapkan dengan `node --import tsx --test
  tests/tempahan/admin-booking-actions.test.ts
  tests/tempahan/multi-day-booking.test.ts`, `npm run typecheck` dan
  `npm run build`.

## 2026-08-05 - Peruntukan unit mengikut catatan

- Senarai status unit pentadbir menggunakan ruang tetap yang mencukupi untuk
  pilihan status dan butang `Kemaskini` pada skrin desktop.
- Pilihan unit dalam panel kelulusan memaparkan `No. siri - Catatan`, tanpa
  memaparkan model atau nombor aset kerajaan.
- `Isi baki secara automatik` mengutamakan nombor `No 1`, `No. 2` dan seterusnya
  yang direkodkan dalam `Catatan`; unit tanpa nombor tersebut diisi mengikut
  susunan nombor siri.
- Hanya catatan bernombor yang bermula dengan `No` atau `Nombor` dipaparkan
  sebagai label seperti `No 3` dalam pilihan unit; catatan lain tidak dipaparkan.
- Pilihan unit mengekalkan jenama dan kod model ringkas sebelum nombor siri
  penuh; nombor aset tidak dipaparkan untuk menjimatkan ruang.

## 2026-08-05 - Paparan peralatan habis dipinjam

- Katalog awam mengekalkan kategori peralatan walaupun tiada unit tersedia.
  Kategori yang semua unitnya sedang dipinjam memaparkan nilai `0` dan status
  `Dipinjam`; status lain yang tidak boleh dipinjam memaparkan `Tidak tersedia`.
  Kedua-duanya tidak menyediakan pautan permohonan supaya pemohon tidak boleh
  meneruskan permohonan yang pasti gagal.
- 3D printer atau model lain boleh disorokkan sementara oleh pentadbir utama
  melalui tetapan status `Tidak aktif` pada kategori atau model. Rekod inventori
  fizikal kekal dan boleh diaktifkan semula kemudian.

## 2026-08-05 - Syarat kelulusan pinjaman boleh dilaras

- Semasa permohonan masih `pending`, pentadbir boleh mengurangkan kuantiti yang
  diluluskan bagi setiap kategori dan menetapkan tarikh pinjam serta tarikh pulang
  yang diluluskan.
- Hanya unit yang benar-benar diluluskan diperuntukkan dan ditempah. Kuantiti serta
  tempoh yang telah diluluskan digunakan pada semakan pemohon dan dokumen KEW.PA-9;
  butiran asal serta perubahan kuantiti direkodkan dalam jejak audit kelulusan.

## 2026-08-06 - Input kuantiti kelulusan mesra telefon

- Medan `Kuantiti diluluskan` kini membenarkan nilai dikosongkan sementara semasa
  menaip. Ini membolehkan pentadbir menukar nilai seperti `10` kepada `4` pada
  telefon tanpa input dipaksa kembali kepada `1`.
- Hanya integer antara 1 dan kuantiti dimohon diterapkan pada peruntukan unit.
  Nilai tidak sah dipulihkan kepada nilai sah terakhir apabila medan ditinggalkan,
  dan kelulusan dinyahaktifkan sehingga input sah.
- Verifikasi: `tsc --noEmit` dan `next build` berjaya; build memaparkan amaran
  ESLint sedia ada yang tidak berkaitan.

## 2026-08-09 - Pembersihan kod diagnostik dan lint

- Dua endpoint diagnostik awam sementara, `/api/diag` dan `/diag-page`, telah
  dibuang selepas isu sambungan PostgreSQL produksi yang direkodkan pada
  2026-07-05 stabil. Kedua-duanya sebelum ini mendedahkan butiran diagnostik
  infrastruktur dan tidak sesuai dikekalkan pada laluan awam.
- Semua 19 amaran ESLint sedia ada dibersihkan: dua import tidak digunakan dan
  17 arahan `eslint-disable` yang tidak berkesan kerana peraturan imej telah
  dinyahaktifkan secara global. Skrip QA KEW.PA-9 yang tidak dirujuk turut
  dibuang daripada direktori sementara.

## 2026-08-10 - Pengesahan sekolah bagi permohonan peralatan

- Permohonan peralatan jenis `sekolah` kini diwajibkan menggunakan kod sekolah
  daripada jadual induk; jenis pemohon dan ada/tiada kod sekolah dipastikan oleh
  kekangan pangkalan data.
- Trigger pangkalan data menyelaraskan `org_name` dengan nama daripada jadual
  `schools` bagi setiap permohonan sekolah, termasuk jika data ditulis terus ke
  pangkalan data.
- Rekod `PP-2026-08AB157A` yang tersalah direkodkan sebagai `Pegawai` dengan
  nilai `STEM` dibetulkan kepada `AEE1030 — SMK TOK PERDANA`, dengan jejak audit.

## 2026-08-10 - KEW.PA-17 bagi pindahan aset antara PKG

- Setiap pemindahan kini direkodkan sebagai satu batch dengan nombor rujukan
  KEW.PA-17, senarai unit dan snapshot pihak yang perlu menandatangani borang.
- Mengikut keputusan pengurusan: `Pemohon` dan `Penerima` diambil daripada
  pegawai peralatan PKG baharu; `Pelulus` dan `Penyerah` daripada pegawai
  peralatan PKG asal. Nama dan jawatan dibekukan pada masa pindahan supaya
  rekod sejarah tidak berubah apabila maklumat PKG dikemas kini.
- Selepas pindahan selesai, sistem memuat turun KEW.PA-17 yang diisi secara
  automatik. Hanya pentadbir utama boleh membuat pindahan atau memuat turun
  dokumen tersebut.

## 2026-08-10 - Snapshot pegawai bagi KEW.PA-9

- Semasa serahan peralatan pinjaman disahkan, nama dan jawatan pegawai
  peralatan PKG direkodkan pada permohonan sebagai pegawai yang mengeluarkan
  aset. KEW.PA-9 sentiasa menggunakan snapshot ini selepas itu, termasuk
  salinan yang dijana semula semasa pemulangan.
- Rekod pinjaman lama tanpa snapshot kekal serasi: sistem menggunakan
  maklumat pegawai PKG semasa sekali ketika pemulangan, lalu menyimpannya
  bersama rekod pemulangan tersebut.

## 2026-08-11 - Pelulus dan penerima KEW.PA-9

- Pelulus KEW.PA-9 ialah nama dan jawatan pegawai peralatan PKG yang aktif
  pada masa kelulusan, bukan akaun pentadbir yang menekan butang lulus.
- Penerima ialah pegawai peralatan PKG yang aktif pada masa pemulangan. Kedua-
  dua peranan disimpan sebagai snapshot bersama rekod pinjaman supaya pertukaran
  pegawai PKG pada masa hadapan tidak mengubah dokumen yang telah selesai.

## 2026-08-10 - Usia guna aset KEW.PA-17

- Setiap unit fizikal boleh menyimpan `Tarikh Perolehan` atau, jika tarikh
  lengkap tidak diketahui, `Tahun Perolehan`. Kedua-duanya pilihan supaya
  inventori lama kekal boleh diurus tanpa membuat andaian.
- KEW.PA-17 hanya mengira tahun: tahun pindahan ditolak tahun perolehan,
  sama ada daripada tarikh penuh atau tahun sahaja. Bulan dan hari tidak
  diambil kira; jika kedua-duanya kosong, medan usia guna dibiarkan kosong.
# 2026-08-25 — Notifikasi peribadi Telegram pentadbir

- Telegram diikat sendiri oleh setiap pengguna pentadbir melalui pautan `/start`
  sekali guna yang sah selama 10 minit; Chat ID tidak perlu dimasukkan secara manual.
- Tempahan bilik dan peminjaman peralatan dihantar kepada `PKG_Admin` aktif mengikut
  `pkgId`; Khidmat Bantu dihantar kepada `Admin` dan `Pegawai` aktif yang telah
  menyambungkan Telegram.
- WhatsApp kepada pegawai dikekalkan sebagai fallback apabila tiada mesej Telegram
  berjaya dihantar. WhatsApp keputusan kepada pemohon tidak diubah.

# 2026-08-26 — Pegawai Telegram boleh diurus mengikut PKG

- Tetapan setiap PKG kini memilih seorang pegawai Telegram untuk kedua-dua Tempahan
  Bilik dan Peralatan. Pemilihan ini mengatasi penerima `PKG_Admin` lama; jika belum
  dipilih, laluan lama kekal sebagai keserasian.
- Tetapan Khidmat Bantu kini boleh memilih seorang pegawai `Admin` atau `Pegawai`.
  Jika belum dipilih, semua penerima lama kekal digunakan.
- Semua laluan terus mengekalkan WhatsApp sebagai fallback apabila Telegram gagal
  dihantar, supaya guru boleh menghubungi pegawai melalui nombor rasmi.

# 2026-08-26 — Tetapan pegawai Telegram dipaparkan di halaman Telegram

- Halaman `/admin/telegram` (menu avatar) kini menyenaraikan pilihan pegawai penerima
  bagi setiap PKG, plus Khidmat Bantu untuk Admin/Pegawai. Tetapan PKG lama di
  `/admin/tempahan/[pkg]/tetapan` kekal.
- Tempahan Bilik dan Peralatan terus berkongsi seorang pegawai bagi setiap PKG.
- Jika lajur `telegram_responsible_user_id` belum wujud, halaman memaparkan arahan
  migrasi dan tidak meruntuhkan kad ikatan peribadi.

# 2026-08-26 — Jana pautan Telegram bagi setiap PKG

- Halaman `/admin/telegram` menjana pautan `/start bind_…` berasingan untuk setiap
  PKG (dan Khidmat Bantu). Pegawai buka pautan di Telegram tanpa log masuk portal.
- Destinasi disimpan dalam jadual `telegram_destinations` (`pkg:<slug>` / `khidmat`)
  dan mengatasi pilihan pengguna serta penerima `PKG_Admin` lama.
- Akaun Telegram pentadbir yang log masuk kekal sebagai ikatan peribadi di bahagian bawah.

## 2026-08-26 - Siaran WhatsApp Direktori

- Halaman admin Direktori menyediakan siaran WhatsApp bantuan: pentadbir boleh
  menapis sekolah mengikut PKG/zonnya dan memilih satu atau beberapa jawatan,
  dengan PGB dipilih secara lalai.
- Penghantaran menggunakan pautan `wa.me` seorang demi seorang, bukan automasi
  WhatsApp Business API. Sistem menyahgandakan nombor, mengecualikan nombor tidak
  sah dan menyatakan dengan jelas bahawa pentadbir masih perlu menyemak serta
  menghantar mesej dalam WhatsApp.
- Rekod yang tidak boleh dihantar kini dipaparkan bersama sekolah, jawatan,
  nama dan sebabnya supaya pentadbir boleh menyemak atau membetulkan Direktori.
