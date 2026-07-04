"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreVersion } from "@/lib/actions/direktori";

export default function RestoreButton({ versionId }: { versionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRestore() {
    if (!window.confirm("Pulihkan versi ini sebagai versi semasa?")) return;
    setError(null);
    startTransition(async () => {
      const res = await restoreVersion(versionId);
      if (!res.ok) {
        setError(res.error ?? "Gagal memulihkan versi.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        className="btn-outline btn-sm"
        disabled={pending}
        onClick={onRestore}
      >
        {pending ? "Memulihkan…" : "Pulihkan"}
      </button>
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
