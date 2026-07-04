CREATE TYPE "public"."peranan" AS ENUM('Admin', 'Pegawai', 'PKG_Admin');--> statement-breakpoint
CREATE TYPE "public"."teacher_role" AS ENUM('GPICT', 'DELIMA', 'GPM');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"school_code" text,
	"version_id" uuid,
	"actor_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_roles" (
	"version_id" uuid NOT NULL,
	"role" "teacher_role" NOT NULL,
	"teacher_name" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	CONSTRAINT "contact_roles_version_id_role_pk" PRIMARY KEY("version_id","role")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_code" text NOT NULL,
	"school_name" text NOT NULL,
	"zone" text DEFAULT '' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitter_name" text,
	"submitter_phone" text,
	"source" text,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schools" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"zone" text DEFAULT '' NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"nama" text NOT NULL,
	"jawatan" text DEFAULT '' NOT NULL,
	"peranan" "peranan" DEFAULT 'Pegawai' NOT NULL,
	"pkg_id" text,
	"aktif" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_version_id_contact_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."contact_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_roles" ADD CONSTRAINT "contact_roles_version_id_contact_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."contact_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contact_versions" ADD CONSTRAINT "contact_versions_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schools" ADD CONSTRAINT "schools_current_version_id_contact_versions_id_fk" FOREIGN KEY ("current_version_id") REFERENCES "public"."contact_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contact_versions_school_code_idx" ON "contact_versions" USING btree ("school_code","submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schools_current_version_id_idx" ON "schools" USING btree ("current_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_aktif_idx" ON "users" USING btree ("aktif");