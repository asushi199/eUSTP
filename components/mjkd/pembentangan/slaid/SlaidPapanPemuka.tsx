"use client";

import { STATUS_MJKD, STATUS_MJKD_LABEL } from "@/lib/mjkd/enums";
import { KUNCI_SEMUA_SOALAN, kunciPerkara, type BarisAnalisis, type SlaidPapanPemuka as T } from "@/lib/mjkd/pembentangan";
import { BarStatus, CincinKemajuan, WARNA_STATUS_VAR } from "../Donut";
import KiraNaik from "../KiraNaik";
import { usePentas } from "../konteks";

/**
 * Papan Pemuka Daerah: KPI penghantaran + peratus status (klik = perkara & sekolah berstatus itu)
 * + 2 lajur baris perkara (klik = lompat);
 * baris akhir "Semua soalan" = slaid mozek sekolah (semua maklum balas satu sekolah).
 */
export default function SlaidPapanPemuka({ slaid }: { slaid: T }) {
  const { keKunci, bukaStatus } = usePentas();
  const { kpi } = slaid;
  const n = kpi.bilangan.jumlah;
  const pc = (v: number) => (n ? Math.round((v / n) * 100) : 0);
  const peratusHantar = kpi.sekolahJumlah ? Math.round((kpi.sekolahDihantar / kpi.sekolahJumlah) * 100) : 0;
  const separuh = Math.ceil(slaid.perkara.length / 2);

  const baris = (b: BarisAnalisis) => (
    <button key={b.perkaraId} type="button" className="pt-baris-perkara" onClick={() => keKunci(kunciPerkara(b.perkaraId))}>
      <span className="pt-para-kecil pt-potong">{b.para}</span>
      <span className="pt-potong">{b.perkaraRingkas}</span>
      <BarStatus bilangan={b.bilangan} jumlah={b.dijangka} tinggi={18} />
      <span className="pt-nombor pt-redup" style={{ textAlign: "right" }}>
        {b.dihantar}/{b.dijangka}
      </span>
    </button>
  );

  return (
    <>
      <div className="pt-anim" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p className="pt-label">Maklum balas perkara tindakan · seluruh daerah</p>
          <h2 className="pt-tajuk">Papan Pemuka Daerah</h2>
        </div>
        <p className="pt-samar" style={{ fontSize: 18, margin: 0 }}>
          Klik status atau perkara untuk melihat sekolah
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 28, marginTop: 26 }}>
        <div className="pt-kaca pt-anim" style={{ padding: 20, display: "grid", placeItems: "center", textAlign: "center" }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <CincinKemajuan nilai={kpi.sekolahDihantar} jumlah={kpi.sekolahJumlah} />
            <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center" }}>
              <b style={{ fontSize: 64, lineHeight: 1 }}>
                <KiraNaik nilai={kpi.sekolahDihantar} />
              </b>
              <span className="pt-redup" style={{ fontSize: 18 }}>
                / {kpi.sekolahJumlah} sekolah
              </span>
            </div>
          </div>
          <p className="pt-redup" style={{ fontSize: 18, margin: "8px 0 0" }}>
            telah menghantar ({peratusHantar}%)
          </p>
        </div>
        <div
          className="pt-kaca pt-anim"
          style={{ padding: "26px 30px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 22, animationDelay: ".06s" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
            {STATUS_MJKD.map((s) => (
              <button
                key={s}
                type="button"
                className="pt-kotak-status"
                disabled={kpi.bilangan[s] === 0}
                onClick={() => bukaStatus(s)}
                title={`${kpi.bilangan[s]} jawapan — klik untuk perkara & sekolah`}
              >
                <span className="pt-redup" style={{ display: "block", fontSize: 17, whiteSpace: "nowrap" }}>
                  <i
                    style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", marginRight: 8, background: WARNA_STATUS_VAR[s] }}
                  />
                  {STATUS_MJKD_LABEL[s]}
                </span>
                <b style={{ fontSize: 54 }}>
                  <KiraNaik nilai={pc(kpi.bilangan[s])} akhiran="%" />
                </b>
                <span className="pt-samar pt-nombor" style={{ fontSize: 17, marginLeft: 10 }}>
                  {kpi.bilangan[s]}
                  <span className="pt-anak-panah" aria-hidden>
                    →
                  </span>
                </span>
              </button>
            ))}
          </div>
          <BarStatus bilangan={kpi.bilangan} jumlah={n} />
          <p className="pt-samar" style={{ fontSize: 16, margin: 0 }}>
            Peratus daripada {n} jawapan perkara tindakan
          </p>
        </div>
      </div>
      <div
        className="pt-kaca pt-anim"
        style={{ marginTop: 24, padding: 10, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", columnGap: 20, animationDelay: ".14s" }}
      >
        <div>{slaid.perkara.slice(0, separuh).map(baris)}</div>
        <div>
          {slaid.perkara.slice(separuh).map(baris)}
          <button
            type="button"
            className="pt-baris-perkara pt-baris-semua"
            onClick={() => keKunci(KUNCI_SEMUA_SOALAN)}
            title="Semua maklum balas satu sekolah"
          >
            <span className="pt-para-kecil pt-potong">Semua soalan</span>
            <span className="pt-potong">Lihat semua maklum balas mengikut sekolah →</span>
            <BarStatus bilangan={kpi.bilangan} jumlah={n} tinggi={18} />
            <span className="pt-nombor pt-redup" style={{ textAlign: "right" }}>
              {kpi.sekolahDihantar}/{kpi.sekolahJumlah}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
