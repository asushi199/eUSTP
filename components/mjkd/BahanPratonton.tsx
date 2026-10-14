"use client";

import { useEffect, useMemo, useState } from "react";
import { kumpulBahan, urlEmbedBahan, urlMuatTurunBahan } from "@/lib/mjkd/bahan";

export type BahanPratontonItem = {
  id: string;
  sektorUnit: string;
  tajuk: string;
  namaPembentang: string;
  hari: string[];
  jenis: string;
  url: string;
  storagePath: string;
  createdAt: string;
};

/** true pada skrin lebar (panel pratonton di sisi); null sebelum dipasang (elak dua iframe). */
function useSkrinLebar(): boolean | null {
  const [lebar, setLebar] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const ubah = () => setLebar(mq.matches);
    ubah();
    mq.addEventListener("change", ubah);
    return () => mq.removeEventListener("change", ubah);
  }, []);
  return lebar;
}

function Pratonton({ b, tinggi }: { b: BahanPratontonItem; tinggi: string }) {
  const embed = urlEmbedBahan(b);
  const muatTurun = urlMuatTurunBahan(b);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0E7490]">
            {b.sektorUnit}
          </p>
          <p className="mt-1 text-lg font-semibold leading-snug text-ink">{b.tajuk}</p>
          <p className="text-sm text-graphite">{b.namaPembentang}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#0b2530] px-4 text-xs font-semibold uppercase tracking-[0.7px] text-white hover:bg-[#0E7490]"
          >
            Skrin penuh ↗
          </a>
          {muatTurun ? (
            <a
              href={muatTurun}
              className="inline-flex h-10 items-center rounded-md border border-steel px-4 text-xs font-semibold uppercase tracking-[0.7px] text-ink hover:border-ink"
            >
              Muat turun
            </a>
          ) : null}
        </div>
      </div>
      {embed ? (
        <>
          <div className={`overflow-hidden rounded-xl border hairline bg-[#0b2530]/5 ${tinggi}`}>
            <iframe
              key={b.id}
              title={b.tajuk}
              src={embed}
              allow="fullscreen"
              allowFullScreen
              loading="lazy"
              className="h-full w-full"
            />
          </div>
          <p className="text-xs text-graphite">
            Pratonton kosong atau meminta log masuk? Pemilik bahan belum berkongsi &quot;sesiapa
            yang ada pautan&quot; — klik Skrin penuh.
          </p>
        </>
      ) : (
        <div
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-steel bg-cloud/50 p-6 text-center ${tinggi}`}
        >
          <p className="text-sm text-graphite">Bahan ini tidak boleh dipratonton di sini.</p>
          <a
            href={b.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-ink btn-sm"
          >
            Buka di tab baharu
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Bahan pembentangan dengan pratonton terus: skrin lebar = senarai kiri + panel pratonton kanan
 * (melekit); telefon = pratonton dibuka di bawah item yang dipilih.
 */
export default function BahanPratonton({ bahan }: { bahan: BahanPratontonItem[] }) {
  const kumpulan = useMemo(() => kumpulBahan(bahan), [bahan]);
  const lebar = useSkrinLebar();
  const [dipilih, setDipilih] = useState<string | null>(bahan[0]?.id ?? null);
  // Kunci unik setiap kemunculan (bahan dua hari muncul di bawah kedua-dua hari).
  const [kunciAktif, setKunciAktif] = useState<string | null>(null);
  const semasa = bahan.find((b) => b.id === dipilih) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-6">
        {kumpulan.map((k) => (
          <div key={k.hari}>
            <p className="inline-flex items-center gap-2 rounded-full bg-[#0b2530] px-3 py-1 text-xs font-semibold tracking-[0.08em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E3B341]" aria-hidden />
              {k.label}
            </p>
            <div className="mt-3 space-y-4">
              {k.sektor.map((s) => (
                <div key={s.sektorUnit}>
                  <p className="text-sm font-semibold text-ink">{s.sektorUnit}</p>
                  <ul className="mt-2 space-y-2">
                    {s.bahan.map((b) => {
                      const kunci = `${k.hari}-${b.id}`;
                      const aktif = lebar ? b.id === dipilih : kunci === kunciAktif;
                      return (
                        <li key={kunci}>
                          <button
                            type="button"
                            onClick={() => {
                              setDipilih(b.id);
                              setKunciAktif(kunciAktif === kunci && !lebar ? null : kunci);
                            }}
                            aria-expanded={lebar ? undefined : aktif}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                              aktif
                                ? "border-[#0E7490] bg-[#0E7490]/[0.06] shadow-sm"
                                : "hairline bg-white hover:border-steel"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                                aktif ? "bg-[#0E7490] text-white" : "bg-cloud text-graphite"
                              }`}
                              aria-hidden
                            >
                              {b.jenis === "PDF" ? "PDF" : "▶"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-medium text-ink">{b.tajuk}</span>
                              <span className="block text-xs text-graphite">{b.namaPembentang}</span>
                            </span>
                            <span className="text-xs text-graphite" aria-hidden>
                              {lebar ? "→" : aktif ? "▲" : "▼"}
                            </span>
                          </button>
                          {lebar === false && aktif ? (
                            <div className="mt-3 rounded-xl border hairline bg-white p-3">
                              <Pratonton b={b} tinggi="aspect-[4/3]" />
                            </div>
                          ) : null}
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

      {lebar && semasa ? (
        <div className="xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border hairline bg-white p-5 shadow-[0_12px_40px_-24px_rgba(11,37,48,0.45)]">
            <Pratonton b={semasa} tinggi="aspect-video" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
