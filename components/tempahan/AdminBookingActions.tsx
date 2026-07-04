"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminApproveBooking,
  adminCancelBooking,
  adminRejectBooking,
} from "@/lib/actions/tempahan-admin";

export default function AdminBookingActions({
  pkgId,
  bookingId,
  status,
}: {
  pkgId: string;
  bookingId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string }>, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
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

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {status === "pending" && (
          <>
            <button
              type="button"
              className="btn-primary btn-sm"
              disabled={pending}
              onClick={() => run(() => adminApproveBooking(pkgId, bookingId))}
            >
              Lulus
            </button>
            <button
              type="button"
              className="btn-outline-ink btn-sm"
              disabled={pending}
              onClick={() => run(() => adminRejectBooking(pkgId, bookingId))}
            >
              Tolak
            </button>
          </>
        )}
        {(status === "pending" || status === "approved") && (
          <button
            type="button"
            className="text-sm font-medium text-bloom-deep hover:underline disabled:opacity-50"
            disabled={pending}
            onClick={() =>
              run(
                () => adminCancelBooking(pkgId, bookingId),
                "Batalkan tempahan ini?",
              )
            }
          >
            Batal
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-bloom-deep">{error}</p>}
    </div>
  );
}
