ALTER TYPE "public"."teacher_role" ADD VALUE IF NOT EXISTS 'PGB';--> statement-breakpoint
ALTER TYPE "public"."teacher_role" ADD VALUE IF NOT EXISTS 'PK_PENTADBIRAN';--> statement-breakpoint
ALTER TYPE "public"."teacher_role" ADD VALUE IF NOT EXISTS 'PK_HEM';--> statement-breakpoint
ALTER TYPE "public"."teacher_role" ADD VALUE IF NOT EXISTS 'PK_KOKURIKULUM';--> statement-breakpoint
ALTER TYPE "public"."teacher_role" ADD VALUE IF NOT EXISTS 'PK_PPKI';--> statement-breakpoint
ALTER TABLE "contact_roles" ADD COLUMN IF NOT EXISTS "phone_normalized" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "contact_roles"
SET "phone_normalized" = CASE
  WHEN regexp_replace("phone", '[^0-9]', '', 'g') ~ '^01[0-9]{8,9}$'
    THEN '60' || substring(regexp_replace("phone", '[^0-9]', '', 'g') FROM 2)
  WHEN regexp_replace("phone", '[^0-9]', '', 'g') ~ '^601[0-9]{8,9}$'
    THEN regexp_replace("phone", '[^0-9]', '', 'g')
  ELSE ''
END
WHERE "phone_normalized" = '';
