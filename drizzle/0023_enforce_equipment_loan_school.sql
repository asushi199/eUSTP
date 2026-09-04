-- Betulkan satu permohonan guru yang tersalah ditanda sebagai Pegawai.
WITH corrected AS (
  UPDATE "equipment_loan_requests"
  SET
    "applicant_type" = 'sekolah',
    "school_code" = 'AEE1030',
    "org_name" = 'SMK TOK PERDANA',
    "updated_at" = now()
  WHERE "id" = '08ab157a-cbe5-43bd-87c9-693a8e05468b'
  RETURNING "id"
)
INSERT INTO "equipment_loan_events" ("request_id", "action", "details")
SELECT
  "id",
  'application_corrected',
  '{"reason":"School selection corrected from STEM to SMK TOK PERDANA"}'::jsonb
FROM corrected;

ALTER TABLE "equipment_loan_requests"
  ADD CONSTRAINT "equipment_loan_requests_applicant_type_scope_check"
  CHECK ("applicant_type" IN ('sekolah', 'pegawai'));

ALTER TABLE "equipment_loan_requests"
  ADD CONSTRAINT "equipment_loan_requests_school_selection_check"
  CHECK (
    ("applicant_type" = 'sekolah' AND "school_code" IS NOT NULL)
    OR ("applicant_type" = 'pegawai' AND "school_code" IS NULL)
  );

-- Nama sekolah sentiasa datang daripada jadual induk, walaupun data ditulis
-- terus ke pangkalan data dan tidak melalui borang aplikasi.
CREATE OR REPLACE FUNCTION "enforce_equipment_loan_school_name"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW."applicant_type" = 'sekolah' THEN
    SELECT "name"
    INTO NEW."org_name"
    FROM public."schools"
    WHERE "code" = NEW."school_code";

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kod sekolah tidak dijumpai dalam senarai sekolah';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "equipment_loan_requests_enforce_school_name"
  BEFORE INSERT OR UPDATE OF "applicant_type", "school_code", "org_name"
  ON "equipment_loan_requests"
  FOR EACH ROW
  EXECUTE FUNCTION "enforce_equipment_loan_school_name"();
