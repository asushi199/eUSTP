-- Kunci Data API (PostgREST): hidupkan RLS tanpa polisi.
-- Aplikasi hanya akses DB melalui Drizzle (peranan postgres memintas RLS).
-- Tanpa polisi, anon/authenticated tidak dapat baca/tulis sebarang baris.
-- Amaran INFO "RLS Enabled No Policy" adalah disengajakan — bukan CRITICAL.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'schools',
    'contact_versions',
    'contact_roles',
    'laporan_dpd',
    'laporan_pss',
    'laporan_photos',
    'laporan_akhbar',
    'tebus_buku_pelajar',
    'kandungan_cards',
    'resources_cards',
    'analisis_metrics',
    'analisis_monthly',
    'analisis_breakdown',
    'pegawai',
    'app_settings',
    'admin_actions',
    'pkgs',
    'telegram_destinations',
    'telegram_resource_drafts',
    'rooms',
    'bookings',
    'attendees',
    'equipment_categories',
    'equipment_types',
    'equipment_units',
    'equipment_transfer_batches',
    'equipment_unit_transfers',
    'equipment_loan_requests',
    'equipment_loan_items',
    'equipment_loan_allocations',
    'equipment_loan_events',
    'equipment_loan_signatures',
    'equipment_loan_documents',
    'khidmat_bantu_requests'
  ]
  LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END $$;
