CREATE TABLE IF NOT EXISTS "equipment_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "search_aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_categories_code_idx"
  ON "equipment_categories" USING btree ("code");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "equipment_categories_active_idx"
  ON "equipment_categories" USING btree ("active", "sort_order", "name");
--> statement-breakpoint

INSERT INTO "equipment_categories"
  ("code", "name", "description", "search_aliases", "sort_order")
VALUES
  (
    'PENCETAK-3D',
    'Pencetak 3D',
    'Pencetak 3D untuk prototaip, reka bentuk dan aktiviti penghasilan projek.',
    '["3d printer", "printer 3d"]'::jsonb,
    10
  ),
  (
    'MICROBIT',
    'Kit micro:bit',
    'Kit pembelajaran micro:bit untuk aktiviti pengaturcaraan dan elektronik.',
    '["micro bit", "coding kit", "programming kit"]'::jsonb,
    20
  ),
  (
    'RASPBERRY-PI-PICO',
    'Kit Raspberry Pi Pico',
    'Kit papan mikropengawal Raspberry Pi Pico untuk pembelajaran kod dan elektronik.',
    '["raspberry pi", "pico", "microcontroller"]'::jsonb,
    30
  ),
  (
    'KERETA-KAWALAN-JAUH',
    'Kit kereta kawalan jauh',
    'Kit robotik bergerak untuk aktiviti kawalan, sensor dan penyelesaian masalah.',
    '["remote control car", "rc car", "robot car", "robotics kit"]'::jsonb,
    40
  ),
  (
    'KOMPUTER-RIBA',
    'Komputer riba',
    'Komputer riba untuk bengkel, fasilitasi dan pelaksanaan program pendidikan.',
    '["laptop", "notebook", "computer"]'::jsonb,
    50
  ),
  (
    'SET-ELEKTRONIK',
    'Set elektronik',
    'Set komponen untuk aktiviti pembelajaran elektronik.',
    '["electronics kit", "electronic set", "sensor kit"]'::jsonb,
    60
  ),
  (
    'LAIN-LAIN',
    'Peralatan lain',
    'Peralatan yang belum ditetapkan kepada kategori khusus.',
    '[]'::jsonb,
    999
  )
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint

ALTER TABLE "equipment_types" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint

UPDATE "equipment_types" t
SET "category_id" = c."id"
FROM "equipment_categories" c
WHERE c."code" = CASE
  WHEN t."code" = '008001114' THEN 'PENCETAK-3D'
  WHEN t."code" = '1050020250145' THEN 'MICROBIT'
  WHEN t."code" = '1050020570002' THEN 'RASPBERRY-PI-PICO'
  WHEN t."code" = '1160080020001' THEN 'KERETA-KAWALAN-JAUH'
  WHEN t."code" = '001002002' THEN 'KOMPUTER-RIBA'
  WHEN t."code" = 'EL' THEN 'SET-ELEKTRONIK'
  ELSE 'LAIN-LAIN'
END;
--> statement-breakpoint

ALTER TABLE "equipment_types" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_types"
    ADD CONSTRAINT "equipment_types_category_id_equipment_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."equipment_categories"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "equipment_types_category_idx"
  ON "equipment_types" USING btree ("category_id", "active", "sort_order");
--> statement-breakpoint

ALTER TABLE "equipment_loan_items" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint

UPDATE "equipment_loan_items" i
SET "category_id" = t."category_id"
FROM "equipment_types" t
WHERE t."id" = i."equipment_type_id"
  AND i."category_id" IS NULL;
--> statement-breakpoint

ALTER TABLE "equipment_loan_items" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_loan_items"
    ADD CONSTRAINT "equipment_loan_items_category_id_equipment_categories_id_fk"
    FOREIGN KEY ("category_id") REFERENCES "public"."equipment_categories"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DROP INDEX IF EXISTS "equipment_loan_items_request_type_idx";
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_items_request_category_idx"
  ON "equipment_loan_items" USING btree ("request_id", "category_id");
