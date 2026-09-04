CREATE TABLE IF NOT EXISTS "telegram_resource_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"telegram_user_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"file_id" text,
	"file_name" text,
	"mime_type" text,
	"file_size" integer,
	"step" text NOT NULL,
	"kategori" text,
	"letter_month" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources_cards" ADD COLUMN "letter_month" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_resource_drafts" ADD CONSTRAINT "telegram_resource_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_resource_drafts_chat_user_idx" ON "telegram_resource_drafts" USING btree ("chat_id","telegram_user_id");