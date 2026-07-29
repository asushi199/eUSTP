DO $$ BEGIN
  CREATE TYPE "public"."equipment_signature_role" AS ENUM(
    'borrower',
    'approver',
    'returner',
    'receiver'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."equipment_document_stage" AS ENUM(
    'handover',
    'final'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."equipment_document_status" AS ENUM(
    'generating',
    'ready',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "equipment_loan_signatures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "role" "equipment_signature_role" NOT NULL,
  "signer_name" text NOT NULL,
  "signer_position" text DEFAULT '' NOT NULL,
  "strokes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "stroke_sha256" text NOT NULL,
  "captured_by_user_id" integer,
  "audit_context" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "signed_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_signatures"
    ADD CONSTRAINT "equipment_loan_signatures_request_id_equipment_loan_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "public"."equipment_loan_requests"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_signatures"
    ADD CONSTRAINT "equipment_loan_signatures_captured_by_user_id_users_id_fk"
    FOREIGN KEY ("captured_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_signatures_request_role_idx"
  ON "equipment_loan_signatures" USING btree ("request_id", "role");
CREATE INDEX IF NOT EXISTS "equipment_loan_signatures_request_signed_idx"
  ON "equipment_loan_signatures" USING btree ("request_id", "signed_at");

CREATE TABLE IF NOT EXISTS "equipment_loan_documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "request_id" uuid NOT NULL,
  "stage" "equipment_document_stage" NOT NULL,
  "status" "equipment_document_status" DEFAULT 'generating' NOT NULL,
  "file_name" text NOT NULL,
  "storage_path" text,
  "public_url" text,
  "sha256" text,
  "error_message" text DEFAULT '' NOT NULL,
  "generated_by_user_id" integer,
  "generated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "equipment_loan_documents"
    ADD CONSTRAINT "equipment_loan_documents_request_id_equipment_loan_requests_id_fk"
    FOREIGN KEY ("request_id") REFERENCES "public"."equipment_loan_requests"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "equipment_loan_documents"
    ADD CONSTRAINT "equipment_loan_documents_generated_by_user_id_users_id_fk"
    FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "equipment_loan_documents_request_stage_idx"
  ON "equipment_loan_documents" USING btree ("request_id", "stage");
CREATE INDEX IF NOT EXISTS "equipment_loan_documents_request_status_idx"
  ON "equipment_loan_documents" USING btree ("request_id", "status");
