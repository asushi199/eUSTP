"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveResourcesCard } from "@/lib/actions/resources";
import { RESOURCES_KATEGORI } from "@/lib/resources/kategori";

export type ResourcesCardFormValues = {
  id?: number;
  kategori: string;
  title: string;
  url: string;
  sort: number;
  aktif: boolean;
};

export default function ResourcesCardForm({ values }: { values: ResourcesCardFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveResourcesCard(fd);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.push(`/admin/resources?kategori=${fd.get("kategori")}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-4 p-6">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      <div>
        <label className="label" htmlFor="kategori">
          Kategori
        </label>
        <select id="kategori" name="kategori" defaultValue={values.kategori} className="input">
          {RESOURCES_KATEGORI.map((k) => (
            <option key={k.slug} value={k.slug}>
              {k.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="title">
          Tajuk
        </label>
        <input id="title" name="title" defaultValue={values.title} className="input" required />
      </div>

      <div>
        <label className="label" htmlFor="url">
          Pautan surat
        </label>
        <input
          id="url"
          name="url"
          defaultValue={values.url}
          className="input"
          placeholder="https://"
          required
        />
        <p className="mt-1 text-xs text-graphite">
          Pautan Google Drive, Canva atau PDF. Halaman awam akan papar dan pratonton surat ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="sort">
            Susunan
          </label>
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
