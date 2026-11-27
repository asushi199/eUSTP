"use client";

import { useEffect, useRef, useState } from "react";

const NAMA_PENANDA = "DELIMa → NEXa";

/**
 * Butang penanda boleh seret: pautan `javascript:` dijana daripada `public/penanda/delima-d3.js`
 * dengan asal NEXa semasa. React menolak `href="javascript:"`, jadi atribut ditetapkan melalui ref.
 */
export default function PenandaDelimaD3() {
  const pautan = useRef<HTMLAnchorElement>(null);
  const [kod, setKod] = useState<string | null>(null);
  const [versi, setVersi] = useState("");
  const [ralat, setRalat] = useState(false);
  const [disalin, setDisalin] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/penanda/delima-d3.js", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((sumber) => {
        if (batal) return;
        const url = `javascript:${encodeURIComponent(sumber.replace(/__NEXA_ORIGIN__/g, window.location.origin))}`;
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
    <div className="card mt-3 px-4 py-4">
      <h3 className="text-sm font-semibold text-ink">Kemas kini dengan penanda (tanpa CSV)</h3>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-graphite">
        <li>Sekali sahaja: seret butang di bawah ke bar penanda pelayar.</li>
        <li>Buka d3.delima.edu.my dan log masuk seperti biasa.</li>
        <li>
          Klik penanda &ldquo;{NAMA_PENANDA}&rdquo;. Ia membaca PPD Manjung dan setiap sekolah (1 Jan → hari
          ini), kira-kira seminit.
        </li>
        <li>NEXa dibuka dengan ringkasan. Semak, kemudian tekan &ldquo;Simpan ke NEXa&rdquo;.</li>
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-steel bg-cloud px-4 py-3">
        {ralat ? (
          <p className="text-sm text-ink">Penanda tidak dapat dimuatkan. Sila muat semula halaman.</p>
        ) : (
          <>
            {/* Nama penanda = teks pautan; normal-case supaya tidak jadi huruf besar. */}
            <a
              ref={pautan}
              draggable
              onClick={(e) => e.preventDefault()}
              className="btn-ink btn-sm cursor-grab normal-case tracking-normal active:cursor-grabbing"
              aria-disabled={!kod}
              title="Seret ke bar penanda — jangan klik di sini"
            >
              {NAMA_PENANDA}
            </a>
            <span className="text-xs font-medium text-graphite">
              Seret ke bar penanda{versi ? ` · versi ${versi}` : ""}
            </span>
          </>
        )}
      </div>
      <details className="mt-3 text-sm text-graphite">
        <summary className="cursor-pointer text-xs font-medium text-charcoal hover:text-ink">
          Tidak boleh seret, atau penanda tiada respons?
        </summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            Tambah secara manual: buat penanda baharu dengan sebarang nama, kemudian tampal kod ini ke
            dalam medan URL.
          </p>
          <button type="button" className="btn-outline-ink btn-sm" onClick={() => void salin()} disabled={!kod}>
            {disalin ? "Disalin" : "Salin kod penanda"}
          </button>
          <p>
            Jika klik penanda tiada kesan langsung, profil Chrome yang diurus (akaun moe-dl) menyekat
            penanda jenis ini. Guna Microsoft Edge, atau profil Chrome tanpa akaun moe-dl, dan log
            masuk ke DELIMa di situ.
          </p>
        </div>
      </details>
      <p className="mt-3 text-xs leading-relaxed text-graphite">
        Penanda hanya membaca bilangan guru dan murid aktif. Tiada nama atau e-mel dibaca, dan sesi
        DELIMa anda tidak dihantar ke NEXa.
      </p>
    </div>
  );
}
