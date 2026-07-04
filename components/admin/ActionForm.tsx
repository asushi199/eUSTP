"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Borang generik: hantar FormData ke server action, segarkan halaman.
 * Kanak-kanak (input/butang) dirender oleh komponen pelayan.
 */
export default function ActionForm({
  action,
  className,
  submitLabel = "Simpan",
  children,
}: {
  action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  className?: string;
  submitLabel?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-ink underline-offset-2 hover:underline disabled:opacity-50"
      >
        {pending ? "…" : submitLabel}
      </button>
      {error ? <span className="text-xs text-bloom-deep">{error}</span> : null}
    </form>
  );
}
