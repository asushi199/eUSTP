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

export const teacherRole = pgEnum("teacher_role", ["GPICT", "DELIMA", "GPM"]);

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
    phone: text("phone").notNull().default(""),
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
