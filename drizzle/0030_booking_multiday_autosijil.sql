ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "group_id" uuid;
CREATE INDEX IF NOT EXISTS "bookings_group_idx" ON "bookings" ("pkg_id", "group_id", "date");
