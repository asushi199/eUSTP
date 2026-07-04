"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSchoolWebsite } from "@/lib/actions/direktori";

export default function EditSchoolWebsiteForm({
  schoolCode,
  currentWebsite,
}: {
  schoolCode: string;
  currentWebsite: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [website, setWebsite] = useState(currentWebsite);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <p className="text-sm text-graphite">
        Laman web:{" "}
        {currentWebsite ? (
          <a
            href={currentWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="link-blue break-all"
          >
            {currentWebsite}
          </a>
        ) : (
          <span>tiada</span>
        )}{" "}
        <button
          type="button"
          className="link-blue"
          onClick={() => {
            setWebsite(currentWebsite);
            setEditing(true);
          }}
        >
          {currentWebsite ? "Tukar" : "Tambah"}
        </button>
      </p>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateSchoolWebsite(schoolCode, website);
      if (!res.ok) {
        setError(res.error ?? "Gagal mengemas kini laman web.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input
        className="input max-w-xs"
        type="url"
        placeholder="https://…"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        disabled={pending}
      />
      <button type="submit" className="btn-primary" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan"}
      </button>
      <button
        type="button"
        className="btn-outline-ink"
        onClick={() => setEditing(false)}
        disabled={pending}
      >
        Batal
      </button>
      {error ? <p className="w-full text-sm text-bloom-deep">{error}</p> : null}
    </form>
  );
}
