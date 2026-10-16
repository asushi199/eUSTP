CREATE TABLE IF NOT EXISTS "mjkd_draf" (
	"mesyuarat_id" uuid NOT NULL,
	"school_code" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mjkd_draf_mesyuarat_id_school_code_pk" PRIMARY KEY("mesyuarat_id","school_code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_draf" ADD CONSTRAINT "mjkd_draf_mesyuarat_id_mjkd_mesyuarat_id_fk" FOREIGN KEY ("mesyuarat_id") REFERENCES "public"."mjkd_mesyuarat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mjkd_draf" ADD CONSTRAINT "mjkd_draf_school_code_schools_code_fk" FOREIGN KEY ("school_code") REFERENCES "public"."schools"("code") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
ALTER TABLE "public"."mjkd_draf" ENABLE ROW LEVEL SECURITY;
