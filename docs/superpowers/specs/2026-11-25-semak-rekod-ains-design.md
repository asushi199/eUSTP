# Semak Rekod AINS — Reka Bentuk

- **Tarikh:** 2026-11-25
- **Status:** Draf untuk semakan pengguna
- **Modul:** CoE Tools (hub baharu; alat pertama untuk GPM)
- **Laluan:** `/tools` (hub) · `/tools/semak-ains` (awam) · `/tools/semak-ains/pasang` · `/admin/semak-ains`

## 1. Ringkasan

Alat untuk Guru Perpustakaan dan Media (GPM) menyemak rekod bacaan murid yang
menunggu pengesahan dalam AINS (`ains.moe.gov.my`), mengelaskannya secara automatik
kepada **Lulus / Perlu semak / Cadang tolak**, dan meluluskan atau menolak secara
pukal. Semakan berasaskan peraturan (tanpa AI), berjalan dalam pelayar GPM; data
murid tidak dihantar ke pelayan NEXa.

Masalah yang diselesaikan: satu GPM menguruskan ratusan hingga ribuan rekod
menunggu (sampel: 1,381 dan 1,687 rekod di dua sekolah), dan rekod bermasalah
(templat, teks rawak, terlalu pendek, pendua) mudah terlepas apabila disemak satu
per satu.

## 2. Keputusan yang telah dipersetujui

| Perkara | Keputusan |
|---|---|
| Cara akses data AINS | **Penanda (bookmarklet)** dalam tab AINS + halaman semakan NEXa. Bukan sambungan pelayar, bukan pengikisan sisi pelayan. |
| Kelulusan / penolakan | **Pukal dibenarkan**, kedua-duanya. Dilaksanakan dalam tab AINS menggunakan sesi GPM sendiri. |
| AI | **Tiada dalam v1.** Pilihan fasa 2 untuk rekod kuning sahaja. |
| Akses halaman NEXa | **Awam, tanpa log masuk NEXa.** |
| Standard | **Standard lalai daerah**, GPM boleh ubah (disimpan dalam pelayar sendiri). |
| Pemantauan | **Ya — bilangan sahaja** dihantar ke NEXa (tiada data murid). |
| Skop sekolah | Semua sekolah daerah Manjung (rendah & menengah). |
| Ambang | Mengikut **bahasa sebenar rekod × tahap**, bukan jenis sekolah (sekolah menengah aliran Cina didaftarkan sebagai SMK dalam AINS). |
| Lokasi dalam laman | Hub baharu **CoE Tools** (`/tools`) untuk alat bantuan guru; Semak Rekod AINS ialah alat pertama. |

## 3. Skop

**Dalam skop (v1)**

- Penanda AINS: baca senarai rekod menunggu (dengan tapisan tahun/tingkatan dan nama kelas; tapisan tarikh luar skop v1), hantar ke NEXa, laksana arahan lulus/tolak.
- Halaman `/tools/semak-ains`: enjin semakan, keputusan tiga warna, tapisan, butiran sebab, tindakan pukal, tetapan GPM, eksport CSV, panel murid luar biasa.
- Halaman `/tools/semak-ains/pasang`: panduan pasang penanda (BM).
- Pemantauan: jadual `semak_ains_log`, API log, halaman admin `/admin/semak-ains`.
- Hub baharu **CoE Tools** (`/tools`): kad ke-6 halaman utama, item navigasi, halaman hub (§4.7).

**Luar skop (fasa 2 — lihat §12)**

- Semakan AI untuk rekod kuning.
- Medan halaman butiran (Bahasa, mukasurat, ISBN, penerbit).
- "Semak ketepatan" (bandingkan standard dengan keputusan lalu GPM).
- Cap jari rekod dalam IndexedDB untuk semakan pendua merentas sesi.

## 4. Seni bina

```
 Tab AINS (sesi GPM)                         Tab NEXa /tools/semak-ains (tanpa sesi AINS)
 ┌──────────────────────────────┐            ┌────────────────────────────────────┐
 │ Penanda (javascript: …)       │  window.open│ Halaman semakan (client component) │
 │ 1. baca senarai menunggu      │───────────▶│                                    │
 │    (GET berhalaman, dihadkan) │ postMessage │ 3. enjin semakan (dalam pelayar)   │
 │ 2. hantar rekod ──────────────┼───────────▶│ 4. papar Lulus/Semak/Tolak         │
 │                               │             │ 5. GPM pilih & tekan tindakan      │
 │ 7. sahkan (confirm) + laksana │◀───────────┼── 6. arahan {lulus|tolak, id[]}     │
 │    satu demi satu, dihadkan   │ postMessage │                                    │
 │ 8. lapor kemajuan ────────────┼───────────▶│ 9. papar kemajuan, CSV, log bilangan│
 └──────────────────────────────┘            └──────────────┬─────────────────────┘
                                                            │ POST bilangan sahaja
                                                            ▼
                                               /api/semak-ains/log → semak_ains_log
```

Prinsip:

- **Data murid kekal dalam pelayar.** Rekod hanya wujud dalam memori tab AINS dan tab NEXa.
- **NEXa tidak memegang sesi AINS.** Semua tindakan terhadap AINS dibuat oleh penanda dalam tab AINS.
- **Penanda mempercayai NEXa secara terhad:** hanya menerima mesej daripada asal (origin) NEXa, hanya untuk ID yang ia sendiri baca dalam sesi ini, dan meminta pengesahan GPM sebelum melaksana.

### 4.1 Penanda AINS (`public/tools/semak-ains/penanda.js` → `javascript:` URL)

Sumber penanda ialah fail JS biasa (ES2020, tiada `import`) di
`public/tools/semak-ains/penanda.js` yang mengandungi pemegang tempat
`__NEXA_ORIGIN__` dan pemalar `VERSI_PENANDA`. Halaman `/tools/semak-ains/pasang`
memuat fail itu, menggantikan `__NEXA_ORIGIN__` dengan `location.origin`, dan
menjana pautan `javascript:` untuk diseret ke bar penanda. Fail yang sama dimuat
oleh ujian Node.

Penanda **lengkap kendiri** (tidak memuat skrip luar ke dalam halaman AINS),
supaya jika NEXa terjejas, skop kerosakan terhad kepada arahan yang masih perlu
disahkan GPM. Kosnya: GPM perlu pasang semula apabila penanda dikemas kini —
halaman NEXa mengesan versi lama dan memaparkan arahan pasang semula.

Tanggungjawab:

1. **Semak konteks:** mesti di `ains.moe.gov.my` dan log masuk (halaman papan pemuka boleh dibaca). Jika tidak → `alert` dalam BM.
2. **Kenal pasti sekolah** daripada `document.body.innerText` halaman Portal Guru semasa: halaman Portal Guru = ada pautan `teacher-record-list` (kepala "PORTAL GURU" tersembunyi pada tetingkap sempit — disahkan 2026-11-26); nama sekolah = baris sebelum ID pengguna (`x@y`) dalam menu profil jika bermula "SEKOLAH ", jika tidak baris pertama yang bermula "SEKOLAH ". Kod sekolah daripada ID berformat `gpm@<kod>` jika `<kod>` sepadan `^[A-Z]{3}\d{4}$` (cth. `gpm@abc1234` → `ABC1234`), jika tidak, kosong. Bukan Portal Guru → minta GPM buka Papan Pemuka guru dahulu.
3. **Buka NEXa** (`window.open(__NEXA_ORIGIN__ + '/tools/semak-ains')`), tunggu mesej `sedia`, balas `sekolah`, kemudian tunggu `mula` (tapisan dipilih GPM di NEXa).
4. **Baca senarai:** `GET /web/teacher-record-list?search_status=pending&page=N` (+ tapisan pilihan `search_class_year`, `search_class_name`). 10 rekod sehalaman (tetap). Satu permintaan pada satu masa, jeda ≥ 100 ms. Ukuran sampel: ~0.4 s sehalaman (1,381 rekod ≈ 56 s).
5. **Hurai setiap rekod** daripada `#rsList [data-key] a.rec`:
   - `id` ← `href` `teacher-record-details?id=…`
   - `tajuk` ← `.rec-title`
   - `meta` ← `.rec-meta` (jenis bahan, "Dihantar <tarikh, masa>")
   - `rumusan`, `pengajaran` ← `p.rec-sum` dengan label `<b>Rumusan</b>` / `<b>Pengajaran</b>`
   - `murid` ← `.rec-murid b`, `kelas` ← `.rec-murid small` (cth. `TAHUN 4 4D`, `TINGKATAN 2 …`, `PERALIHAN …`)
6. **Hantar** rekod secara berkelompok (cth. setiap 10 halaman) supaya NEXa boleh mula menyemak lebih awal; mesej akhir `selesai-baca`.
7. **Laksana arahan** (§4.4): `confirm()` BM dengan bilangan dan jenis tindakan → untuk setiap ID, panggil fungsi kelulusan AINS yang sama digunakan oleh butang "Luluskan Rekod" / "Tolak Rekod" pada halaman butiran (parameter `id`, `status`, `comment`); jawapan dianggap berjaya hanya jika teks jawapan tepat `success`.
   - Satu demi satu, jeda lalai 500 ms (boleh ubah 300–2000 ms dalam tetapan).
   - Gagal sekali → catat dan teruskan; **3 kegagalan berturut-turut → henti** (kemungkinan sesi tamat atau AINS berubah).
   - Butang **Henti** sentiasa berfungsi (mesej `henti` dari NEXa atau panel kecil dalam tab AINS).
8. **Pengesahan selepas tindakan:** baca semula halaman menunggu yang berkaitan dan laporkan ID yang masih menunggu.

Pengesanan ralat: jika HTML yang dibaca tiada `#rsList` → anggap sesi tamat / struktur berubah, henti dan maklumkan.

### 4.2 Halaman NEXa `/tools/semak-ains`

Komponen klien di `app/(public)/tools/semak-ains/`. Tiada query DB semasa muat halaman
(tiada kos egress); hanya `POST` log bilangan.

Keadaan halaman:

1. **Belum bersambung:** arahan ringkas + pautan ke `/tools/semak-ains/pasang`. Jika dibuka terus tanpa penanda, papar panduan.
2. **Membaca:** bar kemajuan (halaman X / Y, rekod diterima).
3. **Keputusan:**
   - Ringkasan: 🟢 Lulus · 🟡 Perlu semak · 🔴 Cadang tolak (bilangan + peratus).
   - Senarai bertapis (warna, sebab, tahap, kelas, bahasa); setiap baris: tajuk, murid, kelas, sebab (BM), petikan Rumusan/Pengajaran, pautan **"Buka dalam AINS"** (`/web/teacher-record-details?id=…`).
   - Rekod kuning boleh dipilih terus (keputusan pengguna 2026-11-26 — syarat "sudah dilihat" dibuang kerana menambah satu klik); had keselamatan kekal: merah tidak boleh diluluskan pukal, hijau tidak boleh ditolak pukal.
   - Tindakan: **"Luluskan semua hijau (N)"**, **"Tolak semua merah (N)"**, serta lulus/tolak rekod terpilih. Merah tidak boleh diluluskan secara pukal; hijau tidak boleh ditolak secara pukal.
   - Komen penolakan dijana mengikut sebab (§6), boleh disunting sebelum hantar.
   - Pilihan **"Semak rawak 5 rekod hijau"** sebelum lulus pukal.
4. **Melaksana:** kemajuan per rekod, butang Henti, ringkasan berjaya/gagal.
5. **Selesai:** muat turun **CSV** (id, murid, kelas, tajuk, warna, sebab, tindakan, keputusan, masa, versi standard) — disimpan pada komputer GPM sahaja.

Panel maklumat (tidak mengubah warna):

- **Murid dengan rekod luar biasa banyak** (lalai > 50 rekod dalam kelompok ini) — untuk semakan rawak.
- Rekod dengan frasa lazim AI/terjemahan (senarai frasa) — penanda sahaja.

Tetapan GPM (laci "Tetapan"): §7.2. Lencana **"Tetapan diubah"** dan butang
**"Kembali ke standard daerah"** apabila berbeza daripada lalai.

UI 100% BM; ikut reka bentuk standard (kanvas putih, maksimum 2 unsur biru).
**Pengecualian reka bentuk terhad:** lencana/titik status tiga warna
(hijau/kuning/merah) pada ringkasan dan baris rekod sahaja — sama seperti titik
warna bilik kiosk; unsur lain kekal palet standard.

### 4.3 Enjin semakan (`lib/tools/semak-ains/`)

Fungsi tulen TypeScript, tiada kebergantungan DOM/DB, boleh diuji.

| Fail | Tanggungjawab |
|---|---|
| `jenis.ts` | Jenis `RekodAins`, `Keputusan`, `KodSebab`, `Standard`, `TetapanGpm` |
| `normal.ts` | Normalisasi teks/tajuk (huruf kecil, buang tanda baca & ruang, NFKC), `bukuSama(a,b)` |
| `bahasa.ts` | Kesan bahasa: `zh` (nisbah Han), `ta` (skrip Tamil), `bm`/`en` (skor kata henti), `campur` |
| `panjang.ts` | Kira panjang: aksara Han untuk `zh`, perkataan untuk lain-lain; per ruangan & jumlah |
| `rawak.ts` | Pengesan teks rawak/berulang (§6, R6) |
| `pendua.ts` | Kumpulan rumusan sama, templat, hantar semula, aktiviti kelas |
| `tahap.ts` | Hurai kelas → `D1–D6`, `T1–T5`, `P` → jalur `D1-2`, `D3-4`, `D5-6`, `M` |
| `standard.ts` | **Standard lalai daerah** (§7.1) + gabung dengan tetapan GPM |
| `peraturan.ts` | `semak(rekod[], standard) → Keputusan[]` |
| `komen.ts` | Templat komen penolakan BM per sebab |
| `mesej.ts` | Jenis protokol postMessage (§4.4). Penanda (JS biasa) menyalin pemalar `jenis` yang sama; ujian memastikan kedua-duanya sepadan |
| `versi.ts` | `VERSI_ENJIN`, `VERSI_PENANDA_MIN` |

### 4.4 Protokol mesej

Semua mesej `{ sumber: 'semak-ains', versi, jenis, … }`. Penerima menyemak
`event.origin` (AINS ↔ NEXa sahaja) dan `sumber`.

| Arah | `jenis` | Muatan |
|---|---|---|
| NEXa → AINS | `sedia` | `versiEnjin` |
| AINS → NEXa | `sekolah` | `nama`, `kod?`, `versiPenanda` |
| NEXa → AINS | `mula` | `tapisan: { tahun?, kelas? }` |
| AINS → NEXa | `rekod` | `rekod[]`, `halaman`, `jumlahHalaman` |
| AINS → NEXa | `selesai-baca` | `bilangan`, `ralat?`, `halamanGagal[]` |
| NEXa → AINS | `laksana` | `tindakan: 'approved'|'rejected'`, `item: {id, komen}[]`, `jedaMs` |
| AINS → NEXa | `kemajuan` | `id`, `berjaya`, `jawapan?` |
| NEXa → AINS | `henti` | — |
| AINS → NEXa | `selesai-laksana` | `berjaya`, `gagal`, `masihMenunggu[]`, `dihentikan`, `ralat?` |

Penanda menolak `laksana` untuk sebarang `id` yang tidak dibaca dalam sesi itu.

### 4.5 Pemantauan

Jadual baharu dalam `lib/schema.ts` + migrasi (dengan `ENABLE ROW LEVEL SECURITY`, tanpa polisi):

```
semak_ains_log
  id              serial pk
  dicipta_pada    timestamptz default now()
  kod_sekolah     text null        -- disahkan wujud dalam schools.code
  nama_sekolah    text not null    -- seperti dalam AINS
  jenis           text not null    -- 'semak' | 'lulus' | 'tolak'
  bil_rekod       int  not null
  bil_hijau       int  null        -- untuk 'semak'
  bil_kuning      int  null
  bil_merah       int  null
  bil_berjaya     int  null        -- untuk 'lulus' / 'tolak'
  bil_gagal       int  null
  tetapan_diubah  boolean not null default false
  tetapan         jsonb null       -- hanya medan yang berbeza daripada lalai (kecil)
  versi_enjin     text not null
  versi_penanda   text not null
```

- `POST /api/semak-ains/log` (route handler): sahkan dengan `zod`; padankan `kod_sekolah` atau nama dengan `schools` (senarai bercache sedia ada); had kasar 200 baris/sekolah/hari; tolak muatan > 4 KB. Tiada nama murid, tajuk, teks atau ID rekod.
- Data ini **petunjuk penggunaan**, bukan statistik rasmi (halaman awam tanpa log masuk boleh dihantar data palsu).
- `/admin/semak-ains` (peranan staf sedia ada): jadual per sekolah — kali terakhir guna, jumlah disemak, diluluskan/ditolak melalui alat, % merah, tetapan diubah (dengan nilai). Query agregat SQL, pilih lajur perlu sahaja; tiada cache diperlukan (trafik admin rendah).

### 4.6 Halaman pasang `/tools/semak-ains/pasang`

- Butang penanda boleh seret ke bar penanda ("Semak AINS").
- Langkah bergambar: tunjuk bar penanda (Ctrl+Shift+B), seret, log masuk AINS, klik.
- Nota: berfungsi pada Chrome/Edge komputer; tidak disokong pada telefon.
- Halaman `/tools/semak-ains` memaparkan amaran jika `versiPenanda < VERSI_PENANDA_MIN`.

### 4.7 Hub baharu CoE Tools (`/tools`)

Semak Rekod AINS ialah alat pertama dalam hub baharu **CoE Tools** — tempat
alat bantuan guru akan datang. Mengikut corak hub sedia ada (CoE Services):

- `TOOLS_HUB` dalam `lib/module-theme.ts`: `href: "/tools"`, tajuk **"CoE Tools"**,
  huraian "Alat bantuan untuk guru dan sekolah — semakan dan pengurusan yang lebih
  pantas.", `iconKey: "tools"` (ikon baharu dalam `components/home/HomeModuleIcon.tsx`),
  aksen satu warna baharu yang belum digunakan modul lain (cadangan indigo `#4F46E5`).
- `TOOLS_SECTIONS`: senarai alat; mula dengan modul **"Semak Rekod AINS"**
  (`href: "/tools/semak-ains"`, huraian "Semak dan sahkan rekod bacaan AINS murid
  secara pukal untuk GPM."). Alat baharu = tambah modul + masukkan href ke senarai ini.
- Halaman hub `app/(public)/tools/page.tsx` — senarai kad alat, ikut susun atur
  halaman hub CoE Services.
- `HOME_MODULES` (`lib/home-modules.ts`): kad ke-6 **CoE Tools** (kepala berwarna
  penuh seperti kad lain); grid `sm:2 / xl:3` menjadi genap (3×2).
- `PUBLIC_NAV` (`lib/public-navigation.ts`): item `tools` — bar sisi desktop;
  telefon dalam helaian **Lagi** (`mobile: "more"`; 4 tab bawah tidak berubah).
- Kemas kini `CLAUDE.md` (halaman utama kini 6 kad `HOME_MODULES`).
- Hub dilancarkan bersama Semak Rekod AINS (tiada hub kosong di produksi).

## 5. Struktur AINS yang dijadikan kebergantungan

Diperhati 2026-11-25 (portal guru, aplikasi dipapar pelayan, jQuery):

- Senarai: `/web/teacher-record-list` — borang GET (`keyword`, `search_status` = `pending|approved|rejected`, `search_class_year` = `D1–D6|T1–T5|P`, `search_class_name`, `search_start_date`, `search_end_date`); 10 rekod sehalaman, parameter `per-page` diabaikan.
- Butiran: `/web/teacher-record-details?id=<uuid>` — medan tambahan (Kategori, Jenis Bahan, Bahasa, Penulis, ISBN, Bilangan Mukasurat, Penerbit, Penilaian) + butang lulus/tolak dengan "Komen untuk murid".
- Papan pemuka: `/web/teacher-dashboard` — nama sekolah, ID pengguna, jumlah menunggu.

Jika struktur ini berubah, hanya penanda (§4.1) perlu dikemas kini. Isu
keselamatan yang diperhati pada AINS dilaporkan berasingan kepada KPM dan tidak
didokumenkan di sini.

## 6. Katalog peraturan

Warna rekod = merah jika ada sebab merah; kuning jika ada sebab kuning; jika tidak, hijau.

**🔴 Cadang tolak**

| Kod | Peraturan | Komen lalai kepada murid |
|---|---|---|
| R1 `ruangan-kosong` | Rumusan atau Pengajaran di bawah minimum ruangan (zh < 5 aksara; lain < 3 perkataan) | Rumusan/Pengajaran tidak lengkap. Sila tulis semula dengan lengkap. |
| R2 `terlalu-pendek` | Jumlah panjang < ambang merah (§7.1) | Rumusan dan pengajaran terlalu pendek. Sila huraikan isi buku dengan ayat sendiri. |
| R3 `templat` | Rumusan sama (normal, ≥ 40 aksara) digunakan untuk ≥ 3 buku berbeza (oleh sesiapa dalam kelompok) | Rumusan ini sama dengan rekod buku lain. Sila tulis rumusan khusus untuk buku ini. |
| R4 `rumusan-sama-pengajaran` | Rumusan dan Pengajaran sama selepas normalisasi | Rumusan dan pengajaran tidak boleh sama. |
| R5 `hantar-semula-sama` | Murid sama, buku sama (`bukuSama`), rumusan sama | Rekod ini telah dihantar sebelum ini. |
| R6 `teks-rawak` | Mana-mana: (a) perkataan unik < 35% (≥ 8 perkataan) atau bigram Han unik < 40% (≥ 40 aksara); (b) perkataan sama berturut ≥ 6 kali; (c) corak papan kekunci (`asdf`, `qwer`, …); (d) ≥ 30% token Latin ≥ 4 huruf tanpa vokal / ≥ 5 konsonan berturut; (e) ≥ 5 kes huruf/angka Latin terselit antara aksara Han (sisa IME); (f) huruf dijarakkan (≥ 8 huruf tunggal berturut dipisah ruang) | Teks tidak dapat difahami. Sila tulis semula rumusan dan pengajaran. |
| R7 `bahasa-tak-sepadan` | Tajuk mengandungi aksara Han/Tamil tetapi teks tidak | Rumusan hendaklah dalam bahasa buku yang dibaca. |

**🟡 Perlu semak**

| Kod | Peraturan |
|---|---|
| Y1 `agak-pendek` | Ambang merah ≤ panjang < ambang kuning |
| Y2 `terlalu-panjang` | Panjang > ambang panjang (§7.1) |
| Y3 `rumusan-sama-2-buku` | Rumusan sama untuk tepat 2 buku berbeza |
| Y4 `sama-murid-lain` | Rumusan sama dengan murid lain bagi buku sama, **bukan** aktiviti kelas |
| Y5 `buku-sama-berulang` | Murid sama, buku sama, rumusan berbeza |
| Y6 `simbol-pengisi` | Tanda baca/simbol sama berulang ≥ 8 kali (cth. `........`, `,,,,,,`, `()()()`) |
| Y8/R8 `bahasa-bercampur` (pilihan, lalai **mati**) | Bahasa Rumusan dan Pengajaran dikesan berasingan; kedua-duanya bm/en/zh/ta tetapi berbeza (`campur`/`lain` tidak mencetus). Tahap mengikut tetapan `bahasaBercampur` (merah / kuning / abai). Sebab lalai mati: di sesetengah SK, Rumusan BI + Pengajaran BM lazim dan diluluskan. |

**Pengecualian:** rumusan sama oleh murid berlainan, buku sama, **kelas sama dan
hari sama** = aktiviti kelas → tidak dikenakan Y4 (boleh ditukar dalam tetapan).

**Tidak digunakan** (diuji dan ditolak): bilangan hantaran sehari (lazim dalam
rekod yang diluluskan); campuran BM/BI dalam satu rekod (kini pilihan Y8/R8, lalai mati, boleh dihidupkan GPM); huruf panjang
(`kesayangannyaaaa`) dan kata ganda BM (`labah labah`) tidak dikira rawak.

**Penanda maklumat** (tidak mengubah warna): murid > 50 rekod dalam kelompok;
frasa lazim AI/terjemahan; (pilihan, lalai **mati**) "Pengajaran tiada unsur
pengajaran" — jika dihidupkan GPM, menjadi Y7.

**Kesamaan buku (`bukuSama`)**: tajuk dinormalkan sama, atau salah satu
mengandungi yang lain (kedua-duanya ≥ 6 aksara selepas normalisasi) — menampung
variasi seperti "MODUL X - BAB Y" / "BAB Y".

**Skop perbandingan pendua (v1):** rekod dalam kelompok yang dibaca sahaja
(menunggu, mengikut tapisan). Rekod ditolak sebelum ini tidak dibandingkan.

## 7. Standard dan tetapan

### 7.1 Standard lalai daerah (`lib/tools/semak-ains/standard.ts`)

Panjang = Rumusan + Pengajaran. Perkataan untuk BM/BI/Tamil/campuran; aksara Han untuk Cina.

| Bahasa | Ukuran | Jalur | 🔴 di bawah | 🟡 di bawah | 🟡 melebihi |
|---|---|---|---|---|---|
| BM / BI / Tamil | perkataan | Tahun 1–2 | 6 | 12 | 250 |
| | | Tahun 3–4 | 10 | 20 | 250 |
| | | Tahun 5–6 | 10 | 20 | 250 |
| | | Menengah / Peralihan | 15 | 25 | 400 |
| Cina | aksara | Tahun 1–2 | 40 | 60 | 500 |
| | | Tahun 3–4 | 60 | 100 | 500 |
| | | Tahun 5–6 | 80 | 120 | 500 |
| | | Menengah / Peralihan | 60 | 150 | 800 |

Minimum ruangan: Cina 5 aksara; lain-lain 3 perkataan. Ambang Tahun 1–2 dan
Tamil masih **sementara** (sampel kecil) — semak semula selepas perintis.

Perubahan standard daerah = suntingan kod (`standard.ts`) + naikkan `VERSI_ENJIN`.

### 7.2 Tetapan GPM

- Disimpan dalam `localStorage` pelayar GPM, kunci `semak-ains:tetapan:<kod atau nama sekolah>`.
- Boleh ubah: semua ambang §7.1; Y4 aktiviti kelas (benarkan / kuning); R5/Y5 (tolak / kuning / benarkan); R7 (hidup / mati); Y7 pengajaran (hidup / mati); Y8/R8 bahasa bercampur (merah / kuning / abai, lalai abai); ambang murid luar biasa; templat komen; jeda tindakan.
- Perbezaan daripada lalai dihantar bersama log pemantauan (`tetapan`).

## 8. Privasi dan keselamatan

- Data murid (nama, kelas, teks) hanya dalam memori pelayar GPM; CSV disimpan oleh GPM sendiri. Tiada data murid dalam DB NEXa, log pelayan atau analitik.
- Tiada kata laluan AINS/DELIMa dikendalikan oleh NEXa; penanda menggunakan sesi GPM yang sudah log masuk.
- `postMessage` dengan semakan `origin` dua hala; senarai putih ID; `confirm()` sebelum setiap kelompok tindakan.
- Penanda kendiri (tiada skrip jauh dimuat ke halaman AINS).
- Beban AINS: permintaan bersiri dengan jeda; tiada akses selari.
- Data ujian & fixture: **teks sintetik sahaja**, jangan salin rekod sebenar murid ke repositori (repo awam).
- Sebelum pelancaran daerah: maklumkan KPM tentang isu keselamatan yang diperhati pada AINS (saluran helpdesk) dan dapatkan pengesahan JPN/KPM bahawa kelulusan berbantu alat dibenarkan.

## 9. Ralat dan kes tepi

| Keadaan | Tindakan |
|---|---|
| Penanda diklik di luar AINS / belum log masuk | `alert` BM, tiada tindakan |
| Tab NEXa disekat pop-up | `alert` BM: benarkan pop-up untuk ains.moe.gov.my |
| HTML tanpa `#rsList` semasa membaca | Henti, maklum "Sesi AINS tamat atau halaman berubah" |
| Bacaan separa (ralat rangkaian) | Cuba semula halaman itu 2 kali; jika gagal, teruskan dan laporkan halaman tertinggal |
| Jawapan kelulusan ≠ `success` | Catat gagal; 3 berturut → henti |
| Tab NEXa ditutup semasa melaksana | Penanda henti selepas rekod semasa (tiada penerima kemajuan) |
| Versi penanda lama | NEXa papar arahan pasang semula; tindakan pukal dimatikan |
| Senarai berubah semasa tindakan | Tindakan berasaskan ID, bukan halaman; semakan semula selepas selesai |

## 10. Pengujian

- Ujian unit enjin dengan `node:test` melalui `tsx` (tiada kebergantungan baharu): `npm run test:tools` → `tsx --test "lib/tools/**/*.test.ts"`.
- Fixture sintetik untuk setiap kod sebab (R1–R7, Y1–Y6), pengecualian aktiviti kelas, `bukuSama`, pengesanan bahasa (zh/ta/bm/en/campur), kata ganda BM tidak dikira rawak.
- Penghurai penanda bergantung pada `DOMParser` (tiada dalam Node) — disahkan secara manual dalam tab AINS yang log masuk; ujian Node memastikan pemalar `jenis` mesej dalam `penanda.js` sepadan dengan `mesej.ts`.
- Ujian manual (perintis): satu sekolah, satu tahap; bandingkan keputusan alat dengan semakan GPM; ukur masa baca dan masa tindakan.
- Selepas fasa: `npm run build` + `npm run typecheck` + smoke `/tools`, `/tools/semak-ains`, `/tools/semak-ains/pasang`, `/admin/semak-ains`, API log; catat dalam `AI_CONTEXT_LOG.md`.

## 11. Data kalibrasi (2026-11-25, tanpa nama)

Dibaca baca-sahaja dalam pelayar GPM, statistik agregat sahaja; tiada data murid disimpan.

| Sekolah | Jenis | Menunggu | Rujukan keputusan GPM | Penemuan utama |
|---|---|---|---|---|
| A | SJKC | 150 | 456 ditolak, 200 diluluskan | Ditolak didominasi templat (satu teks untuk ≤ 79 tajuk), rumusan = pengajaran, tajuk Cina + teks BI. Diluluskan: median ~295 aksara (T5–6). Teks sama 2–3 murid, buku/kelas/hari sama = aktiviti kelas (diluluskan). |
| B | SK kecil | 250 | 70 ditolak, 300 diluluskan | Teks sangat pendek (diluluskan median ~30 perkataan, ada 4–9 perkataan). Pemisah lulus/tolak ~10–16 perkataan. Ditolak: 97% ditanda merah/kuning (v1). |
| C | SJKT | 1,687 | — | BM 45%, BI 47%, Tamil 7%; tajuk Tamil kebanyakan dirumikan. 69 rekod teks gelung berulang. Satu murid 224 menunggu. |
| D | SMK | 637 | — | 91% T4, hampir semua BM; modul KPM berulang dengan variasi tajuk → keperluan `bukuSama`. |
| E | SMK aliran Cina | 14 | 447 ditolak, 400 diluluskan | Pengajaran Cina selalunya satu ayat (6–20 aksara) dan diluluskan → minimum ruangan 5 aksara. Sisa IME, huruf tanpa vokal, simbol berulang dikesan. Frasa AI lebih kerap dalam diluluskan (9) berbanding ditolak (1) → bukan peraturan. |
| F | SK besar | 1,381 | 46 diluluskan | 92.5% hijau, 1% merah; satu murid 443 menunggu. 1,381 rekod dibaca dalam 56 s. |

Ketepatan (standard akhir kecuali dinyatakan):

| Sekolah | Ditolak GPM → merah/kuning | Diluluskan GPM → merah |
|---|---|---|
| B | 97% (v1) | ~3% (anggaran selepas pembaikan) |
| E | ~62–70% | 3% (sebahagian ialah keciciran GPM) |
| F | — | 1/46 (teks gelung yang diluluskan) |

Had yang diketahui: salinan blurb penerbit, teks AI dan salinan verbatim buku
tidak dapat dikesan dengan peraturan.

## 12. Fasa 2 (cadangan, luar skop v1)

1. **Semakan AI** untuk rekod kuning sahaja, dicetus GPM, tanpa nama murid; perlu bajet API dan kelulusan KPM/JPN untuk menghantar teks murid ke perkhidmatan luar.
2. **Medan butiran** (Bahasa, Bilangan Mukasurat, ISBN, Penulis = Penerbit) — baca halaman butiran secara terhad untuk R7 Tamil dan semakan metadata.
3. **Semak ketepatan**: baca rekod diluluskan/ditolak sekolah, kira padanan dengan standard, cadang ambang.
4. **Cap jari IndexedDB** (hash sahaja) untuk pendua merentas sesi dan semakan tambahan sahaja.
5. **Rumusan tahunan** pemantauan untuk laporan USTP.

## 13. Risiko

| Risiko | Mitigasi |
|---|---|
| AINS ubah struktur HTML / fungsi kelulusan | Penghurai terpencil dalam penanda; pengesanan ralat awal; versi minimum |
| Dasar KPM melarang kelulusan berbantu alat | Sahkan dengan JPN/KPM sebelum pelancaran daerah; mula dengan perintis |
| Positif palsu menolak rekod baik | Merah hanya untuk peraturan berkeyakinan tinggi; komen boleh disunting; GPM boleh ubah ambang; CSV untuk audit |
| Beban pada AINS | Bersiri + jeda; tiada akses selari |
| Log pemantauan palsu | Dianggap petunjuk sahaja; had kadar kasar |
| Penanda tidak disokong (telefon / pelayar terkawal) | Halaman pasang menyatakan keperluan; fasa kemudian boleh pertimbang sambungan pelayar |
