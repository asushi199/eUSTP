ALTER TABLE "equipment_types"
  ADD COLUMN IF NOT EXISTS "specifications" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "equipment_unit_transfers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "unit_id" uuid NOT NULL,
  "from_pkg_id" text NOT NULL,
  "to_pkg_id" text NOT NULL,
  "moved_by_user_id" integer,
  "notes" text DEFAULT '' NOT NULL,
  "moved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_unit_transfers"
    ADD CONSTRAINT "equipment_unit_transfers_unit_id_equipment_units_id_fk"
    FOREIGN KEY ("unit_id") REFERENCES "public"."equipment_units"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_unit_transfers"
    ADD CONSTRAINT "equipment_unit_transfers_from_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("from_pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_unit_transfers"
    ADD CONSTRAINT "equipment_unit_transfers_to_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("to_pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "equipment_unit_transfers"
    ADD CONSTRAINT "equipment_unit_transfers_moved_by_user_id_users_id_fk"
    FOREIGN KEY ("moved_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "equipment_unit_transfers_unit_history_idx"
  ON "equipment_unit_transfers" USING btree ("unit_id", "moved_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "equipment_unit_transfers_pkg_history_idx"
  ON "equipment_unit_transfers" USING btree ("from_pkg_id", "to_pkg_id", "moved_at");
--> statement-breakpoint

UPDATE "equipment_types"
SET
  "code" = '008001114',
  "name" = 'Pencetak 3D',
  "model" = 'Bambu Lab A1 Mini',
  "description" = 'Pencetak 3D untuk prototaip, reka bentuk dan aktiviti penghasilan projek.',
  "specifications" = '[
    "Ruang cetakan 180 × 180 × 180 mm",
    "Kelajuan maksimum kepala alat 500 mm/s",
    "Suhu muncung maksimum 300°C",
    "Suhu maksimum tapak cetakan 80°C",
    "Penentukuran automatik: pembatalan hingar motor, pampasan getaran dan pelarasan tapak automatik",
    "Menyokong pemuatan dan pengeluaran filamen PLA",
    "Manual pemasangan dalam talian dan bercetak disediakan"
  ]'::jsonb,
  "components" = '[
    "Peralatan penyelenggaraan dan alat ganti pencetak 3D",
    "Gam cecair untuk plat binaan",
    "Muncung keluli keras 0.4 mm",
    "Alat membuang gerigis",
    "Playar pemotong pepenjuru",
    "Pengelap muncung tapak haba",
    "Penutup pencetak 3D",
    "Filamen PLA 1.75 mm (Bambu Lab)"
  ]'::jsonb,
  "unit_price_cents" = 150000,
  "sort_order" = 10,
  "updated_at" = now()
WHERE "code" = '3D';
--> statement-breakpoint

UPDATE "equipment_types"
SET
  "code" = '1050020250145',
  "name" = 'Kit Asas micro:bit',
  "model" = 'micro:bit V2',
  "description" = 'Kit pembelajaran asas untuk aktiviti pengaturcaraan, elektronik dan reka cipta.',
  "specifications" = '[
    "Papan micro:bit V2",
    "Buku panduan penggunaan disediakan"
  ]'::jsonb,
  "components" = '[
    "1 × motor servo",
    "6 × LED",
    "10 × perintang",
    "10 × wayar buaya dan wayar pelompat"
  ]'::jsonb,
  "unit_price_cents" = 11000,
  "sort_order" = 20,
  "updated_at" = now()
WHERE "code" = 'MB';
--> statement-breakpoint

UPDATE "equipment_types"
SET
  "code" = '1050020570002',
  "name" = 'Kit Asas Raspberry Pi Pico H',
  "model" = 'Raspberry Pi Pico H Basic Kit',
  "description" = 'Kit papan mikropengawal untuk pembelajaran pengaturcaraan dan elektronik.',
  "specifications" = '[
    "Pemproses RP2040 dwi-teras ARM Cortex-M0+ sehingga 133 MHz",
    "SRAM 264 KB dan storan QSPI Flash 2 MB",
    "Voltan operasi 1.8 V hingga 5.5 V DC",
    "Suhu operasi -20°C hingga +85°C",
    "Buku panduan penggunaan disediakan"
  ]'::jsonb,
  "components" = '[
    "1 × Raspberry Pi Pico H dengan pin dipateri",
    "1 × kabel Micro-USB",
    "1 set papan uji dan wayar pelompat",
    "1 × buzzer pasif",
    "1 × potensiometer",
    "6 × LED dan perintang",
    "2 × sensor PIR",
    "3 × butang tekan"
  ]'::jsonb,
  "unit_price_cents" = 5000,
  "sort_order" = 30,
  "updated_at" = now()
WHERE "code" = 'RP';
--> statement-breakpoint

UPDATE "equipment_types"
SET
  "code" = '1160080020001',
  "name" = 'Kit Kereta Kawalan Jauh',
  "model" = 'Remote Control Car Kit',
  "description" = 'Kit robotik bergerak untuk aktiviti kawalan, sensor dan penyelesaian masalah.',
  "specifications" = '[
    "Pemilihan kuasa automatik melalui USB 5 V, LiPo satu sel atau Vin 3.6–6 V",
    "Pengecas LiPo/Li-Ion satu sel terbina dalam dengan perlindungan cas berlebihan dan nyahcas berlebihan",
    "Suis hidup/mati dengan lampu status LED",
    "Buku panduan penggunaan disediakan"
  ]'::jsonb,
  "components" = '[
    "1 × Raspberry Pi Pico Wireless",
    "1 × Robo Pico",
    "1 set casis robot",
    "1 set bateri",
    "1 × sensor ultrasonik",
    "1 × sensor cahaya",
    "1 × sensor penjejakan garisan"
  ]'::jsonb,
  "unit_price_cents" = 16000,
  "sort_order" = 40,
  "updated_at" = now()
WHERE "code" = 'RC';
--> statement-breakpoint

UPDATE "equipment_types"
SET
  "code" = '001002002',
  "name" = 'Komputer riba',
  "model" = 'ASUS VivoBook Go A1405V-ALY409WS',
  "description" = 'Komputer riba untuk bengkel, fasilitasi dan pelaksanaan program.',
  "specifications" = '[
    "Pemproses Intel Core i5-13420H 2.1 GHz, sehingga 4.6 GHz, 8 teras dan 12 bebenang",
    "RAM 16 GB DDR4 SODIMM",
    "SSD 512 GB M.2 NVMe PCIe 3.0",
    "Grafik Intel UHD",
    "Skrin 14 inci WUXGA (1920 × 1200), nisbah 16:10",
    "Wi-Fi 6E dan Bluetooth 5.3",
    "USB 2.0 × 1, Thunderbolt × 1, USB-C 3.2 × 1, USB 3.2 × 2, HDMI 1.4 × 1 dan bicu audio × 1",
    "Windows 11 Home",
    "Microsoft Office Home 2024 dan Microsoft 365 Basic"
  ]'::jsonb,
  "components" = '["Beg galas"]'::jsonb,
  "unit_price_cents" = 295000,
  "sort_order" = 50,
  "updated_at" = now()
WHERE "code" = 'NB';
--> statement-breakpoint

WITH "inventory" ("code", "quantity") AS (
  VALUES
    ('008001114', 20),
    ('1050020250145', 120),
    ('1050020570002', 120),
    ('1160080020001', 120),
    ('001002002', 20)
)
INSERT INTO "equipment_units"
  ("equipment_type_id", "pkg_id", "serial_no", "status", "notes")
SELECT
  "equipment_types"."id",
  "pkgs"."id",
  "inventory"."code" || '-' || "sequence"."number",
  'available',
  ''
FROM "inventory"
JOIN "equipment_types" ON "equipment_types"."code" = "inventory"."code"
JOIN "pkgs" ON "pkgs"."id" = 'sitiawan'
CROSS JOIN LATERAL generate_series(1, "inventory"."quantity") AS "sequence"("number")
ON CONFLICT ("equipment_type_id", "serial_no") DO NOTHING;
