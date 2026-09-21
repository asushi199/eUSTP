CREATE TABLE IF NOT EXISTS "analisis_optik_teachers" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"school_code" text NOT NULL,
	"name" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"plc_status" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analisis_optik_teachers" ADD CONSTRAINT "analisis_optik_teachers_snapshot_id_analisis_optik_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."analisis_optik_snapshots"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_optik_teachers_snapshot_school_idx" ON "analisis_optik_teachers" USING btree ("snapshot_id","school_code","sort");
--> statement-breakpoint
ALTER TABLE "public"."analisis_optik_teachers" ENABLE ROW LEVEL SECURITY;