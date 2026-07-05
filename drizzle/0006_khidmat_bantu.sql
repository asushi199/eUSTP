CREATE TABLE IF NOT EXISTS "khidmat_bantu_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "service_type" text NOT NULL,
  "applicant_type" text NOT NULL,
  "school_code" text REFERENCES "schools"("code") ON DELETE SET NULL,
  "org_name" text NOT NULL,
  "applicant_name" text NOT NULL,
  "contact" text NOT NULL,
  "contact_normalized" text DEFAULT '' NOT NULL,
  "email" text,
  "details" jsonb NOT NULL,
  "status" "booking_status" DEFAULT 'pending' NOT NULL,
  "approval_token_hash" text,
  "approved_at" timestamp with time zone,
  "rejected_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "khidmat_bantu_status_idx" ON "khidmat_bantu_requests" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "khidmat_bantu_contact_idx" ON "khidmat_bantu_requests" ("contact_normalized", "status");
