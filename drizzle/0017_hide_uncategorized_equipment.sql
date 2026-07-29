UPDATE "equipment_categories"
SET
  "active" = false,
  "updated_at" = now()
WHERE "code" = 'LAIN-LAIN';
