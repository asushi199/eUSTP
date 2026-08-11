ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "approver_name" text DEFAULT '' NOT NULL;

ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "approver_position" text DEFAULT '' NOT NULL;

ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "receiver_name" text DEFAULT '' NOT NULL;

ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "receiver_position" text DEFAULT '' NOT NULL;
