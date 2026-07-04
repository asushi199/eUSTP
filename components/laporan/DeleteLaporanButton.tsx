"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLaporan } from "@/lib/actions/laporan";
import type { LaporanModul } from "@/lib/laporan/photos";

export default function DeleteLaporanButton({
  modul,
  laporanId,
}: {
  modul: LaporanModul;
  laporanId: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(`Padam laporan #${laporanId}? Tindakan ini kekal.`)) return;
    startTransition(async () => {
      await deleteLaporan(modul, laporanId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
      disabled={pending}
      onClick={onDelete}
    >
      {pending ? "…" : "Padam"}
    </button>
  );
}
