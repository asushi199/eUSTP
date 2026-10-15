"use client";

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { terbitkanUrlEmbed } from "@/lib/mjkd/bahan";
import { STATUS_MJKD_LABEL, isStatusMjkd } from "@/lib/mjkd/enums";
import { kenalJenisSekolah } from "@/lib/mjkd/jenis-sekolah";
import {
  jawapanSekolah,
  namaPendek,
  ringkasTeks,
  urutanSpotlight,
  type DataPentas,
  type TileSekolah,
} from "@/lib/mjkd/pembentangan";
import { urlBukaFotoBukti } from "@/lib/mjkd/validation";
import LapisanPenuh from "./LapisanPenuh";
import QrPautan from "./QrPautan";
import TeksMuat from "./TeksMuat";
import { usePentas } from "./konteks";

export type KawalanSpot = { langkah: (d: number) => boolean; esc: () => boolean };

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

function namaHos(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    if (h.endsWith("canva.com") || h === "canva.link") return "Canva";
    if (h === "drive.google.com") return "Google Drive";
    if (h === "docs.google.com") return "Google Docs / Slides";
    return h;
  } catch {
    return "Pautan";
  }
}

/**
 * Spotlight jawapan satu sekolah (lapisan atas kanvas): kiri = identiti + status + ★ Sorotan;
 * kanan = Catatan (satu perenggan seperti diisi PGB; saiz fon mengecil supaya muat) + jalur
 * bukti (gambar → lightbox, pautan → Buka / QR / Pratonton). ← → antara sekolah yang telah
 * menghantar (susunan mozek). Semua teks `overflow-wrap:anywhere`.
 * Jika `urutanPerkara` diberi (dibuka dari "Semua soalan"), ← → bertukar PERKARA bagi sekolah yang
 * sama — bukan sekolah.
 */
export default function Spotlight({
  data,
  perkaraId,
  kod,
  jubin,
  kawalan,
  onPilih,
  urutanPerkara,
  onPilihPerkara,
  ketUrutan = "sekolah menghantar",
  onTutup,
  onSorotan,
}: {
  data: DataPentas;
  perkaraId: string;
  kod: string;
  jubin: readonly TileSekolah[];
  kawalan: Ref<KawalanSpot | null>;
  onPilih: (kod: string) => void;
  /** Perkara yang dijawab sekolah ini (susunan minit) — mod "satu sekolah". */
  urutanPerkara?: readonly { id: string; para: string }[];
  onPilihPerkara?: (perkaraId: string) => void;
  /** Teks selepas "x / n" di bar bawah (mod sekolah). */
  ketUrutan?: string;
  onTutup: () => void;
  onSorotan: (itemId: string, dipilih: boolean) => void;
}) {
  const { urlFoto } = usePentas();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [pratonton, setPratonton] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const kotakPratonton = useRef<HTMLDivElement>(null);

  const perkara = data.perkara.find((p) => p.id === perkaraId);
  const { sekolah, mb, item } = jawapanSekolah(data, perkaraId, kod);
  const urutan = urutanSpotlight(jubin);
  const kedudukan = urutan.indexOf(kod);
  const namaIkutKod = new Map(jubin.map((j) => [j.kod, j.namaPendek]));
  const foto = item?.fotoBukti ?? [];
  const pautan = item?.pautanBukti?.trim() ?? "";
  const embed = pautan ? terbitkanUrlEmbed(pautan) : null;
  const nama = namaPendek(sekolah?.name ?? kod);
  const jenis = sekolah ? kenalJenisSekolah(sekolah.name, sekolah.code) : null;

  const modPerkara = Boolean(urutanPerkara && onPilihPerkara);
  const iPerkara = urutanPerkara ? urutanPerkara.findIndex((p) => p.id === perkaraId) : -1;

  // Tukar sekolah / perkara = tutup lightbox / pratonton.
  useEffect(() => {
    setLightbox(null);
    setPratonton(false);
    dialogRef.current?.focus();
  }, [kod, perkaraId]);

  const langkahSekolah = (d: number) => {
    if (modPerkara) {
      const p = urutanPerkara![iPerkara + d];
      if (p) onPilihPerkara!(p.id);
      return;
    }
    if (kedudukan < 0) {
      // Sekolah belum menghantar: lompat ke sekolah menghantar terdekat ikut susunan mozek.
      const i = jubin.findIndex((j) => j.kod === kod);
      const seterusnya = d > 0 ? jubin.slice(i + 1).find((j) => j.status !== null) : [...jubin.slice(0, i)].reverse().find((j) => j.status !== null);
      if (seterusnya) onPilih(seterusnya.kod);
      return;
    }
    const k = urutan[kedudukan + d];
    if (k) onPilih(k);
  };

  useImperativeHandle(kawalan, () => ({
    langkah: (d) => {
      if (lightbox !== null) {
        setLightbox((i) => (i === null ? i : (i + d + foto.length) % foto.length));
        return true;
      }
      langkahSekolah(d);
      return true;
    },
    esc: () => {
      if (lightbox !== null) {
        setLightbox(null);
        return true;
      }
      if (pratonton) {
        setPratonton(false);
        return true;
      }
      return false;
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

  const status = item?.status ?? null;
  const labelStatus = status === null ? "Belum menghantar" : isStatusMjkd(status) ? STATUS_MJKD_LABEL[status] : status;

  return (
    <div className="pt-lapisan">
      <div className="pt-latar-spot" onClick={onTutup} />
      <div
        ref={dialogRef}
        className="pt-spot"
        role="dialog"
        aria-modal="true"
        aria-label={`Jawapan ${nama}`}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <button type="button" className="pt-hantu pt-tutup" onClick={onTutup}>
          Tutup (Esc)
        </button>

        <div className="pt-spot-kiri">
          <p className="pt-label" style={{ fontSize: 18 }}>
            {modPerkara ? "Semua soalan · " : ""}Para {perkara?.para}
          </p>
          {modPerkara && perkara ? (
            <p className="pt-redup" style={{ fontSize: 18, margin: "-8px 0 0", lineHeight: 1.35, overflowWrap: "anywhere" }}>
              {ringkasTeks(perkara.perkara, 150)}
            </p>
          ) : null}
          <TeksMuat as="h2" maks={72} min={38} style={{ maxHeight: 300, flex: "none" }} kunci={nama}>
            {nama}
          </TeksMuat>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {jenis ? <span className="pt-cip">{LABEL_JENIS[jenis]}</span> : null}
            <span className="pt-cip pt-nombor">{kod}</span>
          </div>
          {item && mb ? (
            <>
              {mb.namaPengisi ? (
                <p className="pt-redup" style={{ fontSize: 20, margin: 0, overflowWrap: "anywhere" }}>
                  Diisi oleh {mb.namaPengisi}
                  {mb.jawatanPengisi ? `, ${mb.jawatanPengisi}` : ""}
                </p>
              ) : null}
              <span className={`pt-status-besar s-${status}`}>{labelStatus}</span>
              {mb.tarikhHantar ? (
                <p className="pt-samar pt-nombor" style={{ fontSize: 18, margin: 0 }}>
                  Dihantar {FORMAT_MASA.format(new Date(mb.tarikhHantar))}
                </p>
              ) : null}
              {item.id ? (
                <button
                  type="button"
                  className="pt-hantu pt-sorotan-btn"
                  aria-pressed={item.dipilih}
                  style={{ alignSelf: "flex-start", fontSize: 18, padding: "10px 18px", marginTop: "auto" }}
                  onClick={() => onSorotan(item.id!, !item.dipilih)}
                >
                  {item.dipilih ? "★ Sorotan" : "☆ Sorotkan sekolah ini"}
                </button>
              ) : null}
            </>
          ) : (
            <span className="pt-status-besar s-KOSONG">Belum menghantar</span>
          )}
        </div>

        <div className="pt-spot-kanan">
          {!item ? (
            <div className="pt-kosong">
              <p style={{ fontSize: 36, margin: 0 }}>Belum menghantar maklum balas</p>
              <p className="pt-samar" style={{ fontSize: 22, margin: 0 }}>
                Sekolah ini belum menghantar maklum balas bagi perkara ini.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 150 }}>
                <p className="pt-label" style={{ fontSize: 16 }}>
                  {pratonton ? `Pratonton bukti · ${namaHos(pautan)}` : "Catatan"}
                </p>
                {pratonton ? (
                  <button type="button" className="pt-hantu" onClick={() => setPratonton(false)}>
                    Kembali ke catatan
                  </button>
                ) : null}
              </div>
              {pratonton && embed ? (
                <div ref={kotakPratonton} className="pt-pratonton">
                  <LapisanPenuh sasaran={kotakPratonton} lapisan="spot">
                    <iframe title={`Pratonton bukti ${nama}`} src={embed} allow="fullscreen" allowFullScreen />
                  </LapisanPenuh>
                </div>
              ) : !item.catatan ? (
                <p className="pt-catatan-bebas pt-samar" style={{ fontSize: 28 }}>
                  Tiada catatan.
                </p>
              ) : (
                <TeksMuat as="p" maks={40} min={24} className="pt-catatan-bebas" kunci={item.catatan}>
                  {item.catatan}
                </TeksMuat>
              )}

              {foto.length > 0 || pautan ? (
                <>
                  <p className="pt-label" style={{ fontSize: 16 }}>
                    Bukti
                  </p>
                  <div className="pt-bukti">
                    {foto.slice(0, 3).map((f, i) => (
                      <button
                        key={f}
                        type="button"
                        className="pt-foto"
                        onClick={() => {
                          setPratonton(false);
                          setLightbox(i);
                        }}
                        aria-label={`Besarkan gambar bukti ${i + 1}`}
                      >
                        <img src={urlFoto(f, 600)} alt={`Gambar bukti ${i + 1}`} referrerPolicy="no-referrer" />
                      </button>
                    ))}
                    {pautan ? (
                      <div className="pt-kad-pautan">
                        <div style={{ minWidth: 0 }}>
                          <b style={{ fontSize: 20, display: "block" }}>{namaHos(pautan)}</b>
                          <p className="pt-url">{pautan}</p>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <a className="pt-butang-emas" href={pautan} target="_blank" rel="noopener noreferrer">
                              Buka ↗
                            </a>
                            {embed && !pratonton ? (
                              <button type="button" className="pt-hantu" style={{ fontSize: 17 }} onClick={() => setPratonton(true)}>
                                Pratonton
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <QrPautan teks={pautan} saiz={150} label="Kod QR pautan bukti" />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="pt-samar" style={{ margin: 0, fontSize: 18 }}>
                  Tiada bukti dilampirkan.
                </p>
              )}
            </>
          )}
        </div>

        {modPerkara ? (
          <div className="pt-spot-bawah">
            <button
              type="button"
              style={{ justifySelf: "start", maxWidth: "100%" }}
              disabled={iPerkara <= 0}
              onClick={() => langkahSekolah(-1)}
            >
              ← {iPerkara > 0 ? `Para ${urutanPerkara![iPerkara - 1]!.para}` : ""}
            </button>
            <span className="pt-samar pt-nombor">
              {iPerkara >= 0 ? `${iPerkara + 1} / ${urutanPerkara!.length} perkara · ${nama}` : nama}
            </span>
            <button
              type="button"
              style={{ justifySelf: "end", maxWidth: "100%" }}
              disabled={iPerkara >= urutanPerkara!.length - 1}
              onClick={() => langkahSekolah(1)}
            >
              {iPerkara >= 0 && iPerkara < urutanPerkara!.length - 1 ? `Para ${urutanPerkara![iPerkara + 1]!.para}` : ""} →
            </button>
          </div>
        ) : (
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
              {kedudukan >= 0 ? `${kedudukan + 1} / ${urutan.length} ${ketUrutan}` : `${urutan.length} ${ketUrutan}`}
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
        )}
      </div>

      {lightbox !== null && foto[lightbox] ? (
        <div className="pt-lightbox" role="dialog" aria-label="Gambar bukti" onClick={() => setLightbox(null)}>
          <img src={urlFoto(foto[lightbox]!, 1600)} alt={`Gambar bukti ${lightbox + 1}`} referrerPolicy="no-referrer" />
          <div style={{ position: "absolute", bottom: 40, display: "flex", gap: 16, alignItems: "center", color: "#fff", fontSize: 20 }}>
            <span className="pt-nombor">
              {lightbox + 1} / {foto.length}
            </span>
            <a
              className="pt-hantu"
              style={{ color: "#fff" }}
              href={urlBukaFotoBukti(foto[lightbox]!)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Saiz penuh ↗
            </a>
            <span style={{ opacity: 0.7 }}>← → tukar · Esc tutup</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
