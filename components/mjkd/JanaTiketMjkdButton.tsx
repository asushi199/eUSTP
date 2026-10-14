"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminJanaTiketMjkd } from "@/lib/actions/mjkd";

export default function JanaTiketMjkdButton({
  mesyuaratId,
  schoolCode,
  tiketAsal,
}: {
  mesyuaratId: string;
  schoolCode: string;
  tiketAsal: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tiket, setTiket] = useState(tiketAsal);
  const [error, setError] = useState<string | null>(null);

  function onJana() {
    if (!window.confirm("Jana nombor tiket baharu? Tiket lama tidak boleh digunakan lagi.")) return;
    setError(null);
    startTransition(async () => {
      const res = await adminJanaTiketMjkd(mesyuaratId, schoolCode);
      if (!res.ok || !res.receiptToken) {
        setError(res.error ?? "Gagal jana tiket.");
        return;
      }
      setTiket(res.receiptToken);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <p className="text-xs text-graphite">Nombor tiket</p>
        <p className="font-mono text-lg font-semibold tracking-wider text-ink">{tiket}</p>
      </div>
      <button type="button" className="btn-outline-ink btn-sm" disabled={pending} onClick={onJana}>
        {pending ? "Menjana…" : "Jana tiket baharu"}
      </button>
      {error && <span className="text-xs text-bloom-deep">{error}</span>}
    </div>
  );
}
