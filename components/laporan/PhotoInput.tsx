"use client";

import { useRef, useState } from "react";
import { compressImageForLaporan } from "@/lib/client/compress-image";
import { LAPORAN_MAX_PHOTOS } from "@/lib/laporan/photos";

export type PickedPhoto = { file: File; previewUrl: string };

/** Pemilih gambar (≤5) dengan mampatan pelayar + pratonton. */
export default function PhotoInput({
  photos,
  onChange,
  disabled,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setBusy(true);
    setNotice(null);
    const next = [...photos];
    const notices: string[] = [];
    for (const raw of files) {
      if (next.length >= LAPORAN_MAX_PHOTOS) {
        notices.push(`Maksimum ${LAPORAN_MAX_PHOTOS} gambar.`);
        break;
      }
      try {
        const { file, notice: n } = await compressImageForLaporan(raw);
        next.push({ file, previewUrl: URL.createObjectURL(file) });
        if (n) notices.push(n);
      } catch (err) {
        notices.push(err instanceof Error ? err.message : String(err));
      }
    }
    onChange(next);
    setNotice(notices.length ? notices.join(" ") : null);
    setBusy(false);
  }

  function removeAt(i: number) {
    const next = [...photos];
    const [removed] = next.splice(i, 1);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={p.previewUrl} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.previewUrl}
              alt={`Gambar ${i + 1}`}
              className="h-24 w-24 rounded-lg border hairline object-cover"
            />
            <button
              type="button"
              aria-label={`Buang gambar ${i + 1}`}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white hover:bg-charcoal"
              onClick={() => removeAt(i)}
              disabled={disabled}
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < LAPORAN_MAX_PHOTOS && (
          <button
            type="button"
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-steel text-graphite hover:border-ink hover:text-ink disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[11px]">{busy ? "Memproses…" : "Tambah"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
      <p className="mt-2 text-xs text-graphite">
        Sehingga {LAPORAN_MAX_PHOTOS} gambar. Gambar besar dimampatkan secara automatik.
      </p>
      {notice && <p className="mt-1 text-xs text-storm-deep">{notice}</p>}
    </div>
  );
}
