"use client";

import { useEffect, useImperativeHandle, useRef, type KeyboardEvent, type Ref } from "react";
import { STATUS_MJKD, STATUS_MJKD_LABEL, isStatusMjkd } from "@/lib/mjkd/enums";
import { kenalJenisSekolah } from "@/lib/mjkd/jenis-sekolah";
import {
  jawapanSemuaPerkara,
  namaPendek,
  ringkasTeks,
  urutanSpotlight,
  type DataPentas,
  type TileSekolah,
} from "@/lib/mjkd/pembentangan";
import { kiraStatus } from "@/lib/mjkd/ringkasan";
import { WARNA_STATUS_VAR } from "./Donut";
import TeksMuat from "./TeksMuat";

export type KawalanSpotSekolah = { langkah: (d: number) => boolean };

const LABEL_JENIS: Record<string, string> = {
  SK: "Sekolah Kebangsaan",
  SJKC: "SJK(C)",
  SJKT: "SJK(T)",
  SM: "Sekolah Menengah",
};

const FORMAT_MASA = new Intl.DateTimeFormat("ms-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Semua jawapan satu sekolah (lapisan atas kanvas): kiri = identiti + bilangan status;
 * kanan = senarai SEMUA perkara yang terpakai (status + catatan ringkas + bukti). Klik baris =
 * Spotlight perkara itu (catatan penuh + bukti) di atas lapisan ini. ← → antara sekolah yang
 * telah menghantar (susunan mozek).
 */
export default function SpotlightSekolah({
  data,
  kod,
  jubin,
  ditindih,
  kawalan,
  onPilih,
  onPerkara,
  onTutup,
}: {
  data: DataPentas;
  kod: string;
  jubin: readonly TileSekolah[];
  /** Spotlight perkara sedang terbuka di atas lapisan ini. */
  ditindih: boolean;
  kawalan: Ref<KawalanSpotSekolah | null>;
  onPilih: (kod: string) => void;
  onPerkara: (perkaraId: string) => void;
  onTutup: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const senaraiRef = useRef<HTMLDivElement>(null);

  const { sekolah, mb, baris } = jawapanSemuaPerkara(data, kod);
  const urutan = urutanSpotlight(jubin);
  const kedudukan = urutan.indexOf(kod);
  const namaIkutKod = new Map(jubin.map((j) => [j.kod, j.namaPendek]));
  const nama = namaPendek(sekolah?.name ?? kod);
  const jenis = sekolah ? kenalJenisSekolah(sekolah.name, sekolah.code) : null;
  const dijawab = baris.flatMap((b) => (b.item ? [b.item] : []));
  const bilangan = kiraStatus(dijawab);

  // Tukar sekolah = kembali ke atas senarai; fokus semula bila Spotlight perkara ditutup.
  useEffect(() => {
    senaraiRef.current?.scrollTo({ top: 0 });
  }, [kod]);
  useEffect(() => {
    if (!ditindih) dialogRef.current?.focus();
  }, [kod, ditindih]);

  const langkahSekolah = (d: number) => {
    if (kedudukan < 0) {
      const i = jubin.findIndex((j) => j.kod === kod);
      const seterusnya =
        d > 0
          ? jubin.slice(i + 1).find((j) => j.status !== null)
          : [...jubin.slice(0, i)].reverse().find((j) => j.status !== null);
      if (seterusnya) onPilih(seterusnya.kod);
      return;
    }
    const k = urutan[kedudukan + d];
    if (k) onPilih(k);
  };

  useImperativeHandle(kawalan, () => ({
    langkah: (d) => {
      langkahSekolah(d);
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

  return (
    <div className="pt-lapisan">
      <div className="pt-latar-spot" onClick={onTutup} />
      <div
        ref={dialogRef}
        className="pt-spot"
        role="dialog"
        aria-modal="true"
        aria-label={`Semua jawapan ${nama}`}
        aria-hidden={ditindih || undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <button type="button" className="pt-hantu pt-tutup" onClick={onTutup}>
          Tutup (Esc)
        </button>

        <div className="pt-spot-kiri">
          <p className="pt-label" style={{ fontSize: 18 }}>
            Semua soalan
          </p>
          <TeksMuat as="h2" maks={72} min={38} style={{ maxHeight: 300, flex: "none" }} kunci={nama}>
            {nama}
          </TeksMuat>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {jenis ? <span className="pt-cip">{LABEL_JENIS[jenis]}</span> : null}
            <span className="pt-cip pt-nombor">{kod}</span>
          </div>
          {mb ? (
            <>
              {mb.namaPengisi ? (
                <p className="pt-redup" style={{ fontSize: 20, margin: 0, overflowWrap: "anywhere" }}>
                  Diisi oleh {mb.namaPengisi}
                  {mb.jawatanPengisi ? `, ${mb.jawatanPengisi}` : ""}
                </p>
              ) : null}
              {mb.tarikhHantar ? (
                <p className="pt-samar pt-nombor" style={{ fontSize: 18, margin: 0 }}>
                  Dihantar {FORMAT_MASA.format(new Date(mb.tarikhHantar))}
                </p>
              ) : null}
              <div className="pt-legend-v" style={{ marginTop: 8 }}>
                {STATUS_MJKD.map((s) => (
                  <div key={s}>
                    <span>
                      <i style={{ background: WARNA_STATUS_VAR[s] }} />
                      {STATUS_MJKD_LABEL[s]}
                    </span>
                    <b className="pt-nombor">{bilangan[s]}</b>
                  </div>
                ))}
                <p className="pt-samar pt-nombor" style={{ fontSize: 17, margin: 0 }}>
                  {dijawab.length} / {baris.length} perkara dijawab
                </p>
              </div>
            </>
          ) : (
            <span className="pt-status-besar s-KOSONG">Belum menghantar</span>
          )}
        </div>

        <div className="pt-spot-kanan">
          {!mb ? (
            <div className="pt-kosong">
              <p style={{ fontSize: 36, margin: 0 }}>Belum menghantar maklum balas</p>
              <p className="pt-samar" style={{ fontSize: 22, margin: 0 }}>
                Sekolah ini belum menghantar maklum balas bagi mana-mana perkara.
              </p>
            </div>
          ) : (
            <>
              <p className="pt-label" style={{ fontSize: 16, paddingRight: 150 }}>
                {baris.length} perkara tindakan · klik untuk catatan penuh & bukti
              </p>
              <div ref={senaraiRef} className="pt-senarai-jawapan">
                {baris.map(({ perkara, item }) => {
                  const foto = item?.fotoBukti?.length ?? 0;
                  const pautan = Boolean(item?.pautanBukti?.trim());
                  const status = item?.status ?? null;
                  return (
                    <button
                      key={perkara.id}
                      type="button"
                      className="pt-baris-jawapan"
                      disabled={!item}
                      onClick={() => onPerkara(perkara.id)}
                    >
                      <span className="pt-para-kecil">{perkara.para}</span>
                      <span style={{ minWidth: 0 }}>
                        <span className="pt-potong pt-samar" style={{ display: "block", fontSize: 16 }}>
                          {ringkasTeks(perkara.perkara, 140)}
                        </span>
                        <span className="pt-catatan-ringkas">
                          {!item ? (
                            <span className="pt-samar">Tidak dijawab.</span>
                          ) : item.catatan.trim() ? (
                            item.catatan
                          ) : (
                            <span className="pt-samar">Tiada catatan.</span>
                          )}
                        </span>
                        {foto > 0 || pautan ? (
                          <span className="pt-samar" style={{ display: "block", fontSize: 15, marginTop: 4 }}>
                            Bukti: {[foto > 0 ? `${foto} gambar` : "", pautan ? "pautan" : ""].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </span>
                      <span className={`pt-status-kecil s-${status ?? "KOSONG"}`}>
                        {status === null ? "Tiada jawapan" : isStatusMjkd(status) ? STATUS_MJKD_LABEL[status] : status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="pt-spot-bawah">
          <button
            type="button"
            style={{ justifySelf: "start", maxWidth: "100%" }}
            disabled={kedudukan === 0 || urutan.length === 0}
            onClick={() => langkahSekolah(-1)}
          >
            ← {kedudukan > 0 ? namaIkutKod.get(urutan[kedudukan - 1]!) : ""}
          </button>
          <span className="pt-samar pt-nombor">
            {kedudukan >= 0 ? `${kedudukan + 1} / ${urutan.length} sekolah menghantar` : `${urutan.length} sekolah menghantar`}
          </span>
          <button
            type="button"
            style={{ justifySelf: "end", maxWidth: "100%" }}
            disabled={kedudukan >= urutan.length - 1 && kedudukan >= 0}
            onClick={() => langkahSekolah(1)}
          >
            {kedudukan >= 0 && kedudukan < urutan.length - 1 ? namaIkutKod.get(urutan[kedudukan + 1]!) : ""} →
          </button>
        </div>
      </div>
    </div>
  );
}
