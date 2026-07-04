CREATE TYPE "public"."analisis_modul" AS ENUM('delima', 'dcs', 'ains', 'pensijilan', 'optik');--> statement-breakpoint
CREATE TYPE "public"."kandungan_card_type" AS ENUM('pdf', 'canva', 'gdoc', 'embed', 'youtube', 'image', 'link');--> statement-breakpoint
CREATE TYPE "public"."kandungan_topik" AS ENUM('integrasi', 'hebahan', 'itm', 'pembudayaan', 'pemerkasaan', 'bahan_sokongan');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_breakdown" (
	"id" serial PRIMARY KEY NOT NULL,
	"modul" "analisis_modul" NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"value" double precision DEFAULT 0 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"modul" "analisis_modul" NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analisis_monthly" (
	"id" serial PRIMARY KEY NOT NULL,
	"modul" "analisis_modul" NOT NULL,
	"month_label" text NOT NULL,
	"chart_label" text DEFAULT '' NOT NULL,
	"guru_pct" double precision,
	"murid_pct" double precision,
	"include_chart" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kandungan_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"topik" "kandungan_topik" NOT NULL,
	"subtopik_key" text DEFAULT '' NOT NULL,
	"subtopik_title" text DEFAULT '' NOT NULL,
	"subtopik_sort" integer DEFAULT 999 NOT NULL,
	"subtopik_blurb" text DEFAULT '' NOT NULL,
	"subtopik_icon" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"type" "kandungan_card_type" DEFAULT 'pdf' NOT NULL,
	"preview_url" text DEFAULT '' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pegawai" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama" text NOT NULL,
	"jawatan" text DEFAULT '' NOT NULL,
	"telefon" text DEFAULT '' NOT NULL,
	"photo_url" text DEFAULT '' NOT NULL,
	"detail_url" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "website" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_breakdown_modul_kind_idx" ON "analisis_breakdown" USING btree ("modul","kind","sort");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "analisis_metrics_modul_key_idx" ON "analisis_metrics" USING btree ("modul","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analisis_monthly_modul_idx" ON "analisis_monthly" USING btree ("modul","sort");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kandungan_cards_topik_idx" ON "kandungan_cards" USING btree ("topik","subtopik_sort","sort");