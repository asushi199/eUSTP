ALTER TABLE "pkgs" ADD COLUMN "telegram_responsible_user_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pkgs" ADD CONSTRAINT "pkgs_telegram_responsible_user_id_users_id_fk" FOREIGN KEY ("telegram_responsible_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
