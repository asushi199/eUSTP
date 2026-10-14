"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminPilihBacaMjkd } from "@/lib/actions/mjkd";

type Props = {
  itemId: string;
  dipilih: boolean;
};

/**
 * Togol "★ Sorotan" bagi satu jawapan — tanda sahaja (bintang pada mozek mod pembentangan);
 * tidak menentukan susunan slaid. Boleh juga ditogol dalam Spotlight semasa pembentangan.
 */
export default function PilihBacaKawalan({ itemId, dipilih }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function togol() {
    setError(null);
    startTransition(async () => {
      const res = await adminPilihBacaMjkd(itemId, !dipilih);
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
        onClick={togol}
      >
        {dipilih ? "★ Sorotan" : "☆ Sorotan"}
      </button>
      {error && <span className="text-xs text-bloom-deep">{error}</span>}
    </div>
  );
}
