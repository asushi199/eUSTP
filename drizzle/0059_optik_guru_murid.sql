ALTER TABLE "analisis_optik_schools" ADD COLUMN "guru_belum_login" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_schools" ADD COLUMN "murid_ai" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_schools" ADD COLUMN "murid_jumlah" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_snapshots" ADD COLUMN "guru_belum_login" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_snapshots" ADD COLUMN "murid_ai" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_snapshots" ADD COLUMN "murid_jumlah" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_snapshots" ADD COLUMN "murid_pct" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "analisis_optik_teachers" ADD COLUMN "hari_aktif" integer;--> statement-breakpoint
-- E-mel guru tidak lagi disimpan (hanya nama + kod sekolah dipaparkan).
UPDATE "analisis_optik_teachers" SET "email" = '' WHERE "email" <> '';
