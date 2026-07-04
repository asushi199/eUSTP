"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSchoolName } from "@/lib/actions/direktori";

export default function EditSchoolNameForm({
  schoolCode,
  currentName,
}: {
  schoolCode: string;
  currentName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        className="link-blue text-sm"
        onClick={() => {
          setName(currentName);
          setEditing(true);
        }}
      >
        Tukar nama
      </button>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateSchoolName(schoolCode, name);
      if (!res.ok) {
        setError(res.error ?? "Gagal mengemas kini nama.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input
        className="input h-9 max-w-sm text-sm"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary btn-sm" disabled={pending}>
        {pending ? "…" : "Simpan"}
      </button>
      <button
        type="button"
        className="btn-outline-ink btn-sm"
        onClick={() => setEditing(false)}
      >
        Batal
      </button>
      {error && <p className="w-full text-xs text-bloom-deep">{error}</p>}
    </form>
  );
}
