"use client";

import { useEffect, useRef, useState } from "react";

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
    <div className="mt-8 space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">1. Seret butang ini ke bar penanda</h2>
        <p className="mt-1 text-sm text-graphite">
          Tunjukkan bar penanda dengan <b>Ctrl+Shift+B</b> (Chrome/Edge), kemudian seret butang di bawah ke
          bar itu. Jangan klik butang di halaman ini.
        </p>
        {ralat ? (
          <p className="mt-4 text-sm text-ink">Penanda tidak dapat dimuatkan. Sila muat semula halaman.</p>
        ) : (
          <a
            ref={pautan}
            draggable
            onClick={(e) => e.preventDefault()}
            className="btn-primary mt-4 inline-flex cursor-grab"
            aria-disabled={!kod}
          >
            Semak AINS
          </a>
        )}
        {versi ? <p className="mt-2 text-xs text-graphite">Versi penanda: {versi}</p> : null}
        <details className="mt-4 text-sm text-graphite">
          <summary className="cursor-pointer">Tidak boleh seret? Tambah secara manual</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Klik kanan bar penanda → Tambah halaman / Add page.</li>
            <li>Nama: Semak AINS. URL: tampal kod yang disalin.</li>
          </ol>
          <button type="button" className="btn-outline-ink mt-3" disabled={!kod} onClick={salin}>
            {disalin ? "Disalin" : "Salin kod penanda"}
          </button>
        </details>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">2. Gunakan di AINS</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-graphite">
          <li>Log masuk ains.moe.gov.my sebagai guru dan buka Papan Pemuka.</li>
          <li>Klik penanda &quot;Semak AINS&quot;. Benarkan pop-up jika diminta.</li>
          <li>Tab Semak Rekod AINS dibuka — pilih tahap/kelas dan tekan Mula baca.</li>
        </ol>
        <p className="mt-3 text-xs text-graphite">
          Berfungsi pada Chrome/Edge komputer. Tidak disokong pada telefon. Kelulusan dan penolakan dibuat
          atas nama akaun AINS anda; tanggungjawab pengesahan kekal pada GPM.
        </p>
      </section>
    </div>
  );
}
