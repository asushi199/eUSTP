ALTER TABLE "equipment_loan_requests"
  ADD COLUMN IF NOT EXISTS "applicant_mykad_encrypted" text,
  ADD COLUMN IF NOT EXISTS "applicant_mykad_last4" text,
  ADD COLUMN IF NOT EXISTS "declaration_version" text,
  ADD COLUMN IF NOT EXISTS "declaration_text" text,
  ADD COLUMN IF NOT EXISTS "declaration_accepted_at" timestamp with time zone;
