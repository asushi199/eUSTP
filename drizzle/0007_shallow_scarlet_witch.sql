ALTER TABLE "khidmat_bantu_requests" ADD COLUMN IF NOT EXISTS "activity_date" date;--> statement-breakpoint
UPDATE "khidmat_bantu_requests"
SET "activity_date" = NULLIF(COALESCE("details"->>'tarikhCadangan', "details"->>'tarikh'), '')::date
WHERE "activity_date" IS NULL
  AND COALESCE("details"->>'tarikhCadangan', "details"->>'tarikh') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "khidmat_bantu_activity_date_idx" ON "khidmat_bantu_requests" USING btree ("status","activity_date");
