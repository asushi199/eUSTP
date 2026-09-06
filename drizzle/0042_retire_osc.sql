-- Pindah bahan OSC ke CoE Resources / Media, kemudian kosongkan kandungan_cards.
--> statement-breakpoint
INSERT INTO "resources_cards" ("kategori", "title", "url", "letter_month", "sort", "aktif", "created_at", "updated_at")
SELECT
	'nota',
	"title",
	"url",
	COALESCE((regexp_match("title", '20[0-9]{2}'))[1], '2025') || '-01',
	"sort",
	"aktif",
	"created_at",
	"updated_at"
FROM "kandungan_cards"
WHERE "subtopik_key" IN ('slot-buku', 'slot-dasar')
	AND "url" !~* 'lookerstudio\.google\.com|ruangilmu\.moe-dl|classroom\.google|accounts\.google\.com|rakmaya\.com|artsteps\.com'
	AND NOT EXISTS (
		SELECT 1 FROM "resources_cards" r WHERE r."url" = "kandungan_cards"."url"
	);
--> statement-breakpoint
INSERT INTO "resources_cards" ("kategori", "title", "url", "letter_month", "sort", "aktif", "created_at", "updated_at")
SELECT
	'arkib',
	CASE
		WHEN "subtopik_key" = 'slot-opr' AND "title" NOT LIKE 'OPR · %' THEN 'OPR · ' || "title"
		WHEN "title" ~* '^epelaporan' THEN 'ePelaporan · ' || COALESCE((regexp_match("title", '20[0-9]{2}'))[1], "title")
		WHEN ("subtopik_key" = 'slot-kertas-kerja' OR "title" ~* '^kertas kerja')
			AND "title" NOT LIKE 'Kertas kerja · %' THEN 'Kertas kerja · ' || "title"
		WHEN "subtopik_key" = 'slot-laporan' AND "title" NOT LIKE 'Laporan · %' THEN 'Laporan · ' || "title"
		WHEN "subtopik_key" = 'slot-jnj' AND "title" ~* '^jnj[[:space:]]' THEN regexp_replace("title", '^[Jj][Nn][Jj][[:space:]]+', 'JNJ · ')
		WHEN "subtopik_key" = 'slot-jnj' AND "title" NOT LIKE 'JNJ · %' THEN 'JNJ · ' || "title"
		ELSE "title"
	END,
	"url",
	CASE
		WHEN "subtopik_key" = 'slot-opr' THEN '2025-01'
		ELSE COALESCE((regexp_match("title", '20[0-9]{2}'))[1], '2025') || '-01'
	END,
	"sort",
	"aktif",
	"created_at",
	"updated_at"
FROM "kandungan_cards"
WHERE "subtopik_key" NOT IN (
		'slot-buku',
		'slot-dasar',
		'slot-impak',
		'slot-hari-terbuka',
		'slot-karnival',
		'slot-pameran',
		'slot-bahan-delima',
		'slot-bahan-digital',
		'slot-classroom'
	)
	AND NOT (
		"subtopik_key" = 'slot-pencapaian' AND "title" !~* '^kertas kerja'
	)
	AND "type" <> 'embed'
	AND "url" !~* 'lookerstudio\.google\.com|ruangilmu\.moe-dl|classroom\.google|accounts\.google\.com|rakmaya\.com|artsteps\.com'
	AND NOT EXISTS (
		SELECT 1 FROM "resources_cards" r WHERE r."url" = "kandungan_cards"."url"
	);
--> statement-breakpoint
INSERT INTO "media_cards" ("kategori", "title", "url", "letter_month", "sort", "aktif", "created_at", "updated_at")
SELECT
	'koleksi',
	"title",
	"url",
	COALESCE((regexp_match("title", '20[0-9]{2}'))[1], '2025') || '-01',
	"sort",
	"aktif",
	"created_at",
	"updated_at"
FROM "kandungan_cards"
WHERE (
		"subtopik_key" IN ('slot-impak', 'slot-hari-terbuka', 'slot-karnival', 'slot-pameran')
		OR ("subtopik_key" = 'slot-pencapaian' AND "title" !~* '^kertas kerja')
	)
	AND "url" !~* 'lookerstudio\.google\.com|ruangilmu\.moe-dl|classroom\.google|accounts\.google\.com|rakmaya\.com|artsteps\.com'
	AND NOT EXISTS (
		SELECT 1 FROM "media_cards" m WHERE m."url" = "kandungan_cards"."url"
	);
--> statement-breakpoint
DELETE FROM "kandungan_cards";
