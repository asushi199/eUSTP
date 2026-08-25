ALTER TABLE "users" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_bound_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_bind_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "telegram_bind_token_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_chat_id_idx" ON "users" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_telegram_bind_token_hash_idx" ON "users" USING btree ("telegram_bind_token_hash");
