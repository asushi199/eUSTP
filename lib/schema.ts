import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  uuid,
  integer,
  primaryKey,
  date,
  doublePrecision,
  jsonb,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/* ============================== Auth ============================== */

export const peranan = pgEnum("peranan", ["Admin", "Pegawai", "PKG_Admin"]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    nama: text("nama").notNull(),
    jawatan: text("jawatan").notNull().default(""),
    peranan: peranan("peranan").notNull().default("Pegawai"),
    /** Skop PKG untuk PKG_Admin (slug pkg, cth. "sitiawan"); null untuk peranan lain. */
    pkgId: text("pkg_id"),
    aktif: boolean("aktif").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(t.username),
    aktifIdx: index("users_aktif_idx").on(t.aktif),
  }),
);

/* ==================== Modul Direktori (jadual induk sekolah dikongsi) ==================== */

/**
 * Kod jawatan Direktori. Nama enum lama dikekalkan supaya migrasi pangkalan data
 * tidak memutuskan rekod GPICT/DELIMa/GPM yang sedia ada.
 */
export const teacherRole = pgEnum("teacher_role", [
  "PGB",
  "PK_PENTADBIRAN",
  "PK_HEM",
  "PK_KOKURIKULUM",
  "PK_PETANG",
  "PK_PPKI",
  "GPICT",
  "DELIMA",
  "GPM",
]);

/** Jadual induk sekolah — dikongsi oleh modul Direktori dan Laporan PSS. */
export const schools = pgTable(
  "schools",
  {
    code: text("code").primaryKey(),
    name: text("name").notNull(),
    /** Zon PKG (cth. "PKG Sitiawan"). */
    zone: text("zone").notNull().default(""),
    /** Laman web rasmi sekolah (URL penuh; kosong jika tiada). */
    website: text("website").notNull().default(""),
    currentVersionId: uuid("current_version_id").references(
      (): AnyPgColumn => contactVersions.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    currentVersionIdx: index("schools_current_version_id_idx").on(t.currentVersionId),
  }),
);

export const contactVersions = pgTable(
  "contact_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    schoolCode: text("school_code")
      .notNull()
      .references(() => schools.code, { onDelete: "cascade" }),
    schoolName: text("school_name").notNull(),
    zone: text("zone").notNull().default(""),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    submitterName: text("submitter_name"),
    submitterPhone: text("submitter_phone"),
    source: text("source"),
    isHidden: boolean("is_hidden").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    schoolCodeIdx: index("contact_versions_school_code_idx").on(
      t.schoolCode,
      t.submittedAt.desc(),
    ),
  }),
);

export const contactRoles = pgTable(
  "contact_roles",
  {
    versionId: uuid("version_id")
      .notNull()
      .references(() => contactVersions.id, { onDelete: "cascade" }),
    role: teacherRole("role").notNull(),
    teacherName: text("teacher_name").notNull().default(""),
    /** Nombor paparan (format tempatan, cth. 0123456789). */
    phone: text("phone").notNull().default(""),
    /** Nombor mudah alih Malaysia dalam format 60XXXXXXXXX untuk pautan WhatsApp/filter. */
    phoneNormalized: text("phone_normalized").notNull().default(""),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.versionId, t.role] }),
  }),
);

/* ==================== Modul Laporan (DPD + PSS) ==================== */

export const laporanStatus = pgEnum("laporan_status", ["BARU", "DISEMAK", "SELESAI"]);
export const laporanModul = pgEnum("laporan_modul", ["dpd", "pss"]);

/** Laporan DPD — program pendigitalan (dahulunya GAS "gas dpd.txt" v3.9). */
export const laporanDpd = pgTable(
  "laporan_dpd",
  {
    id: serial("id").primaryKey(),
    tarikh: date("tarikh").notNull(),
    /** Kod & nama sekolah / organisasi penganjur. */
    organisasi: text("organisasi").notNull(),
    namaProgram: text("nama_program").notNull(),
    lokasi: text("lokasi").notNull().default(""),
    jenisProgram: text("jenis_program").notNull().default(""),
    bilMurid: integer("bil_murid").notNull().default(0),
    bilGuru: integer("bil_guru").notNull().default(0),
    bilPentadbir: integer("bil_pentadbir").notNull().default(0),
    bilSwasta: integer("bil_swasta").notNull().default(0),
    teras: text("teras").notNull().default(""),
    strategi: text("strategi").notNull().default(""),
    inisiatif: text("inisiatif").notNull().default(""),
    emailPelapor: text("email_pelapor").notNull().default(""),
    status: laporanStatus("status").notNull().default("BARU"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tarikhIdx: index("laporan_dpd_tarikh_idx").on(t.tarikh),
    statusIdx: index("laporan_dpd_status_idx").on(t.status),
  }),
);

/** Laporan PSS — aktiviti Pusat Sumber Sekolah (dahulunya GAS "code.gs"). */
export const laporanPss = pgTable(
  "laporan_pss",
  {
    id: serial("id").primaryKey(),
    schoolCode: text("school_code")
      .notNull()
      .references(() => schools.code, { onDelete: "restrict" }),
    /** Snapshot nama sekolah semasa hantaran. */
    schoolName: text("school_name").notNull(),
    namaProgram: text("nama_program").notNull(),
    tarikhMula: date("tarikh_mula").notNull(),
    tarikhTamat: date("tarikh_tamat"),
    pelapor: text("pelapor").notNull().default(""),
    jawatan: text("jawatan").notNull().default(""),
    bilGuru: integer("bil_guru").notNull().default(0),
    bilMurid: integer("bil_murid").notNull().default(0),
    objektif: text("objektif").notNull().default(""),
    ringkasan: text("ringkasan").notNull().default(""),
    impak: text("impak").notNull().default(""),
    status: laporanStatus("status").notNull().default("BARU"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tarikhIdx: index("laporan_pss_tarikh_mula_idx").on(t.tarikhMula),
    schoolIdx: index("laporan_pss_school_code_idx").on(t.schoolCode),
  }),
);

/** Gambar laporan (dikongsi DPD + PSS) — fail sebenar di Google Drive. */
export const laporanPhotos = pgTable(
  "laporan_photos",
  {
    id: serial("id").primaryKey(),
    modul: laporanModul("modul").notNull(),
    laporanId: integer("laporan_id").notNull(),
    /** "drive/{fileId}" — rujukan padam melalui GAS. */
    storagePath: text("storage_path").notNull(),
    publicUrl: text("public_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    laporanIdx: index("laporan_photos_modul_laporan_idx").on(t.modul, t.laporanId),
  }),
);

/**
 * Laporan Akhbar — tinjauan penyelarasan peruntukan Langganan Akhbar (JPN Perak).
 * Satu baris per sekolah per tahun program. Lihat docs/superpowers/specs/2026-08-11-laporan-akhbar-design.md.
 */
export const laporanAkhbar = pgTable(
  "laporan_akhbar",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    year: integer("year").notNull().default(2026),
    schoolCode: text("school_code")
      .notNull()
      .references(() => schools.code, { onDelete: "restrict" }),
    kategoriSekolah: text("kategori_sekolah").notNull(),
    liputanPkb: text("liputan_pkb").notNull(),
    peruntukanDiterimaRm: doublePrecision("peruntukan_diterima_rm").notNull().default(0),
    perbelanjaanDigunakanRm: doublePrecision("perbelanjaan_digunakan_rm").notNull().default(0),
    bayaranTertunggakRm: doublePrecision("bayaran_tertunggak_rm").notNull().default(0),
    bakiPeruntukanRm: doublePrecision("baki_peruntukan_rm").notNull().default(0),
    dipulangkanJpnRm: doublePrecision("dipulangkan_jpn_rm").notNull().default(0),
    tambahanDipohonRm: doublePrecision("tambahan_dipohon_rm").notNull().default(0),
    bayaranTertunggakSelesai: text("bayaran_tertunggak_selesai").notNull(),
    bakiDipulangkan: text("baki_dipulangkan").notNull(),
    tiadaBakiKwk: text("tiada_baki_kwk").notNull(),
    mohonTambahan: text("mohon_tambahan").notNull(),
    dokumenLengkap: text("dokumen_lengkap").notNull(),
    statusSekolah: text("status_sekolah").notNull().default("Belum"),
    tarikhHantar: timestamp("tarikh_hantar", { withTimezone: true }),
    catatan: text("catatan").notNull().default(""),
    semakanLengkap: text("semakan_lengkap"),
    disahkan: text("disahkan"),
    perluPembetulan: text("perlu_pembetulan"),
    pegawaiPpd: text("pegawai_ppd").notNull().default(""),
    tarikhSemakan: date("tarikh_semakan"),
    catatanPpd: text("catatan_ppd").notNull().default(""),
    receiptToken: text("receipt_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    schoolYearUq: uniqueIndex("laporan_akhbar_school_year_uq").on(t.schoolCode, t.year),
    yearIdx: index("laporan_akhbar_year_idx").on(t.year),
    statusIdx: index("laporan_akhbar_status_idx").on(t.statusSekolah),
  }),
);

/* ==================== Modul Kandungan (Sumber USTP + Bahan Sokongan) ==================== */

export const kandunganTopik = pgEnum("kandungan_topik", [
  "integrasi",
  "hebahan",
  "itm",
  "pembudayaan",
  "pemerkasaan",
  "bahan_sokongan",
]);

export const kandunganCardType = pgEnum("kandungan_card_type", [
  "pdf",
  "canva",
  "gdoc",
  "embed",
  "youtube",
  "image",
  "link",
]);

/**
 * Kad kandungan — denormalised mengikut bentuk Sheet asal (medan subtopik
 * berulang setiap baris). "Group edit" subtopik = satu UPDATE WHERE topik+subtopikKey.
 */
export const kandunganCards = pgTable(
  "kandungan_cards",
  {
    id: serial("id").primaryKey(),
    topik: kandunganTopik("topik").notNull(),
    subtopikKey: text("subtopik_key").notNull().default(""),
    subtopikTitle: text("subtopik_title").notNull().default(""),
    subtopikSort: integer("subtopik_sort").notNull().default(999),
    subtopikBlurb: text("subtopik_blurb").notNull().default(""),
    subtopikIcon: text("subtopik_icon").notNull().default(""),
    sort: integer("sort").notNull().default(0),
    title: text("title").notNull(),
    blurb: text("blurb").notNull().default(""),
    url: text("url").notNull(),
    type: kandunganCardType("type").notNull().default("pdf"),
    /** URL alternatif untuk pratonton (jika berbeza dari url penuh). */
    previewUrl: text("preview_url").notNull().default(""),
    aktif: boolean("aktif").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    topikIdx: index("kandungan_cards_topik_idx").on(t.topik, t.subtopikSort, t.sort),
  }),
);

/* ==================== Modul Analisis USTP ==================== */

export const analisisModul = pgEnum("analisis_modul", [
  "delima",
  "dcs",
  "ains",
  "pensijilan",
  "optik",
]);

/** Metrik/konfigurasi KV per modul (cth. kpi_guru, tov, capai, intro). */
export const analisisMetrics = pgTable(
  "analisis_metrics",
  {
    id: serial("id").primaryKey(),
    modul: analisisModul("modul").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    modulKeyIdx: uniqueIndex("analisis_metrics_modul_key_idx").on(t.modul, t.key),
  }),
);

/** Siri bulanan (DELIMa guru/murid %; boleh dipakai modul lain kelak). */
export const analisisMonthly = pgTable(
  "analisis_monthly",
  {
    id: serial("id").primaryKey(),
    modul: analisisModul("modul").notNull(),
    monthLabel: text("month_label").notNull(),
    chartLabel: text("chart_label").notNull().default(""),
    guruPct: doublePrecision("guru_pct"),
    muridPct: doublePrecision("murid_pct"),
    includeChart: boolean("include_chart").notNull().default(true),
    sort: integer("sort").notNull().default(0),
  },
  (t) => ({
    modulIdx: index("analisis_monthly_modul_idx").on(t.modul, t.sort),
  }),
);

/** Baris pecahan kategori (cth. Pensijilan: kind="lokasi"|"sekolah"). */
export const analisisBreakdown = pgTable(
  "analisis_breakdown",
  {
    id: serial("id").primaryKey(),
    modul: analisisModul("modul").notNull(),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    value: doublePrecision("value").notNull().default(0),
    sort: integer("sort").notNull().default(0),
  },
  (t) => ({
    modulKindIdx: index("analisis_breakdown_modul_kind_idx").on(t.modul, t.kind, t.sort),
  }),
);

/* ==================== Maklumat Asas ==================== */

/** Pegawai USTP/PPD — dipapar di halaman Maklumat Asas. */
export const pegawai = pgTable("pegawai", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  jawatan: text("jawatan").notNull().default(""),
  telefon: text("telefon").notNull().default(""),
  /** URL foto — aset public/ atau pautan luaran. */
  photoUrl: text("photo_url").notNull().default(""),
  detailUrl: text("detail_url").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  aktif: boolean("aktif").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Tetapan aplikasi KV (kalendar_embed_url, carta_organisasi_url, info_pkg_url, …). */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Jejak audit tindakan admin direktori (restore, tukar nama, dll.). */
export const adminActions = pgTable("admin_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  schoolCode: text("school_code").references(() => schools.code, { onDelete: "set null" }),
  versionId: uuid("version_id").references(() => contactVersions.id, { onDelete: "set null" }),
  actorUserId: integer("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ==================== Modul Tempahan PKG (multi-tenant) ==================== */

export const bookingSlot = pgEnum("booking_slot", ["am", "pm", "full_day"]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);

/**
 * PKG (tenant). Log masuk pentadbir kini melalui Auth.js
 * (users.pkgId untuk PKG_Admin) — tiada lagi admin_password_hash per PKG.
 */
export const pkgs = pgTable("pkgs", {
  /** slug, cth. "sitiawan", "pantai-remis" */
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  whatsappAdminPhone: text("whatsapp_admin_phone"),
  equipmentManagerName: text("equipment_manager_name"),
  equipmentManagerPosition: text("equipment_manager_position"),
  equipmentManagerPhone: text("equipment_manager_phone"),
  logoSrc: text("logo_src"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pkgId: text("pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "cascade" }),
    /** unik dalam satu PKG */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    category: text("category").notNull().default(""),
    /** Kapasiti bilik (bilangan orang). Paparan awam: "10 pax". */
    capacity: integer("capacity"),
    imageSrc: text("image_src"),
    amenities: jsonb("amenities").$type<string[]>().notNull().default([]),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pkgSlugIdx: uniqueIndex("rooms_pkg_slug_idx").on(t.pkgId, t.slug),
    pkgActiveIdx: index("rooms_pkg_active_idx").on(t.pkgId, t.active, t.sortOrder),
  }),
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pkgId: text("pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "cascade" }),
    /** merujuk rooms.slug dalam PKG yang sama */
    roomSlug: text("room_slug").notNull(),
    date: date("date").notNull(),
    slot: bookingSlot("slot").notNull(),
    name: text("name").notNull(),
    schoolOrUnit: text("school_or_unit").notNull(),
    purpose: text("purpose").notNull(),
    contact: text("contact").notNull(),
    contactNormalized: text("contact_normalized").notNull().default(""),
    status: bookingStatus("status").notNull().default("pending"),
    approvalTokenHash: text("approval_token_hash"),
    /** token QR pendaftaran kehadiran awam (legacy — rekod lama sahaja) */
    attendanceToken: text("attendance_token"),
    /** token urus senarai kehadiran (legacy — rekod lama sahaja) */
    attendanceManageToken: text("attendance_manage_token"),
    /** Adakah program ini perlu sijil di Autosijil */
    requiresCertificate: boolean("requires_certificate").notNull().default(false),
    /** Token awam untuk halaman cetak poster kehadiran */
    cetakToken: text("cetak_token"),
    autosijilEventId: text("autosijil_event_id"),
    autosijilEventSlug: text("autosijil_event_slug"),
    autosijilPublicUrl: text("autosijil_public_url"),
    autosijilAdminUrl: text("autosijil_admin_url"),
    /** pending | synced | failed | cancelled */
    autosijilSyncStatus: text("autosijil_sync_status"),
    autosijilSyncError: text("autosijil_sync_error"),
    autosijilSyncedAt: timestamp("autosijil_synced_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    activeLookupIdx: index("bookings_active_lookup_idx").on(
      t.pkgId,
      t.date,
      t.roomSlug,
      t.slot,
      t.status,
    ),
    contactLookupIdx: index("bookings_contact_lookup_idx").on(
      t.pkgId,
      t.contactNormalized,
      t.status,
    ),
    attendanceTokenIdx: index("bookings_attendance_token_idx").on(t.attendanceToken),
    manageTokenIdx: index("bookings_manage_token_idx").on(t.attendanceManageToken),
    cetakTokenIdx: index("bookings_cetak_token_idx").on(t.cetakToken),
    autosijilEventIdx: index("bookings_autosijil_event_id_idx").on(t.autosijilEventId),
  }),
);

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pkgId: text("pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "cascade" }),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bookingIdx: index("attendees_booking_idx").on(t.pkgId, t.bookingId, t.createdAt),
  }),
);

/* ==================== Peminjaman Peralatan Maker Lab ==================== */

export const equipmentUnitStatus = pgEnum("equipment_unit_status", [
  "available",
  "reserved",
  "borrowed",
  "maintenance",
  "retired",
  "lost",
]);

export const equipmentLoanStatus = pgEnum("equipment_loan_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "handed_over",
  "returned",
]);

export const equipmentSignatureRole = pgEnum("equipment_signature_role", [
  "borrower",
  "approver",
  "returner",
  "receiver",
]);

export const equipmentDocumentStage = pgEnum("equipment_document_stage", [
  "handover",
  "final",
]);

export const equipmentDocumentStatus = pgEnum("equipment_document_status", [
  "generating",
  "ready",
  "failed",
]);

export type EquipmentSignatureStroke = Array<{
  x: number;
  y: number;
}>;

/** Kategori umum yang dipilih pemohon, contohnya Komputer riba. */
export const equipmentCategories = pgTable(
  "equipment_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    searchAliases: jsonb("search_aliases").$type<string[]>().notNull().default([]),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex("equipment_categories_code_idx").on(t.code),
    activeIdx: index("equipment_categories_active_idx").on(
      t.active,
      t.sortOrder,
      t.name,
    ),
  }),
);

/** Jenis/model peralatan yang dikongsi oleh semua PKG. */
export const equipmentTypes = pgTable(
  "equipment_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => equipmentCategories.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    model: text("model").notNull().default(""),
    description: text("description").notNull().default(""),
    /** Spesifikasi teknikal yang dipaparkan sebagai senarai. */
    specifications: jsonb("specifications").$type<string[]>().notNull().default([]),
    /** Alias carian tersembunyi, termasuk istilah Inggeris. */
    searchAliases: jsonb("search_aliases").$type<string[]>().notNull().default([]),
    /** Komponen yang membentuk satu set, jika berkenaan. */
    components: jsonb("components").$type<string[]>().notNull().default([]),
    unitPriceCents: integer("unit_price_cents"),
    receivedDate: date("received_date"),
    receiptDocumentUrl: text("receipt_document_url"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    codeIdx: uniqueIndex("equipment_types_code_idx").on(t.code),
    categoryIdx: index("equipment_types_category_idx").on(
      t.categoryId,
      t.active,
      t.sortOrder,
    ),
    activeIdx: index("equipment_types_active_idx").on(t.active, t.sortOrder, t.name),
  }),
);

/** Satu baris mewakili satu unit/set fizikal sebenar. */
export const equipmentUnits = pgTable(
  "equipment_units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    equipmentTypeId: uuid("equipment_type_id")
      .notNull()
      .references(() => equipmentTypes.id, { onDelete: "restrict" }),
    pkgId: text("pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    serialNo: text("serial_no").notNull(),
    /** Belum wajib sehingga nombor aset kerajaan diterima. */
    governmentAssetNo: text("government_asset_no"),
    /** Tarikh tepat diutamakan; tahun digunakan apabila maklumat terhad. */
    acquisitionDate: date("acquisition_date"),
    acquisitionYear: integer("acquisition_year"),
    status: equipmentUnitStatus("status").notNull().default("available"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    typeSerialIdx: uniqueIndex("equipment_units_type_serial_idx").on(
      t.equipmentTypeId,
      t.serialNo,
    ),
    governmentAssetIdx: uniqueIndex("equipment_units_government_asset_idx").on(
      t.governmentAssetNo,
    ),
    pkgStatusIdx: index("equipment_units_pkg_status_idx").on(
      t.pkgId,
      t.status,
      t.equipmentTypeId,
    ),
  }),
);

/** Satu rekod bagi setiap urusan pindahan, termasuk maklumat KEW.PA-17 yang dibekukan. */
export const equipmentTransferBatches = pgTable(
  "equipment_transfer_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNo: text("reference_no").notNull(),
    fromPkgId: text("from_pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    toPkgId: text("to_pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    applicantName: text("applicant_name").notNull(),
    applicantPosition: text("applicant_position").notNull().default(""),
    approverName: text("approver_name").notNull(),
    approverPosition: text("approver_position").notNull().default(""),
    senderName: text("sender_name").notNull(),
    senderPosition: text("sender_position").notNull().default(""),
    receiverName: text("receiver_name").notNull(),
    receiverPosition: text("receiver_position").notNull().default(""),
    notes: text("notes").notNull().default(""),
    movedByUserId: integer("moved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    movedAt: timestamp("moved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    referenceIdx: uniqueIndex("equipment_transfer_batches_reference_idx").on(
      t.referenceNo,
    ),
    fromToMovedIdx: index("equipment_transfer_batches_from_to_moved_idx").on(
      t.fromPkgId,
      t.toPkgId,
      t.movedAt,
    ),
  }),
);

/** Jejak audit apabila unit fizikal dipindahkan antara PKG. */
export const equipmentUnitTransfers = pgTable(
  "equipment_unit_transfers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    transferBatchId: uuid("transfer_batch_id").references(
      () => equipmentTransferBatches.id,
      { onDelete: "set null" },
    ),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => equipmentUnits.id, { onDelete: "restrict" }),
    fromPkgId: text("from_pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    toPkgId: text("to_pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    movedByUserId: integer("moved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes").notNull().default(""),
    movedAt: timestamp("moved_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    unitHistoryIdx: index("equipment_unit_transfers_unit_history_idx").on(
      t.unitId,
      t.movedAt,
    ),
    pkgHistoryIdx: index("equipment_unit_transfers_pkg_history_idx").on(
      t.fromPkgId,
      t.toPkgId,
      t.movedAt,
    ),
  }),
);

export const equipmentLoanRequests = pgTable(
  "equipment_loan_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    referenceNo: text("reference_no").notNull(),
    pkgId: text("pkg_id")
      .notNull()
      .references(() => pkgs.id, { onDelete: "restrict" }),
    applicantType: text("applicant_type").notNull(),
    schoolCode: text("school_code").references(() => schools.code, {
      onDelete: "set null",
    }),
    orgName: text("org_name").notNull(),
    applicantName: text("applicant_name").notNull(),
    position: text("position").notNull().default(""),
    contact: text("contact").notNull(),
    contactNormalized: text("contact_normalized").notNull(),
    applicantMykadEncrypted: text("applicant_mykad_encrypted"),
    applicantMykadLast4: text("applicant_mykad_last4"),
    declarationVersion: text("declaration_version"),
    declarationText: text("declaration_text"),
    declarationAcceptedAt: timestamp("declaration_accepted_at", {
      withTimezone: true,
    }),
    purpose: text("purpose").notNull(),
    usageLocation: text("usage_location").notNull(),
    borrowDate: date("borrow_date").notNull(),
    expectedReturnDate: date("expected_return_date").notNull(),
    status: equipmentLoanStatus("status").notNull().default("pending"),
    decisionNote: text("decision_note").notNull().default(""),
    approvedByUserId: integer("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    /** Pegawai peralatan PKG yang meluluskan pinjaman, dibekukan semasa kelulusan. */
    approverName: text("approver_name").notNull().default(""),
    approverPosition: text("approver_position").notNull().default(""),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    handedOverAt: timestamp("handed_over_at", { withTimezone: true }),
    /** Pegawai PKG yang mengeluarkan aset, dibekukan semasa serahan. */
    issuerName: text("issuer_name").notNull().default(""),
    issuerPosition: text("issuer_position").notNull().default(""),
    returnedAt: timestamp("returned_at", { withTimezone: true }),
    /** Pegawai peralatan PKG yang menerima pemulangan, dibekukan semasa pemulangan. */
    receiverName: text("receiver_name").notNull().default(""),
    receiverPosition: text("receiver_position").notNull().default(""),
    returnNote: text("return_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    referenceIdx: uniqueIndex("equipment_loan_requests_reference_idx").on(t.referenceNo),
    pkgStatusIdx: index("equipment_loan_requests_pkg_status_idx").on(
      t.pkgId,
      t.status,
      t.createdAt,
    ),
    contactIdx: index("equipment_loan_requests_contact_idx").on(
      t.contactNormalized,
      t.createdAt,
    ),
  }),
);

export const equipmentLoanItems = pgTable(
  "equipment_loan_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => equipmentLoanRequests.id, { onDelete: "cascade" }),
    equipmentTypeId: uuid("equipment_type_id")
      .notNull()
      .references(() => equipmentTypes.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => equipmentCategories.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
  },
  (t) => ({
    requestCategoryIdx: uniqueIndex("equipment_loan_items_request_category_idx").on(
      t.requestId,
      t.categoryId,
    ),
  }),
);

/** Unit sebenar yang diperuntukkan semasa kelulusan. */
export const equipmentLoanAllocations = pgTable(
  "equipment_loan_allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestItemId: uuid("request_item_id")
      .notNull()
      .references(() => equipmentLoanItems.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => equipmentUnits.id, { onDelete: "restrict" }),
    allocatedByUserId: integer("allocated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    allocatedAt: timestamp("allocated_at", { withTimezone: true }).defaultNow().notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true }),
  },
  (t) => ({
    requestUnitIdx: uniqueIndex("equipment_loan_allocations_request_unit_idx").on(
      t.requestItemId,
      t.unitId,
    ),
    unitHistoryIdx: index("equipment_loan_allocations_unit_history_idx").on(
      t.unitId,
      t.allocatedAt,
    ),
  }),
);

/** Jejak audit untuk permohonan, kelulusan, serahan, tandatangan dan pemulangan. */
export const equipmentLoanEvents = pgTable(
  "equipment_loan_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => equipmentLoanRequests.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    actorUserId: integer("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    requestIdx: index("equipment_loan_events_request_idx").on(
      t.requestId,
      t.createdAt,
    ),
  }),
);

/**
 * Tandatangan disimpan sebagai koordinat ternormal (0..1), bukan imej.
 * Satu peranan hanya boleh menandatangani sekali bagi setiap permohonan.
 */
export const equipmentLoanSignatures = pgTable(
  "equipment_loan_signatures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => equipmentLoanRequests.id, { onDelete: "cascade" }),
    role: equipmentSignatureRole("role").notNull(),
    signerName: text("signer_name").notNull(),
    signerPosition: text("signer_position").notNull().default(""),
    strokes: jsonb("strokes")
      .$type<EquipmentSignatureStroke[]>()
      .notNull()
      .default([]),
    strokeSha256: text("stroke_sha256").notNull(),
    capturedByUserId: integer("captured_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    auditContext: jsonb("audit_context")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    signedAt: timestamp("signed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    requestRoleIdx: uniqueIndex("equipment_loan_signatures_request_role_idx").on(
      t.requestId,
      t.role,
    ),
    requestSignedIdx: index("equipment_loan_signatures_request_signed_idx").on(
      t.requestId,
      t.signedAt,
    ),
  }),
);

/** Versi PDF KEW.PA-9 selepas serahan dan selepas pemulangan. */
export const equipmentLoanDocuments = pgTable(
  "equipment_loan_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => equipmentLoanRequests.id, { onDelete: "cascade" }),
    stage: equipmentDocumentStage("stage").notNull(),
    status: equipmentDocumentStatus("status").notNull().default("generating"),
    fileName: text("file_name").notNull(),
    storagePath: text("storage_path"),
    publicUrl: text("public_url"),
    sha256: text("sha256"),
    errorMessage: text("error_message").notNull().default(""),
    generatedByUserId: integer("generated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    requestStageIdx: uniqueIndex("equipment_loan_documents_request_stage_idx").on(
      t.requestId,
      t.stage,
    ),
    requestStatusIdx: index("equipment_loan_documents_request_status_idx").on(
      t.requestId,
      t.status,
    ),
  }),
);

/* ==================== Modul Khidmat Bantu ==================== */

export type KhidmatSuratPermohonan = {
  storagePath: string;
  fileName: string;
  originalName: string;
};

export type KhidmatProgramDetails = {
  tarikhCadangan: string;
  masaCadangan: string;
  lokasi: string;
  suratPermohonan: KhidmatSuratPermohonan;
  /** Tajuk program — untuk paparan admin & integrasi takwim akan datang */
  tajuk?: string;
  bilPeserta?: string;
  catatan?: string;
};

export type KhidmatMcpDetails = {
  tarikh: string;
  masa: string;
  lokasi: string;
  suratPermohonan: KhidmatSuratPermohonan;
  /** Rekod lama sebelum ringkasan borang */
  tajukProgram?: string;
  platform?: string;
  catatanTeknikal?: string;
};

export type KhidmatBantuDetails = KhidmatProgramDetails | KhidmatMcpDetails;

export const khidmatBantuRequests = pgTable(
  "khidmat_bantu_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceType: text("service_type").notNull(),
    applicantType: text("applicant_type").notNull(),
    schoolCode: text("school_code").references(() => schools.code, { onDelete: "set null" }),
    orgName: text("org_name").notNull(),
    applicantName: text("applicant_name").notNull(),
    contact: text("contact").notNull(),
    contactNormalized: text("contact_normalized").notNull().default(""),
    email: text("email"),
    details: jsonb("details").$type<KhidmatBantuDetails>().notNull(),
    /** Tarikh aktiviti (yyyy-MM-dd) diekstrak dari details — untuk query & kalendar per-bulan. */
    activityDate: date("activity_date"),
    status: bookingStatus("status").notNull().default("pending"),
    approvalTokenHash: text("approval_token_hash"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("khidmat_bantu_status_idx").on(t.status, t.createdAt),
    contactIdx: index("khidmat_bantu_contact_idx").on(t.contactNormalized, t.status),
    activityDateIdx: index("khidmat_bantu_activity_date_idx").on(t.status, t.activityDate),
  }),
);
