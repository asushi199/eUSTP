"use client";

import { useEffect, useRef, useState } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { Ikon } from "./Ui";

/**
 * Butang penanda boleh seret (pautan javascript: dijana daripada public/tools/semak-ains/penanda.js
 * dengan asal NEXa semasa) + cara tambah manual.
 */
export default function ButangPenanda() {
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
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-steel bg-cloud px-4 py-3">
        {ralat ? (
          <p className="text-sm text-ink">Penanda tidak dapat dimuatkan. Sila muat semula halaman.</p>
        ) : (
          <>
            {/* Nama penanda = teks pautan; normal-case supaya tidak jadi huruf besar. */}
            <a
              ref={pautan}
              draggable
              onClick={(e) => e.preventDefault()}
              className="btn-primary btn-sm cursor-grab normal-case tracking-normal active:cursor-grabbing"
              aria-disabled={!kod}
              title="Seret ke bar penanda — jangan klik"
            >
              {NAMA_PENANDA}
            </a>
            <span className="flex items-center gap-1.5 text-xs font-medium text-graphite">
              <Ikon nama="muat" className="h-3.5 w-3.5 rotate-180" />
              Seret ke bar penanda{versi ? ` · versi ${versi}` : ""}
            </span>
          </>
        )}
      </div>
      <details className="mt-2 text-sm text-graphite">
        <summary className="cursor-pointer text-xs font-medium text-charcoal hover:text-ink">
          Tidak boleh seret? Tambah secara manual
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
          <li>Klik kanan bar penanda → Tambah halaman / Add page.</li>
          <li>Nama: {NAMA_PENANDA}. URL: tampal kod yang disalin.</li>
        </ol>
        <button type="button" className="btn-outline-ink btn-sm mt-3" disabled={!kod} onClick={salin}>
          {disalin ? "Disalin" : "Salin kod penanda"}
        </button>
      </details>
    </div>
  );
}
