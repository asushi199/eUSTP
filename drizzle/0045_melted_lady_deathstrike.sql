CREATE TABLE IF NOT EXISTS "analisis_optik_schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"school_code" text NOT NULL,
	"school_name" text NOT NULL,
	"selesai_bil" integer NOT NULL,
	"total_bil" integer NOT NULL,
	"pct_ai" double precision NOT NULL,
	"plc_status" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_optik_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"captured_on" date NOT NULL,
	"chart_label" text NOT NULL,
	"source_filename" text DEFAULT '' NOT NULL,
	"source_format" text DEFAULT 'school_table' NOT NULL,
	"raw_csv" text DEFAULT '' NOT NULL,
	"selesai_pct" double precision NOT NULL,
	"selesai_bil" integer NOT NULL,
	"total_bil" integer NOT NULL,
	"belum_pct" double precision NOT NULL,
	"belum_bil" integer NOT NULL,
	"sekolah_selesai" integer NOT NULL,
	"sekolah_belum" integer NOT NULL,
	"sekolah_count" integer NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"include_chart" boolean DEFAULT true NOT NULL,
	"uploaded_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analisis_optik_schools" ADD CONSTRAINT "analisis_optik_schools_snapshot_id_analisis_optik_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."analisis_optik_snapshots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analisis_optik_snapshots" ADD CONSTRAINT "analisis_optik_snapshots_uploaded_by_user_id_users_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_optik_schools_snapshot_idx" ON "analisis_optik_schools" USING btree ("snapshot_id","sort");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_optik_schools_snapshot_code_idx" ON "analisis_optik_schools" USING btree ("snapshot_id","school_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_optik_snapshots_captured_idx" ON "analisis_optik_snapshots" USING btree ("captured_on","id");
--> statement-breakpoint
ALTER TABLE "public"."analisis_optik_snapshots" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "public"."analisis_optik_schools" ENABLE ROW LEVEL SECURITY;