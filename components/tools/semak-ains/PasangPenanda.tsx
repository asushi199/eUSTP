"use client";

import { useEffect, useRef, useState } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { Ikon } from "./Ui";

function NomborLangkah({ n }: { n: number }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-semibold text-white">{n}</span>
  );
}

export default function PasangPenanda() {
  const pautan = useRef<HTMLAnchorElement>(null);
  const [kod, setKod] = useState<string | null>(null);
  const [versi, setVersi] = useState("");
  const [ralat, setRalat] = useState(false);
  const [disalin, setDisalin] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/tools/semak-ains/penanda.js", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((sumber) => {
        if (batal) return;
        const js = sumber.replace(/__NEXA_ORIGIN__/g, window.location.origin);
        const url = `javascript:${encodeURIComponent(js)}`;
        pautan.current?.setAttribute("href", url);
        setKod(url);
        setVersi(sumber.match(/VERSI_PENANDA\s*=\s*(\d+)/)?.[1] ?? "");
      })
      .catch(() => {
        if (!batal) setRalat(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  const salin = async () => {
    if (!kod) return;
    try {
      await navigator.clipboard.writeText(kod);
      setDisalin(true);
    } catch {
      setDisalin(false);
    }
  };

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-2">
      <section className="card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <NomborLangkah n={1} />
          <div className="min-w-0 pt-1">
            <h2 className="text-lg font-semibold text-ink">Seret butang ke bar penanda</h2>
            <p className="mt-1 text-sm leading-relaxed text-graphite">
              Tunjukkan bar penanda dengan <kbd className="rounded border border-fog bg-cloud px-1.5 py-0.5 text-xs font-semibold text-ink">Ctrl+Shift+B</kbd>{" "}
              (Chrome/Edge), kemudian seret butang di bawah ke bar itu. Jangan klik butang di halaman ini.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-steel bg-cloud px-5 py-6 text-center">
          {ralat ? (
            <p className="text-sm text-ink">Penanda tidak dapat dimuatkan. Sila muat semula halaman.</p>
          ) : (
            <>
              <p className="mb-4 flex items-center justify-center gap-1.5 text-xs font-medium text-graphite">
                <Ikon nama="muat" className="h-3.5 w-3.5 rotate-180" />
                Seret ke bar penanda
              </p>
              <a
                ref={pautan}
                draggable
                onClick={(e) => e.preventDefault()}
                className="btn-primary cursor-grab normal-case tracking-normal active:cursor-grabbing"
                aria-disabled={!kod}
              >
                {NAMA_PENANDA}
              </a>
              {versi ? <p className="mt-4 text-xs text-graphite">Versi penanda {versi}</p> : null}
            </>
          )}
        </div>

        <details className="mt-5 text-sm text-graphite">
          <summary className="cursor-pointer font-medium text-charcoal hover:text-ink">Tidak boleh seret? Tambah secara manual</summary>
          <ol className="mt-3 list-decimal space-y-1 pl-5 leading-relaxed">
            <li>Klik kanan bar penanda → Tambah halaman / Add page.</li>
            <li>
              Nama: {NAMA_PENANDA}. URL: tampal kod yang disalin.
            </li>
          </ol>
          <button type="button" className="btn-outline-ink btn-sm mt-3" disabled={!kod} onClick={salin}>
            {disalin ? "Disalin" : "Salin kod penanda"}
          </button>
        </details>
      </section>

      <section className="card flex flex-col p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <NomborLangkah n={2} />
          <div className="min-w-0 pt-1">
            <h2 className="text-lg font-semibold text-ink">Gunakan di AINS</h2>
            <ol className="mt-3 space-y-3 text-sm leading-relaxed text-graphite">
              <li>
                <b className="font-semibold text-ink">Log masuk</b> ains.moe.gov.my sebagai guru dan buka Papan Pemuka.
              </li>
              <li>
                <b className="font-semibold text-ink">Klik penanda {NAMA_PENANDA}.</b> Benarkan pop-up jika diminta.
              </li>
              <li>
                <b className="font-semibold text-ink">Tab {NAMA_PENANDA} dibuka</b> — pilih tahap/kelas dan tekan Mula baca.
              </li>
            </ol>
          </div>
        </div>
        <div className="mt-6 flex gap-3 border-t border-fog pt-5 text-xs leading-relaxed text-graphite lg:mt-auto">
          <Ikon nama="info" className="mt-0.5 text-ink" />
          <p>
            Berfungsi pada Chrome/Edge komputer — tidak disokong pada telefon. Kelulusan dan penolakan dibuat atas nama
            akaun AINS anda; tanggungjawab pengesahan kekal pada GPM.
          </p>
        </div>
      </section>
    </div>
  );
}
