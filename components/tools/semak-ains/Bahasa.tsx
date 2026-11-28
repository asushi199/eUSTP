"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BAHASA_UI, KAMUS, bacaBahasaUi, simpanBahasaUi, type BahasaUi, type Kamus } from "@/lib/tools/semak-ains/i18n";

type NilaiBahasa = { bahasa: BahasaUi; k: Kamus; tukar: (b: BahasaUi) => void };

/* Tanpa penyedia (cth. komponen diuji bersendirian) = BM. */
const Konteks = createContext<NilaiBahasa>({ bahasa: "ms", k: KAMUS.ms, tukar: () => undefined });

/**
 * Bahasa paparan alat (BM / 中文 / தமிழ்). Paparan pertama sentiasa BM (sama dengan HTML pelayan),
 * kemudian bertukar kepada pilihan tersimpan atau `?bahasa=` selepas dipasang.
 */
export function PenyediaBahasa({ children }: { children: ReactNode }) {
  const [bahasa, setBahasa] = useState<BahasaUi>("ms");
  useEffect(() => setBahasa(bacaBahasaUi()), []);
  const tukar = useCallback((b: BahasaUi) => {
    simpanBahasaUi(b);
    setBahasa(b);
  }, []);
  const nilai = useMemo(() => ({ bahasa, k: KAMUS[bahasa], tukar }), [bahasa, tukar]);
  return (
    <Konteks.Provider value={nilai}>
      <div lang={BAHASA_UI.find((b) => b.kod === bahasa)?.lang ?? "ms"}>{children}</div>
    </Konteks.Provider>
  );
}

export function useBahasa(): NilaiBahasa {
  return useContext(Konteks);
}

/** Pemilih bahasa tiga butang. Nama bahasa ditulis dalam bahasanya sendiri. */
export function PemilihBahasa({ className }: { className?: string }) {
  const { bahasa, k, tukar } = useBahasa();
  return (
    <div
      role="group"
      aria-label={k.pilihBahasa}
      className={cn("inline-flex rounded-full border border-fog bg-white p-0.5", className)}
    >
      {BAHASA_UI.map((b) => {
        const aktif = b.kod === bahasa;
        return (
          <button
            key={b.kod}
            type="button"
            lang={b.lang}
            aria-pressed={aktif}
            onClick={() => tukar(b.kod)}
            className={cn(
              "h-8 rounded-full px-3 text-xs font-medium transition",
              aktif ? "bg-ink text-white" : "text-charcoal hover:bg-cloud hover:text-ink",
            )}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
