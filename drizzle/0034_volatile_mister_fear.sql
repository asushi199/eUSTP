CREATE TABLE IF NOT EXISTS "tebus_buku_pelajar" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_code" text NOT NULL,
	"school_name" text NOT NULL,
	"nama" text NOT NULL,
	"email" text NOT NULL,
	"tingkatan" text NOT NULL,
	"sudah_tebus" boolean NOT NULL,
	"sudah_guna" boolean NOT NULL,
	"sourced_at" date NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tebus_buku_pelajar_email_idx" ON "tebus_buku_pelajar" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tebus_buku_pelajar_school_idx" ON "tebus_buku_pelajar" USING btree ("school_code","nama");