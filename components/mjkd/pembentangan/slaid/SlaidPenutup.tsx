"use client";

import type { SlaidPenutup as T } from "@/lib/mjkd/pembentangan";
import KiraNaik from "../KiraNaik";
import { LOGO_MJKD } from "../Krom";

/** Penutup: terima kasih + tiga nombor ringkasan. */
export default function SlaidPenutup({ slaid }: { slaid: T }) {
  const ringkasan: [number | null, string, string][] = [
    [slaid.sekolahHadir, "", "sekolah hadir"],
    [slaid.sekolahDihantar, "", "sekolah menghantar maklum balas"],
    [slaid.peratusSelesai, "%", "perkara dilaporkan selesai"],
  ];
  return (
    <div
      style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 30 }}
    >
      <span className="pt-plak pt-anim" style={{ padding: "14px 24px" }}>
        <img src={LOGO_MJKD} alt="KPM — PPD Manjung" style={{ height: 110 }} />
      </span>
      <h2 className="pt-anim" style={{ fontSize: 150, margin: 0, letterSpacing: "-.04em", animationDelay: ".08s" }}>
        Terima <span className="pt-emas-grad">kasih</span>
      </h2>
      <p className="pt-redup pt-anim" style={{ fontSize: 30, margin: 0, animationDelay: ".12s" }}>
        atas komitmen semua Pengetua dan Guru Besar Daerah Manjung
      </p>
      <div
        className="pt-anim"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 340px)", gap: 24, marginTop: 20, animationDelay: ".18s" }}
      >
        {ringkasan.map(([v, akhiran, t]) => (
          <div key={t} className="pt-kaca" style={{ padding: 26 }}>
            <b style={{ fontSize: 72, color: "var(--emas)" }}>
              {v === null ? "—" : <KiraNaik nilai={v} akhiran={akhiran} />}
            </b>
            <p className="pt-redup" style={{ fontSize: 20, margin: "6px 0 0" }}>
              {t}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
