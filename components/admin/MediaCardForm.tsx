"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMediaCard } from "@/lib/actions/media";
import { MEDIA_KATEGORI } from "@/lib/media/kategori";
import { listLetterMonthChoices } from "@/lib/resources/search";

export type MediaCardFormValues = {
  id?: number;
  kategori: string;
  title: string;
  url: string;
  letterMonth: string | null;
  sort: number;
  aktif: boolean;
};

export default function MediaCardForm({ values }: { values: MediaCardFormValues }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const months = listLetterMonthChoices();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveMediaCard(fd);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.push(`/admin/media?kategori=${fd.get("kategori")}`);
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
          {MEDIA_KATEGORI.map((k) => (
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
        <label className="label" htmlFor="letterMonth">
          Bulan bahan
        </label>
        <select
          id="letterMonth"
          name="letterMonth"
          defaultValue={values.letterMonth ?? ""}
          className="input"
        >
          <option value="">Tidak dinyatakan</option>
          {values.letterMonth && !months.some((m) => m.value === values.letterMonth) ? (
            <option value={values.letterMonth}>{values.letterMonth}</option>
          ) : null}
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-graphite">
          Guna bulan program atau siaran, bukan bulan muat naik. Wajib jika memuat naik fail.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="fail">
          Fail video / gambar
        </label>
        <input id="fail" name="fail" type="file" accept="application/pdf,image/*" className="input" />
        <p className="mt-1 text-xs text-graphite">
          Imej (JPG/PNG/WebP) atau PDF, maksimum 8 MB. Fail disimpan ke Google Drive mengikut
          bulan. Untuk video, tampal pautan YouTube di bawah.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="url">
          Pautan video / gambar
        </label>
        <input
          id="url"
          name="url"
          defaultValue={values.url}
          className="input"
          placeholder="https://"
        />
        <p className="mt-1 text-xs text-graphite">
          Isi pautan YouTube, Drive atau lain-lain, atau biarkan kosong jika memuat naik fail
          di atas.
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
