"use client";

import type { ReactNode } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { useBahasa } from "./Bahasa";
import ButangPenanda from "./ButangPenanda";
import { Ikon, TitikWarna } from "./Ui";
import { WARNA_STATUS } from "./warna";

function Langkah({ n, tajuk, children }: { n: number; tajuk: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{n}</span>
      <div className="min-w-0 flex-1 pt-1">
        <p className="font-semibold text-ink">{tajuk}</p>
        <div className="mt-0.5 text-sm leading-relaxed text-graphite">{children}</div>
      </div>
    </li>
  );
}

/**
 * Paparan apabila halaman dibuka terus (bukan melalui penanda dalam tab AINS):
 * pasang penanda + cara guna dalam satu halaman. Alat hanya berfungsi apabila
 * dibuka oleh penanda kerana data dibaca daripada tab AINS (NEXa tiada sesi AINS).
 */
export default function Pengenalan() {
  const { k } = useBahasa();
  const p = k.pengenalan;
  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="card p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">{p.tajuk}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-graphite">{p.huraian(NAMA_PENANDA)}</p>
        <ol className="mt-6 space-y-6">
          <Langkah n={1} tajuk={p.langkah1}>
            <p>{p.langkah1Isi}</p>
            <ButangPenanda />
          </Langkah>
          <Langkah n={2} tajuk={p.langkah2}>
            {p.langkah2Isi}
          </Langkah>
          <Langkah n={3} tajuk={p.langkah3(NAMA_PENANDA)}>
            {p.langkah3Isi(NAMA_PENANDA)}
          </Langkah>
        </ol>
      </section>

      <aside className="card flex flex-col p-6 sm:p-8">
        <h2 className="font-semibold text-ink">{p.kelasTajuk}</h2>
        <ul className="mt-5 flex-1 space-y-4">
          {(["hijau", "kuning", "merah"] as const).map((w) => (
            <li key={w} className="flex gap-3">
              <TitikWarna warna={w} className="mt-1.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: WARNA_STATUS[w].teks }}>
                  {k.warna[w]}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-graphite">{p.maksud[w]}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3 border-t border-fog pt-5 text-xs leading-relaxed text-graphite">
          <p className="flex gap-3">
            <Ikon nama="kunci" className="mt-0.5 text-ink" />
            <span>{p.privasi}</span>
          </p>
          <p className="flex gap-3">
            <Ikon nama="info" className="mt-0.5 text-ink" />
            <span>{p.syarat}</span>
          </p>
        </div>
      </aside>
    </div>
  );
}
