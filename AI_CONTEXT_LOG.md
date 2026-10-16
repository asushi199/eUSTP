# AI Context Log — NEXa Manjung

## 2026-10-16 — MJKD borang awam: tanda sekolah "Sudah dihantar"

- `/laporan-mjkd` memuat `listKodSekolahSudahHantar` (queries.ts) dan menghantar `sudahHantar` ke `MaklumBalasMjkdForm`. Borang baharu sahaja (bukan kemaskini/admin): senarai carian + `<select>` tanda "✓ Sudah dihantar".
- Bila sekolah sedemikian dipilih, bahagian B/C + butang hantar digantikan kad status dengan pautan "Semak / kemaskini" (`/laporan-mjkd/semak?kod=`, perlu nombor tiket). Banner draf dan prefill PGB tidak dijalankan untuk sekolah tersebut.
- Tanda "Tiada perkara" (sekolah tanpa perkara terpakai) dicuba kemudian dibuang atas arahan pengguna — kes itu tidak wujud.
- Disahkan: typecheck, `npm run build`, pelayar dev: 102 sekolah (kod unik; 103 `<option>` termasuk "Pilih sekolah…"), 25 bertanda sudah dihantar, ABA1001 papar kad status.

## 2026-10-16 — DELIMa: keputusan — bilangan sahaja, tiada senarai nama buat masa ini

- JPN tidak lagi membekalkan CSV "belum log masuk"; d3 SPP hanya boleh eksport satu sekolah sekali (PPD sahaja = 0 baris). Eksport pukal PII oleh Claude disekat polisi keselamatan.
- Keputusan pengguna: paparan DELIMa guna **bilangan aktif / jumlah** setiap sekolah (snapshot d3) sahaja. Muat naik "Guru Belum Log Masuk" sedia ada dibiarkan (data lama), tidak dikemas kini.
- Jika senarai nama diperlukan kelak: **Pelan 2** — skrip konsol pelayar yang dijalankan sendiri oleh pegawai (log masuk d3) untuk gelung 102 sekolah, keluarkan hanya kod sekolah + nama bagi akaun `LOG TERAKHIR` kosong (kecuali akaun sementara `g-sk…tmp`); No. KP / ID / e-mel dibuang di pelayar pengguna. Belum dibina; semak dahulu kesesuaian dengan terma penggunaan d3.

## 2026-10-16 — DELIMa: sumber Perak + cron dibuang; d3 sumber tunggal

- Atas arahan pengguna: papan pemuka DELIMa Perak (`delimaperak.vercel.app`) dan CSV Google Sheet "Portal Statistik DELIMa Negeri Perak" tidak lagi dibaca. Dibuang: `app/api/cron/delima-snapshot` + entri `vercel.json` (cron backup kekal; `CRON_SECRET` masih diperlukan), `lib/analisis/delima-csv.ts`, semua fungsi `fetchDelima*`, `saveDelimaSnapshot`/`captureDelimaSnapshot`/`ensureDelimaSnapshot`, butang admin "Simpan snapshot sekarang", tetapan admin pautan/slug daerah, kad "2.0 + 3.0" (guruGabung/kadMurid), `ringkasCsvPpd`.
- `getDelimaTerkini()` (delima-snapshot.ts) = snapshot `sumber_url = https://d3.delima.edu.my` terbaharu → `getAnalisisData`, `loadDelimaSchools`, `loadDelimaSchoolDetail`, admin "Sumber Data". Snapshot Perak Jan–Sep 2026 kekal dalam DB untuk carta trend. Metrik DB lama `delima_live_url`/`delima_daerah` tidak lagi dibaca (tidak dipadam).
- d3 SPP (Sistem Pengurusan Pengguna → Guru, pilih PPD + sekolah → Export CSV) diuji untuk satu sekolah: lajur `ID DELIMa, NAMA, NO PENGENALAN, OU, KOD ORGANISASI, NAMA ORGANISASI, NEGERI, DAERAH, LOG TERAKHIR` (kosong = belum pernah log masuk; akaun sementara `g-sk…tmp` juga kosong). Belum disambung ke "Guru Belum Log Masuk" — fail mengandungi No. KP, jangan komit.
- Disahkan: typecheck, `npm run build`, `tests/analisis/*` (32 lulus), pelayar: modal DELIMa laman utama, `/analisis/delima` senarai + butiran sekolah (tempoh 1 Jan – 16 Okt 2026).

## 2026-10-16 — DELIMa: snapshot d3.delima.edu.my (rasmi KPM) diimport manual setiap bulan

- Sumber baharu: papan pemuka DELIMa 3.0 KPM (`d3.delima.edu.my` → Utama, PPD MANJUNG, tempoh 1 Jan → tarikh ambil). API sumber (`d3-api.delima.edu.my/analytics/active-teacher-student?orgUnitId&startDate&endDate`) perlukan sesi log masuk pengguna, jadi pelayan TIDAK menarik sendiri: pegawai log masuk dalam pelayar, Claude baca 102 sekolah melalui UI (pilih sekolah → Hantar), simpan `scripts/data/delima-d3-YYYY-MM-DD.csv` (ringkasan sekolah sahaja), lalu `npm run db:import-delima-d3 -- <fail> [--dry-run]`.
- Import: semak jumlah sekolah = jumlah daerah, padan nama → kod ikut senarai sekolah snapshot terdahulu (nama berulang SK Methodist (ACS) / SJKC Pei Min dipadan ikut jumlah guru+murid), tulis snapshot `period` YYYY-MM dengan `sumber_url = https://d3.delima.edu.my` (tiada migrasi).
- `saveDelimaSnapshot` / `ensureDelimaSnapshot` tidak menimpa baris d3. `pilihDelimaD3` (delima-snapshot.ts): paparan awam (`getAnalisisData`, `loadDelimaSchools`, `loadDelimaSchoolDetail`) guna d3 selagi tempohnya ≥ tempoh langsung Perak; jika tertinggal, kembali ke Perak. Nota paparan: "Data DELIMa 3.0 KPM, d3.delima.edu.my (…)". Admin: label sumber pada Sejarah Snapshot.
- Snapshot pertama 2026-10 (1 Jan – 16 Okt 2026): guru 3,699/3,757 (98.46%), murid 21,724/41,501 (52.35%), 41/102 sekolah capai KPI murid. Angka jumlah sekolah sama tepat dengan senarai Perak.
- Disahkan: typecheck, `npm run build`, `tests/analisis/delima-d3.test.ts` (6 lulus), pelayar: modal DELIMa laman utama + `/analisis/delima` papar angka d3.

## 2026-10-15 — MJKD pembentangan: kotak status boleh diklik, kembali ke Papan Pemuka, "Semua soalan" ikut perkara

- **Kotak status Papan Pemuka** (Selesai / Dalam Pelaksanaan / Belum Dilaksanakan / Tidak Berkaitan) kini butang (bilangan jawapan dipapar di sebelah %; dilumpuhkan jika 0) → lapisan baharu `SpotlightStatus.tsx`: kiri = perkara yang ada jawapan berstatus itu (bilangan sekolah), kanan = teks perkara + mozek sekolah berstatus itu sahaja + "Buka slaid perkara →". ← → = perkara sebelum/seterusnya. Klik sekolah = Spotlight sedia ada dengan `jubin` ditapis ikut status (← → antara sekolah berstatus sama; bar bawah "x / n sekolah · <status>"). Esc = kembali selapis demi selapis; kekal di slaid Papan Pemuka.
- **Kembali ke Papan Pemuka:** butang "← Papan Pemuka" pada setiap slaid perkara + kekunci **P** (dari mana-mana slaid/lapisan). `KUNCI_PAPAN_PEMUKA` dalam `lib/mjkd/pembentangan.ts`.
- **Semua soalan → klik baris:** Spotlight kini mod "satu sekolah" (`urutanPerkara` + `onPilihPerkara`): ← → bertukar PERKARA yang dijawab sekolah itu (bukan sekolah lain); label "Semua soalan · Para X" + ringkasan teks perkara. Tukar sekolah tetap dari lapisan "Semua soalan" (← →) selepas Spotlight ditutup.
- Disahkan: typecheck, eslint, `npm run build`, `tests/mjkd/pembentangan.test.ts` (19 lulus), `/dev/pentas` 1600×900: kotak status → perkara → sekolah → Esc; Semua soalan → baris 1.4 → → = 1.6 sekolah sama; butang/P kembali ke `#papan-pemuka`.

## 2026-10-15 — MJKD pembentangan: "Semua soalan" (semua maklum balas satu sekolah)

- Permintaan pengurusan: dari Papan Pemuka, Tuan PPD boleh terus melihat SEMUA jawapan satu sekolah. Baris akhir lajur kanan Papan Pemuka **"Semua soalan"** (garis putus-putus emas; bar status keseluruhan + x/y sekolah) → slaid baharu `semua-soalan` (hujung bab Maklum Balas, selepas perkara terakhir — aliran ← → perkara tidak berubah).
- Slaid: kiri donut semua jawapan + kiraan menghantar; kanan mozek SEMUA sekolah dijangka (`binaMozekSekolah`, teal `s-HANTAR` = telah menghantar, putus-putus = belum). Klik sekolah → lapisan `SpotlightSekolah`: senarai semua perkara terpakai (`jawapanSemuaPerkara`) — status, catatan 2 baris, bukti; klik baris = Spotlight perkara sedia ada di atasnya (Esc kembali ke senarai sekolah; ← → dalam Spotlight perkara turut menukar sekolah lapisan bawah). ← → dalam lapisan sekolah = sekolah menghantar seterusnya.
- Disahkan: typecheck, `tests/mjkd/pembentangan.test.ts` (19 lulus, 2 ujian baharu), `/dev/pentas` 1920×1080: baris di Papan Pemuka, slaid, lapisan sekolah, klik baris → Spotlight, Esc, →; tiada ralat konsol.

## 2026-10-15 — MJKD admin: "Mengikut perkara" bertukar tanpa muat semula

- Aduan pengguna: klik nombor para (atau tapisan Status / Jenis) melompat ke atas halaman — setiap klik ialah navigasi pelayan, `loading.tsx` menggantikan halaman dengan rangka. Paparan dipindah ke komponen klien `components/mjkd/AdminPaparanPerkara.tsx`: perkara/status/jenis dalam state (data semua perkara sudah dimuat), URL dikemas kini dengan `history.replaceState` (muat semula + `router.refresh()` ★ Sorotan kekal pada perkara sama). Hanya `perkara/sekolah/maklumBalas/items` dihantar ke klien (bukan Map `itemMengikutKunci`). Panel: `PaparanPerkara` + `StatusBadge` dibuang; `key` = nilai URL pelayan.
- Paparan Matriks masih guna `Penapis` (pautan pelayan) — belum diubah.
- Disahkan: typecheck, eslint, build; pelayar (admin log masuk): 1.3 → 1.4 dan tapisan Selesai bertukar serta-merta tanpa rangka/muat semula, URL dikemas kini, muat semula kekal pada 1.4 + Selesai. ★ Sorotan (`router.refresh`) tidak diuji — akan menulis data produksi.

## 2026-10-15 — MJKD awam: bar kemajuan telefon tanpa tatal mendatar

- Maklum balas pengguna: cip nombor para di bar melekat perlu diseret di telefon. Kini (< sm): bar ringkas ~62px — "N / Y lengkap" + jalur titik segmen (dakwat = lengkap) + butang **Senarai ▾**; dibuka = semua cip dibalut (tiada tatal). Tekan cip → senarai ditutup, kemudian tatal (`lompatKe`, dua rAF — bar melekat mengecil mengubah susun atur). `scroll-mt-36` telefon / `sm:scroll-mt-48`. sm+ tidak berubah (cip sentiasa dipaparkan).
- Disahkan: typecheck, eslint, pelayar 375×812 (tertutup 62px, dibuka 210px, lompat ke 17.1–17.3 mendarat 18px di bawah bar) dan 1024px.

## 2026-10-15 — MJKD: ujian hujung-ke-hujung kemaskini (DB produksi, dipadam)

- Atas arahan pengguna: hantar ujian AHA1002 (KV Seri Manjung, nama "UJIAN SISTEM (Claude)", tiada gambar) → Semak (kod + tiket) → Kemaskini (catatan 1.3 diubah, 1.4 Tidak Berkaitan → Dalam Pelaksanaan) melalui dev tempatan. DB disahkan: rekod sama dikemas kini, tiket tidak berubah, 10 item betul. Hantar semula tanpa tiket ditolak dengan butang "Semak / kemaskini maklum balas sekolah ini".
- Rekod ujian dipadam (item ikut cascade); jumlah maklum balas MJKD 2026 kembali 0. Skrip sementara tidak dikomit.

## 2026-10-15 — MJKD awam: borang maklum balas lebih jelas (PGB berumur)

- Masalah: nombor para (`text-xs` kelabu) paling kecil dalam kad, sempadan kad lemah, kotak bersarang, bahagian "1./2./3." bertembung dengan para 1.1/1.2. `components/mjkd/MaklumBalasMjkdForm.tsx`:
  - Kepala kad `bg-cloud` + lencana para besar dakwat (text-2xl; text-lg jika para panjang cth. "17.1–17.3, 17.6") + "Perkara X daripada Y" + "✓ Lengkap" (syarat sama dengan `sahkanMaklumBalas`: status dipilih dan catatan ≥ 30 aksara kecuali Tidak Berkaitan). Sempadan kad `border-2 border-steel/70`, jarak `space-y-6`.
  - Bar melekat `top-16` "N / Y perkara lengkap" + cip nombor para (✓ = dakwat) yang melompat ke kad (`#perkara-<id>`, `scroll-mt-48`).
  - Bahagian dinamakan A/B/C; panduan jadi garis kiri (bukan kotak); Bukti tanpa kotak (garis atas). Teks perkara 17px, butang status `min-h-12` 15px.
  - Kawasan hantar: ringkasan kemajuan + butang `h-14`. Ralat "sudah menghantar" kini ada butang ke `/laporan-mjkd/semak?kod=…`.
- Butang kemaskini lebih jelas: `/laporan-mjkd` ganti pautan kecil "Semak status / kemaskini" dengan kad "Sudah menghantar maklum balas?" + butang `btn-outline` h-14 (satu-satunya unsur biru di skrin atas); mod kemaskini (`existing`) papar kad "Mod kemaskini". `/laporan-mjkd/semak`: butang Kemaskini `h-14`, lebar penuh di telefon.
- Disahkan: typecheck, `npm run build`, pelayar (lebar ~435px dan 800px): cip lompat, ✓ Lengkap, kiraan, kad atas. Butang Kemaskini di `/semak` tidak dismoke (perlu nombor tiket sebenar).

## 2026-10-14 — MJKD admin: tab Maklum Balas lalai "Mengikut perkara"

- `/admin/mjkd/[id]?tab=maklum-balas` tanpa `view` kini membuka **Mengikut perkara** (perkara pertama) — paparan yang paling kerap diguna untuk menanda ★ Sorotan. Kemajuan/Matriks kekal melalui butang paparan.
- Data ujian dibuang dari DB produksi (arahan pengguna): maklum balas SK MUHAMMAD SAMAN (ABA1018, 8 item, catatan rawak) + 3 gambar bukti Drive. Kini 0 maklum balas untuk MJKD 2026. Skrip sementara, tidak dikomit.

## 2026-10-14 — MJKD: Mod Pembentangan v2 (MJKD/PLAN-pembentangan-v2.md langkah 1–5)

- **Dek berterusan** (`components/mjkd/pembentangan/`, ganti `PembentanganMjkd.tsx` yang dipadam): Pembukaan → Kehadiran (QR besar 780px + 2 nombor tanpa penyebut, pegawai ikut sektor) → Minit (PDF) → Papan Pemuka Daerah → satu slaid setiap perkara aktif (mozek SEMUA sekolah terpakai, ikut nama, tiada zon) → Atur Cara + bahan → Penutup. ← → / PgUp PgDn / Space merentas bab; G semua slaid, T tema (lalai **terang**, localStorage), F skrin penuh, B skrin hitam, R segar, S sorotan seterusnya, Esc tutup lapisan / dua kali = keluar. Kedudukan dalam `#kunci` URL.
- **Kanvas tetap 1920×1080** diskala (jalur hitam pada 4:3). iframe (minit, bahan, pratonton bukti) dalam `LapisanPenuh` TIDAK diskala (portal `position:fixed` atas kotak pemegang tempat) supaya tajam; zon ‹ › di tepi iframe bahan mengembalikan kawalan papan kekunci (iframe merampas fokus).
- **Spotlight** (klik jubin): Catatan dipaparkan sebagai SATU perenggan seperti diisi PGB (`TeksMuat` mengecil 40→24px, `overflow-wrap:anywhere`) — grid 5W1H dibuang atas arahan pengguna (borang hanya satu kotak catatan; 5W1H sekadar nota + contoh pemegang tempat); gambar `object-contain` + lightbox (← →); kad pautan Buka ↗ + QR (`import("qrcode")`) + Pratonton jika boleh dibenam; ← → antara sekolah menghantar; ★ Sorotan optimistik (`adminPilihBacaMjkd`, kini tanda sahaja — `susunan_bacaan` dikosongkan; `adminUbahSusunanBacaMjkd` dibuang). Slaid "jawapan" paksa dibuang. Admin: butang "★ Sorotan".
- **Data langsung**: `getVersiPembentanganMjkd` (satu query tandatangan) setiap 15 s (Pembukaan/Kehadiran) atau 30 s; muat penuh `getDataPembentanganMjkd` hanya bila maklum balas/perkara/bahan berubah, `getKehadiranPembentanganMjkd` bila hanya kehadiran berubah (elak ~450 KB setiap tinjauan). Semua dalam `withDbTimeout`, berurutan (`lib/mjkd/pentas-data.ts`). Muatan terakhir di localStorage `mjkd-pentas-<id>`: halaman tanpa DB → "Data luar talian HH:MM"; semakan gagal → "Data terakhir HH:MM". Sekolah baru menghantar = denyut BARU 60 s + toast.
- `canva.link` dalam bukti maklum balas kini dihuraikan semasa hantar (awam + admin) — `huraiPautanPendek` dipindah ke `lib/mjkd/pautan-server.ts` (di luar had masa DB). `getKiraanKehadiranMjkd` dibuang (tidak digunakan).
- Susunan mozek (arahan pengguna, mengatasi pelan "ikut nama"): **SR dahulu, kemudian SM, dalam setiap peringkat ikut kod sekolah** (jenis tidak dikenali di hujung); urutan ← → Spotlight ikut susunan yang sama.
- Logik tulen `lib/mjkd/pembentangan.ts` (`binaDek`, `binaMozek`, `ukuranMozek` — 100 sekolah = 7 lajur fon ≈15px, `namaPendek`, `kiraPapanPemuka`, `bezaData`, `cariIndeks`…) diuji (19 ujian). Jumlah sekolah sentiasa daripada data.
- **Pratonton dev `/dev/pentas`** (404 dalam produksi): data contoh 102 sekolah, `__mjkdSim.hantar()/hadir(n)`, `?auto=1`, `?luar=1` (cache tanpa rangkaian). Diguna untuk semakan tanpa menulis ke DB produksi.
- Disahkan: typecheck, eslint, ujian mjkd + admin (106), `npm run build`; pelayar 1024×768 (4:3, jalur hitam) semua slaid, mozek 102 sekolah 1028×820 tanpa tatal, catatan 300 aksara tanpa ruang, lightbox, Sorotan, polling (hantar baharu muncul < 30 s, slaid tidak melompat), kehadiran < 15 s, rangkaian gagal/luar talian; halaman admin sebenar dimuat dengan data DB (baca sahaja). **Belum**: reka bentuk Canva/Slides awam sebenar, imbasan QR dari belakang dewan, `prefers-reduced-motion` (peraturan CSS + KiraNaik ada, tidak dapat diemulasi) — semak semasa raptai 10-20.

## 2026-10-14 — MJKD kehadiran: tab Lain-lain dibuang

- Kebimbangan pengguna: wakil sekolah tersalah isi tab "Lain-lain". Borang awam `/laporan-mjkd/hadir` kini hanya Sekolah + Pegawai PPD; tab Pegawai ada "Tiada dalam senarai" (isi Nama + Jawatan/Sektor sendiri, nota "pegawai PPD Manjung sahaja") → rekod `PEGAWAI`, organisasi PPD Manjung, `pegawai_ppd_id` null. `sahkanKehadiranMjkd` awam tidak lagi menerima `LAIN` (zod); admin masih boleh tambah LAIN secara manual. Mod pembentangan papar kad "Lain-lain" hanya jika > 0.
- Disahkan: typecheck, eslint, ujian (86), build. Borang tidak dismoke dalam pelayar (kehadiran sedang ditutup di produksi).

## 2026-10-14 — MJKD: kiraan hari hingga tarikh tutup (awam)

- `/laporan-mjkd`: kad "Lagi N hari sebelum maklum balas ditutup" (nama hari + tarikh, 11:59 malam); ≤ 2 hari = merah bloom-deep ("Tinggal N hari lagi!"), hari terakhir = "Hari terakhir!". Pembantu tulen `bakiHariTutup` (`lib/mjkd/enums.ts`, waktu KL) diuji.

## 2026-10-14 — MJKD: halaman awam kembali ke reka bentuk standard

- Arahan pengguna: `/laporan-mjkd` tidak perlu "gah" — kembali ke peraturan reka bentuk (PageHeader + kad putih, `PublicPageShell`). Hero gelap, logo, kiraan hari dan PDF terbenam dibuang (iframe PDF juga memerangkap tatal sebelum borang); minit = butang Lihat Minit / Muat Turun. Pengecualian reka bentuk kini HANYA mod pembentangan (CLAUDE.md dikemas kini). `fasaAcara` dibuang (tidak digunakan).

## 2026-10-14 — MJKD: awam minit + maklum balas sahaja; mod pembentangan "pentas"; tab admin tidak lagi tergantung

- Gabungan Bil.1→Bil.2 (`scripts/gabung-mjkd-2026.ts`) telah dijalankan oleh pengguna; `/admin/mjkd` kini terus ke rekod tunggal.
- Awam `/laporan-mjkd`: bahagian Kehadiran dan Bahan dibuang (dipaparkan dalam mod pembentangan sahaja). Hero kekal; kiraan hari kini hingga **tarikh tutup maklum balas** (hari terakhir = "HARI TERAKHIR"). `BahanPratonton` dibuang (tidak digunakan).
- Mod pembentangan direka semula (arahan pimpinan "lebih gah"): latar pentas #071c24 + corak songket + aksen emas, logo KPM/PPD pada pengepala, tab pil, bar kemajuan, slaid pembuka kehadiran (tajuk acara + QR berbingkai emas + kiraan langsung), Para berlencana emas, jadual analisis gelap dengan bar status bertindan, cip/lencana status hijau/ambar/merah/kelabu, jawapan dengan gambar bukti di lajur kanan. Logik/kekunci tidak berubah; prop baharu `acara` (tarikh/tempat).
- **Pepijat tab admin "tiada respons"** (terutama Maklum Balas): `/admin/mjkd/[id]` tiada had masa DB dan `muatDataMaklumBalasAdmin` guna `Promise.all` (3 query serentak, kolam 3) — soket pooler mati menggantung navigasi sehingga 300 s tanpa sebarang paparan. Dibaiki: semua query tab BERURUTAN dalam `withDbTimeout` 10 s (gagal → `DbPerlahan` + muat semula), pembentangan 12 s, `loading.tsx` rangka untuk `/admin/mjkd/[id]`. Tempatan: tukar tab 0.2–0.6 s.
- Disahkan: typecheck, eslint, ujian mjkd + admin (86), `npm run build`, smoke pelayar (admin semua tab, pembentangan 1920×1080 semua bahagian, awam).

## 2026-10-14 — MJKD 2026: satu acara, 5W1H, gambar bukti, pratonton Canva, halaman acara

- Arahan pimpinan: tiada lagi pemisahan Bil.1/Bil.2 (pengumpulan maklum balas Bil.2 bukan lagi tugas unit ini). **Satu rekod** = MJKD 2026 (21–22 Okt, Cameron Highland): minit + 13 perkara Bil.1 dipindah ke rekod Bil.2; label minit dalam `lib/mjkd/acara.ts` (`MINIT_RUJUKAN`). Skrip `scripts/gabung-mjkd-2026.ts [--dry-run]` (pindah perkara/minit, buka maklum balas tutup 19 Okt, padam SEMUA data ujian maklum balas/kehadiran/bahan + fail Drive, padam Bil.1). Dry-run disahkan (1 maklum balas, 1 bahan ujian, 13 perkara); **larian sebenar dijalankan oleh pengguna**. `scripts/setup-mjkd-2026-bil2.ts` kini usang.
- Migrasi `0054_mjkd_foto_bukti` (DIJALANKAN): `mjkd_maklum_balas_item.foto_bukti text[]` (RLS jadual sedia ada).
- Paparan: kad CoE Reports + semua tajuk = **MJKD 2026**. `/admin/mjkd` terus ke rekod tunggal (redirect jika satu); pilihan "Mesyuarat sebelum" disorok bila tiada. Mod pembentangan guna rekod sendiri + `MINIT_RUJUKAN` (data lama `mesyuarat_sebelum_id` masih disokong); jawapan dipapar dengan gambar bukti.
- Maklum balas: catatan wajib 5W1H (nota + contoh pemegang tempat `CONTOH_5W1H`), minimum **30** aksara (pembilang). Bukti = pautan dan/atau ≤ 3 gambar (dimampat di pelayar → `muatNaikFotoBuktiMjkd` → Drive `MJKD/<tahun>/Bukti/<kod>`; semak bait JPG/PNG/WEBP, ≤ 2.5 MB; awam hanya bila dibuka, admin bila-bila). Token `drive/<id>~<hmac>` (`lib/mjkd/foto-token.ts`, AUTH_SECRET) — path tanpa tandatangan hanya diterima jika sudah dalam rekod sekolah itu, supaya borang awam tidak boleh merujuk/memadam fail Drive lain. Gambar dibuang selepas kemas kini dipadam dari Drive (best-effort, di luar had masa DB). CSV + panel admin papar gambar. Diuji hujung-ke-hujung: muat naik GAS → thumbnail 200 image/jpeg → padam (folder kosong `MJKD/2026/Bukti/_UJIAN` tertinggal di Drive).
- Bahan: `terbitkanUrlEmbed` menyokong Canva (`/design/{id}[/{token}]/(view|edit)` → `/view?embed`); pautan pendek canva.link dihuraikan di pelayan semasa simpan. Arahan perkongsian Canva pada borang muat naik. `BahanPratonton` (≥1280px: senarai + panel pratonton melekit; telefon: pratonton di bawah item) + "Skrin penuh" (tab baharu). `BahanAwam` dibuang. **Belum disahkan dengan reka bentuk Canva awam sebenar.**
- Halaman `/laporan-mjkd` direka semula sebagai halaman acara (pengecualian reka bentuk dicatat dalam CLAUDE.md): hero gelap + logo KPM/PPD (`public/mjkd/logo-kpm-ppd-manjung.png`), kiraan hari, navigasi 01–04 (Kehadiran, Minit dengan PDF terbenam, Maklum Balas, Bahan), lebar max-w-7xl. `maxDuration = 60` pada halaman awam + admin sekolah (muat naik GAS).
- Disahkan: typecheck, eslint, ujian mjkd + admin (86), `npm run build`, smoke pelayar 1440/1024/375 (data pra-gabung).

## 2026-10-15 — MJKD: `withDbTimeout` pada laluan awam (instance "beracun")

- Gejala produksi: 300 s "Vercel Runtime Timeout Error" berselang pada banyak laluan (termasuk /admin/mjkd dan /tempahan) — isu soket pooler mati yang sama seperti 2026-07-05/07-29/09-21. QR kehadiran tidak boleh berputar berminit-minit.
- Dibungkus `withDbTimeout` (8 s; halaman utama MJKD 10 s kerana lebih banyak query), pertanyaan BERURUTAN (bukan `Promise.all`; kolam serverless ~3 sambungan — selaras 2026-09-21): halaman awam `/laporan-mjkd`, `/hadir`, `/bahan/muat-naik`, `/semak`, `/berjaya`. Gagal = kad notis BM "Sambungan ke pangkalan data perlahan" + butang muat semula ke URL sama (`components/mjkd/DbPerlahan.tsx`, `pautanMuatSemula`). Tiada data kosong dipaparkan seolah-olah sebenar. `/berjaya`: nombor tiket (dari URL) sentiasa dipaparkan; hanya nama sekolah diabaikan jika perlahan.
- Tindakan awam: `submitMaklumBalasMjkd` (bacaan dan tulisan dipisah; timeout BACAAN = "cuba semula"; timeout TULISAN = "status penghantaran tidak pasti… hubungi urusetia untuk nombor tiket" kerana komit mungkin masih berlaku), `getPrefillPgbMjkd` & `cariPegawaiMjkd` (pulang kosong), `getKehadiranSekolahMjkd` (ralat BM; `Promise.all` -> berurutan), `sahkanKehadiranMjkd` (mesej piawai — selamat diulang: indeks unik per hari), `muatNaikBahanAwam` (hanya panggilan DB; muat naik GAS/Drive TIDAK dihadkan 8 s; timeout INSERT = status tidak pasti, fail Drive tidak dipadam), `getKiraanKehadiranMjkd` (polling pembentangan; klien kekalkan kiraan terakhir). `listSektorCadangan` kini berurutan. CRUD admin tidak diubah (keputusan 2026-07-29).
- Klien: `MaklumBalasMjkdForm`, `KehadiranMjkdForm`, `MuatNaikBahanForm` kini menangkap ralat yang dilontar (rangkaian/500) dan papar mesej BM yang sesuai.
- Pembantu tulen `lib/mjkd/ralat-db.ts` (mesej, `isRalatTimeoutDb`, `pautanMuatSemula`) diuji `tests/mjkd/ralat-db.test.ts`. Disahkan: typecheck, eslint, ujian mjkd + admin (96), `npm run build`.

## 2026-10-14 — MJKD: data dijalankan, smoke test, pembetulan penyelia

- DB (dijalankan oleh pengguna): `db:migrate` (0053), `db:seed-mjkd` (Bil.1/2026, 13 perkara; sekolah khusus AEE1032, AEA1111, ABA1015, ABA1008), `db:import-pegawai-ppd -- MJKD/pegawai-ppd.csv` (80 pegawai; tiada IC), `scripts/setup-mjkd-2026-bil2.ts` (Bil.2/2026: 21–22 Okt, Hotel Rosa Passadena Cameron Highland, sebelum = Bil.1; maklum balas Bil.1 dibuka, tutup 19 Okt). RLS disahkan pada 7 jadual.
- Skrip baharu: `scripts/upload-minit-mjkd.ts` (muat naik PDF minit ke Supabase + simpan URL; `--dry-run`), `scripts/setup-mjkd-2026-bil2.ts`.
- Minit Bil.1 BELUM dimuat naik: `SUPABASE_SERVICE_ROLE_KEY` dalam `.env.local` tempatan ialah kunci baharu `sb_secret_…` (pembantu storan hanya terima JWT `eyJ…`). Keputusan: muat naik melalui admin (tab Tetapan) selepas deploy (env Vercel).
- Pembetulan penyelia: (1) `cariPegawaiMjkd` hanya bila kehadiran mana-mana mesyuarat dibuka; (2) kiraan ringkasan/analisis hanya sekolah yang perkara terpakai (x ≤ y); (3) "Mesyuarat sebelum" mesti lebih awal (`lebihAwal` dalam `lib/mjkd/hari.ts`) — ditapis pada pilihan Tetapan/cipta dan disemak di pelayan.
- Smoke (dev, DB sebenar, tiada data ujian ditulis): borang awam (sasaran per jenis sekolah: SK 8, SK Seri Selamat 9, SJKC 9, SMK Raja Shahriman 11, KV 10 + jawatan "Pengarah"), pengesahan kosong ditolak, mudah alih 375px tanpa tatal mendatar, kehadiran/bahan "belum dibuka", admin semua tab, pembentangan Bil.2 (minit + analisis Bil.1, kehadiran Bil.2), senarai pegawai. Ujian 93 lulus, `npm run build` lulus.

## 2026-10-14 — MJKD Fasa 4: arahan pimpinan (mesyuarat 21–22 Okt)

- **Migrasi 0053_mjkd dipinda di tempat** (belum pernah dijalankan): `mjkd_mesyuarat` + `tarikh_tamat`, `mesyuarat_sebelum_id` (FK sendiri, set null), `bahan_dibuka`, `kod_muat_naik_bahan`; `mjkd_kehadiran` + `tarikh` (unik: mesyuarat, tarikh, nama_kunci, organisasi); jadual baharu `mjkd_bahan`. RLS ada pada kesemua 7 jadual MJKD; `db:generate` = tiada perubahan. Seed Bil.1/2026 tidak perlu diubah (medan baharu lalai null/false).
- Pembantu tulen: `lib/mjkd/hari.ts` (`hariMesyuarat`, label hari, pilihan tarikh pembentangan, `mesyuaratSebelumLalai`), `bahan.ts` (sahkan pautan https, `terbitkanUrlEmbed` Google Slides/Docs/Sheets/Drive, URL pratonton/muat turun Drive, `kumpulBahan`), `bahan-kod.ts` (kod XXXX-XXXX, `semakKodMuatNaik` timingSafeEqual), kehadiran per hari (`tapisRekodHari`, `tafsirHariDipilih`), `pembentangan.ts` (`binaAnalisis`, grid cip, slaid bahan/kehadiran). Ujian: `tests/mjkd/hari-bahan.test.ts`, `pembentangan.test.ts` dan lain-lain (92 lulus).
- Kehadiran per hari: rekod menyimpan tarikh KL semasa sahkan; pendua per hari; skrin kejayaan papar tarikh; chip wakil PK Pentadbiran/HEM/Kokurikulum (dari direktori, nama sahaja); admin ada pemilih hari (Hari 1/2/Semua), kiraan dan "belum hadir" mengikut hari, lajur tarikh dalam CSV, tambah manual dengan hari.
- Bahan MJKD: tindakan `lib/actions/mjkd-bahan.ts`. PDF ≤ 3 MB (semak `%PDF-`) dimuat naik melalui `uploadFileViaGas` ke Drive `MJKD/<tahun>-Bil<bil>/Bahan`; GAS memulangkan `drive/<fileId>` — URL pratonton `/file/d/<id>/preview`, muat turun `uc?export=download`; `gas/Code.gs` tidak diubah (perkongsian "sesiapa dengan pautan" best-effort — jika dasar domain menyekat, fail hanya boleh dibuka dalam domain). Padam bahan = padam baris + padam Drive best-effort. Halaman awam `/laporan-mjkd/bahan/muat-naik` (hanya bila `bahan_dibuka` dan kod betul, disemak di pelayan); bahagian "Bahan MJKD" pada `/laporan-mjkd`; tab Bahan admin (suis, kod + pautan boleh disalin, tambah/sunting/padam).
- Pembentangan 4 tab: Kehadiran (QR + URL pendek + kiraan hari ini, segar 30 s hanya bila tab kelihatan) · Minit (mesyuarat sebelum; PDF dibenam + Muat Turun) · Maklum Balas (jadual Analisis, grid cip sekolah boleh diklik + lapisan jawapan, kemudian jawapan dipilih ikut susunan) · Bahan (indeks hari -> sektor, paparan benam/tab baharu). Jadual Analisis juga di atas tab Maklum Balas admin. Mesyuarat sebelum boleh ditetapkan semasa cipta/Tetapan (lalai: terkini sebelum).
- Disahkan: typecheck, eslint, ujian mjkd + admin, `npm run build`. Belum dismoke dalam pelayar (jadual belum wujud di DB).

## 2026-10-14 — MJKD Fasa 3: mod pembentangan

- `/admin/mjkd/[id]/pembentangan` (`requireKandunganAccess`): lapisan skrin penuh untuk projektor (teks badan ≥ 28px pada 1920px, kontras tinggi, 1280–1920 lebar), butang "Skrin penuh" (Fullscreen API, try/catch) dan "Keluar". Kekunci: ← → (juga PageUp/PageDown/Space) antara slaid, 1/2/3 tukar tab, Esc keluar; penunjuk "Slaid x / y". Pautan menonjol "Mod Pembentangan" pada `/admin/mjkd/[id]`.
- Logik tulen `lib/mjkd/pembentangan.ts` (`binaSlaidPembentangan`, diuji `tests/mjkd/pembentangan.test.ts`): Minit = slaid tajuk (nama mesyuarat, Bil./Tahun, tarikh, tempat, "Buka Minit (PDF)" jika ada) + satu slaid setiap perkara aktif; Maklum Balas = hanya perkara yang ada jawapan dipilih — slaid ringkasan (kiraan status, "x daripada y sekolah telah menghantar", y = sekolah yang perkara terpakai) + satu slaid setiap jawapan dipilih ikut `susunan_bacaan` (seri ikut kod sekolah); pautan bukti dipaparkan sebagai teks; tiada pilihan = slaid kosong yang mesra; Bahan = "Bahan akan ditambah kemudian." (tiada jadual/muat naik).
- Tiada perubahan skema/migrasi. Disahkan: typecheck, eslint, ujian mjkd + admin, `npm run build`. Belum dismoke dalam pelayar (jadual belum wujud di DB).

## 2026-10-14 — MJKD Fasa 2: kehadiran (QR) + senarai pegawai PPD

- Tiada jadual/migrasi baharu (semua dalam `0053_mjkd.sql`, masih BELUM dijalankan). Tindakan baharu dalam `lib/actions/mjkd-kehadiran.ts`.
- Awam `/laporan-mjkd/hadir`: mesyuarat terkini dengan `kehadiran_dibuka = true` (jika tiada: "Kehadiran belum dibuka"). Tiga tab, setiap satu berakhir "Sahkan Kehadiran": Sekolah (cari sekolah -> kad PGB -> satu ketik; pautan "Saya wakil sekolah" dengan isi pantas nama PK Pentadbiran), Pegawai PPD, Lain-lain. Rekod = Nama, Jawatan, Organisasi sahaja; hanya nama + jawatan didedahkan (tiada telefon).
- Pelayan: `sahkanKehadiranMjkd` menolak jika kehadiran tidak dibuka; nama/jawatan PGB dan pegawai diambil di pelayan; indeks unik (mesyuarat, nama_kunci, organisasi) dilanggar = mesej mesra dengan masa rekod sedia ada (bukan ralat). Carian pegawai `cariPegawaiMjkd` di pelayan (min 2 aksara, maks 10, aktif sahaja) — senarai penuh tidak dihantar ke pelayar. localStorage (try/catch) ingat kehadiran terakhir.
- `jawatanPgb(jenis, nama)`: "Pengarah" bagi nama bermula KOLEJ VOKASIONAL (ujian ditambah); lain-lain tidak berubah.
- Admin `/admin/mjkd/[id]?tab=kehadiran`: suis buka/tutup, QR (URL mutlak `APP_BASE_URL` + `/laporan-mjkd/hadir`, sandaran origin permintaan) dengan Muat Turun PNG, paparan penuh `/admin/mjkd/[id]/qr` (besar, hitam-putih, teks URL), kiraan, senarai hadir (padam + tambah manual), sekolah belum hadir ikut zon (sekolah sahaja; hadir = ada rekod PGB/WAKIL bagi kod), eksport CSV (`/kehadiran-export`).
- Admin `/admin/mjkd/pegawai`: senarai/cari/tambah/sunting/aktif-tak aktif (tiada padam; tidak aktif tidak muncul dalam carian awam; tiada IC/nama pengguna).
- Ujian baharu `tests/mjkd/kehadiran.test.ts`. Disahkan: typecheck, eslint, ujian mjkd + admin (62 lulus), `npm run build`. Belum dismoke dalam pelayar (jadual belum wujud di DB).

## 2026-10-14 — MJKD Fasa 1: skema, logik, seed, maklum balas awam, semakan admin

- Cawangan `feat/mjkd-maklum-balas`. Pelan: `MJKD/PLAN-eUSTP.md` (folder `MJKD/` git-ignored). Corak rujukan: Laporan Akhbar.
- **Migrasi `drizzle/0053_mjkd.sql` BELUM dijalankan** (penyelia jalankan `npm run db:migrate`). Jadual: `mjkd_mesyuarat`, `mjkd_perkara`, `mjkd_maklum_balas`, `mjkd_maklum_balas_item`, `pegawai_ppd`, `mjkd_kehadiran` (skema penuh untuk Fasa 2 sekali gus) — semua `ENABLE ROW LEVEL SECURITY` tanpa polisi. Fail jurnal/snapshot konsisten (`db:generate` = tiada perubahan).
- Logik tulen `lib/mjkd/` (diuji `tests/mjkd/*.test.ts`): `jenis-sekolah` (nama diutamakan, kod sandaran, bercanggah/tidak dikenali = ralat; `kenalJenisSekolah` = versi null untuk UI), `sasaran` (`perkaraUntukSekolah`: sekolah_khusus mengatasi sasaran; jenis tidak dikenali hanya dapat SEMUA), `validation` (catatan min 10 aksara kecuali TIDAK_BERKAITAN, bukti http(s)), `nama-kunci`, `jawatan-pgb`, `ringkasan`, `csv`, `pegawai-csv`. Data sebenar 102 sekolah: SK 42, SJKC 24, SJKT 15, SM 21 (SR 81).
- Awam `/laporan-mjkd` (+ `/berjaya`, `/semak`): minit PDF (Lihat/Muat Turun), borang maklum balas ikut sekolah, nombor tiket seperti Akhbar. Nama PGB diisi daripada direktori melalui tindakan pelayan `getPrefillPgbMjkd` (nama sahaja — tiada telefon). Ditutup jika suis tutup atau melepasi tarikh tutup (waktu KL).
- Admin `/admin/mjkd` (+ `/[id]` tab Tetapan/Perkara/Maklum Balas, `/[id]/sekolah/[kod]`, `/[id]/export` CSV). Maklum Balas: kemajuan (belum hantar ikut zon), matriks sekolah × perkara, mengikut perkara dengan "Pilih untuk dibaca" + susunan. Kad ditambah di `/admin/pelaporan`, `ADMIN_PAPAN_NESTED_PATHS` (+ ujian), `MODULES`/`LAPORAN_SECTIONS` (aksen #0E7490).
- Muat naik minit: `uploadPublicStorageObject` (eksport baharu dalam `lib/tempahan/room-photos.ts`, pilihan `upsert`; pemanggil lama tidak berubah). PDF sahaja (semak "%PDF-"), ≤ 8 MB, laluan `mjkd/<tahun>-bil<bil>/minit-<ts>.pdf`.
- Skrip (JANGAN dijalankan tanpa semakan): `npm run db:seed-mjkd [-- --dry-run]` (Bil.1/2026 + 13 perkara; enggan ganti perkara jika sudah ada maklum balas) dan `npm run db:import-pegawai-ppd -- <csv> [--dry-run]` (header mesti tepat nama,jawatan,sektor; tiada IC/nama pengguna).
- Disahkan: typecheck, eslint, ujian (mjkd + admin), `npm run build`. Belum dismoke dalam pelayar (jadual belum wujud di DB).

## 2026-10-13 — Ains: kurangkan bloat `analisis_ains_murid`

- DB 68 MB, Ains ~43 MB. `analisis_ains_murid` 25k baris tetapi 14 MB heap
  (1745 halaman vs ~290 patut) — import bulanan UPDATE semua murid
  (~135k UPDATE, 1,132 HOT) tanpa nama berubah.
- `VACUUM (FULL, ANALYZE)` dijalankan sekali: jadual 18 MB → 4 MB, DB 68 → 54 MB.
- `scripts/import-ains.ts`: upsert murid guna `setWhere nama IS DISTINCT FROM
  excluded.nama` — baris tidak berubah tidak lagi dikemas kini (tiada tuple
  mati). Tiada migrasi.
- Dasar baharu (keputusan pengguna): tahun lalu diarkib — butiran murid
  dipadam selepas sandaran pg_dump, ringkasan sekolah dikekalkan. Prosedur
  penuh dalam `CLAUDE.md` (bahagian "Program Ains — dasar data tahunan").
  Skrip arkib + nota UI tahun diarkib belum ditulis; buat sebelum Jan 2027.

## 2026-09-28 — Tebus Buku: muat naik CSV mingguan + snapshot 28 Sept

- Import semula `tebus_buku_pelajar` daripada CSV JPN
  (`Dashboard Operasi Bahagian_Butiran Tebus_Guna_Table (Murid).csv`).
  Hanya `PPD MANJUNG`: 17,498 pelajar, 21 sekolah menengah, sudah tebus
  15,729, sudah guna 14,852. Tarikh data 28 September 2026.
  (21 Sept: 17,495 pelajar; tebus 14,346; guna 13,095.)
- Pentadbir / Pegawai boleh muat naik sendiri di `/admin/tebus-buku`
  (kad Tebus Buku di CoE Reports). Fail penuh negeri dibaca di pelayar;
  hanya baris PPD MANJUNG dihantar (fail asal ~25MB melebihi had muat naik).
  Data lama diganti dalam satu transaksi. CSV mentah tidak dikomit.
- Skrip CLI kekal: `npm run db:import-tebus-buku -- <fail.csv>`.
  Nama fail tanpa tarikh (cth. `(Murid)`) guna tarikh hari ini (waktu KL);
  corak `26Ogos2026` dan `(21092026)` masih dikesan.

## 2026-09-21 — AI Tools: KPI Kebangsaan dua tahun

- Kad KPI boleh papar 2025 55% dan 2026 79% (atau satu tahun). Pentadbir
  tetapkan di `/admin/analisis?modul=optik`, termasuk pilihan paparan.

## 2026-09-21 — AI Tools: senarai sekolah/guru dalam modal awam

- Klik sekolah atau guru tidak lagi buka halaman penuh `/analisis/ai-tools`
  (nampak seperti backend; pautan balik ke `/analisis` kena log masuk).
- Aliran awam: modal CoE Analytics → senarai sekolah → senarai guru, semua
  dalam popup yang boleh ditutup. Tiada e-mel.

## 2026-09-21 — CoE Analytics: statement timeout 57014 / EOF 08006

- Halaman utama terlalu banyak query selari pada pool serverless 3 sambungan.
  `withDbTimeout` (Promise.race) meninggalkan statement Postgres tergantung —
  log Supabase `57014 canceling statement due to statement timeout` +
  `08006 unexpected EOF on client connection with an open transaction`.
- Kesan: 5 kad indikator hilang (getAnalisisHomeSummary timeout) manakala 3
  kad perkhidmatan kadang muncul.
- Pembetulan: homepage perkhidmatan KPI sahaja; carta penuh dimuat bila modal
  dibuka. Query berturutan. Penapis tahun guna julat tarikh (bukan
  `extract(year)`). Tiada migrasi.

## 2026-09-21 — CoE Analytics: Khidmat Bantu, Pinjaman Aset, Tempahan PKG

- Tiga modul perkhidmatan ditambah pada CoE Analytics (bukan editor admin).
  Nombor dikira terus dari jadual permohonan (`approved` / diluluskan).
- Halaman utama: baris pertama kekal 5 indikator USTP; baris kedua 3 kad
  perkhidmatan. Modal sama, dengan penapis tahun.
- `/analisis` (staf): sticky nav + seksyen `#khidmat-bantu` `#pinjaman-aset`
  `#tempahan-pkg`, penapis `?tahun=`. Tiada tab baharu di `/admin/analisis`.
- Khidmat Bantu: diluluskan, bulan ini, sekolah terlibat; carta jenis
  perkhidmatan, jenis pemohon, trend bulanan.
- Pinjaman Aset: permohonan diluluskan, unit diserahkan, sudah dipulangkan;
  carta PKG, jenis peralatan (top 8), trend. Tiada inventori/pending/lewat.
- Tempahan PKG: aktiviti (`coalesce(group_id, id)`), hari penggunaan;
  carta PKG, pagi/petang/sepenuh hari, trend.


## 2026-09-21 — CoE Analytics AI Tools: CSV snapshot + arkib

- AI Tools tidak lagi diisi nombor KV satu persatu. Pentadbir muat naik CSV
  paparan daerah (atau Excel senarai guru) di `/admin/analisis?modul=optik`.
  Setiap muat naik jadi paparan semasa dan satu titik carta; fail lama kekal
  arkib (muat turun / pulihkan / buang daripada carta).
- KPI Kebangsaan 2026 = 79% (medan berasingan, boleh ditukar setiap tahun).
  TOV carta = 86.43% (snapshot 27 Nov 2025 — nombor tamat kitaran 2025 yang
  ada dalam sistem; bukan 90%+). AR1/AR2 lama diganti muat naik tahun ini:
  Apr 2026 36.96% (Excel guru 20 Apr), Sep 2026 83.49% (CSV V4, 3059/3664).
- Jadual sekolah awam `/analisis/ai-tools` (101 sekolah, carian + tapis PLC).
  Klik sekolah buka senarai guru (nama + status; e-mel tidak dipaparkan).
  Status PLC ikut lajur CSV; Excel/CSV guru diagregat, Selesai jika ≥80%.
  Nama sekolah digabung dengan jadual `schools` (ABA1031 = SK PANGKALAN TLDM II).
- Jadual baharu `analisis_optik_snapshots` + `analisis_optik_schools` (RLS).
  Skrip: `npm run db:import-optik`.
- Arkib admin: tapis tahun (lalai tahun terbaru; pilihan Semua tahun).
- Carta AI Tools: garis putus-putus KPI Kebangsaan (paksi 0–100%).


## 2026-09-21 — Kelip scroll pada skrin dalam lipat

- Magic V5: kelip hanya semasa scroll bawah — toolbar pelayar menguncup,
  `overflow-x: clip` jadi scrollport kedua, `backdrop-blur` sticky + blob
  `filter: blur(80px)` dikomposit semula setiap frame. Bukan isu breakpoint.
- `overflow-x: hidden` pada body sahaja; buang clip pada html/shell/main.
- Ambient `height: 100lvh` (stabil). Blur/animasi dimatikan di ≤1023px /
  `hover: none`. Satu lapisan AmbientScene (buang overlay homepage kedua).
- TopNav/admin header: `backdrop-blur` hanya `lg`. Tab bawah `transform-gpu`.

## 2026-09-21 — Chrome desktop 1024px (lipat Magic V5)

- Honor Magic V5 skrin dalam 2172×2352 @ ~3x ≈ 724–784 CSS px, tepat di tepi
  breakpoint `md` (768px). Sidebar + tab bawah berulang-alik = "jump/refresh".
  Skrin luar (~353 CSS px) dan telefon biasa tidak terjejas.
- Chrome shell (sidebar, BottomTabBar, footer margin, TopNav wordmark, admin
  `pl-64`) kini `lg` / 1024px. Manifest PWA `orientation: any` (bukan
  `portrait-primary`). Sidebar awam guna `100svh` bukan `100dvh`.

## 2026-09-21 — Admin Khidmat Bantu: ubah & padam selepas lulus

- Permohonan yang sudah `approved` (dan `pending`) boleh diubah: jenis
  perkhidmatan, tajuk, tarikh, masa, lokasi. Surat permohonan dikekalkan.
- Admin boleh padam rekod pada mana-mana status; surat di Drive dibuang
  secara best-effort. Corak sama seperti tempahan (Ubah / Padam).
- Semak status pemohon (`/khidmat-bantu/semak`) terus baca DB — tiada
  cache khas.


## 2026-09-21 — Kemas kini snapshot tebus baucar buku (PPD Manjung)

- Import semula `tebus_buku_pelajar` daripada CSV JPN baharu
  (`Murid_Butiran Tebus_Guna_Table (21092026).csv`).
  Skrip menapis `PPD MANJUNG` sahaja (21 sekolah menengah).
- Snapshot: 21 September 2026. 17,495 pelajar; 14,346 sudah tebus; 13,095
  sudah guna. (Snapshot 14 Sep: 17,659 pelajar; tebus 12,992, guna 11,760.)
- Halaman `laporan/tebus-buku` force-dynamic — data terus dari DB,
  tiada redeploy. Disahkan di produksi: tarikh "21 September 2026"
  dan senarai 21 sekolah.
- `parseSourcedAt` kini kenal corak `(21092026)` (DDMMYYYY) pada nama fail.
- CSV mentah mengandungi nama & emel pelajar — TIDAK dikomit.
- Kemas kini: `npm run db:import-tebus-buku -- <fail.csv>`.

## 2026-09-14 — Batal permohonan pinjaman peralatan sebelum serahan

- Admin boleh **Batal permohonan** selagi status `pending` atau `approved`.
  Selepas `handed_over` (peralatan sudah diserahkan), butang hilang.
- Jika sudah diluluskan, unit `reserved` dikembalikan kepada `available`
  dan peruntukan ditanda `releasedAt`. Rekod kekal sebagai `cancelled`
  (bukan padam keras) untuk jejak audit KEW.PA-9.
- WhatsApp pemohon disediakan selepas pembatalan, sama seperti lulus/tolak.

## 2026-09-14 — Kemas kini snapshot tebus baucar buku (PPD Manjung)

- Import semula `tebus_buku_pelajar` daripada CSV JPN baharu
  (`Dashboard Operasi Bahagian_Butiran Tebus_Guna_Table (2).csv`).
  Skrip menapis `PPD MANJUNG` sahaja (21 sekolah menengah).
- Snapshot: 14 September 2026. 17,659 pelajar; 12,992 sudah tebus; 11,760
  sudah guna. (Snapshot 13 Sep: tebus 12,797, guna 11,532.)
- Halaman `laporan/tebus-buku` force-dynamic — data terus dari DB,
  tiada redeploy. Disahkan di produksi: tarikh "14 September 2026",
  senarai 21 sekolah dan senarai pelajar SMK SERI MANJUNG.
- CSV mentah mengandungi nama & emel pelajar — TIDAK dikomit.
- Kemas kini: `npm run db:import-tebus-buku -- <fail.csv>`.

## 2026-09-13 — Kemas kini snapshot Tebus Buku (13 Sept 2026)

- Import semula data baucar buku PPD MANJUNG daripada CSV terkini
  (`docs/Data Baucar Buku 13 Sept 2026.csv`, sumber desktop
  `Dashboard Operasi Bahagian_Butiran Tebus_Guna_Table (2).csv`)
  melalui `npm run db:import-tebus-buku`. Hanya baris `PPD MANJUNG`;
  snapshot lama diganti dalam satu transaksi.
- Hasil: 17,659 pelajar, 21 sekolah, sudah tebus 12,797 (7 Sept: 11,605),
  sudah guna 11,532 (7 Sept: 10,281), sourced_at 2026-09-13.
- Halaman `laporan/tebus-buku` force-dynamic — data terus dari DB,
  tiada redeploy. Disahkan di produksi: tarikh "13 September 2026",
  senarai sekolah dan carian pelajar SMK TOK PERDANA.
- CSV mentah mengandungi nama & emel pelajar — TIDAK dikomit
  (sudah di `.gitignore`).

## 2026-09-09 — Minit Curai: tarikh tamat untuk bengkel beberapa hari

- Medan `meeting_end_date` (pilihan). Kosong atau sama dengan tarikh mula
  = program sehari. Tarikh kemudian = julat `mula – tamat` pada senarai,
  halaman butiran dan PDF.
- Migrasi `0044_minit_curai_end_date`.

## 2026-09-09 — Minit Curai PDF: aksara luar WinAnsi

- Prompt AI Kandungan: hanya "• " untuk point form; jangan anak panah,
  tanda semak, emoji. `normalizePointForm` turut buang simbol itu semasa
  parse, supaya hasil disimpan bersih walaupun model abaikan arahan.

- Muat turun PDF gagal dengan 502 "Semak teks menggunakan aksara Rumi"
  kerana `pdf-lib` Helvetica hanya encode WinAnsi. Teks dari Word/AI
  (anak panah `→`, tanda semak `✓`, ZWSP, aksara CJK) menyebabkan
  `widthOfTextAtSize` / `drawText` throw.
- `pdfText` kini map simbol biasa (`→` → `->`, `✓` → `v`) dan ganti
  aksara lain yang Helvetica tidak encode dengan `?`. Kandungan Rumi
  kekal; PDF dijana tanpa menyuruh pengguna sunting semula.

## 2026-09-07 — Khidmat Bantu: muat naik surat tanpa tertib medan

- Surat boleh dipilih pada bila-bila masa. Muat naik ke Drive hanya bermula
  apabila nama sekolah/unit + tarikh cadangan sudah ada (debounce 800ms,
  elak muat naik semasa taip nama unit). Butang hantar kekal menunggu
  muat naik selesai.
- Jangan gabungkan muat naik dengan submit — GAS + Vercel boleh timeout.
  Jangan muat naik tanpa tarikh: folder/nama fail Drive
  `Khidmat-Bantu/<tahun>/<YYYY-MM>/` + `YYYY-MM-DD_org_service_…`.
- Jika tarikh/sekolah/jenis berubah selepas berjaya, fail yang sama dimuat
  naik semula; fail lama di Drive tidak dipadam (sama seperti sebelum ini).

## 2026-09-07 — Admin boleh tukar lokasi (bilik) semasa "Ubah" tempahan

- Panel admin tempahan (`AdminBookingActions`) kini ada dropdown **Lokasi (bilik)**
  di borang "Ubah", di samping tarikh + slot. Senarai bilik = bilik aktif PKG
  (diambil dari `roomNames`, dihantar turun melalui `TempahanAdminView` →
  `BookingCard`/`BookingAgendaRow`). Bilik semasa sentiasa dimuat sebagai opsyen
  walau dinyahaktif.
- `rescheduleBookingCore` menerima `nextRoomSlug`: sahkan bilik wujud + aktif,
  semak konflik pada bilik **baharu** (hari yang diedit + setiap hari lain dalam
  kumpulan lintas hari). Tarikh/slot kekal per-hari; **bilik dikongsi seluruh
  kumpulan** (satu tempahan = satu lokasi) — kemas kini dalam satu transaksi.
- Lokasi Autosijil ikut automatik: `pushBookingDetailsToAutosijil` kira semula
  `location` dari `roomSlug` selepas ubah.

## 2026-09-06 — NexaBot: jangan tapis peranan

- NexaBot hanya semak akaun aktif + Telegram terikat. `canUseNexaBot`
  digugurkan — Admin/Pegawai/PKG_Admin tidak dibeza.
- Ikatan destinasi: pegawai ditetapkan (`telegramResponsibleUserId`)
  dahulu, kemudian mana-mana staf `pkgId` itu, bukan tekaan peranan.

## 2026-09-06 — NexaBot: sambungan PKG dikira terikat

- `/surat` gagal jika hanya ikat destinasi PKG (notifikasi), kerana bot
  hanya semak `users.telegram_chat_id`. Halaman Telegram menandakan ikatan
  peribadi sebagai pilihan, jadi pegawai rasa sudah terikat.
- Kini NexaBot terima: akaun peribadi, nama pengguna Telegram, atau
  `telegram_destinations.chat_id` (sambungan PKG/khidmat). Ikatan destinasi
  baharu juga disalin ke akaun pegawai bertanggungjawab jika belum ada.

## 2026-09-06 — NexaBot: PKG_Admin boleh urus

- `/surat` `/foto` `/kemaskini` `/padam` kini untuk semua staf backend
  (`Admin`, `Pegawai`, `PKG_Admin`) yang akaun aktif + Telegram terikat.
- Tidak membuka modul kandungan admin (laporan/direktori/khidmat) kepada
  PKG_Admin — hanya NexaBot.

## 2026-09-06 — Minit Curai: AI baca PDF/PPTX tanpa Storage

- Peringkat B boleh muat naik PDF/PPTX. Fail diekstrak teks di memori
  (`unpdf` / `jszip`), digabung dengan nota, kemudian dibuang.
- Tidak ditulis ke Supabase Storage. Kuota AI ikut teks (maks 8000 aksara),
  sama seperti nota tampal — bukan keseluruhan fail/imej slaid.
- Prompt AI wajib pecahkan kepada beberapa perkara; UI nyatakan ini.
- Jika teks terlalu sedikit (PDF imbasan/gambar), hantar 20 halaman
  pertama kepada Gemini sebagai PDF/imej. Masih tidak disimpan.
- Gemini percuma: kuota berasingan mengikut model. Lalai 3.5 Flash
  dahulu, 429/404 baharu jatuh ke 2.5 Flash.

## 2026-09-06 — 0043 minit_curai terlepas kerana journal `when`

- `0042_retire_osc` guna `when: 1788672000000` (nombor bulat), manakala
  `0043_minit_curai` dijana dengan `when` lebih awal. Drizzle migrator
  susun ikut `when`, jadi `npm run db:migrate` anggap 0043 sudah selesai
  dan **tidak cipta jadual** — production 500 Digest.
- Betulkan `when` 0043 kepada `1788672000001`, kemudian migrate semula.
  Jadual `minit_curai` kini wujud pada Supabase production.

## 2026-09-06 — AI Kandungan Minit Curai

- Peringkat B ada nota pegawai (mana-mana bahasa, tidak disimpan) dan
  `Jana dengan AI` untuk mengisi jadual perkara / keputusan / tindakan /
  pegawai dalam point form.
- Rumusan panjang digugurkan: Kandungan sudah merekod isu dan keputusan.
  Peringkat C kekal lampiran, tarikh sasaran, penyebaran dan pengesahan.

## 2026-09-06 — Minit Curai dalam CoE Reports

- Modul staf sahaja, sama seperti Laporan Program USTP: `requireUser()`, kad
  hanya pada hub `/laporan` untuk sesi staf dan pada `/admin/pelaporan`.
- Borang ikut `Template_Minit_Curai_Terkini_v2.docx`, dipecah A (butiran),
  B (kandungan berbilang isu) dan C (rumusan, curai, pengesahan).
- Senarai mengikut bulan tarikh mesyuarat; PDF dijana atas permintaan.
- Migrasi `0043_minit_curai`: jadual `minit_curai`, indeks tarikh, FK
  pencipta, RLS tanpa polisi.

## 2026-09-06 — OSC dibubarkan, bahan ke Resources / Media

- OSC / Sumber dimansuhkan. `/osc`, `/sumber`, `/admin/osc`,
  `/admin/kandungan` dihalakan ke CoE Resources.
- CoE Resources ada kategori baharu **Kertas Kerja / Arkib** (`arkib`),
  disusun mengikut tahun (bukan bulan). Mengandungi kertas kerja, OPR,
  ePelaporan Canva, laporan program dan dokumen JNJ lama.
- Buku pengurusan dan penyebaran dasar masuk **Nota**. Hebahan, impak
  JNJ dan bahan pencapaian visual masuk CoE Media `koleksi`.
- Looker DPD/PSS, Pelaporan Tambahan, Ruang Ilmu, Google Classroom,
  contoh bahan DELIMa dan embed tapak (SESDA / Rak Maya / Artsteps)
  dibuang.
- Menu admin OSC (desktop + telefon) digugurkan; urusan melalui kad
  Papan Admin (Resources / Media).
- Migrasi `0042_retire_osc` memindah baris `kandungan_cards` lalu
  mengosongkan jadual.

## 2026-09-06 — Carian Laporan Program USTP

- `/admin/laporan-ustp` ada kotak carian serta-merta (nama program, PKG,
  penyedia, lokasi, penganjur, kluster) dalam bulan yang dipilih.

## 2026-09-06 — Fix Laporan Program: jangan hantar fungsi ke MonthNav

- Halaman pelayan tidak boleh menghantar `href` fungsi kepada klien
  (ralat Vercel Digest). `MonthNav` kini terima `path` rentetan.

## 2026-09-06 — Navigasi bulan: anak panah + pemilih di tengah

- Komponen kongsi `MonthNav`: `‹ September 2026 ›`, ketik nama bulan untuk
  pilih tahun/bulan. Tukar bulan menapis serta-merta (tiada butang Papar).
- Dipakai pada Laporan Program USTP, CoE Resources (awam + admin), CoE
  Media gambar/video (awam + admin), dan seksyen kalendar admin sedia ada.
- Admin Surat tidak lagi accordion: hab kategori, ketik masuk, kemudian
  tapis mengikut bulan seperti halaman awam.

## 2026-09-05 — TikTok USTP akaun rasmi

- Pautan CoE Media: `https://www.tiktok.com/@ustpmanjung1`.

## 2026-09-05 — Maklumat Asas ke CoE Directory

- Hab awam `/direktori` ada dua kad: **Direktori Sekolah**
  (`/direktori/sekolah`) dan **Direktori USTP** (`/direktori/ustp`).
- Direktori USTP (carta, PKG, takwim, pegawai) hanya dipaparkan selepas
  log masuk MOE-DL atau staf; tanpa sesi, tiada data. `/maklumat-asas`
  dihalakan ke `/direktori/ustp`.
- Kawalan pegawai/tetapan berpindah ke hab admin CoE Directory
  (`/admin/direktori/pegawai`, `/admin/direktori/tetapan`). OSC Urus
  tinggal Sumber sahaja.

## 2026-09-05 — OSC tanpa kad Analytics

- Hab `/osc` hanya Sumber dan Maklumat Asas. CoE Analytics kekal di
  halaman utama (awam) dan kawalan di Papan Admin. `/analisis` masih
  wujud sebagai laman dalaman, tetapi tidak lagi dipromosi dari OSC.

## 2026-09-05 — CoE Media admin: bulan terkini lalai

- `/admin/media` tidak lagi membuka Semua bulan. Lalai ialah bulan
  terkini yang ada bahan, sama seperti halaman awam kategori. Semua
  bulan kekal pilihan arkib.

## 2026-09-05 — CoE Analytics di Papan Admin

- Platform kawalan nombor analisis (`/admin/analisis`) dipindah dari
  Urus OSC ke kad **CoE Analytics** pada Papan Admin. Bingkai kad
  menggunakan aksen modul `#024AD8`.
- OSC Urus tidak lagi menyenaraikan Analisis. Menu sisi / tab telefon
  menonjolkan Papan Admin semasa di `/admin/analisis`.

## 2026-09-05 — NexaBot: /foto album Google Photos ke CoE Media

- `/foto` (atau `/gambar`) dalam sembang peribadi atau kumpulan menanya
  bulan aktiviti dan nama aktiviti, kemudian menyimpan pautan album ke
  `media_cards` (kategori `koleksi`) — kad awam di `/media/koleksi`.
- Pautan `photos.google.com` / `photos.app.goo.gl` dikesan secara
  automatik (staf yang sudah ikat akaun). Dalam kumpulan, privacy mode:
  hantar `/foto` dulu atau **balas** mesej album dengan `/foto` (teks,
  kapsyen, atau entiti `text_link`).
- Selepas simpan: butang Buka album, Lihat di CoE Media, ubah tajuk /
  bulan, padam (callback `mf:` supaya tidak bercanggah dengan surat).
- Tajuk album dibaca daripada halaman kongsi (`<title>` / `og:title`).
  Jika berjaya, staf tekan **Guna tajuk ini** atau taip nama baharu.
- Menu bot menambah `/foto`. Jalankan `npm run telegram:set-webhook`
  selepas deploy.

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
- Pautan: TikTok `https://www.tiktok.com/@ustpmanjung1`, Facebook
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

## 2026-09-05 - Laporan Program USTP

- Semua pengguna backend (`Admin`, `Pegawai`, `PKG_Admin`) boleh menyediakan,
  melihat, mengedit dan memadam laporan USTP tanpa skop pemilik PKG. Kad di
  CoE Reports hanya dipaparkan kepada sesi staf; laporan awam lain kekal awam.
- Senarai mengikut bulan tarikh mula program, lalai bulan semasa MYT, dengan
  20 rekod setiap halaman. Minit Curai ditangguhkan atas arahan pengguna.
- Lima KOD PKG, 11 kluster, enam teras berbilang pilihan dan 19 pilihan peralatan
  mengikut rujukan pengguna. Peralatan laporan tidak mengubah inventori pinjaman.
  Amaun disimpan dalam sen; jumlah dikira daripada empat komponen peruntukan.
- Tepat dua gambar disimpan melalui GAS sedia ada ke
  `Laporan USTP/tahun/bulan/id-laporan/`. Perkongsian pautan Drive dikekalkan
  seperti diminta. Edit teks mengekalkan gambar; penggantian membersihkan gambar
  lama selepas rekod disimpan. Versi rekod menghalang tindihan edit serentak.
- PDF dijana atas permintaan tanpa disimpan di Drive, menggunakan struktur
  jadual dan imej kepala daripada `docs/6f10807f.docx`. Kandungan panjang disambung
  ke halaman tambahan; dua gambar dibenam tanpa dipotong. Hub berasaskan sesi
  dan laluan USTP menggunakan NetworkOnly dalam PWA.
- Migrasi `0040_laporan_program_ustp` hanya menambah jadual `laporan_ustp`, indeks,
  FK pencipta kepada users dan RLS tanpa polisi. Fail migrasi dijana dan disemak.
  Ketika sambungan tugas, kod sudah terkandung dalam commit susulan; semakan
  baca sahaja mengesahkan jadual sebenar sudah wujud dengan 28 lajur sepadan,
  RLS aktif dan sifar polisi. Tiada migrasi atau deployment dijalankan oleh sesi ini.
- Verifikasi: build, typecheck, lint fail berkaitan dan 18 ujian lulus.
  Ujian tindakan menggunakan DB/Drive/sesi palsu (tiada perubahan luaran).
  Smoke HTTP: hub awam 200 tanpa kad staf; kelima-lima laluan USTP menghala ke
  login bagi pelawat tanpa sesi. Pratonton komponen telefon mengesahkan multi-
  pilihan, Ya/Tidak dan jumlah; PDF contoh dua/lima halaman dirender dan diperiksa,
  dengan semua 70 perenggan objektif serta penanda akhir kekal.
- CodeGraph auto-sync telah mengenali fail, simbol dan ujian baharu. Tool
  `index_project` tidak tersedia dalam sesi ini; tiada CLI sync/index dijalankan.

### 2026-09-05 — Pilihan kod PKG dalam Laporan USTP
- Borang baharu dan suntingan memaparkan kod sahaja dalam pilihan PKG. Selepas kod dipilih, Negeri (Perak), SSTP/USTP (Manjung) dan nama PKG dipaparkan secara baca sahaja berdasarkan pilihan sedia ada.
- Penyimpanan kekal menggunakan pkgCode; tiada perubahan skema. Pengguna mengesahkan AppSheet menerima kod sahaja (contohnya AQA1001), bukan gabungan kod dan nama.
- Ujian pengguna mengesahkan pautan prefill AppSheet untuk nama program, tarikh, tempat, penganjur, bilangan peserta, objektif dan refleksi. Kluster, teras, peralatan dan gambar masih belum disahkan; butang integrasi belum ditambah.
- Verifikasi perubahan borang PKG: npm run build, npm run typecheck dan ESLint khusus UstpReportForm.tsx lulus. Tiada deployment atau penghantaran laporan AppSheet dilakukan.

### 2026-09-05 — Pautan praisi AppSheet Laporan USTP
- Pengguna mengesahkan ujian pautan berjaya untuk kod PKG sahaja, kluster, TERAS1/TERAS2, YA dan dua pilihan peralatan, selain semua medan teks/tarikh/bilangan yang diuji sebelumnya.
- Tambah Buka Borang AppSheet pada butiran laporan. Pautan asli membuka tab baharu menggunakan nilai laporan tersimpan, tanpa API, extension, penghantaran automatik atau penanda penyegerakan palsu.
- Sasaran yang dikenal pasti daripada URL pengguna: app 5c64ec78-6110-44c0-8672-95282a8de83b, LAPORANPROGRAMSSTP-653903016, form LAPOR AKTIVITI. Pautan tidak menyalin vss atau ID transaksi lama.
- TERAS 1–6 dipetakan kepada TERAS1–6; senarai menggunakan pemisah yang diuji. Tarikh dihantar MM/DD/YYYY. TIDAK menghantar senarai peralatan kosong. Pemetaan hanya merangkumi medan yang telah dikenal pasti; peruntukan dan gambar perlu dilengkapkan dalam AppSheet seperti dinyatakan pada UI.
- Tiga ujian praisi lulus: kontrak pemetaan, TIDAK/senarai kosong, dan pengekodan teks panjang/Unicode/pemisah URL tanpa pemotongan. Pengesahan pengguna meliputi pautan sampel; data sebenar belum dihantar atau disimpan oleh agen.
- Verifikasi integrasi pautan: 3 ujian lulus, ESLint fail terlibat lulus, npm run build dan npm run typecheck lulus. CodeGraph auto-sync mengenal pasti fungsi dan pemanggil baharu; index_project tidak tersedia. Tiada deployment.

### 2026-09-05 — Peruntukan integer dan pautan gambar AppSheet
- Pengguna mengesahkan OS29000/OS42000/OS21000 menerima 100/200/50 tanpa perpuluhan dan jumlah 350. Format 100.50/200.00/50.00 sebelum ini ditolak oleh borang.
- Praisi kini menghantar tiga peruntukan dalam ringgit penuh sahaja. Nilai sen asal NEXa kekal; amaun pecahan tidak dipraisi atau dibundarkan, dengan amaran khusus pada halaman (medan AppSheet mungkin kekal 0). Peruntukan lain masih perlu dilengkapkan mengikut arahan UI jika wujud.
- Kedua-dua GAMBAR 1/GAMBAR 2 berjaya memaparkan imej URL awam dalam tangkapan skrin pengguna. Pautan laporan kini menyertakan publicUrl dua foto NEXa. Ini rujukan kepada fail Drive NEXa, bukan salinan ke storan aplikasi sasaran; UI meminta pengguna mengekalkan fail asal dan memeriksa gambar.
- Bacaan SELECT terhad kepada satu laporan USTP terbaru memulangkan senarai kosong. Oleh itu, foto Drive sebenar dan paparan selepas simpan/sync belum diuji. Tiada rekod, foto atau tetapan produksi diubah untuk ujian.
- Lima ujian pemetaan lulus, termasuk format integer, pecahan sen tanpa pembundaran, pautan gambar dengan parameter dan teks panjang. ESLint fail terlibat lulus.
- Verifikasi akhir fasa ini: npm run build dan npm run typecheck lulus; tiada deployment. Langkah seterusnya ialah menyimpan laporan NEXa pertama dengan dua foto dan menguji pautan dalam sesi AppSheet pengguna.

### 2026-09-07 — Kemas kini snapshot Tebus Buku (7 Sept 2026)
- Import semula data baucar buku PPD MANJUNG daripada CSV terkini
  (`docs/Data Baucar Buku 7 Sept 2026 7.50 pagi.csv`) melalui
  `npm run db:import-tebus-buku`. Snapshot lama diganti dalam satu transaksi.
- Hasil disahkan pada DB: 17,659 pelajar, 21 sekolah, sudah tebus 11,605,
  sudah guna 10,281, sourced_at 2026-09-07 (dipapar "7 September 2026").
- Halaman `laporan/tebus-buku` dan `[kod]` ialah force-dynamic — data terus
  dibaca dari DB, tiada redeploy diperlukan.
- `parseSourcedAt` dalam `scripts/import-tebus-buku.ts` dinaik taraf: dahulu
  hanya kenal "Ogos" pada nama fail, kini kenal nama bulan BM/Inggeris (termasuk
  singkatan seperti "Sept") supaya tarikh snapshot ikut nama fail, bukan tarikh larian.
- CSV mentah mengandungi nama & emel pelajar — TIDAK dikomit; corak
  `/docs/Data Baucar Buku*.csv` ditambah ke `.gitignore`.
- Betulkan susun atur tarikh snapshot pada tajuk halaman: guna ruang tak-pecah
  (String.fromCharCode(160)) supaya "7 September 2026" tak dipecah antara baris.

### 2026-09-17 — Sandaran data (butang admin + Vercel Cron)
- Punca: Supabase free tier tiada sandaran terurus. Ditambah eksport logik
  semua jadual `public` → satu JSON setiap jadual → ZIP (DEFLATE, jszip).
  Peranan `postgres` (Drizzle) memintas RLS jadi semua baris terkandung.
- Teras boleh guna semula: `lib/backup/dump.ts` (`createBackupZip`) senaraikan
  jadual dari `information_schema` (auto-liputi jadual baharu), dump `select *`
  setiap satu; bigint→string, bytea→{__type,base64}, Date→ISO. Manifest+README
  disertakan. `lib/backup/store.ts` muat naik ke Google Drive via GAS
  (subPath `_backup/tahun/bulan`) & rekod status terakhir dalam `app_settings`
  (key `backup:last`) — TIADA migrasi/jadual baharu.
- Tiga entri: (1) muat turun ZIP ke komputer admin —
  `app/(admin)/admin/backup/download/route.ts` (Admin sahaja, salinan luar-talian);
  (2) butang "Sandar ke Google Drive" — `lib/actions/backup.ts`;
  (3) automatik — `app/api/cron/backup/route.ts` dilindungi `CRON_SECRET`
  (`Authorization: Bearer`), bukan di bawah middleware /admin.
- UI: `app/(admin)/admin/backup/page.tsx` + `components/admin/BackupPanel.tsx`
  (status sandaran terakhir, dua butang, amaran jika Drive/cron belum sedia).
  Kad "Sandaran Data" (Admin sahaja, accent #475569) ditambah di `/admin`.
  `requireAdmin` baharu dalam `lib/rbac.ts` (Admin sahaja — dump mengandungi
  hash kata laluan/token).
- Jadual: `vercel.json` crons `0 18 * * *` (UTC) = ~2:00 pagi MYT harian.
  Hobby plan = maksimum sehari sekali (mencukupi). `.env.local.example` +CRON_SECRET.
- Verifikasi: typecheck + build lulus (3 route baharu). Smoke teras pada DB
  sebenar (read-only, tanpa muat naik): 39 jadual, 21,793 baris → 672.8 KB ZIP
  dalam 2.3s (jauh di bawah had GAS 8MB). Smoke UI penuh perlu log masuk Admin.
- BELUM disediakan pengguna: set `CRON_SECRET` dalam .env.local + Vercel env,
  pastikan GAS dikonfigurasi. Pemulihan (restore) belum ada skrip — import
  manual ikut susunan FK.

### 2026-09-21 — Sandaran dwi-lapisan (JSON harian + pg_dump bulanan)
- Kekalkan sandaran logik harian (ZIP/Drive/cron). Tambah `scripts/pg-dump-backup.ts`
  + `npm run db:backup-pgdump` → `backups/pgdump/` (gitignore).
- Admin `/admin/backup`: seksyen `BackupPgDumpSection` (arahan BM).
- `.env.local.example`: `PGDUMP_DATABASE_URL` (Direct 5432).

### 2026-09-21 — Semak baiki kelip semasa scroll pada skrin lipat (Magic V5)
- Aduan: pada Honor Magic V5 (skrin dalam dibuka) NEXa kelip-kelip / seolah
  refresh semasa scroll ke bawah; skrin luar (lipat) & telefon lain OK.
  Bukan kerosakan telefon — isu adaptasi skrin lipat yang dicetuskan kod kita.
- Punca disahkan (kombinasi, hanya lipat-dibuka yang kena semua): (1) unit
  `dvh`/`vh` pada elemen full-screen berayun bila toolbar pelayar menguncup
  semasa scroll → relayout/repaint; (2) blur+animasi ambient full-screen
  dikomposit semula tiap frame — halaman utama dahulu render DUA lapisan
  ambient (`HomeAmbientScene` + `AmbientScene`); (3) `backdrop-blur` pada
  header sticky sampel semula latar tiap frame; (4) lebar lipat-dibuka
  ≈724–784 CSS px duduk tepat di sempadan md(768) → sidebar/tab bawah
  berulang-alik.
- Pembetulan (commit b3228d4 + 96a8c12) disahkan menyasar punca:
  sidebar `100dvh`→`100svh`, ambient `fixed`+`100lvh`; matikan
  `filter`/`animation` + sorok blob & pointer-glow pada `(hover:none),(max-width:1023)`;
  `contain: paint`; buang lapisan ambient pendua; gate `backdrop-blur` header
  ke ≥lg (di bawah 1024 putih tepu); breakpoint nav md(768)→lg(1024);
  `manifest` orientation `any`.
- Verifikasi (Browser pane, lebar dipaksa 776px): ambient 1 lapisan sahaja,
  tinggi 1100px (=lvh, tak berubah), mesh/blob `filter:none`+`animation:none`,
  header `backdrop-filter:none` latar putih tepu, sidebar `display:none`
  (satu susun atur mobile), horizontal overflow = 0, tiada elemen超宽.
  Julat 724–1023px seluruhnya di bawah 1024 → tiada lompat susun atur.
  Tiada monitor reload/resize/orientation dalam kod (bukan reload sebenar,
  hanya repaint). 404 dev (`main-app.js`/`app-pages-internals.js`) = artifak
  dev server sementara, tiada kaitan.
- BELUM disahkan: kelip sebenar TIDAK boleh dihasilkan semula dalam emulator
  (toolbar pelayar tak menguncup). Perlu ujian mesin sebenar Magic V5 (scroll
  semula), atau `chrome://inspect` paint-flashing untuk bukti muktamad.

## 2026-09-30 — Kad "Penyertaan Pertandingan" (CoE Analytics)

- Kad baharu `penyertaan` di halaman utama (sebaris dengan Tebus Buku). Modal 5 tab:
  Ringkasan (KPI, dapatan utama, carta, cadangan susulan, nota data), Pertandingan,
  Sekolah, Top 5, Guru. Sumber: `MANJUNG2026_RUMUSAN_DAERAH.xlsx` (PPPDM & DUTA 2026
  Negeri Perak, dijana 30/09/2026).
- Fail: `lib/analisis/penyertaan-data.ts` (data statik), `lib/analisis/penyertaan.ts`
  (terbitan + teks dapatan dikira daripada data), `components/analisis/PenyertaanExplore.tsx`
  (dimuat malas, ada recharts), `tests/analisis/penyertaan.test.ts` (jumlah padan helaian RINGKASAN).
- Nama murid SENGAJA tidak dipaparkan (halaman awam). Guru: 38 baris fail -> 34 unik
  (4 rekod digabung: kod sekolah sama, ejaan nama berbeza).
- Kemas kini: ganti data dalam `penyertaan-data.ts` apabila fail rumusan baharu dijana.
- Disahkan: tsc bersih, ujian lulus, semak visual desktop + mobile. `npm run build` TIDAK dijalankan
  (dev server sembang lain sedang guna `.next`).

## 2026-10-04 — DELIMa 3.0 pada panel DELIMa (CoE Analytics)

- Sumber baharu: CSV awam (Publish to web) Google Sheet "Portal Statistik DELIMa Negeri Perak"
  dalam Google Site DELIMa Perak (Analisis DELIMa). Hanya lembaran Guru 3.0 + Murid 3.0 dibaca
  (jumlah aktif/jumlah per sekolah, ditapis `PPD MANJUNG`). Tab Admin (nama/e-mel individu) TIDAK
  diakses/diambil; tiada kata laluan disimpan dalam kod.
- Angka 2.0 kekal dari papan pemuka DELIMa Perak (vercel) — lembaran 2.0 CSV memberi angka sama.
- Fail: `lib/analisis/delima-csv-parse.ts` (tulen, boleh diuji), `lib/analisis/delima-csv.ts`
  (fetch, cache 1 jam), `delima-live.ts` (`DelimaLive.v30`, `DelimaSchoolRow.guru30/murid30`),
  `summary.ts` (stat "Aktif · DELIMa 3.0"), `DelimaExplore.tsx` (baris 3.0 dalam jadual sekolah,
  kad Guru/Murid 2.0+3.0 dalam butiran), `tests/analisis/delima-csv.test.ts`.
- Snapshot bulanan/trend BELUM simpan 3.0 (perlu migrasi lajur) — 3.0 hanya langsung.
- Gid lembaran: Guru 3.0 = 1023985887, Murid 3.0 = 1408521867; jika Google Sheet bertukar, kemas kini `GID`.
- Disahkan: tsc bersih, build lulus, 4 ujian lulus, Manjung 102 sekolah (Guru 3.0 64.1%, Murid 3.0 15.0%).

## 2026-10-04 — Snapshot & trend DELIMa 3.0

- Migrasi `0049_delima_v30` (tambahan sahaja, lajur nullable): `guru30_*`/`murid30_*` (aktif, jumlah, pct)
  pada `analisis_delima_snapshots` dan `analisis_delima_schools`.
- `saveDelimaSnapshot` tulis 3.0 hanya bila CSV berjaya dibaca (kegagalan sementara tak padam rekod);
  `ensureDelimaSnapshot` isi semula snapshot sedia ada yang belum ada 3.0 (sekali).
- Trend (`DelimaTrendPoint`) + `DelimaTrendChart`: garisan "Guru 3.0"/"Murid 3.0" (putus-putus), hanya
  muncul bila ada data; jadual sejarah & snapshot sekolah papar baris 3.0.
- Bulan lama (sebelum 3.0 direkod) kekal tiada data 3.0 — CSV hanya data semasa, tiada sejarah.
- Andaian: CSV 3.0 semasa dikaitkan dengan tempoh sumber 2.0 (angka 2.0 CSV = sumber vercel, 31 Ogos 2026).

### Pembetulan (2026-10-04, selepas semakan data)

- CSV KPM (4 helaian) disahkan bersih: tiada kod sekolah berulang, aktif<=jumlah, peratus sepadan.
  2.0 sama tepat dengan papan pemuka JPN. 3.0 CSV = pengguna aktif platform 3.0 sahaja.
- Kad JPN "Data Aktif Delima 3.0" (Guru 80%/Murid 62.3%) BUKAN 3.0 sahaja: ia = pernah log masuk
  2.0 ATAU 3.0 (Manjung: guru 3757-752 "Belum Login" = 3005; murid 41540-15676 = 25864 ~ 25866).
  Label asal "Jumlah Aktif Murid · DELIMa 2.0 + 3.0" betul. Sasaran KPI (guru 98%, murid 75%) dikenakan
  pada angka gabungan ini, jangan banding dengan 3.0 sahaja.
- Ditambah kad "Jumlah Aktif Guru · 2.0 + 3.0" (widget JPN bertajuk menyebut 3.0, `DelimaLive.guruGabung`).
- Murid gabungan dalam snapshot = lajur `kad_*` (sejarah sedia ada); `murid30_*` = CSV 3.0 sahaja.
- Senarai "Belum Login" per orang (sheet KPM) mengandungi nama/e-mel — hanya dibilang secara tempatan,
  tidak disimpan/ditunjuk.

### Pembetulan KPI guru (2026-10-04)

- `kpi_guru` dalam DB ialah 78 (sama dengan `avg_tov_guru`, tersalah isi TOV sebagai sasaran). Sasaran
  rasmi (widget JPN) = Guru 98%, Murid 75%; DB `kpi_guru` dikemas kini ke 98 dan seed `analisis-delima.csv`
  dibetulkan (kpi_guru 98, kpi_murid 75).
- Sasaran dikenakan pada angka gabungan 2.0 + 3.0: "Capaian Guru" kini = bil. sekolah `capai` pada widget
  gabungan (`fetchDelimaGuruCapai`, 12/102 pada 31 Ogos 2026), bukan guru 2.0 >= sasaran.
- Migrasi 0050: `guru_gab_*` pada snapshot; trend ada garisan "Guru 2.0+3.0" (dibandingkan garis KPI Guru).

### Pembetulan "Capaian Murid" hilang (2026-10-09)

- Punca: `saveDelimaSnapshot` menulis `bilCapai` tanpa syarat. Jika `fetchDelimaCapai` pulang `null` (kurang 95% kad
  sekolah berjaya dibaca) semasa snapshot dikemas kini semula (cron/butang admin/render halaman), nilai sedia ada
  ditimpa `null` → `capaianStats` menapis baris "Capaian Murid".
- Pembetulan: `bilCapai` hanya ditulis bila bukan `null`; `getDelimaCapaiTerkini` mengambil snapshot terbaharu yang
  `bilCapai`-nya sudah ada (snapshot tempoh baharu yang belum siap dikira dilangkau, jadi baris tidak lenyap).
- Kesan sampingan: sementara tempoh baharu belum siap dikira, "Capaian Murid" menunjukkan angka tempoh sebelumnya.
- Belum disahkan terhadap data langsung: hos delimaperak.vercel.app disekat dalam persekitaran sesi ini. Jika
  `bilCapai` terus `null`, semak `parseKadMurid` (format HTML kad "Aktif Murid" mungkin berubah).

### Capaian Sekolah guru + murid (2026-10-09, punca sebenar)

- Sumber JPN (kemas kini 2026-10-08, data hingga 30 Sep 2026) kini MENGGABUNGKAN DELIMa 2.0 + 3.0 dalam satu
  laporan: widget gabungan berasingan dan kad "Aktif Murid" sudah tiada; `targetPeratus` = 0 (tanda `capai` tak boleh dipercayai).
  Itulah punca sebenar "Capaian Murid" hilang (kad tiada → `bilCapai` null) dan "Capaian Guru" 12/102 (8 Ogos) lapuk.
- `bilSekolahCapai()` (delima-live.ts) kira terus sekolah dengan peratus aktif >= sasaran KPI (guru 98, murid 75) daripada
  senarai sekolah; `fetchDelimaCapai` (scrape kad) dibuang. Snapshot semasa/akan datang guna kiraan ini (`getKpiMurid`);
  snapshot bulan lama TIDAK disentuh. Pembetulan di atas (kekalkan nilai lama bila null) kekal sebagai pelindung.
- Disahkan: Manjung guru 83/102, murid 39/102 (sama dengan kiraan bebas daripada API sumber).
- Label kad Guru/Murid (halaman utama + /analisis) ditukar: "Aktif" (angka gabungan JPN, tanpa sebut 2.0/3.0; nota kad dipendekkan); baris "Platform 3.0 sahaja" (CSV) dibuang kerana sumber sudah gabungan. Jadual/trend sejarah tidak disentuh.

### Senarai guru belum log masuk DELIMa + pemulihan snapshot AI Tools (2026-10-10)

- Borang muat naik AI Tools: `e.currentTarget` jadi null selepas `await` → `form.reset()` melempar TypeError ("client-side
  exception") walaupun muat naik berjaya. Rujukan borang kini disimpan sebelum `await`.
- Snapshot AI Tools id 10 (`okt.csv`, 10 Okt) dipadam kerana Looker sebenarnya hanya dikemas kini hingga 31 Ogos (data sama
  dengan 21 Sep); snapshot id 6 (Sep 2026) dijadikan semasa dan metrik disegerakkan semula.
- Migrasi 0051: jadual `analisis_delima_belum_login` (kod, nama, listed_on; RLS dikunci). Hanya nama + kod sekolah disimpan —
  e-mel TIDAK disimpan. Setiap muat naik (admin → Analisis → DELIMa → "Guru Belum Log Masuk") menggantikan seluruh senarai
  dan hanya PPD daerah semasa diambil (`parseBelumLoginCsv`, ujian di `tests/analisis/delima-belum-parse.test.ts`).
- Butiran sekolah DELIMa memaparkan nama guru belum log masuk (nama sahaja, tanpa nota/tarikh di halaman; `listed_on` tetap disimpan). Data awal: fail
  `belum-login-guru-300926-perak.csv` → Manjung 58 guru / 21 sekolah (tarikh 2026-09-30).
- Senarai AI Tools "belum" (283 guru, 30 Sep) TIDAK diimport: 356 guru "Belum Selesai" dalam Looker tiada dalam fail itu
  (takrif berbeza); paparan AI Tools kekal ikut Looker (nama + status sahaja, tanpa e-mel).

## 2026-10-13 — Carta trend DELIMa: hanya siri sumber JPN terkini

- `DelimaTrendChart` kini hanya lukis garisan **Guru** dan **Murid** (laporan gabungan 2.0 + 3.0 sumber JPN) + garis KPI.
  Siri lama dibuang daripada carta: Guru/Murid 3.0, Guru 2.0+3.0, Murid 2.0+3.0 (hanya ada pada bulan Ogs) dan nota "direkod mulai".
- Tajuk carta: "Peratus Penggunaan DELIMa Bulanan"; legenda "Guru"/"Murid" (tanpa sebut 2.0).
- `DelimaTrendPoint` / `HomeDelimaTrend` dipendekkan kepada `bulan`, `guru`, `murid`; `getDelimaSnapshotTrend` tidak lagi pilih lajur 3.0/gabungan.
- Data dalam DB (lajur `guru30_*`, `murid30_*`, `guru_gab_*`, `kad_*`) TIDAK disentuh — masih dipaparkan dalam jadual sejarah snapshot.
- Disahkan: tsc bersih; modal DELIMa di halaman utama papar 2 garisan + 2 garis KPI.

## 2026-10-13 — Arkib DELIMa 2025 mengikut sekolah + pautan kongsi

- Senarai sekolah DELIMa (CoE Analytics) kini ada pilihan **Tahun**: 2026 = data langsung (seperti sedia ada), 2025 = arkib.
  Arkib hanya peratus aktif guru/murid setiap sekolah — tiada carta, tiada nama guru/murid, tiada tahap/butiran sekolah.
- Sumber: Google Sheet rekod PPD (tab pertama), lajur "DISEMBER 31.12.2025 (TOV)", 101 sekolah. Lajur Feb–Jun 2026 dalam helaian
  yang sama SENGAJA tidak diimport (2026 sudah ada data langsung JPN). Data statik dalam `lib/analisis/delima-arkib-data.ts`
  (tidak bergantung pada helaian semasa runtime); tambah tahun baharu: tambah data + `DELIMA_ARKIB_TAHUN` + `ARKIB` dalam `delima-arkib.ts`.
- Nama sekolah diseragamkan dengan jadual `schools` (kod sama), jatuh balik ke nama helaian.
- Halaman awam boleh dikongsi: `/analisis/delima` (`?tahun=2025` = arkib 2025). Pengecualian auth ditambah dalam `middleware.ts`
  (sama corak `/analisis/ai-tools`); `/analisis` induk kekal staf sahaja.
- Fail: `components/analisis/DelimaArkibTable.tsx`, `DelimaExplore.tsx` (initialLayer/initialTahun/backHref + TahunSelect),
  `lib/actions/delima-public.ts` (`loadDelimaArkib`), `tests/analisis/delima-arkib.test.ts`.
- Disahkan: tsc bersih, build lulus, 2 ujian lulus, semak visual desktop + mobile, tukar 2025 <-> 2026 dalam modal halaman utama dan halaman kongsi.

### Aktif sekolah setiap sekolah 2025 (2026-10-13)

- Lajur "Aktif sekolah" (label paparan; Bil Id Pengguna Aktif / Bil Id Pengguna, semua jenis ID) ditambah pada arkib 2025 + kad ringkasan PPD Manjung
  (63.8%, 29,673 / 46,524 ID). Sumber: KPM Dashboard Penggunaan Platform (Power BI awam, data 31/12/2025).
- Cara ambil: laporan Power BI "publish to web" — ditanya terus melalui API querydata laporan itu (penapis `a_dl_ou_List.PPD` = PPD MANJUNG,
  `all_dl_transaction_log.Tahun` = 2025L; ukuran `Bil Pengguna` + `Adjusted Bil Id Pengguna`, kumpulan ikut `a_dl_ou_List.Sekolah`).
  Jumlah 29,673 padan kad PPD; jumlah ID per sekolah dijumlah 46,699 (kad PPD 46,524 — ukuran ID unik, beza 175).
- Kolej Vokasional Seri Manjung (AHA1002) ada dalam Power BI (389/650) tetapi SENGAJA tidak disenaraikan (arahan pengguna); kad ringkasan PPD kekal angka rasmi 29,673 / 46,524 (termasuk KV).
- Data statik dalam `delima-arkib-data.ts` (tidak bergantung pada Power BI semasa runtime). Ulang ambilan perlu penapis Tahun lain.

## 2026-10-13 — Program Ains: data bulanan 2026 (PPD Manjung) + penapis tahun

- Import CSV Ains Jan–Jul 2026 (hanya PPD MANJUNG, 102 sekolah, ~24k murid): `npm run db:import-ains -- "<folder user>" "<folder school>" 2026`. Idempoten per bulan; bulan dikesan daripada nama fail.
- Jadual baharu (migrasi `0052_ains_bacaan`, RLS dikunci): `analisis_ains_sekolah`, `analisis_ains_murid` (kunci e-mel, tidak dipaparkan), `analisis_ains_murid_bulanan`.
- UI: `components/analisis/AinsExplore.tsx` dalam `/analisis#ains` — pilihan tahun (2026 data bulanan; 2025 = metrik Ains lama sebagai sandaran), pilihan bulan, carta bulanan, senarai sekolah, senarai murid setiap sekolah (graf perkembangan bila nama diklik). Server action `lib/actions/ains-explore.ts` hanya untuk staf.
- Ringkasan Ains halaman utama (`summary.ts`) kini guna bulan terkini data 2026; jatuh balik ke metrik lama (dilabel "Data 2025") jika DB kosong. Metrik lama disahkan pengguna sebagai data 2025.
- Catatan data: angka bulanan diambil seadanya daripada fail (Mac→Apr turun sedikit); jumlah sekolah ikut fail sekolah, senarai murid ikut fail pengguna (beza kecil).

## 2026-10-13 — Ains: ringkasan awam, senarai murid perlu log masuk MOE-DL

- Keputusan pengguna: Ains awam (halaman utama + `/analisis/ains`, pilihan 2025/2026), TETAPI senarai nama murid hanya untuk akaun MOE-DL (@moe-dl.edu.my) atau staf — sama corak Semak Tebus Buku.
- `loadAinsMurid` (`lib/actions/ains-explore.ts`) menyemak `getDirectoryContactAccess()` di pelayan; tanpa akses → `{ ok:false, reason:"login" }` dan UI papar butang "Log masuk MOE-DL" (`direktoriLoginHref("/analisis/ains")`). Data murid tidak dihantar ke pelayar tanpa log masuk.
- `/analisis/ains` ditambah ke `MOE_DL_CALLBACK_PREFIXES` (`lib/moe-dl.ts`); halaman `/direktori/log-masuk` ada salinan khas Ains. Ujian ditambah dalam `tests/direktori/moe-dl-email.test.ts`.
- Menggantikan nota privasi entri sebelumnya (nama murid tidak lagi terbuka tanpa log masuk). Disahkan: tsc, ujian, build, pelayar (tanpa log masuk → butang login, tiada nama murid).

## 2026-10-13 — Pautan terus modal CoE Analytics (`/?analisis=<id>`)

- `HomeAnalisisBand` membaca `?analisis=<id>` semasa mount dan membuka modal modul berkenaan (id: `ains`, `delima`, `optik`, dll. — mesti padan modul yang dipaparkan; id tidak dikenali diabaikan).
- Contoh: `/?analisis=ains` membuka carta Program Ains (lapisan ringkasan) terus pada halaman utama. Awam, tiada log masuk.
- Disahkan: `npm run typecheck`. Belum dismoke dalam pelayar (persekitaran sesi tiada DB).

## 2026-10-13 — Ains: ringkas paparan telefon

- `AinsExplore`: carta (ringkasan + satu sekolah) kini ikut tab pada skrin < lg (satu carta pada satu masa, bukan 4 ditindan); lg ke atas kekal grid. Komponen `ChartTabs`.
- Senarai sekolah & murid: telefon (< sm) guna kad ringkas tanpa tatal mendatar; jadual penuh kekal pada sm ke atas. Senarai sekolah dihadkan 30 sebaris + "Papar lagi". Penapis dua lajur pada telefon.
- Disahkan: `npm run typecheck`, eslint fail berkenaan. Belum dismoke dalam pelayar (tiada DB dalam sesi).

## 2026-10-13 — Ains: senarai murid lebih mudah (telefon)

- `SekolahView`: bar kemajuan murid membaca; status bacaan jadi 3 butang (Semua/Sudah/Belum + bilangan) ganti dropdown; carian + status melekat (sticky) semasa skrol; murid dimuat automatik (IntersectionObserver, 50 sekali) dengan butang "Papar lagi" sebagai sandaran.
- Offset sticky guna pembolehubah CSS `--ains-sticky-top` (lalai 4rem = TopNav; modal halaman utama set `0px` dalam `HomeAnalisisBand`).
- Disahkan: typecheck + eslint. Belum dismoke dalam pelayar (tiada DB dalam sesi).

## 2026-10-13 — Ains: render satu susun atur sahaja (kad ATAU jadual)

- `AinsExplore`: senarai sekolah & murid sebelum ini render kad (telefon) DAN jadual (sm+) serentak, satu disorok dengan CSS → nod DOM berganda. Kini `useSkrinLebar()` (`useSyncExternalStore` + `matchMedia("(min-width: 640px)")`) memilih satu sahaja. Snapshot pelayan = kad; skrin lebar bertukar ke jadual selepas hidrasi (kelipan singkat sahaja pada paparan awal `/analisis/ains`).
- Disahkan: typecheck + eslint. Belum dismoke dalam pelayar.

## 2026-10-13 — Ains: muat turun CSV senarai murid

- Butang "CSV <bulan>" dan "CSV semua bulan" dalam senarai murid sekolah (`SekolahView`); ikut carian + status semasa. CSV dijana di klien (data murid sudah ada di pelayar selepas semakan log masuk MOE-DL — tiada endpoint baharu).
- `lib/analisis/ains-csv.ts` (tulen): satu bulan (Nama, Status, Diluluskan, Ditolak, BM, BI, Lain-lain, Muka surat, Bintang); semua bulan (Diluluskan/Ditolak setiap bulan + jumlah + bilangan bulan membaca). BOM UTF-8, sel yang bermula `= + - @` diawali `'` (halang formula Excel).
- Ujian: `tests/analisis/ains-csv.test.ts` (`npx tsx --test`). Disahkan: ujian, typecheck, eslint. Belum dismoke dalam pelayar.

## 2026-10-13 — Ains CSV: status "sudah/belum" ikut jenis muat turun

- `tapisMuridCsv` (`lib/analisis/ains-csv.ts`): CSV satu bulan — sudah/belum + susunan ikut bulan terpilih; CSV semua bulan — "sudah" = ada bacaan diluluskan dalam mana-mana bulan, susunan ikut jumlah diluluskan semua bulan. Carian nama sama untuk kedua-dua.
- Butang papar bilangan murid setiap CSV + nota ringkas bezanya. Ujian ditambah (5 lulus), typecheck + eslint lulus.

## 2026-10-13 — Ains: buang kad "Bintang" pada ringkasan sahaja

- Arahan pimpinan: kad "Bintang" pada ringkasan (overview) tidak dipaparkan. Lajur Bintang dalam senarai murid dan CSV KEKAL (sengaja).
- Medan `star` kekal dalam import, DB dan jenis.

## 2026-10-16 — DCS 2026 daripada dcs.moe.edu.my (penapis tahun 2025/2026)

- Sumber: dcs.moe.edu.my, 5 akaun PKG Manjung (Sitiawan, Seri Manjung, Pantai Remis, Beruas, Ayer Tawar). Pegawai log masuk sendiri dalam pelayar; Claude baca Dashboard, Progress, Top Schools (T6/T3/T5) dan PKG Ranking (50 PKG Perak) setiap akaun. Tiada nama murid/pengurus disimpan.
- Data: `scripts/data/dcs-2026-10-16.json` (5 PKG, 101 sekolah, murid 1,296/1,657). Jadual baharu `analisis_dcs_snapshots` (jsonb `data` = `DcsSnapshot`, unik `captured_on`, RLS dihidupkan) — migrasi `0055_dcs_snapshots`. Import: `npm run db:import-dcs -- <fail.json> [--dry-run]` (semak jumlah sekolah/murid = angka Ranking).
- `/analisis#dcs`: `DcsExplore` — pilih Tahun; 2026 = petak KPI, kedudukan PKG dalam Perak, % ikut tahap, jadual sekolah (tapis PKG/status). 2025 = carta TOV/KPI/Capai lama (metrik `analisis_metrics` dcs dikekalkan).
- Modal halaman utama (`summary.ts`): kad DCS guna snapshot terkini jika ada (78.2% murid selesai), jatuh balik ke 2025.
- Disahkan: typecheck, build, migrasi + import ke DB, smoke kad/modal halaman utama + pratonton dev sementara `DcsExplore` (desktop & telefon, tukar tahun, tapis PKG) — laluan dev dibuang selepas semakan.

## 2026-10-16 — MJKD maklum balas: draf auto-simpan

- Aduan pengetua: borang maklum balas `/laporan-mjkd` hilang jika tab tertutup separuh jalan.
- `components/mjkd/MaklumBalasMjkdForm.tsx`: draf (sekolah, nama/jawatan, semua jawapan termasuk URL gambar bukti) disimpan ke `localStorage` setiap kali borang berubah. Kunci `mjkd-draf:<mesyuaratId>` (borang baharu) atau `mjkd-draf:<mesyuaratId>:<kodSekolah>` (kemaskini). Mod admin tiada draf.
- Dibuka semula → draf dipulihkan (hanya jika ada jawapan sebenar) + banner "Draf anda telah dipulihkan" dengan butang "Buang draf". Draf dipadam selepas berjaya menghantar; jika sama dengan rekod asal, tidak disimpan.
- Had: draf hanya dalam pelayar/peranti yang sama (bukan pelayan).
- Disahkan: typecheck, eslint, smoke dev (isi → muat semula → dipulihkan → Buang draf kosongkan + padam kunci; tiada ralat konsol). `npm run build` tidak dijalankan kerana pelayan dev sesi lain sedang guna `.next`.

## 2026-10-16 — DCS: senarai sekolah selesai / belum selesai

- `DcsExplore`: status dua nilai ikut takrif "sekolah siap" DCS (murid didaftarkan > 0 dan semua selesai) — sepadan angka Ranking (daerah 37/101, Sitiawan 9/22). Butang Semua / Selesai / Belum selesai (dengan bilangan), tapis PKG, carian nama/kod, lajur Status. Sekolah 0/0 = "Belum daftar murid" (dikira belum selesai).
- Disahkan: typecheck, eslint, smoke pratonton dev sementara (kiraan butang, tapis PKG, carian) — laluan dev dibuang.

## 2026-10-16 — DCS: penapis tahun + senarai sekolah dalam modal halaman utama

- Modal DCS (`HomeAnalisisBand`) kini render `DcsExplore` (dimuat malas, `ssr:false`) melalui `AnalisisHomeModule.dcsExplore` (`summary.ts`) — pilih Tahun 2025/2026 dan senarai Selesai/Belum selesai sama seperti `/analisis#dcs`. `DcsBackup` dipindah ke `lib/analisis/dcs-types.ts`.
- Disahkan: typecheck, eslint, smoke halaman utama (buka kad DCS → butang 101/37/64, tapis Selesai = 37 baris, tukar ke 2025 papar carta TOV/KPI/Capai).

## 2026-10-16 — DCS: modal lebih lebar + telefon tanpa tatal mendatar

- Modal DCS halaman utama `max-w-5xl` (dahulu `max-w-2xl`, sesak).
- `DcsExplore`: petak KPI grid 2×2 (telefon) / 4 sebaris; jadual tahap jadi grid lajur tetap (T6/T3/T5 di telefon, bilangan di bawah peratus) — tiada `min-w`. Senarai sekolah: telefon = senarai kad (`useSkrinLebar`, ≥640px = jadual), 20 baris + "Papar lagi"; butang status 3 lajur, PKG + carian satu baris.
- Disahkan: typecheck, eslint; smoke 375px (tiada unsur melebihi lebar, 20 kad + Papar lagi (81)) dan 1280px (modal 1024px, 4 petak sebaris, jadual tanpa tatal).

## 2026-10-16 — DCS: jalur tarikh akhir 1 Disember 2026

- `DCS_TARIKH_AKHIR` (`lib/analisis/dcs-types.ts`, ikut tahun) — `DcsExplore` papar jalur dakwat gelap tebal di bawah pemilih tahun: "Tarikh akhir: 1 Disember 2026 · Semua murid mesti selesai menjawab · lagi N hari" (kiraan waktu Malaysia). Hanya untuk tahun yang ada tarikh akhir; 2025 tidak.
- Disahkan: typecheck, eslint, smoke modal halaman utama ("lagi 46 hari" pada 16 Okt 2026).

## 2026-10-16 — MJKD: draf maklum balas disimpan di pelayan (merentas peranti)

- Jadual baharu `mjkd_draf` (migrasi `0056_mjkd_draf`, RLS dikunci): satu draf per (mesyuarat, sekolah), `data` jsonb. Tiada kod/tiket draf — hanya PGB mengisi; sesiapa memilih sekolah itu melihat drafnya (keputusan pengguna). Kemaskini selepas dihantar tetap perlukan nombor tiket.
- `lib/actions/mjkd.ts`: `bacaDrafMjkd`, `simpanDrafMjkd` (ditolak jika ditutup / sudah dihantar), `padamDrafMjkd`; draf dipadam selepas `submitMaklumBalasMjkd` berjaya.
- `MaklumBalasMjkdForm`: borang baharu sahaja (bukan kemaskini/admin). localStorage kekal sebagai cache; draf pelayan dibaca bila sekolah stabil 700ms, ditimpa ke borang kecuali draf pelayar sekolah yang sama lebih baharu. Simpan ke pelayan selepas 2.5s tanpa menaip (disiri), tidak menyimpan jika bacaan gagal (elak menimpa). Tersalah pilih sekolah: draf yang dicipta sesi itu untuk sekolah lama dipadam. Butang "Buang draf" kini padam juga draf pelayan.
- Disahkan: typecheck, eslint, `tsx --test tests/mjkd` (91 lulus). BELUM diuji hujung-ke-hujung dengan DB (tiada DB dalam sesi ini) dan `npm run build` belum dijalankan; migrasi `0056` perlu `npm run db:migrate`.

- Pembetulan (draf MJKD): menukar ke sekolah lain yang ada draf lalu kembali ke sekolah asal pada peranti yang sama boleh mengekalkan isi sekolah lain (draf pelayar dianggap lebih baharu tetapi tidak dimuat semula ke borang). Kini pemilihan draf bagi sekolah stabil membandingkan draf pelayan vs draf pelayar (dibaca semula) dan memuatkan yang lebih baharu; isi yang masih milik sekolah lain tidak pernah dikekalkan. Typecheck + eslint lulus; belum diuji dengan DB.

## 2026-10-16 — Kad ESN (Etika Siber Nasional) dalam CoE Analytics

- Sumber: esn.moe.edu.my (log masuk akaun PPD Manjung oleh pengguna; Claude tidak memasukkan kata laluan). Dashboard (ringkasan sekolah/murid rendah & menengah) + Status Pelaksanaan (`/admin/ppd-progress/50/{1,2}`, DataTables server-side — `length` besar beri 504, guna 10 sebaris + cuba semula). Tiada nama murid/guru disimpan.
- Data: `scripts/data/esn-2026-10-16.json` (103 sekolah: 81 rendah + 22 menengah; murid 335/3,837; sekolah selesai 1, dalam proses 20, belum mula 82). `SMK BERTESTING` (ABC1234) ialah rekod ujian ESN — dikira dalam jumlah rasmi, bertanda `ujian` dan tidak disenaraikan dalam UI.
- Jadual baharu `analisis_esn_snapshots` (jsonb `data` = `EsnSnapshot`, unik `captured_on`, RLS dihidupkan) — migrasi `0057_esn_snapshots`. Import: `npm run db:import-esn -- <fail.json> [--dry-run]` (semak senarai sekolah = angka Dashboard).
- Kad "ESN" ditambah dalam jalur CoE Analytics halaman utama (`summary.ts` id `esn`, headline % murid selesai 8.7%). Modal `EsnExplore`: jalur tarikh akhir **15 Disember 2026** (`ESN_TARIKH_AKHIR`), petak KPI, ringkasan rendah/menengah, senarai sekolah (tapis status/jenis/carian).
- `TarikhAkhirBanner` diekstrak daripada `DcsExplore` dan dikongsi DCS + ESN.
- Disahkan: typecheck, build, ujian (`tests/analisis/esn.test.ts` + sedia ada), migrasi + import ke DB, pratonton dev (kad + modal, kiraan 60 hari).
- Kemas kini bulanan: log masuk ESN dalam pelayar → Claude baca semula Dashboard + Status Pelaksanaan → simpan JSON baharu → import.
