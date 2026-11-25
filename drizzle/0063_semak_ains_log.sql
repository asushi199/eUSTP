CREATE TABLE IF NOT EXISTS "semak_ains_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"dicipta_pada" timestamp with time zone DEFAULT now() NOT NULL,
	"kod_sekolah" text,
	"nama_sekolah" text NOT NULL,
	"jenis" text NOT NULL,
	"bil_rekod" integer NOT NULL,
	"bil_hijau" integer,
	"bil_kuning" integer,
	"bil_merah" integer,
	"bil_berjaya" integer,
	"bil_gagal" integer,
	"tetapan_diubah" boolean DEFAULT false NOT NULL,
	"tetapan" jsonb,
	"versi_enjin" text NOT NULL,
	"versi_penanda" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "semak_ains_log" ADD CONSTRAINT "semak_ains_log_kod_sekolah_schools_code_fk" FOREIGN KEY ("kod_sekolah") REFERENCES "public"."schools"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "semak_ains_log_kod_masa_idx" ON "semak_ains_log" USING btree ("kod_sekolah","dicipta_pada");
--> statement-breakpoint
ALTER TABLE "public"."semak_ains_log" ENABLE ROW LEVEL SECURITY;
