"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSubtopikGroup } from "@/lib/actions/kandungan";

/** Edit medan subtopik untuk semua kad kumpulan (bulk update satu UPDATE). */
export default function SubtopikGroupForm({
  topik,
  subtopikKey,
  values,
  cardCount,
}: {
  topik: string;
  subtopikKey: string;
  values: { title: string; sort: number; blurb: string; icon: string };
  cardCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSubtopikGroup(fd);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.push(`/admin/kandungan?topik=${topik}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-xl space-y-4 p-6">
      <input type="hidden" name="topik" value={topik} />
      <input type="hidden" name="subtopikKey" value={subtopikKey} />
      <p className="text-sm text-graphite">
        Perubahan dikenakan pada <span className="font-semibold text-ink">{cardCount} kad</span>{" "}
        dalam kumpulan <code className="rounded bg-cloud px-1">{subtopikKey}</code>.
      </p>
      <div>
        <label className="label" htmlFor="subtopikTitle">Tajuk subtopik</label>
        <input
          id="subtopikTitle"
          name="subtopikTitle"
          defaultValue={values.title}
          className="input"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="subtopikIcon">Ikon (emoji)</label>
          <input id="subtopikIcon" name="subtopikIcon" defaultValue={values.icon} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="subtopikSort">Susunan</label>
          <input
            id="subtopikSort"
            name="subtopikSort"
            type="number"
            defaultValue={values.sort}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="subtopikBlurb">Keterangan</label>
        <input
          id="subtopikBlurb"
          name="subtopikBlurb"
          defaultValue={values.blurb}
          className="input"
        />
      </div>
      {error ? <p className="text-sm text-bloom-deep">{error}</p> : null}
      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan Semua Kad"}
        </button>
        <button
          type="button"
          className="btn-outline-ink"
          onClick={() => router.back()}
          disabled={pending}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
