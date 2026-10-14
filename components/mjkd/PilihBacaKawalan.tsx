"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminPilihBacaMjkd, adminUbahSusunanBacaMjkd } from "@/lib/actions/mjkd";

type Props = {
  itemId: string;
  dipilih: boolean;
  susunan: number | null;
  /** Kedudukan dalam senarai dipilih bagi perkara ini (untuk melumpuhkan naik/turun di hujung). */
  pertama: boolean;
  terakhir: boolean;
};

/** Togol "Pilih untuk dibaca" + susunan bacaan bagi satu jawapan. */
export default function PilihBacaKawalan({ itemId, dipilih, susunan, pertama, terakhir }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function jalankan(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Gagal.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={dipilih ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
        disabled={pending}
        aria-pressed={dipilih}
        onClick={() => jalankan(() => adminPilihBacaMjkd(itemId, !dipilih))}
      >
        {dipilih ? `★ Dipilih${susunan ? ` (${susunan})` : ""}` : "☆ Pilih untuk dibaca"}
      </button>
      {dipilih ? (
        <>
          <button
            type="button"
            className="btn-outline-ink btn-sm"
            disabled={pending || pertama}
            onClick={() => jalankan(() => adminUbahSusunanBacaMjkd(itemId, "naik"))}
            aria-label="Naikkan susunan bacaan"
          >
            Naik
          </button>
          <button
            type="button"
            className="btn-outline-ink btn-sm"
            disabled={pending || terakhir}
            onClick={() => jalankan(() => adminUbahSusunanBacaMjkd(itemId, "turun"))}
            aria-label="Turunkan susunan bacaan"
          >
            Turun
          </button>
        </>
      ) : null}
      {error && <span className="text-xs text-bloom-deep">{error}</span>}
    </div>
  );
}
