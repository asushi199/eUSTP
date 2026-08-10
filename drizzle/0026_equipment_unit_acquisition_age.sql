ALTER TABLE "equipment_units"
  ADD COLUMN IF NOT EXISTS "acquisition_date" date;

ALTER TABLE "equipment_units"
  ADD COLUMN IF NOT EXISTS "acquisition_year" integer;

ALTER TABLE "equipment_units"
  ADD CONSTRAINT "equipment_units_acquisition_year_check"
  CHECK (
    "acquisition_year" IS NULL
    OR "acquisition_year" BETWEEN 1900 AND 2100
  );
