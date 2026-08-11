CREATE TABLE IF NOT EXISTS "laporan_akhbar" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "year" integer DEFAULT 2026 NOT NULL,
  "school_code" text NOT NULL,
  "kategori_sekolah" text NOT NULL,
  "liputan_pkb" text NOT NULL,
  "peruntukan_diterima_rm" double precision DEFAULT 0 NOT NULL,
  "perbelanjaan_digunakan_rm" double precision DEFAULT 0 NOT NULL,
  "bayaran_tertunggak_rm" double precision DEFAULT 0 NOT NULL,
  "baki_peruntukan_rm" double precision DEFAULT 0 NOT NULL,
  "dipulangkan_jpn_rm" double precision DEFAULT 0 NOT NULL,
  "tambahan_dipohon_rm" double precision DEFAULT 0 NOT NULL,
  "bayaran_tertunggak_selesai" text NOT NULL,
  "baki_dipulangkan" text NOT NULL,
  "tiada_baki_kwk" text NOT NULL,
  "mohon_tambahan" text NOT NULL,
  "dokumen_lengkap" text NOT NULL,
  "status_sekolah" text DEFAULT 'Belum' NOT NULL,
  "tarikh_hantar" timestamp with time zone,
  "catatan" text DEFAULT '' NOT NULL,
  "semakan_lengkap" text,
  "disahkan" text,
  "perlu_pembetulan" text,
  "pegawai_ppd" text DEFAULT '' NOT NULL,
  "tarikh_semakan" date,
  "catatan_ppd" text DEFAULT '' NOT NULL,
  "receipt_token" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "laporan_akhbar"
  ADD CONSTRAINT "laporan_akhbar_school_code_schools_code_fk"
  FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code")
  ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "laporan_akhbar_school_year_uq"
  ON "laporan_akhbar" ("school_code","year");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_akhbar_year_idx"
  ON "laporan_akhbar" ("year");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_akhbar_status_idx"
  ON "laporan_akhbar" ("status_sekolah");
