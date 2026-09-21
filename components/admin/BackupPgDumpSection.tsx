/** Arahan sandaran SQL penuh (pg_dump) — pelengkap sandaran logik harian. */
export default function BackupPgDumpSection() {
  return (
    <section className="card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
        Sandaran SQL penuh (pg_dump)
      </h2>
      <p className="mt-2 text-sm text-graphite">
        Untuk pemulihan bencana penuh (schema + data), jalankan{" "}
        <strong className="font-medium text-ink">sekurang-kurangnya sekali sebulan</strong> dari
        komputer yang ada PostgreSQL client. Ini melengkapkan sandaran logik harian di atas — bukan
        menggantikannya.
      </p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-graphite">
        <li>
          Dalam Supabase Dashboard → <span className="text-ink">Connect → Direct (5432)</span>,
          salin URI ke <code className="text-ink">PGDUMP_DATABASE_URL</code> (`.env.local` dan
          GitHub Secrets).
        </li>
        <li>
          Tempatan:{" "}
          <code className="rounded bg-cloud px-1.5 py-0.5 text-ink">npm run db:backup-pgdump</code>
        </li>
        <li>
          <strong className="font-medium text-ink">Automatik bulanan:</strong> GitHub Actions{" "}
          <code className="text-ink">Sandaran pg_dump bulanan</code> → Drive{" "}
          <code className="text-ink">_backup/pgdump/tahun/bulan</code> (secrets:{" "}
          <code className="text-ink">PGDUMP_DATABASE_URL</code>, GAS). Tab Actions → Run workflow
          untuk ujian.
        </li>
      </ol>
      <p className="mt-3 text-sm text-graphite">
        Fail <code className="text-ink">.sql.gz</code> (had GAS 8 MB). Pulihkan:{" "}
        <code className="text-ink">gunzip -c fail.sql.gz | psql &lt;uri&gt;</code>
      </p>
    </section>
  );
}
