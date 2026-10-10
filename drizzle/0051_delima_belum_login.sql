CREATE TABLE IF NOT EXISTS "analisis_delima_belum_login" (
	"id" serial PRIMARY KEY NOT NULL,
	"kod" text NOT NULL,
	"nama" text NOT NULL,
	"listed_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_delima_belum_login_kod_idx" ON "analisis_delima_belum_login" USING btree ("kod");
--> statement-breakpoint
ALTER TABLE "public"."analisis_delima_belum_login" ENABLE ROW LEVEL SECURITY;
