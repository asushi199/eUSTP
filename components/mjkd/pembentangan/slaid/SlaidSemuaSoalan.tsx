"use client";

import { STATUS_MJKD, STATUS_MJKD_LABEL } from "@/lib/mjkd/enums";
import { KUNCI_PAPAN_PEMUKA, type SlaidSemuaSoalan as T } from "@/lib/mjkd/pembentangan";
import { DonutStatus, WARNA_STATUS_VAR } from "../Donut";
import KiraNaik from "../KiraNaik";
import Mozek from "../Mozek";
import { usePentas } from "../konteks";

/**
 * Semua soalan: ringkasan semua jawapan (donut) di kiri; mozek SEMUA sekolah dijangka di kanan
 * (berwarna = telah menghantar). Klik sekolah = semua maklum balas sekolah itu.
 */
export default function SlaidSemuaSoalan({ slaid }: { slaid: T }) {
  const { bukaSekolah, keKunci } = usePentas();
  const belum = slaid.sekolahJumlah - slaid.sekolahDihantar;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "660px 1028px", gap: 40, height: "100%" }}>
      <div className="pt-anim" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="pt-lencana-para">Semua soalan</span>
          <button type="button" className="pt-hantu" style={{ fontSize: 17 }} onClick={() => keKunci(KUNCI_PAPAN_PEMUKA)}>
            ← Papan Pemuka
          </button>
        </div>
        <h2 className="pt-tajuk" style={{ fontSize: 56, marginTop: 22 }}>
          Maklum balas mengikut sekolah
        </h2>
        <p className="pt-redup" style={{ fontSize: 24, margin: "14px 0 0", lineHeight: 1.35 }}>
          Klik sekolah untuk memaparkan semua jawapan perkara tindakan sekolah itu.
        </p>
        <div className="pt-donut-baris">
          <DonutStatus bilangan={slaid.bilangan} jumlah={slaid.bilangan.jumlah} />
          <div className="pt-legend-v">
            {STATUS_MJKD.map((s) => (
              <div key={s}>
                <span>
                  <i style={{ background: WARNA_STATUS_VAR[s] }} />
                  {STATUS_MJKD_LABEL[s]}
                </span>
                <b className="pt-nombor">{slaid.bilangan[s]}</b>
              </div>
            ))}
            <p className="pt-samar" style={{ fontSize: 16, margin: 0 }}>
              Daripada {slaid.bilangan.jumlah} jawapan perkara tindakan
            </p>
          </div>
        </div>
        <div className="pt-legend-v" style={{ marginTop: 26 }}>
          <div>
            <span>
              <i className="s-HANTAR" />
              Telah menghantar
            </span>
            <b className="pt-nombor">{slaid.sekolahDihantar}</b>
          </div>
          <div className="pt-samar">
            <span>
              <i style={{ border: "1.5px dashed var(--samar)" }} />
              Belum menghantar
            </span>
            <b className="pt-nombor">{belum}</b>
          </div>
        </div>
        <p style={{ fontSize: 24, margin: "18px 0 0" }}>
          <b style={{ color: "var(--emas)", fontSize: 34 }}>
            <KiraNaik nilai={slaid.sekolahDihantar} />
          </b>
          <span className="pt-redup"> / {slaid.sekolahJumlah} sekolah telah menghantar</span>
        </p>
      </div>
      <div className="pt-anim" style={{ animationDelay: ".08s", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <Mozek jubin={slaid.jubin} lebar={1028} tinggi={820} onKlik={bukaSekolah} />
        <p className="pt-samar" style={{ fontSize: 17, margin: 0 }}>
          Klik sekolah untuk semua jawapan · kotak putus-putus = belum menghantar
        </p>
      </div>
    </div>
  );
}
