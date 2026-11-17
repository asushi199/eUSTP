/** Satu perkara peringatan; `sub` = senarai kecil di bawahnya (cth. sasaran mengikut tahap). */
export type PerkaraPeringatan = string | { teks: string; sub: readonly string[] };

/**
 * Jalur dakwat gelap untuk peringatan tindakan sekolah (gaya sama `TarikhAkhirBanner`):
 * tajuk + senarai bernombor. Tiada tarikh/kiraan hari.
 */
export default function PeringatanBanner({
  tajuk,
  senarai,
}: {
  tajuk: string;
  senarai: readonly PerkaraPeringatan[];
}) {
  return (
    <div className="mt-3 rounded-lg bg-ink px-4 py-3 text-white">
      <p className="flex items-center gap-2 text-base font-extrabold tracking-tight sm:text-lg">
        <span className="h-2 w-2 shrink-0 rounded-full bg-bloom-coral" aria-hidden />
        {tajuk}
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-9 text-sm font-semibold leading-snug text-white/80">
        {senarai.map((p) =>
          typeof p === "string" ? (
            <li key={p}>{p}</li>
          ) : (
            <li key={p.teks}>
              {p.teks}
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {p.sub.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
