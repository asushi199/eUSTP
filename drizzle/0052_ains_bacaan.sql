CREATE TABLE IF NOT EXISTS "analisis_ains_murid" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"nama" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_ains_murid_bulanan" (
	"id" serial PRIMARY KEY NOT NULL,
	"murid_id" integer NOT NULL,
	"tahun" integer NOT NULL,
	"bulan" integer NOT NULL,
	"kod" text NOT NULL,
	"ditolak" integer DEFAULT 0 NOT NULL,
	"lulus" integer DEFAULT 0 NOT NULL,
	"eng" integer DEFAULT 0 NOT NULL,
	"bm" integer DEFAULT 0 NOT NULL,
	"lain" integer DEFAULT 0 NOT NULL,
	"muka_surat" integer DEFAULT 0 NOT NULL,
	"star" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_ains_sekolah" (
	"id" serial PRIMARY KEY NOT NULL,
	"tahun" integer NOT NULL,
	"bulan" integer NOT NULL,
	"kod" text NOT NULL,
	"nama" text NOT NULL,
	"jenis" text DEFAULT '' NOT NULL,
	"tahap" text DEFAULT '' NOT NULL,
	"murid" integer DEFAULT 0 NOT NULL,
	"ditolak" integer DEFAULT 0 NOT NULL,
	"lulus" integer DEFAULT 0 NOT NULL,
	"purata" double precision DEFAULT 0 NOT NULL,
	"murid_membaca" integer DEFAULT 0 NOT NULL,
	"eng" integer DEFAULT 0 NOT NULL,
	"bm" integer DEFAULT 0 NOT NULL,
	"lain" integer DEFAULT 0 NOT NULL,
	"muka_surat" integer DEFAULT 0 NOT NULL,
	"star" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analisis_ains_murid_bulanan" ADD CONSTRAINT "analisis_ains_murid_bulanan_murid_id_analisis_ains_murid_id_fk" FOREIGN KEY ("murid_id") REFERENCES "public"."analisis_ains_murid"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_ains_murid_email_idx" ON "analisis_ains_murid" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_ains_murid_bulanan_murid_tempoh_idx" ON "analisis_ains_murid_bulanan" USING btree ("murid_id","tahun","bulan");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_ains_murid_bulanan_tempoh_kod_idx" ON "analisis_ains_murid_bulanan" USING btree ("tahun","bulan","kod");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_ains_sekolah_tempoh_kod_idx" ON "analisis_ains_sekolah" USING btree ("tahun","bulan","kod");--> statement-breakpoint
ALTER TABLE "public"."analisis_ains_sekolah" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."analisis_ains_murid" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."analisis_ains_murid_bulanan" ENABLE ROW LEVEL SECURITY;
