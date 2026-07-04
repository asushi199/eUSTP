"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveKandunganCard } from "@/lib/actions/kandungan";

const TYPES = ["pdf", "canva", "gdoc", "embed", "youtube", "image", "link"] as const;

export type KandunganCardFormValues = {
  id?: number;
  topik: string;
  subtopikKey: string;
  subtopikTitle: string;
  subtopikSort: number;
  subtopikBlurb: string;
  subtopikIcon: string;
  sort: number;
  title: string;
  blurb: string;
  url: string;
  type: string;
  previewUrl: string;
  aktif: boolean;
};

export default function KandunganCardForm({
  values,
  topikOptions,
}: {
  values: KandunganCardFormValues;
  topikOptions: { topik: string; title: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveKandunganCard(fd);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.push(`/admin/kandungan?topik=${fd.get("topik")}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-4 p-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="topik">Topik</label>
          <select id="topik" name="topik" defaultValue={values.topik} className="input">
            {topikOptions.map((t) => (
              <option key={t.topik} value={t.topik}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="type">Jenis</label>
          <select id="type" name="type" defaultValue={values.type} className="input">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="title">Tajuk</label>
        <input id="title" name="title" defaultValue={values.title} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="blurb">Keterangan ringkas</label>
        <input id="blurb" name="blurb" defaultValue={values.blurb} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="url">URL</label>
        <input id="url" name="url" defaultValue={values.url} className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="previewUrl">
          URL pratonton (pilihan — jika berbeza dari URL penuh)
        </label>
        <input id="previewUrl" name="previewUrl" defaultValue={values.previewUrl} className="input" />
      </div>

      <fieldset className="hairline rounded-lg border p-4">
        <legend className="px-1 text-sm font-semibold">Subtopik (kumpulan)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="subtopikKey">Kunci subtopik</label>
            <input
              id="subtopikKey"
              name="subtopikKey"
              defaultValue={values.subtopikKey}
              className="input"
              placeholder="cth. slot-kertas-kerja"
            />
          </div>
          <div>
            <label className="label" htmlFor="subtopikTitle">Tajuk subtopik</label>
            <input
              id="subtopikTitle"
              name="subtopikTitle"
              defaultValue={values.subtopikTitle}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="subtopikIcon">Ikon (emoji)</label>
            <input
              id="subtopikIcon"
              name="subtopikIcon"
              defaultValue={values.subtopikIcon}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="subtopikSort">Susunan subtopik</label>
            <input
              id="subtopikSort"
              name="subtopikSort"
              type="number"
              defaultValue={values.subtopikSort}
              className="input"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="subtopikBlurb">Keterangan subtopik</label>
          <input
            id="subtopikBlurb"
            name="subtopikBlurb"
            defaultValue={values.subtopikBlurb}
            className="input"
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sort">Susunan kad</label>
          <input id="sort" name="sort" type="number" defaultValue={values.sort} className="input" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="aktif" defaultChecked={values.aktif} />
            Aktif (dipapar di halaman awam)
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-bloom-deep">{error}</p> : null}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
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
