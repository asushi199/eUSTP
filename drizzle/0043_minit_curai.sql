CREATE TABLE IF NOT EXISTS "minit_curai" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_name" text NOT NULL,
	"reporter_title" text NOT NULL,
	"unit_sektor" text NOT NULL,
	"tajuk" text NOT NULL,
	"anjuran" text NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_time" text NOT NULL,
	"tempat" text NOT NULL,
	"chairperson" text NOT NULL,
	"rujukan_fail" text DEFAULT '' NOT NULL,
	"items" jsonb NOT NULL,
	"rumusan" text NOT NULL,
	"lampiran" text DEFAULT '' NOT NULL,
	"target_date" date,
	"disebarkan_kepada" text NOT NULL,
	"tarikh_curai" date NOT NULL,
	"kaedah" jsonb NOT NULL,
	"kaedah_lain" text DEFAULT '' NOT NULL,
	"prepared_by_name" text NOT NULL,
	"prepared_by_title" text NOT NULL,
	"prepared_at" date NOT NULL,
	"reviewed_by_name" text DEFAULT '' NOT NULL,
	"reviewed_by_title" text DEFAULT '' NOT NULL,
	"reviewed_at" date,
	"created_by" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "minit_curai" ADD CONSTRAINT "minit_curai_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "minit_curai_meeting_date_idx" ON "minit_curai" USING btree ("meeting_date");
--> statement-breakpoint
ALTER TABLE "public"."minit_curai" ENABLE ROW LEVEL SECURITY;
