"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Togol aktif/tersembunyi — action ialah server action terikat. */
export default function ToggleAktifButton({
  aktif,
  action,
}: {
  aktif: boolean;
  action: () => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="status-badge disabled:opacity-50"
      onClick={() =>
        startTransition(async () => {
          await action();
          router.refresh();
        })
      }
      title={aktif ? "Klik untuk sembunyi" : "Klik untuk aktifkan"}
    >
      <span className={`status-dot ${aktif ? "bg-primary" : "bg-steel"}`} />
      {pending ? "…" : aktif ? "Aktif" : "Tersembunyi"}
    </button>
  );
}
