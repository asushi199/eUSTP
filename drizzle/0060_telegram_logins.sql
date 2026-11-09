CREATE TABLE IF NOT EXISTS "telegram_logins" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"telegram_user_id" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_logins" ADD CONSTRAINT "telegram_logins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_logins_telegram_user_id_idx" ON "telegram_logins" USING btree ("telegram_user_id");
--> statement-breakpoint
ALTER TABLE "public"."telegram_logins" ENABLE ROW LEVEL SECURITY;
