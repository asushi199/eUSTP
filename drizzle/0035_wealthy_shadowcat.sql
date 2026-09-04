CREATE TABLE IF NOT EXISTS "resources_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"kategori" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_cards_kategori_idx" ON "resources_cards" USING btree ("kategori","sort");
--> statement-breakpoint
INSERT INTO "resources_cards" ("kategori", "title", "url", "sort", "aktif", "created_at", "updated_at")
SELECT
	'pekeliling',
	"title",
	"url",
	"sort",
	"aktif",
	"created_at",
	"updated_at"
FROM "kandungan_cards"
WHERE "topik" = 'bahan_sokongan' AND "subtopik_key" = 'slot-surat'
ORDER BY "sort", "id";
--> statement-breakpoint
DELETE FROM "kandungan_cards"
WHERE "topik" = 'bahan_sokongan' AND "subtopik_key" = 'slot-surat';
