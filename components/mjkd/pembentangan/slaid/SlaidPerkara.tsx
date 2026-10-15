"use client";

import { STATUS_MJKD, STATUS_MJKD_LABEL } from "@/lib/mjkd/enums";
import { KUNCI_PAPAN_PEMUKA, type SlaidPerkara as T } from "@/lib/mjkd/pembentangan";
import { DonutStatus, WARNA_STATUS_VAR } from "../Donut";
import KiraNaik from "../KiraNaik";
import Mozek from "../Mozek";
import TeksMuat from "../TeksMuat";
import { usePentas } from "../konteks";

/** Satu perkara: teks + tindakan + donut (kiri, 660px); mozek SEMUA sekolah terpakai (kanan). */
export default function SlaidPerkara({ slaid }: { slaid: T }) {
  const { bukaSpot, keKunci } = usePentas();
  const belum = slaid.dijangka - slaid.dihantar;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "660px 1028px", gap: 40, height: "100%" }}>
      <div className="pt-anim" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="pt-lencana-para">Para {slaid.para}</span>
          {slaid.mukaSurat ? (
            <span className="pt-samar" style={{ fontSize: 22 }}>
              m/s {slaid.mukaSurat}
            </span>
          ) : null}
          <button
            type="button"
            className="pt-hantu"
            style={{ fontSize: 17, marginLeft: "auto" }}
            onClick={() => keKunci(KUNCI_PAPAN_PEMUKA)}
            title="Kembali ke Papan Pemuka (P)"
          >
            ← Papan Pemuka
          </button>
        </div>
        <TeksMuat as="p" maks={34} min={20} className="pt-teks-perkara" style={{ maxHeight: 300, flex: "none" }} kunci={slaid.perkara}>
          {slaid.perkara}
        </TeksMuat>
        <div className="pt-kaca pt-tindakan">
          <p className="pt-label" style={{ fontSize: 15 }}>
            Tindakan
          </p>
          <p style={{ fontSize: 24, fontWeight: 600, margin: "6px 0 0", overflowWrap: "anywhere" }}>{slaid.tindakan}</p>
        </div>
        <div className="pt-donut-baris">
          <DonutStatus bilangan={slaid.bilangan} jumlah={slaid.dijangka} />
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
            <div className="pt-samar">
              <span>
                <i style={{ border: "1.5px dashed var(--samar)" }} />
                Belum menghantar
              </span>
              <b className="pt-nombor">{belum}</b>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 24, margin: "18px 0 0" }}>
          <b style={{ color: "var(--emas)", fontSize: 34 }}>
            <KiraNaik nilai={slaid.dihantar} />
          </b>
          <span className="pt-redup"> / {slaid.dijangka} sekolah telah menghantar</span>
        </p>
      </div>
      <div className="pt-anim" style={{ animationDelay: ".08s", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
        <Mozek jubin={slaid.jubin} lebar={1028} tinggi={820} onKlik={(kod) => bukaSpot(slaid.perkaraId, kod)} />
        <p className="pt-samar" style={{ fontSize: 17, margin: 0 }}>
          Klik sekolah untuk memaparkan jawapan · ★ sorotan · kotak putus-putus = belum menghantar
        </p>
      </div>
    </div>
  );
}
