CREATE TABLE IF NOT EXISTS "laporan_ustp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pkg_code" text NOT NULL,
	"cluster" text NOT NULL,
	"program_name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"location" text NOT NULL,
	"organiser" text NOT NULL,
	"school_count" integer DEFAULT 0 NOT NULL,
	"teacher_count" integer DEFAULT 0 NOT NULL,
	"student_count" integer DEFAULT 0 NOT NULL,
	"community_count" integer DEFAULT 0 NOT NULL,
	"teras" jsonb NOT NULL,
	"objectives" text NOT NULL,
	"equipment_used" text NOT NULL,
	"equipment" jsonb NOT NULL,
	"os29000_sen" integer DEFAULT 0 NOT NULL,
	"os42000_sen" integer DEFAULT 0 NOT NULL,
	"os21000_sen" integer DEFAULT 0 NOT NULL,
	"other_allocation" text DEFAULT '' NOT NULL,
	"other_sen" integer DEFAULT 0 NOT NULL,
	"reflection" text NOT NULL,
	"prepared_by" text NOT NULL,
	"photos" jsonb NOT NULL,
	"created_by" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "laporan_ustp" ADD CONSTRAINT "laporan_ustp_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "laporan_ustp_start_date_idx" ON "laporan_ustp" USING btree ("start_date");
--> statement-breakpoint
ALTER TABLE "public"."laporan_ustp" ENABLE ROW LEVEL SECURITY;
