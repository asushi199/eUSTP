ALTER TABLE "laporan_akhbar"
  ADD COLUMN IF NOT EXISTS "terimaan_tahun_2024_2025_rm" double precision DEFAULT 0 NOT NULL;

ALTER TABLE "laporan_akhbar"
  ADD COLUMN IF NOT EXISTS "baki_peruntukan_2024_2025_rm" double precision DEFAULT 0 NOT NULL;
