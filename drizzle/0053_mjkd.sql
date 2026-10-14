CREATE TABLE IF NOT EXISTS "mjkd_bahan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mesyuarat_id" uuid NOT NULL,
	"sektor_unit" text NOT NULL,
	"tajuk" text NOT NULL,
	"nama_pembentang" text NOT NULL,
	"hari" text[] DEFAULT '{}' NOT NULL,
	"jenis" text NOT NULL,
	"url" text NOT NULL,
	"storage_path" text DEFAULT '' NOT NULL,
	"dimuat_naik_oleh" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mjkd_kehadiran" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mesyuarat_id" uuid NOT NULL,
	"jenis" text NOT NULL,
	"tarikh" date NOT NULL,
	"nama" text NOT NULL,
	"nama_kunci" text NOT NULL,
	"jawatan" text NOT NULL,
	"organisasi" text NOT NULL,
	"school_code" text,
	"pegawai_ppd_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mjkd_maklum_balas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mesyuarat_id" uuid NOT NULL,
	"school_code" text NOT NULL,
	"nama_pengisi" text NOT NULL,
	"jawatan_pengisi" text NOT NULL,
	"receipt_token" text NOT NULL,
	"tarikh_hantar" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mjkd_maklum_balas_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"maklum_balas_id" uuid NOT NULL,
	"perkara_id" uuid NOT NULL,
	"status" text NOT NULL,
	"catatan" text DEFAULT '' NOT NULL,
	"pautan_bukti" text DEFAULT '' NOT NULL,
	"dipilih" boolean DEFAULT false NOT NULL,
	"susunan_bacaan" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mjkd_mesyuarat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bil" integer NOT NULL,
	"tahun" integer NOT NULL,
	"tarikh" date NOT NULL,
	"tarikh_tamat" date,
	"mesyuarat_sebelum_id" uuid,
	"tempat" text DEFAULT '' NOT NULL,
	"minit_url" text DEFAULT '' NOT NULL,
	"minit_storage_path" text DEFAULT '' NOT NULL,
	"maklum_balas_dibuka" boolean DEFAULT false NOT NULL,
	"tarikh_tutup_maklum_balas" date,
	"kehadiran_dibuka" boolean DEFAULT false NOT NULL,
	"bahan_dibuka" boolean DEFAULT false NOT NULL,
	"kod_muat_naik_bahan" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mjkd_perkara" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mesyuarat_id" uuid NOT NULL,
	"para" text NOT NULL,
	"muka_surat" text DEFAULT '' NOT NULL,
	"perkara" text NOT NULL,
	"tindakan" text NOT NULL,
	"panduan" text DEFAULT '' NOT NULL,
	"sasaran" text NOT NULL,
	"sekolah_khusus" text[] DEFAULT '{}' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pegawai_ppd" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"jawatan" text DEFAULT '' NOT NULL,
	"sektor" text DEFAULT '' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_bahan" ADD CONSTRAINT "mjkd_bahan_mesyuarat_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_kehadiran" ADD CONSTRAINT "mjkd_kehadiran_mesyuarat_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_kehadiran" ADD CONSTRAINT "mjkd_kehadiran_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_kehadiran" ADD CONSTRAINT "mjkd_kehadiran_pegawai_ppd_id_pegawai_ppd_id_fk" FOREIGN KEY ("pegawai_ppd_id") REFERENCES "public"."pegawai_ppd"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_maklum_balas" ADD CONSTRAINT "mjkd_maklum_balas_mesyuarat_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_maklum_balas" ADD CONSTRAINT "mjkd_maklum_balas_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_maklum_balas_item" ADD CONSTRAINT "mjkd_maklum_balas_item_maklum_balas_id_mjkd_maklum_balas_id_fk" FOREIGN KEY ("maklum_balas_id") REFERENCES "public"."mjkd_maklum_balas"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_maklum_balas_item" ADD CONSTRAINT "mjkd_maklum_balas_item_perkara_id_mjkd_perkara_id_fk" FOREIGN KEY ("perkara_id") REFERENCES "public"."mjkd_perkara"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_mesyuarat" ADD CONSTRAINT "mjkd_mesyuarat_mesyuarat_sebelum_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_sebelum_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_perkara" ADD CONSTRAINT "mjkd_perkara_mesyuarat_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mjkd_bahan_mesyuarat_idx" ON "mjkd_bahan" USING btree ("mesyuarat_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mjkd_kehadiran_mesyuarat_hari_nama_org_uq" ON "mjkd_kehadiran" USING btree ("mesyuarat_id","tarikh","nama_kunci","organisasi");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mjkd_kehadiran_school_idx" ON "mjkd_kehadiran" USING btree ("school_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mjkd_maklum_balas_mesyuarat_sekolah_uq" ON "mjkd_maklum_balas" USING btree ("mesyuarat_id","school_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mjkd_maklum_balas_item_mb_perkara_uq" ON "mjkd_maklum_balas_item" USING btree ("maklum_balas_id","perkara_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mjkd_maklum_balas_item_perkara_idx" ON "mjkd_maklum_balas_item" USING btree ("perkara_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "mjkd_mesyuarat_tahun_bil_uq" ON "mjkd_mesyuarat" USING btree ("tahun","bil");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mjkd_perkara_mesyuarat_sort_idx" ON "mjkd_perkara" USING btree ("mesyuarat_id","sort");
--> statement-breakpoint
ALTER TABLE "public"."mjkd_mesyuarat" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."mjkd_perkara" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."mjkd_maklum_balas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."mjkd_maklum_balas_item" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."pegawai_ppd" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."mjkd_kehadiran" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."mjkd_bahan" ENABLE ROW LEVEL SECURITY;
