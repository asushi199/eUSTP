CREATE TYPE "public"."laporan_modul" AS ENUM('dpd', 'pss');--> statement-breakpoint
CREATE TYPE "public"."laporan_status" AS ENUM('BARU', 'DISEMAK', 'SELESAI');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_dpd" (
	"id" serial PRIMARY KEY NOT NULL,
	"tarikh" date NOT NULL,
	"organisasi" text NOT NULL,
	"nama_program" text NOT NULL,
	"lokasi" text DEFAULT '' NOT NULL,
	"jenis_program" text DEFAULT '' NOT NULL,
	"bil_murid" integer DEFAULT 0 NOT NULL,
	"bil_guru" integer DEFAULT 0 NOT NULL,
	"bil_pentadbir" integer DEFAULT 0 NOT NULL,
	"bil_swasta" integer DEFAULT 0 NOT NULL,
	"teras" text DEFAULT '' NOT NULL,
	"strategi" text DEFAULT '' NOT NULL,
	"inisiatif" text DEFAULT '' NOT NULL,
	"email_pelapor" text DEFAULT '' NOT NULL,
	"status" "laporan_status" DEFAULT 'BARU' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"modul" "laporan_modul" NOT NULL,
	"laporan_id" integer NOT NULL,
	"storage_path" text NOT NULL,
	"public_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "laporan_pss" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" text NOT NULL,
	"school_name" text NOT NULL,
	"nama_program" text NOT NULL,
	"tarikh_mula" date NOT NULL,
	"tarikh_tamat" date,
	"pelapor" text DEFAULT '' NOT NULL,
	"jawatan" text DEFAULT '' NOT NULL,
	"bil_guru" integer DEFAULT 0 NOT NULL,
	"bil_murid" integer DEFAULT 0 NOT NULL,
	"objektif" text DEFAULT '' NOT NULL,
	"ringkasan" text DEFAULT '' NOT NULL,
	"impak" text DEFAULT '' NOT NULL,
	"status" "laporan_status" DEFAULT 'BARU' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_pss" ADD CONSTRAINT "laporan_pss_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_dpd_tarikh_idx" ON "laporan_dpd" USING btree ("tarikh");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_dpd_status_idx" ON "laporan_dpd" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_photos_modul_laporan_idx" ON "laporan_photos" USING btree ("modul","laporan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_pss_tarikh_mula_idx" ON "laporan_pss" USING btree ("tarikh_mula");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_pss_school_code_idx" ON "laporan_pss" USING btree ("school_code");