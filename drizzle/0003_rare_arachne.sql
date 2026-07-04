CREATE TYPE "public"."booking_slot" AS ENUM('am', 'pm', 'full_day');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pkg_id" text NOT NULL,
	"booking_id" uuid NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pkg_id" text NOT NULL,
	"room_slug" text NOT NULL,
	"date" date NOT NULL,
	"slot" "booking_slot" NOT NULL,
	"name" text NOT NULL,
	"school_or_unit" text NOT NULL,
	"purpose" text NOT NULL,
	"contact" text NOT NULL,
	"contact_normalized" text DEFAULT '' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"approval_token_hash" text,
	"attendance_token" text,
	"attendance_manage_token" text,
	"approved_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pkgs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"whatsapp_admin_phone" text,
	"logo_src" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pkg_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"image_src" text,
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendees" ADD CONSTRAINT "attendees_pkg_id_pkgs_id_fk" FOREIGN KEY ("pkg_id") REFERENCES "public"."pkgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendees" ADD CONSTRAINT "attendees_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_pkg_id_pkgs_id_fk" FOREIGN KEY ("pkg_id") REFERENCES "public"."pkgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rooms" ADD CONSTRAINT "rooms_pkg_id_pkgs_id_fk" FOREIGN KEY ("pkg_id") REFERENCES "public"."pkgs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attendees_booking_idx" ON "attendees" USING btree ("pkg_id","booking_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_active_lookup_idx" ON "bookings" USING btree ("pkg_id","date","room_slug","slot","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_contact_lookup_idx" ON "bookings" USING btree ("pkg_id","contact_normalized","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_attendance_token_idx" ON "bookings" USING btree ("attendance_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_manage_token_idx" ON "bookings" USING btree ("attendance_manage_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rooms_pkg_slug_idx" ON "rooms" USING btree ("pkg_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rooms_pkg_active_idx" ON "rooms" USING btree ("pkg_id","active","sort_order");