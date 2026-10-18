"use client";

import type { SlaidPembukaan as T } from "@/lib/mjkd/pembentangan";
import KiraNaik from "../KiraNaik";
import { LOGO_MJKD } from "../Krom";
import { usePentas } from "../konteks";

const TITIK = Array.from({ length: 96 }, (_, i) => {
  const a = (i / 96) * Math.PI * 2 - Math.PI / 2;
  return {
    // Dibundarkan: elak hidrasi tidak sepadan (ketepatan apungan pelayan vs pelayar).
    left: Math.round(322 + Math.cos(a) * 310),
    top: Math.round(322 + Math.sin(a) * 310),
    opacity: Math.round((0.35 + 0.65 * Math.abs(Math.sin(i / 7))) * 100) / 100,
  };
});

/** Muka depan. Cincin titik emas = hiasan sahaja (BUKAN bilangan sekolah); tiada penyebut. */
export default function SlaidPembukaan({ slaid }: { slaid: T }) {
  const { acara } = usePentas();
  return (
    <div className="pt-buka">
      <div className="pt-anim">
        <span className="pt-plak">
          <img
            src={LOGO_MJKD}
            alt="Kementerian Pendidikan Malaysia — Pejabat Pendidikan Daerah Manjung"
          />
        </span>
        <p className="pt-label" style={{ marginTop: 44 }}>
          Pejabat Pendidikan Daerah Manjung
        </p>
        <h1>
          Mesyuarat Jawatankuasa Kurikulum Daerah <span className="pt-emas-grad">Bil. 2/2026</span>
        </h1>
        <div className="pt-meta">
          <span>{acara.tarikh}</span>
          {acara.tempat ? <span>{acara.tempat}</span> : null}
        </div>
      </div>
      <div className="pt-cincin pt-anim" style={{ animationDelay: ".15s" }}>
        {TITIK.map((t, i) => (
          <span key={i} className="pt-titik" style={t} aria-hidden />
        ))}
        <div className="pt-pusat">
          <b>
            <KiraNaik nilai={slaid.sekolahHadir} />
          </b>
          <span>SEKOLAH TELAH HADIR</span>
          <span style={{ marginTop: 10 }}>
            <KiraNaik nilai={slaid.pegawaiHadir} /> PEGAWAI PPD
          </span>
        </div>
      </div>
    </div>
  );
}
