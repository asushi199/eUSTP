CREATE TABLE IF NOT EXISTS "telegram_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"telegram_chat_id" text,
	"telegram_username" text,
	"telegram_bound_at" timestamp with time zone,
	"telegram_bind_token_hash" text,
	"telegram_bind_token_expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_destinations_bind_token_hash_idx" ON "telegram_destinations" USING btree ("telegram_bind_token_hash");