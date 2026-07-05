"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminApproveKhidmat,
  adminRejectKhidmat,
} from "@/lib/actions/khidmat-bantu-admin";

export default function AdminKhidmatActions({
  requestId,
  status,
}: {
  requestId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        setError(res.error ?? "Tindakan gagal.");
        return;
      }
      router.refresh();
    });
  }

  if (status !== "pending") return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={pending}
          onClick={() => run(() => adminApproveKhidmat(requestId))}
        >
          Lulus
        </button>
        <button
          type="button"
          className="btn-outline-ink btn-sm"
          disabled={pending}
          onClick={() => run(() => adminRejectKhidmat(requestId))}
        >
          Tolak
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
