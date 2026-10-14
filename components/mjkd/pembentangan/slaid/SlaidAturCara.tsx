"use client";

import type { SlaidAturCara as T } from "@/lib/mjkd/pembentangan";
import { usePentas } from "../konteks";

/** Atur cara pembentangan sektor/unit: lajur ikut hari; klik sesi = lompat ke slaid bahan. */
export default function SlaidAturCara({ slaid }: { slaid: T }) {
  const { keKunci } = usePentas();
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="pt-anim">
        <p className="pt-label">Pembentangan sektor dan unit</p>
        <h2 className="pt-tajuk">Atur Cara</h2>
      </div>
      {slaid.hari.length === 0 ? (
        <div className="pt-kaca pt-kosong pt-anim" style={{ marginTop: 30, flex: 1 }}>
          <p style={{ fontSize: 40, margin: 0 }}>Belum ada bahan dimuat naik.</p>
        </div>
      ) : (
        <div
          className="pt-hari-col"
          style={{
            gridTemplateColumns: `repeat(${Math.max(slaid.hari.length, 2)}, minmax(0,1fr))`,
            flex: 1,
            minHeight: 0,
          }}
        >
          {slaid.hari.map((h, i) => (
            <div key={h.hari} className="pt-anim" style={{ animationDelay: `${0.08 * (i + 1)}s`, minHeight: 0, overflow: "auto" }}>
              <p className="pt-cip" style={{ fontSize: 20, fontWeight: 700, color: "var(--teks)", margin: "0 0 16px" }}>
                <span
                  style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--emas)", marginRight: 10, display: "inline-block" }}
                />
                {h.label}
              </p>
              {h.sesi.map((s) => (
                <button key={`${h.hari}-${s.kunci}`} type="button" className="pt-sesi" onClick={() => keKunci(s.kunci)}>
                  <span className="pt-masa">{String(s.nombor).padStart(2, "0")}</span>
                  <span style={{ minWidth: 0 }}>
                    <b>{s.tajuk}</b>
                    <small>
                      {s.sektorUnit}
                      {s.namaPembentang ? ` · ${s.namaPembentang}` : ""}
                    </small>
                  </span>
                  <span className="pt-jenis-bahan">{s.jenisLabel}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
