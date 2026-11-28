"use client";

import { useEffect, useRef, useState } from "react";
import { NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";
import { useBahasa } from "./Bahasa";
import { Ikon } from "./Ui";

/**
 * Butang penanda boleh seret (pautan javascript: dijana daripada public/tools/semak-ains/penanda.js
 * dengan asal NEXa semasa) + cara tambah manual.
 */
export default function ButangPenanda() {
  const { bahasa, k } = useBahasa();
  const t = k.penanda;
  const pautan = useRef<HTMLAnchorElement>(null);
  const [sumber, setSumber] = useState<string | null>(null);
  const [kod, setKod] = useState<string | null>(null);
  const [ralat, setRalat] = useState(false);
  const [disalin, setDisalin] = useState(false);
  /* Lalai = mod tetingkap (tahan muat semula tab AINS, lihat penanda.js). /tools/semak-ains?mod=tab
   * menjana penanda cara lama (alat dalam tab baharu) sebagai jalan keluar. Lalai pernah
   * dikembalikan kepada mod tab pada 2026-11-27 pagi kerana "v8 tidak tercetus" — punca sebenar
   * ialah profil Chrome moe-dl menyekat URL javascript: (semua penanda), bukan mod tetingkap. */
  const [modTab, setModTab] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/tools/semak-ains/penanda.js", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((teks) => {
        if (batal) return;
        setModTab(new URLSearchParams(window.location.search).get("mod") === "tab");
        setSumber(teks);
      })
      .catch(() => {
        if (!batal) setRalat(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  /* Penanda membawa bahasa semasa (mesej amarannya + `?bahasa=` pada alat), jadi ia dijana semula
   * setiap kali bahasa ditukar pada halaman ini. */
  useEffect(() => {
    if (!sumber) return;
    const js = sumber
      .replace(/__NEXA_ORIGIN__/g, window.location.origin)
      .replace(/__SAHPANTAS_MOD__/g, modTab ? "tab" : "tetingkap")
      .replace(/__VERIX_BAHASA__/g, bahasa);
    const url = `javascript:${encodeURIComponent(js)}`;
    pautan.current?.setAttribute("href", url);
    setKod(url);
    setDisalin(false);
  }, [sumber, modTab, bahasa]);

  const versi = sumber?.match(/VERSI_PENANDA\s*=\s*(\d+)/)?.[1] ?? "";

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
          <p className="text-sm text-ink">{t.gagalMuat}</p>
        ) : (
          <>
            {/* Nama penanda = teks pautan; normal-case supaya tidak jadi huruf besar. */}
            <a
              ref={pautan}
              draggable
              onClick={(e) => e.preventDefault()}
              className="btn-primary btn-sm cursor-grab normal-case tracking-normal active:cursor-grabbing"
              aria-disabled={!kod}
              title={t.petuaSeret}
            >
              {modTab ? `${NAMA_PENANDA} (tab)` : NAMA_PENANDA}
            </a>
            <span className="flex items-center gap-1.5 text-xs font-medium text-graphite">
              <Ikon nama="muat" className="h-3.5 w-3.5 rotate-180" />
              {t.seret}
              {versi ? ` · ${t.versi(versi)}` : ""}
              {modTab ? ` · ${t.modTab}` : ""}
            </span>
          </>
        )}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-graphite">{t.notaBahasa}</p>
      <details className="mt-2 text-sm text-graphite">
        <summary className="cursor-pointer text-xs font-medium text-charcoal hover:text-ink">{t.bantuanBar}</summary>
        <p className="mt-2 leading-relaxed">
          {t.bantuanBarSebelum}{" "}
          <kbd className="rounded border border-fog bg-cloud px-1.5 py-0.5 text-xs font-semibold text-ink">Ctrl+Shift+B</kbd>{" "}
          {t.bantuanBarSelepas}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
          <li>{t.manual1}</li>
          <li>{t.manual2(NAMA_PENANDA)}</li>
        </ol>
        <button type="button" className="btn-outline-ink btn-sm mt-3" disabled={!kod} onClick={salin}>
          {disalin ? t.disalin : t.salin}
        </button>
      </details>
      <details className="mt-2 text-sm text-graphite">
        <summary className="cursor-pointer text-xs font-medium text-charcoal hover:text-ink">{t.bantuanSekat}</summary>
        <p className="mt-2 leading-relaxed">{t.bantuanSekatIsi}</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
          <li>{t.sekat1}</li>
          <li>{t.sekat2(NAMA_PENANDA)}</li>
          <li>{t.sekat3}</li>
        </ol>
      </details>
    </div>
  );
}
