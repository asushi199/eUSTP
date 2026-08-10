CREATE TABLE IF NOT EXISTS "equipment_transfer_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "reference_no" text NOT NULL,
  "from_pkg_id" text NOT NULL,
  "to_pkg_id" text NOT NULL,
  "applicant_name" text NOT NULL,
  "applicant_position" text DEFAULT '' NOT NULL,
  "approver_name" text NOT NULL,
  "approver_position" text DEFAULT '' NOT NULL,
  "sender_name" text NOT NULL,
  "sender_position" text DEFAULT '' NOT NULL,
  "receiver_name" text NOT NULL,
  "receiver_position" text DEFAULT '' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "moved_by_user_id" integer,
  "moved_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_transfer_batches"
    ADD CONSTRAINT "equipment_transfer_batches_from_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("from_pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_transfer_batches"
    ADD CONSTRAINT "equipment_transfer_batches_to_pkg_id_pkgs_id_fk"
    FOREIGN KEY ("to_pkg_id") REFERENCES "public"."pkgs"("id")
    ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_transfer_batches"
    ADD CONSTRAINT "equipment_transfer_batches_moved_by_user_id_users_id_fk"
    FOREIGN KEY ("moved_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_transfer_batches_reference_idx"
  ON "equipment_transfer_batches" USING btree ("reference_no");
CREATE INDEX IF NOT EXISTS "equipment_transfer_batches_from_to_moved_idx"
  ON "equipment_transfer_batches" USING btree ("from_pkg_id", "to_pkg_id", "moved_at");

ALTER TABLE "equipment_unit_transfers"
  ADD COLUMN IF NOT EXISTS "transfer_batch_id" uuid;

DO $$ BEGIN
  ALTER TABLE "equipment_unit_transfers"
    ADD CONSTRAINT "equipment_unit_transfers_transfer_batch_id_equipment_transfer_batches_id_fk"
    FOREIGN KEY ("transfer_batch_id") REFERENCES "public"."equipment_transfer_batches"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "equipment_unit_transfers_transfer_batch_idx"
  ON "equipment_unit_transfers" USING btree ("transfer_batch_id");
