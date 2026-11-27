"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { Bahasa, Keputusan, KodSebab, RekodAins, Warna } from "@/lib/tools/semak-ains/jenis";
import { LABEL_MAKLUMAT, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import { ASAL_AINS } from "@/lib/tools/semak-ains/mesej";
import type { Ringkasan } from "@/lib/tools/semak-ains/peraturan";
import { labelKodTahap } from "./PanelTapisan";
import { Ikon, TitikWarna } from "./Ui";
import type { StatusTindakan } from "./useSambunganAins";
import { WARNA_STATUS } from "./warna";

const LANGKAH = 100;
const LABEL_BAHASA: Record<Bahasa, string> = {
  zh: "Cina",
  ta: "Tamil",
  bm: "BM",
  en: "BI",
  campur: "Campuran",
  lain: "Lain",
};

export type Penapis = {
  warna: Warna | "semua";
  sebab: KodSebab | "semua";
  tahap: string;
  cari: string;
};
export const PENAPIS_KOSONG: Penapis = { warna: "semua", sebab: "semua", tahap: "semua", cari: "" };

const TAB: { kod: Warna | "semua"; label: string }[] = [
  { kod: "semua", label: "Semua" },
  { kod: "hijau", label: WARNA_STATUS.hijau.label },
  { kod: "kuning", label: WARNA_STATUS.kuning.label },
  { kod: "merah", label: WARNA_STATUS.merah.label },
];

type Props = {
  rekodIkutId: Map<string, RekodAins>;
  keputusan: Keputusan[];
  ringkasan: Ringkasan;
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  penapis: Penapis;
  onPenapis: (p: Penapis) => void;
  onTogolPilih: (id: string) => void;
  /** Pilih / nyahpilih banyak rekod sekali gus (kotak "Pilih semua"). */
  onPilihBanyak: (id: string[], pilih: boolean) => void;
};

export function pautanAins(id: string): string {
  return `${ASAL_AINS}/web/teacher-record-details?id=${encodeURIComponent(id)}`;
}

function LencanaStatus({ st }: { st: StatusTindakan }) {
  const teks = st.berjaya
    ? st.tindakan === "approved"
      ? "Diluluskan"
      : "Ditolak"
    : `Gagal: ${st.jawapan ?? "ralat"}`;
  return (
    <span className="status-badge">
      {st.berjaya ? <Ikon nama="betul" className="h-3 w-3" /> : <Ikon nama="amaran" className="h-3 w-3 text-bloom-deep" />}
      {teks}
    </span>
  );
}

export default function SenaraiRekod({
  rekodIkutId,
  keputusan,
  ringkasan,
  status,
  dipilih,
  penapis,
  onPenapis,
  onTogolPilih,
  onPilihBanyak,
}: Props) {
  const [had, setHad] = useState(LANGKAH);
  useEffect(() => setHad(LANGKAH), [penapis]);

  const sebabAda = useMemo(
    () => [...new Set(keputusan.flatMap((k) => [...k.merah, ...k.kuning]))],
    [keputusan],
  );
  const tahapAda = useMemo(() => [...new Set(keputusan.map((k) => k.kodTahap))].sort(), [keputusan]);
  const tapis = useMemo(() => {
    const q = penapis.cari.trim().toLowerCase();
    return keputusan.filter((k) => {
      if (penapis.warna !== "semua" && k.warna !== penapis.warna) return false;
      if (penapis.sebab !== "semua" && !k.merah.includes(penapis.sebab) && !k.kuning.includes(penapis.sebab)) return false;
      if (penapis.tahap !== "semua" && k.kodTahap !== penapis.tahap) return false;
      if (q) {
        const r = rekodIkutId.get(k.id);
        if (!r || !`${r.murid} ${r.tajuk} ${r.kelas}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [keputusan, penapis, rekodIkutId]);

  /* "Pilih semua" meliputi SEMUA rekod dalam tapisan semasa (bukan hanya yang sudah dipaparkan),
   * kecuali yang sudah diluluskan/ditolak. */
  const idBolehPilih = useMemo(
    () =>
      tapis
        .filter((k) => {
          const st = status.get(k.id);
          return st?.berjaya !== true && st?.perluBacaSemula !== true;
        })
        .map((k) => k.id),
    [tapis, status],
  );
  const bilTerpilih = useMemo(() => idBolehPilih.filter((id) => dipilih.has(id)).length, [idBolehPilih, dipilih]);
  const semuaTerpilih = idBolehPilih.length > 0 && bilTerpilih === idBolehPilih.length;

  const ubah = (sebahagian: Partial<Penapis>) => onPenapis({ ...penapis, ...sebahagian });
  const adaTapisan =
    penapis.warna !== "semua" || penapis.sebab !== "semua" || penapis.tahap !== "semua" || penapis.cari.trim() !== "";
  const bilangan = (kod: Warna | "semua") => (kod === "semua" ? ringkasan.jumlah : ringkasan[kod]);

  return (
    <section id="senarai-rekod" className="card scroll-mt-6 overflow-hidden">
      <div className="p-4 sm:px-6 sm:pt-5">
        <h2 className="text-base font-semibold text-ink">Senarai rekod</h2>
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Tapis mengikut status">
          {TAB.map((t) => {
            const aktif = penapis.warna === t.kod;
            return (
              <button
                key={t.kod}
                type="button"
                aria-pressed={aktif}
                onClick={() => ubah({ warna: t.kod })}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition",
                  aktif ? "border-ink bg-ink text-white" : "border-fog bg-white text-charcoal hover:border-steel",
                )}
              >
                {t.kod !== "semua" ? <TitikWarna warna={t.kod} className="h-2 w-2" /> : null}
                {t.label}
                <span className={cn("text-xs tabular-nums", aktif ? "text-white/70" : "text-graphite")}>
                  {bilangan(t.kod).toLocaleString("ms-MY")}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_15rem_10rem]">
          <label className="relative block">
            <span className="sr-only">Cari murid, tajuk atau kelas</span>
            <Ikon nama="cari" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
            <input
              type="search"
              className="input h-10 pl-9 text-sm"
              placeholder="Cari murid, tajuk atau kelas"
              value={penapis.cari}
              onChange={(e) => ubah({ cari: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="sr-only">Sebab</span>
            <select
              className="input h-10 px-3 text-sm"
              value={penapis.sebab}
              onChange={(e) => ubah({ sebab: e.target.value as KodSebab | "semua" })}
            >
              <option value="semua">Semua sebab</option>
              {sebabAda.map((s) => (
                <option key={s} value={s}>
                  {LABEL_SEBAB[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Tahap</span>
            <select className="input h-10 px-3 text-sm" value={penapis.tahap} onChange={(e) => ubah({ tahap: e.target.value })}>
              <option value="semua">Semua tahap</option>
              {tahapAda.map((t) => (
                <option key={t} value={t}>
                  {labelKodTahap(t)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-y border-fog bg-cloud/70 px-4 py-2 text-xs text-graphite sm:px-6">
        <label className={cn("flex min-w-0 items-center gap-3", idBolehPilih.length > 0 && "cursor-pointer")}>
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 accent-ink"
            checked={semuaTerpilih}
            disabled={idBolehPilih.length === 0}
            ref={(el) => {
              if (el) el.indeterminate = bilTerpilih > 0 && !semuaTerpilih;
            }}
            onChange={() => onPilihBanyak(idBolehPilih, !semuaTerpilih)}
          />
          <span className="font-medium text-ink">{semuaTerpilih ? "Nyahpilih semua" : "Pilih semua"}</span>
          <span className="tabular-nums">
            {tapis.length.toLocaleString("ms-MY")} rekod{adaTapisan ? " dalam tapisan ini" : ""}
          </span>
        </label>
        {adaTapisan ? (
          <button type="button" className="font-medium text-ink hover:underline" onClick={() => onPenapis(PENAPIS_KOSONG)}>
            Kosongkan tapisan
          </button>
        ) : null}
      </div>

      {tapis.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-graphite">Tiada rekod sepadan dengan tapisan ini.</p>
      ) : (
        <ul className="divide-y divide-fog">
          {tapis.slice(0, had).map((k) => {
            const r = rekodIkutId.get(k.id);
            if (!r) return null;
            const st = status.get(k.id);
            const siap = st?.berjaya === true || st?.perluBacaSemula === true;
            /* Semua rekod boleh dipilih; rekod terpilih boleh diluluskan ATAU ditolak tanpa mengira
             * warna — GPM yang memutuskan (2026-11-27). Butang pukal kekal ikut warna. */
            const bolehPilih = !siap;
            const terpilih = dipilih.has(k.id);
            const ada = k.merah.length + k.kuning.length + k.maklumat.length > 0;
            return (
              <li key={k.id} className={cn("flex gap-3 px-4 py-4 transition-colors sm:px-6", terpilih && "bg-cloud shadow-[inset_3px_0_0_#1a1a1a]", siap && "opacity-60")}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-ink"
                  checked={terpilih}
                  disabled={!bolehPilih}
                  onChange={() => onTogolPilih(k.id)}
                  aria-label={`Pilih ${r.tajuk}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        <TitikWarna warna={k.warna} className="h-2 w-2" />
                        <span className="sr-only">{WARNA_STATUS[k.warna].label}: </span>
                        <span className="min-w-0 break-words">{r.tajuk}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-graphite">
                        {r.murid} · {r.kelas} · {LABEL_BAHASA[k.bahasa]} · {k.panjang.toLocaleString("ms-MY")}{" "}
                        {k.bahasa === "zh" ? "aksara" : "perkataan"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {st ? <LencanaStatus st={st} /> : null}
                      <a
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-charcoal hover:bg-cloud hover:text-ink"
                        href={pautanAins(k.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buka dalam AINS: ${r.tajuk}`}
                      >
                        <span className="hidden sm:inline">Buka dalam AINS</span>
                        <span className="sm:hidden">AINS</span>
                        <Ikon nama="luar" className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                  {ada ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {k.merah.map((s) => (
                        <span
                          key={s}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${WARNA_STATUS.merah.warna}14`, color: WARNA_STATUS.merah.teks }}
                        >
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.kuning.map((s) => (
                        <span
                          key={s}
                          className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${WARNA_STATUS.kuning.warna}14`, color: WARNA_STATUS.kuning.teks }}
                        >
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.maklumat.map((m) => (
                        <span key={m} className="rounded-full bg-cloud px-2.5 py-0.5 text-xs text-graphite">
                          {LABEL_MAKLUMAT[m]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {k.padanBuku?.length ? (
                    <p className="mt-2 text-xs leading-relaxed text-graphite">
                      {(() => {
                        /* Tunjuk rekod mana yang dikira "buku sama" supaya GPM boleh menilai padanan itu. */
                        const lain = k.padanBuku.map((id) => rekodIkutId.get(id)?.tajuk ?? "").filter(Boolean);
                        const unik = [...new Set(lain)];
                        if (unik.length === 1 && unik[0] === r.tajuk) {
                          return `Tajuk yang sama direkod ${lain.length.toLocaleString("ms-MY")} kali lagi oleh murid ini.`;
                        }
                        const papar = unik.slice(0, 2).map((t) => `“${t}”`).join(", ");
                        const baki = unik.length - 2;
                        return `Dikira buku sama dengan rekod lain murid ini: ${papar}${baki > 0 ? ` dan ${baki} lagi` : ""}.`;
                      })()}
                    </p>
                  ) : null}
                  <dl className="mt-2.5 space-y-1 border-l-2 border-fog pl-3 text-sm leading-relaxed text-charcoal">
                    <div className="line-clamp-2">
                      <dt className="inline font-semibold text-ink">Rumusan: </dt>
                      <dd className="inline">{r.rumusan || "—"}</dd>
                    </div>
                    <div className="line-clamp-2">
                      <dt className="inline font-semibold text-ink">Pengajaran: </dt>
                      <dd className="inline">{r.pengajaran || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {tapis.length > had ? (
        <div className="border-t border-fog p-4 text-center">
          <button type="button" className="btn-outline-ink btn-sm" onClick={() => setHad((h) => h + LANGKAH)}>
            Tunjuk {Math.min(LANGKAH, tapis.length - had)} lagi
          </button>
        </div>
      ) : null}
    </section>
  );
}
