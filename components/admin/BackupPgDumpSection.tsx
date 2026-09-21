/** Paparan ringkas: tarikh sandaran SQL bulanan (pg_dump) terakhir berjaya. */
export default function BackupPgDumpSection({ atText }: { atText: string | null }) {
  return (
    <section className="card p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-graphite">
        Sandaran SQL penuh (pg_dump)
      </h2>
      <p className="mt-3 text-sm text-graphite">
        {atText ? (
          <>
            Terakhir berjaya: <span className="font-medium text-ink">{atText}</span>
          </>
        ) : (
          <span className="text-graphite">Belum ada sandaran bulanan direkodkan.</span>
        )}
      </p>
    </section>
  );
}
