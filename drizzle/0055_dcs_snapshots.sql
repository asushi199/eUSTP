CREATE TABLE IF NOT EXISTS "analisis_dcs_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"tahun" integer NOT NULL,
	"captured_on" date NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_dcs_snapshots_captured_idx" ON "analisis_dcs_snapshots" USING btree ("captured_on");--> statement-breakpoint
ALTER TABLE "public"."analisis_dcs_snapshots" ENABLE ROW LEVEL SECURITY;
