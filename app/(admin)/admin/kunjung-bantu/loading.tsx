export default function MemuatKunjungBantu() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="h-4 w-40 animate-pulse rounded bg-fog" />
      <div className="mt-4 h-8 w-56 animate-pulse rounded bg-fog" />
      <div className="mt-6 flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-28 animate-pulse rounded-full bg-fog" />
        ))}
      </div>
      <p className="mt-8 text-sm text-graphite">Memuatkan…</p>
      <div className="mt-3 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-fog/70" />
        ))}
      </div>
    </div>
  );
}
