# Reka Bentuk — Laporan Akhbar (Langganan Akhbar 2026, PPD Manjung)

Tarikh: 2026-08-11  
Modul: Pelaporan / Laporan Akhbar  
Template rasmi JPN:
`docs/Template_Penyelarasan_Peruntukan_Program_Langganan_Akhbar_2026_JPN_Perak.xlsx`

## Masalah

JPN membekalkan template Excel penyelarasan peruntukan Program Langganan Akhbar
2026. Template mengandungi banyak medan berulang merentas sheet (`Data Sekolah`,
`Checklist Sekolah`, `Semakan PPD`, …). Jika setiap sekolah mengisi Excel secara
manual, data mudah tidak konsisten dan susah dikumpulkan.

Keperluan kepemimpinan:

1. Integrasikan supaya **isi sekali sahaja** di UI.
2. Sekolah isi melalui aliran berkaitan direktori (pilih sekolah).
3. PPD (admin) semak semula, betulkan jika perlu, dan ikut status.
4. Sistem **jana semula Excel rasmi** (isi ikut kod sekolah) untuk cetak/hantar JPN.
5. Nilai dropdown mesti **ketat ikut pilihan template** (`Senarai`).

## Keputusan yang telah disahkan pengguna

| # | Topik | Keputusan |
|---|--------|-----------|
| Skop | PPD | **A — Manjung sahaja** (senarai sekolah dari direktori tempatan) |
| 1 | Cara sekolah isi | **A — halaman awam**: pilih kod sekolah → isi → hantar; kemaskini kemudian dengan nombor resit/token |
| 2 | Borang UI | **A — satu borang gabungan**; eksport pecah ke sheet Excel |
| 3 | Peranan PPD | **A — senarai admin** → buka → betulkan → tandakan Disahkan / Perlu Pembetulan → eksport |
| 4 | Excel | **A — isi template rasmi**, baris Manjung sahaja, **susun ikut kod sekolah**, validasi enum di aplikasi |
| 5 | Sheet Tindakan JPN | **Tidak langsung** — biar JPN isi sendiri; eksport biarkan kosong |
| 6 | Lampiran | **Tidak perlu** — ini tinjauan/kaji selidik nombor & status sahaja |

## Di luar skop (eksplisit)

- UI atau aliran untuk mengisi `Tindakan JPN`
- Muat naik resit / PDF / gambar
- Akaun log masuk sekolah
- Seluruh Perak / PPD lain
- Menggantikan Looker DPD/PSS (modul baharu berasingan di hub `/laporan`)

## Model data (cadangan)

Jadual baharu `laporan_akhbar` (satu baris per sekolah per tahun program):

- `id` (uuid)
- `year` — tetap `2026` untuk fasa ini (kekalkan lajur untuk tahun akan datang)
- `school_code` → `schools.code` (unik bersama `year`)
- Medan sekolah (gabungan Data Sekolah + Checklist):
  - `kategori_sekolah` — enum Senarai E
  - `liputan_pkb` — `Ya` \| `Tidak`
  - `peruntukan_diterima_rm`, `perbelanjaan_digunakan_rm`, `bayaran_tertunggak_rm`
  - `dipulangkan_jpn_rm`, `tambahan_dipohon_rm`
  - `baki_peruntukan_rm` — **dikira pelayan** = peruntukan − perbelanjaan (disimpan untuk eksport stabil)
  - Checklist Ya/Tidak: `bayaran_tertunggak_selesai`, `baki_dipulangkan`, `tiada_baki_kwk`, `mohon_tambahan`, `dokumen_lengkap`
  - `status_sekolah` — `Belum` \| `Dalam Tindakan` \| `Selesai` \| `Tidak Berkaitan`
    (satu medan UI; semasa eksport ditulis ke **kedua-dua** `Data Sekolah!Status` dan
    `Checklist Sekolah!Status`)
  - `tarikh_hantar` — diisi semasa hantar/kemaskini awam
  - `catatan` — teks pilihan
- Medan semakan PPD:
  - `semakan_lengkap`, `disahkan`, `perlu_pembetulan` — Ya/Tidak (nullable sehingga admin bertindak)
  - `pegawai_ppd`, `tarikh_semakan`
  - `catatan_ppd` (pilihan)
- `receipt_token` — token rawak untuk kemaskini awam selepas hantar
- `created_at`, `updated_at`

**PPD / Nama sekolah** tidak disimpan sebagai sumber kebenaran berasingan pada eksport:
ambil semula dari `schools` + malarkan `PPD = Manjung`.

**Nilai lalai borang baharu:** `status_sekolah = Belum`; checklist Ya/Tidak tiada
lalai (wajib dipilih sebelum hantar); amaun lalai `0` atau kosong+wajib — pelaksanaan
menggunakan **kosong sehingga diisi**, server tolak hantar jika amaun wajib hilang.

### Enum rasmi (dari sheet `Senarai`)

```
YaTidak: Ya | Tidak

Status:
  Belum | Dalam Tindakan | Selesai | Tidak Berkaitan

KategoriSekolah:
  SR Luar PKB | SR Dalam PKB | SM Luar PKB | SM Dalam PKB
```

Nota: validasi dropdown x14 dalam fail template ada julat yang kelihatan tersalah
salin (cth. lajur wang dirujuk ke senarai Status). **Aplikasi mengikut makna
medan + Senarai**, bukan menyalin bug DV template secara buta.

## Aliran pengguna

### Awam — sekolah

1. Masuk hub `/laporan` → kad **Laporan Akhbar** (laluan dalaman; tidak diganti Looker).
2. Pilih kod sekolah (senarai dari direktori Manjung) + sahkan nama.
3. Jika rekod tahun 2026 **belum wujud**: borang kosong (nilai lalai Status = `Belum` jika perlu).
4. Jika rekod **sudah wujud**: mesti masukkan **nombor resit** (token) untuk buka/kemaskini.
5. Isi satu borang gabungan; UI kira `Baki` secara langsung.
6. Hantar → papar halaman berjaya dengan nombor resit + cadangan simpan/cetak resit.
7. Halaman semak status (pilihan ringan): kod + resit → lihat status sekolah & semakan PPD.

### Admin — PPD

1. Laluan tetap: `/admin/laporan-akhbar` (+ `/admin/laporan-akhbar/[kod]` untuk detail).
2. Senarai semua sekolah Manjung (dari direktori), sertakan status isi / semakan; **isih ikut kod**.
3. Buka satu sekolah: boleh edit semua medan tinjauan + medan Semakan PPD.
4. Tindakan pantas: tandakan Disahkan / Perlu Pembetulan (set enum Ya/Tidak + pegawai + tarikh).
5. Butang **Eksport Excel** → muat turun fail diisi dari template rasmi.
6. Tindakan admin: **jana semula nombor resit** jika sekolah hilang token (diaudit/log jika corak audit sedia ada).

## Pemetaan borang → sheet Excel

Satu borang UI; semasa eksport pecah:

| UI / DB | Data Sekolah | Checklist Sekolah | Semakan PPD | Tindakan JPN |
|---------|--------------|-------------------|-------------|--------------|
| Bil (1…n ikut kod) | A | A | A | — (kosong) |
| Kod / Nama | B, C | B, C | C, D | — |
| PPD = Manjung | D | — | B | — |
| Kategori, Liputan PKB | E, F | — | — | — |
| Amaun G–L + Status + Tarikh + Catatan | G–O | — | — | — |
| Checklist Ya/Tidak | — | D–H | — | — |
| Status (satu medan) | M | I | — | — |
| Semakan PPD | — | — | E–I | — |
| (tiada) | — | — | — | **biar kosong** |

`Dashboard`, `Arahan`, `Senarai` kekal dari template sejauh praktikal.

## Eksport Excel

- Pustaka: **ExcelJS** pada route/server action Next (elak openpyxl; DV x14 template
  pun tidak perlu dihasilkan semula selagi nilai yang ditulis sah).
- Buka salinan template rasmi dari `docs/…xlsx` (salin ke `public/templates/` atau
  baca dari `docs/` di pelayan — pelaksanaan pilih satu laluan stabil).
- **Tulis semua sekolah dalam direktori** (Manjung), bukan hanya yang sudah hantar.
  Baris tanpa rekod: kod/nama/PPD diisi; medan tinjauan & checklist dibiarkan kosong;
  status boleh dikosongkan (Dashboard `COUNTIF` Status akan mengira yang bertulis sahaja).
- **Isih menaik mengikut `school_code`.** Bil = 1…n.
- Tulis nilai yang sudah divalidasi (string enum tepat, nombor sebagai number).
- Lajur `Baki`: tulis **nilai dikira pelayan** (jangan bergantung pada formula yang
  mungkin rosak semasa tulis semula).
- Jangan isi `Tindakan JPN` dengan data perniagaan.
- Nama fail:
  `Laporan-Akhbar-Manjung-2026-YYYYMMDD.xlsx`

## UI / penempatan

- Awam: BM 100%, ikut kelas sedia ada (`.card`, `.input`, `.btn-primary`, …).
- Hub `/laporan`: tambah choice ketiga `akhbar` dalam `lib/laporan-entry.ts` (atau
  sambungan setara) dengan `external: false`.
- Admin: ikut corak senarai laporan DPD/PSS; RBAC — mana-mana sesi admin yang sudah
  boleh akses `/admin/laporan-dpd` (atau setara kumpulan pelaporan) boleh akses
  modul ini; jika tiada helper khusus, guna guard admin sedia ada yang paling dekat.
- Maksimum 2 aksen biru per skrin (peraturan reka bentuk projek).

## Keselamatan & integriti

- Halaman awam **tidak** melalui middleware auth (public-first).
- Kemaskini selepas hantar: wajib `receipt_token` yang sepadan.
- Semua enum divalidasi semula di server action (jangan percaya client).
- Amaun: nombor ≥ 0; tolak NaN.
- Admin sahaja boleh eksport dan tulis medan Semakan PPD.
- Jangan log/paparkan token dalam senarai admin awam; admin boleh “jana semula resit”
  jika sekolah hilang token (tindakan admin berlog).

## Rancangan ujian asap

- Pilih sekolah → hantar → resit dipaparkan → kemaskini dengan resit berjaya.
- Kemaskini tanpa resit / resit salah ditolak.
- Dropdown menolak nilai luar Senarai (ujian unit pada parser/validator).
- Admin semak → Disahkan → eksport → buka Excel: baris ikut kod, PPD Manjung,
  nilai sepadan, sheet Tindakan JPN kosong.
- Sekolah tanpa rekod masih muncul dalam eksport (kod/nama/PPD sahaja).

## Fasa pelaksanaan (ringkas)

1. Skema + migrasi + enum/validator berkongsi.
2. Query/actions awam (cipta/kemaskini + resit) + UI borang + hub laporan.
3. Admin senarai + semakan.
4. Eksport template Excel.
5. `npm run build` + `typecheck` + catat `AI_CONTEXT_LOG.md` + `codegraph sync`.
