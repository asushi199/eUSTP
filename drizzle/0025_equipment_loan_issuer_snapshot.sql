ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "issuer_name" text DEFAULT '' NOT NULL;

ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "issuer_position" text DEFAULT '' NOT NULL;
