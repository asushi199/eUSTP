CREATE TABLE IF NOT EXISTS "media_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"letter_month" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_cards_kategori_idx" ON "media_cards" USING btree ("kategori","sort");
--> statement-breakpoint
INSERT INTO "media_cards" ("kategori", "title", "url", "letter_month", "sort", "aktif", "created_at", "updated_at")
SELECT
	'koleksi',
	"title",
	"url",
	NULL,
	"sort",
	"aktif",
	"created_at",
	"updated_at"
FROM "kandungan_cards"
WHERE "type" = 'youtube'
   OR lower("title") LIKE '%video%'
ORDER BY "sort", "id";
--> statement-breakpoint
DELETE FROM "kandungan_cards"
WHERE "type" = 'youtube'
   OR lower("title") LIKE '%video%'
   OR ("subtopik_key" = 'slot-bahan-digital' AND upper("title") IN ('TIKTOK', 'YOUTUBE'));
--> statement-breakpoint
UPDATE "kandungan_cards"
SET "subtopik_blurb" = 'Ruang Ilmu DELIMa — pratonton skrin (klik kad untuk buka)'
WHERE "subtopik_key" = 'slot-bahan-digital';
--> statement-breakpoint
ALTER TABLE "public"."media_cards" ENABLE ROW LEVEL SECURITY;
