"use client";

import { SENARAI_BAB, type Slaid } from "@/lib/mjkd/pembentangan";

/** G — senarai semua slaid dikumpul ikut bab; klik untuk lompat. */
export default function Navigator({
  dek,
  semasa,
  onPilih,
  onTutup,
}: {
  dek: readonly Slaid[];
  semasa: number;
  onPilih: (i: number) => void;
  onTutup: () => void;
}) {
  return (
    <div className="pt-nav" role="dialog" aria-modal="true" aria-label="Semua slaid">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="pt-label">Semua slaid</p>
        <button type="button" className="pt-hantu" onClick={onTutup}>
          Tutup (G / Esc)
        </button>
      </div>
      {SENARAI_BAB.map((b) => {
        const dalam = dek.map((s, i) => ({ s, i })).filter(({ s }) => s.bab === b.id);
        if (dalam.length === 0) return null;
        return (
          <section key={b.id}>
            <h3>{b.label}</h3>
            <div className="pt-gridnav">
              {dalam.map(({ s, i }) => (
                <button
                  key={s.kunci}
                  type="button"
                  aria-current={i === semasa}
                  onClick={() => onPilih(i)}
                  autoFocus={i === semasa}
                >
                  <small>{i + 1}</small>
                  {s.tajuk}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
