"use client";

import { useEffect, useId, useRef } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { Ikon } from "./Ui";

const LANGKAH = [
  "Pergi ke tab AINS.",
  "Buka Papan Pemuka (log masuk semula jika perlu).",
  `Klik penanda ${NAMA_PENANDA} pada bar penanda.`,
];

/** Pop-up apabila penanda dalam tab AINS tidak lagi membalas (tab dimuat semula/ditutup). */
export default function DialogTerputus({ onTutup }: { onTutup: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const butangRef = useRef<HTMLButtonElement>(null);
  const tajukId = useId();
  const tutupRef = useRef(onTutup);
  tutupRef.current = onTutup;

  // Dialog asli: showModal() memberi latar inert, kurungan fokus & Escape.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onClose = () => {
      if (!el.open) tutupRef.current();
    };
    el.addEventListener("close", onClose);
    if (!el.open) el.showModal();
    butangRef.current?.focus();
    return () => {
      el.removeEventListener("close", onClose);
      if (el.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tajukId}
      className="!m-auto w-[calc(100%-2rem)] max-w-md border-0 bg-transparent p-0 backdrop:bg-black/50"
    >
      <div className="w-full overflow-hidden rounded-xl bg-white shadow-modal">
        <div className="px-6 pt-6">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-bloom-rose/60 text-bloom-deep">
            <Ikon nama="amaran" className="h-6 w-6" />
          </span>
          <h2 id={tajukId} className="mt-4 text-lg font-semibold text-ink">
            Sambungan dengan tab AINS terputus
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-graphite">
            Tab AINS telah dimuat semula, bertukar halaman atau ditutup. Untuk menyambung semula:
          </p>
          <ol className="mt-4 space-y-3">
            {LANGKAH.map((l, i) => (
              <li key={l} className="flex items-start gap-3 text-sm text-ink">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{l}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-graphite">
            Rekod akan dibaca semula secara automatik. Jika tab {NAMA_PENANDA} baharu dibuka, tutup tab ini.
          </p>
          <p className="mt-3 rounded-lg bg-cloud px-3 py-2.5 text-xs leading-relaxed text-charcoal">
            Petua: penanda versi terkini kekal bersambung walaupun tab AINS dimuat semula.{" "}
            {/* Tab baharu tanpa opener → paparan pasang penanda. */}
            <a href="/tools/semak-ains" target="_blank" rel="noopener" className="font-medium text-ink underline">
              Pasang semula penanda
            </a>
            .
          </p>
        </div>
        <div className="mt-6 flex justify-end border-t border-fog bg-cloud/50 px-6 py-4">
          <button ref={butangRef} type="button" className="btn-ink" onClick={onTutup}>
            Faham
          </button>
        </div>
      </div>
    </dialog>
  );
}
