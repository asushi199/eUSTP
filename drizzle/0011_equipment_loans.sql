ALTER TABLE "pkgs" ADD COLUMN IF NOT EXISTS "equipment_manager_name" text;
ALTER TABLE "pkgs" ADD COLUMN IF NOT EXISTS "equipment_manager_position" text;
ALTER TABLE "pkgs" ADD COLUMN IF NOT EXISTS "equipment_manager_phone" text;

DO $$ BEGIN
  CREATE TYPE "public"."equipment_unit_status" AS ENUM(
    'available',
    'reserved',
    'borrowed',
    'maintenance',
    'retired',
    'lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."equipment_loan_status" AS ENUM(
    'pending',
    'approved',
    'rejected',
    'cancelled',
    'handed_over',
    'returned'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "equipment_types" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "model" text DEFAULT '' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "search_aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "components" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "unit_price_cents" integer,
  "received_date" date,
  "receipt_document_url" text,
  "active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_types_code_idx"
  ON "equipment_types" USING btree ("code");
CREATE INDEX IF NOT EXISTS "equipment_types_active_idx"
  ON "equipment_types" USING btree ("active", "sort_order", "name");

CREATE TABLE IF NOT EXISTS "equipment_units" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_type_id" uuid NOT NULL,
  "pkg_id" text NOT NULL,
  "serial_no" text NOT NULL,
  "government_asset_no" text,
  "status" "equipment_unit_status" DEFAULT 'available' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_units"
    ADD CONSTRAINT "equipment_units_equipment_type_id_equipment_types_id_fk"
    FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_units"
    ADD CONSTRAINT "equipment_units_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_units_type_serial_idx"
  ON "equipment_units" USING btree ("equipment_type_id", "serial_no");
CREATE UNIQUE INDEX IF NOT EXISTS "equipment_units_government_asset_idx"
  ON "equipment_units" USING btree ("government_asset_no");
CREATE INDEX IF NOT EXISTS "equipment_units_pkg_status_idx"
  ON "equipment_units" USING btree ("pkg_id", "status", "equipment_type_id");

CREATE TABLE IF NOT EXISTS "equipment_loan_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reference_no" text NOT NULL,
  "pkg_id" text NOT NULL,
  "applicant_type" text NOT NULL,
  "school_code" text,
  "org_name" text NOT NULL,
  "applicant_name" text NOT NULL,
  "position" text DEFAULT '' NOT NULL,
  "contact" text NOT NULL,
  "contact_normalized" text NOT NULL,
  "purpose" text NOT NULL,
  "usage_location" text NOT NULL,
  "borrow_date" date NOT NULL,
  "expected_return_date" date NOT NULL,
  "status" "equipment_loan_status" DEFAULT 'pending' NOT NULL,
  "decision_note" text DEFAULT '' NOT NULL,
  "approved_by_user_id" integer,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "handed_over_at" timestamp with time zone,
  "returned_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_requests"
    ADD CONSTRAINT "equipment_loan_requests_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_requests"
    ADD CONSTRAINT "equipment_loan_requests_school_code_schools_code_fk"
    FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_requests"
    ADD CONSTRAINT "equipment_loan_requests_approved_by_user_id_users_id_fk"
    FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_requests_reference_idx"
  ON "equipment_loan_requests" USING btree ("reference_no");
CREATE INDEX IF NOT EXISTS "equipment_loan_requests_pkg_status_idx"
  ON "equipment_loan_requests" USING btree ("pkg_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "equipment_loan_requests_contact_idx"
  ON "equipment_loan_requests" USING btree ("contact_normalized", "created_at");

CREATE TABLE IF NOT EXISTS "equipment_loan_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "equipment_type_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  CONSTRAINT "equipment_loan_items_quantity_check" CHECK ("quantity" > 0)
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_items"
    ADD CONSTRAINT "equipment_loan_items_request_id_equipment_loan_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "public"."equipment_loan_requests"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_items"
    ADD CONSTRAINT "equipment_loan_items_equipment_type_id_equipment_types_id_fk"
    FOREIGN KEY ("equipment_type_id") REFERENCES "public"."equipment_types"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_items_request_type_idx"
  ON "equipment_loan_items" USING btree ("request_id", "equipment_type_id");

CREATE TABLE IF NOT EXISTS "equipment_loan_allocations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_item_id" uuid NOT NULL,
  "unit_id" uuid NOT NULL,
  "allocated_by_user_id" integer,
  "allocated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "released_at" timestamp with time zone
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_allocations"
    ADD CONSTRAINT "equipment_loan_allocations_request_item_id_equipment_loan_items_id_fk"
    FOREIGN KEY ("request_item_id") REFERENCES "public"."equipment_loan_items"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_allocations"
    ADD CONSTRAINT "equipment_loan_allocations_unit_id_equipment_units_id_fk"
    FOREIGN KEY ("unit_id") REFERENCES "public"."equipment_units"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_allocations"
    ADD CONSTRAINT "equipment_loan_allocations_allocated_by_user_id_users_id_fk"
    FOREIGN KEY ("allocated_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_allocations_request_unit_idx"
  ON "equipment_loan_allocations" USING btree ("request_item_id", "unit_id");
CREATE INDEX IF NOT EXISTS "equipment_loan_allocations_unit_history_idx"
  ON "equipment_loan_allocations" USING btree ("unit_id", "allocated_at");

CREATE TABLE IF NOT EXISTS "equipment_loan_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "action" text NOT NULL,
  "actor_user_id" integer,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_events"
    ADD CONSTRAINT "equipment_loan_events_request_id_equipment_loan_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "public"."equipment_loan_requests"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_events"
    ADD CONSTRAINT "equipment_loan_events_actor_user_id_users_id_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "equipment_loan_events_request_idx"
  ON "equipment_loan_events" USING btree ("request_id", "created_at");

INSERT INTO "equipment_types"
  ("code", "name", "model", "description", "search_aliases", "components",
   "unit_price_cents", "received_date", "sort_order")
VALUES
  ('MB', 'Set pembelajaran micro:bit', 'BBC micro:bit Quick Start Kit',
   'Set pembelajaran asas untuk aktiviti pengaturcaraan dan reka cipta.',
   '["micro bit", "coding kit", "programming kit"]'::jsonb, '[]'::jsonb,
   11000, '2026-05-19', 10),
  ('RP', 'Set pembelajaran Raspberry Pi Pico', 'Raspberry Pi Pico Basic Kit - with Pico',
   'Kit papan mikropengawal Pico untuk pembelajaran elektronik dan kod.',
   '["microcontroller", "microcontroller kit", "coding kit"]'::jsonb, '[]'::jsonb,
   5000, '2026-05-19', 20),
  ('RC', 'Kit kereta kawalan jauh', 'Cytron Robo Pico Remote Control Car Kit',
   'Kit robotik bergerak untuk aktiviti kawalan, sensor dan penyelesaian masalah.',
   '["remote control car", "rc car", "robot car", "robotics kit"]'::jsonb,
   '[]'::jsonb, 16000, '2026-05-19', 30),
  ('3D', 'Pencetak 3D', 'Bambu Lab A1 Mini',
   'Pencetak 3D untuk prototaip, reka bentuk dan aktiviti maker.',
   '["3d printer", "printer 3d"]'::jsonb,
   '["2 gulung filamen", "3D printer enclosure", "maintenance tools"]'::jsonb,
   150000, '2026-05-19', 40),
  ('NB', 'Komputer riba', 'ASUS VivoBook Go A1405V-ALY409WS',
   'Komputer riba untuk bengkel, fasilitasi dan pelaksanaan program.',
   '["laptop", "notebook", "computer"]'::jsonb,
   '["Logitech B100 USB Mouse"]'::jsonb, 300000, '2026-05-22', 50),
  ('EL', 'Set elektronik', 'Set generik',
   'Set LED, wayar, player, perintang dan sensor untuk aktiviti elektronik.',
   '["electronics kit", "electronic set", "sensor kit"]'::jsonb,
   '["LED", "wayar", "player", "perintang", "sensor"]'::jsonb,
   50000, '2026-05-19', 60)
ON CONFLICT ("code") DO NOTHING;
