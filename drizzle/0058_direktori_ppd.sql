CREATE TABLE IF NOT EXISTS "direktori_ppd" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_kunci" text NOT NULL,
	"nama" text NOT NULL,
	"gred" text DEFAULT '' NOT NULL,
	"jawatan" text DEFAULT '' NOT NULL,
	"telefon" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "direktori_ppd_nama_kunci_idx" ON "direktori_ppd" USING btree ("nama_kunci");
--> statement-breakpoint
ALTER TABLE "public"."direktori_ppd" ENABLE ROW LEVEL SECURITY;
