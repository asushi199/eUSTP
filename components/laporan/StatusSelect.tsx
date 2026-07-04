"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateLaporanStatus } from "@/lib/actions/laporan";
import type { LaporanModul } from "@/lib/laporan/photos";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS = ["BARU", "DISEMAK", "SELESAI"] as const;

const DOT_CLASS: Record<string, string> = {
  BARU: "bg-graphite",
  DISEMAK: "bg-storm-deep",
  SELESAI: "bg-primary",
};

export default function StatusSelect({
  modul,
  laporanId,
  status,
}: {
  modul: LaporanModul;
  laporanId: number;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(status);

  function onChange(next: string) {
    setValue(next);
    startTransition(async () => {
      const res = await updateLaporanStatus(modul, laporanId, next);
      if (!res.ok) {
        setValue(status);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("status-dot", DOT_CLASS[value] ?? "bg-graphite")} />
      <select
        aria-label="Status laporan"
        className="rounded-md border border-fog bg-white px-1.5 py-1 text-xs font-medium text-charcoal focus:border-ink focus:outline-none disabled:opacity-50"
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </span>
  );
}
