CREATE TABLE IF NOT EXISTS "kunjung_bantu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sesi" text NOT NULL,
	"school_code" text NOT NULL,
	"nama_pgb" text DEFAULT '' NOT NULL,
	"nama_pk_pentadbiran" text DEFAULT '' NOT NULL,
	"nama_admin_delima" text DEFAULT '' NOT NULL,
	"jawapan" jsonb NOT NULL,
	"receipt_token" text NOT NULL,
	"status" text DEFAULT 'DIHANTAR' NOT NULL,
	"tarikh_hantar" timestamp with time zone DEFAULT now() NOT NULL,
	"semakan" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"isu" text DEFAULT '' NOT NULL,
	"ulasan_pegawai" text DEFAULT '' NOT NULL,
	"nama_pegawai" text DEFAULT '' NOT NULL,
	"tarikh_penilaian" date,
	"disemak_pada" timestamp with time zone,
	"disahkan_pada" timestamp with time zone,
	"delima_beku" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kunjung_bantu_draf" (
	"sesi" text NOT NULL,
	"school_code" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kunjung_bantu_draf_sesi_school_code_pk" PRIMARY KEY("sesi","school_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kunjung_bantu" ADD CONSTRAINT "kunjung_bantu_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "kunjung_bantu_draf" ADD CONSTRAINT "kunjung_bantu_draf_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kunjung_bantu_sesi_sekolah_uq" ON "kunjung_bantu" USING btree ("sesi","school_code");--> statement-breakpoint
ALTER TABLE "public"."kunjung_bantu" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."kunjung_bantu_draf" ENABLE ROW LEVEL SECURITY;
