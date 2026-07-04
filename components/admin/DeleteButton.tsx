"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/** Butang padam generik dengan pengesahan — action ialah server action terikat. */
export default function DeleteButton({
  action,
  confirmText = "Padam rekod ini?",
  label = "Padam",
}: {
  action: () => Promise<{ ok: boolean }>;
  confirmText?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="text-sm font-medium text-bloom-deep underline-offset-2 hover:underline disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(confirmText)) return;
        startTransition(async () => {
          await action();
          router.refresh();
        });
      }}
    >
      {pending ? "…" : label}
    </button>
  );
}
