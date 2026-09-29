CREATE TABLE IF NOT EXISTS "analisis_delima_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"kod" text NOT NULL,
	"nama" text NOT NULL,
	"guru_aktif" integer,
	"guru_jumlah" integer,
	"guru_pct" double precision,
	"guru_tahap" text,
	"murid_aktif" integer,
	"murid_jumlah" integer,
	"murid_pct" double precision,
	"murid_tahap" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_delima_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"tempoh" text DEFAULT '' NOT NULL,
	"daerah" text DEFAULT '' NOT NULL,
	"sumber_url" text DEFAULT '' NOT NULL,
	"captured_on" date NOT NULL,
	"guru_aktif" integer NOT NULL,
	"guru_jumlah" integer NOT NULL,
	"guru_pct" double precision NOT NULL,
	"murid_aktif" integer NOT NULL,
	"murid_jumlah" integer NOT NULL,
	"murid_pct" double precision NOT NULL,
	"kad_aktif" integer,
	"kad_jumlah" integer,
	"kad_pct" double precision,
	"kad_sasaran" double precision,
	"bil_sekolah" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analisis_delima_schools" ADD CONSTRAINT "analisis_delima_schools_snapshot_id_analisis_delima_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."analisis_delima_snapshots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_delima_schools_snapshot_kod_idx" ON "analisis_delima_schools" USING btree ("snapshot_id","kod");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_delima_snapshots_period_idx" ON "analisis_delima_snapshots" USING btree ("period");
--> statement-breakpoint
ALTER TABLE "public"."analisis_delima_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."analisis_delima_schools" ENABLE ROW LEVEL SECURITY;
