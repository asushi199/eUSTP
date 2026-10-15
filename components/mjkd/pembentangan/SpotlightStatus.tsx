"use client";

import { useEffect, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react";
import { STATUS_MJKD_LABEL, type StatusMjkd } from "@/lib/mjkd/enums";
import { ringkasTeks, type SlaidPerkara } from "@/lib/mjkd/pembentangan";
import Mozek from "./Mozek";
import TeksMuat from "./TeksMuat";

export type KawalanSpotStatus = { langkah: (d: number) => boolean };

/**
 * Satu status merentas perkara (dibuka dari kotak status Papan Pemuka): kiri = senarai perkara
 * yang ada jawapan berstatus itu (bilangan sekolah); kanan = mozek sekolah berstatus itu bagi
 * perkara dipilih. Klik sekolah = Spotlight jawapan (← → antara sekolah berstatus sama).
 * ← → (lapisan ini) = perkara sebelum / seterusnya.
 */
export default function SpotlightStatus({
  status,
  perkara,
  perkaraId,
  ditindih,
  kawalan,
  onPerkara,
  onSekolah,
  onSlaidPerkara,
  onTutup,
}: {
  status: StatusMjkd;
  /** Slaid perkara dek (sudah diisih ikut minit). */
  perkara: readonly SlaidPerkara[];
  /** Perkara dipilih (null = pertama dalam senarai). */
  perkaraId: string | null;
  /** Spotlight jawapan sedang terbuka di atas lapisan ini. */
  ditindih: boolean;
  kawalan: Ref<KawalanSpotStatus | null>;
  onPerkara: (perkaraId: string) => void;
  onSekolah: (perkaraId: string, kod: string) => void;
  onSlaidPerkara: (perkaraId: string) => void;
  onTutup: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const senaraiRef = useRef<HTMLDivElement>(null);

  const senarai = perkara.filter((p) => p.bilangan[status] > 0);
  const jumlah = senarai.reduce((n, p) => n + p.bilangan[status], 0);
  const i = Math.max(0, senarai.findIndex((p) => p.perkaraId === perkaraId));
  const dipilih = senarai[i] ?? null;
  const jubin = dipilih ? dipilih.jubin.filter((j) => j.status === status) : [];

  useEffect(() => {
    if (!ditindih) dialogRef.current?.focus();
  }, [ditindih]);
  // Pastikan baris dipilih kelihatan (← → boleh melepasi bahagian yang ditatal).
  useEffect(() => {
    senaraiRef.current?.querySelector<HTMLElement>("[aria-current='true']")?.scrollIntoView({ block: "nearest" });
  }, [dipilih?.perkaraId]);

  const langkah = (d: number) => {
    const p = senarai[i + d];
    if (p) onPerkara(p.perkaraId);
  };

  useImperativeHandle(kawalan, () => ({
    langkah: (d) => {
      langkah(d);
      return true;
    },
  }));

  // Perangkap fokus dalam dialog.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return;
    const el = dialogRef.current;
    if (!el) return;
    const f = [...el.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]")];
    if (f.length === 0) return;
    const pertama = f[0]!;
    const akhir = f[f.length - 1]!;
    if (e.shiftKey && (document.activeElement === pertama || document.activeElement === el)) {
      e.preventDefault();
      akhir.focus();
    } else if (!e.shiftKey && document.activeElement === akhir) {
      e.preventDefault();
      pertama.focus();
    }
  };

  const label = STATUS_MJKD_LABEL[status];

  return (
    <div className="pt-lapisan">
      <div className="pt-latar-spot" onClick={onTutup} />
      <div
        ref={dialogRef}
        className="pt-spot"
        role="dialog"
        aria-modal="true"
        aria-label={`Perkara berstatus ${label}`}
        aria-hidden={ditindih || undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <button type="button" className="pt-hantu pt-tutup" onClick={onTutup}>
          Tutup (Esc)
        </button>

        <div className="pt-spot-kiri" style={{ gap: 16 }}>
          <p className="pt-label" style={{ fontSize: 18 }}>
            Status jawapan
          </p>
          <span className={`pt-status-besar s-${status}`}>{label}</span>
          <p className="pt-redup pt-nombor" style={{ fontSize: 20, margin: 0 }}>
            {jumlah} jawapan · {senarai.length} perkara
          </p>
          <div ref={senaraiRef} className="pt-senarai-status">
            {senarai.map((p) => (
              <button
                key={p.perkaraId}
                type="button"
                className="pt-baris-status"
                aria-current={p.perkaraId === dipilih?.perkaraId}
                onClick={() => onPerkara(p.perkaraId)}
              >
                <span className="pt-para-kecil pt-potong">{p.para}</span>
                <span className="pt-potong">{ringkasTeks(p.perkara, 80)}</span>
                <b className="pt-nombor">{p.bilangan[status]}</b>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-spot-kanan">
          {!dipilih ? (
            <div className="pt-kosong">
              <p style={{ fontSize: 36, margin: 0 }}>Tiada jawapan berstatus {label}</p>
              <p className="pt-samar" style={{ fontSize: 22, margin: 0 }}>
                Belum ada sekolah yang memilih status ini bagi mana-mana perkara.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, alignItems: "center", paddingRight: 150 }}>
                <span className="pt-lencana-para" style={{ fontSize: 24, padding: "6px 18px" }}>
                  Para {dipilih.para}
                </span>
                <button type="button" className="pt-hantu" style={{ fontSize: 17 }} onClick={() => onSlaidPerkara(dipilih.perkaraId)}>
                  Buka slaid perkara →
                </button>
              </div>
              <TeksMuat
                as="p"
                maks={28}
                min={18}
                className="pt-teks-perkara"
                style={{ margin: 0, maxHeight: 150, flex: "none" }}
                kunci={dipilih.perkaraId}
              >
                {dipilih.perkara}
              </TeksMuat>
              <p className="pt-label" style={{ fontSize: 16 }}>
                {jubin.length} sekolah · {label} · klik sekolah untuk catatan & bukti
              </p>
              <Mozek jubin={jubin} lebar={1060} tinggi={470} onKlik={(kod) => onSekolah(dipilih.perkaraId, kod)} />
            </>
          )}
        </div>

        <div className="pt-spot-bawah">
          <button type="button" style={{ justifySelf: "start", maxWidth: "100%" }} disabled={i <= 0} onClick={() => langkah(-1)}>
            ← {i > 0 ? `Para ${senarai[i - 1]!.para}` : ""}
          </button>
          <span className="pt-samar pt-nombor">{senarai.length ? `${i + 1} / ${senarai.length} perkara` : "0 perkara"}</span>
          <button
            type="button"
            style={{ justifySelf: "end", maxWidth: "100%" }}
            disabled={i >= senarai.length - 1}
            onClick={() => langkah(1)}
          >
            {i < senarai.length - 1 ? `Para ${senarai[i + 1]!.para}` : ""} →
          </button>
        </div>
      </div>
    </div>
  );
}
