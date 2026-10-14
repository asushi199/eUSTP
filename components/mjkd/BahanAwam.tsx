import { kumpulBahan, urlMuatTurunBahan } from "@/lib/mjkd/bahan";
import type { BahanRow } from "@/lib/mjkd/queries";

/** Bahan MJKD (awam): dikumpul mengikut hari kemudian Sektor / Unit. Papar (tab baharu) + Muat Turun (PDF). */
export default function BahanAwam({ label, bahan }: { label: string; bahan: BahanRow[] }) {
  const kumpulan = kumpulBahan(bahan);
  return (
    <section className="card mt-8 p-6">
      <h2 className="text-lg font-semibold">Bahan MJKD {label}</h2>
      <div className="mt-4 space-y-6">
        {kumpulan.map((k) => (
          <div key={k.hari}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-graphite">
              {k.label}
            </h3>
            <div className="mt-2 space-y-4">
              {k.sektor.map((s) => (
                <div key={s.sektorUnit}>
                  <p className="font-semibold text-ink">{s.sektorUnit}</p>
                  <ul className="mt-2 divide-y divide-fog rounded-lg border hairline">
                    {s.bahan.map((b) => {
                      const muatTurun = urlMuatTurunBahan(b);
                      return (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">{b.tajuk}</p>
                            <p className="text-xs text-graphite">{b.namaPembentang}</p>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={b.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-outline-ink btn-sm"
                            >
                              Papar
                            </a>
                            {muatTurun ? (
                              <a href={muatTurun} className="btn-outline-ink btn-sm">
                                Muat Turun
                              </a>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
