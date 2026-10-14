"use client";

import { useRef, useState } from "react";
import { muatNaikFotoBuktiMjkd } from "@/lib/actions/mjkd";
import { compressImageForLaporan } from "@/lib/client/compress-image";
import { FOTO_BUKTI_MAKS, urlFotoBukti } from "@/lib/mjkd/validation";

type Props = {
  id: string;
  mesyuaratId: string;
  schoolCode: string;
  /** Path sedia ada ("drive/…") atau token baru dimuat naik ("drive/…~sig"). */
  nilai: string[];
  onUbah: (nilai: string[]) => void;
  /** Bilangan muat naik yang sedang berjalan (untuk menghalang hantar). */
  onSibuk: (delta: number) => void;
};

/** Muat naik sehingga 3 gambar bukti: dimampatkan di pelayar, kemudian ke Google Drive. */
export default function FotoBuktiInput({ id, mesyuaratId, schoolCode, nilai, onUbah, onSibuk }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sedang, setSedang] = useState(0);
  const [ralat, setRalat] = useState<string | null>(null);
  // Nilai terkini untuk panggilan balik tak segerak (elak menimpa gambar lain yang siap serentak).
  const nilaiRef = useRef(nilai);
  nilaiRef.current = nilai;

  const baki = FOTO_BUKTI_MAKS - nilai.length - sedang;

  async function pilih(files: FileList | null) {
    setRalat(null);
    const senarai = Array.from(files ?? []).slice(0, Math.max(baki, 0));
    if (inputRef.current) inputRef.current.value = "";
    if (senarai.length === 0) {
      if ((files?.length ?? 0) > 0) setRalat(`Maksimum ${FOTO_BUKTI_MAKS} gambar.`);
      return;
    }
    setSedang((n) => n + senarai.length);
    onSibuk(senarai.length);
    await Promise.all(
      senarai.map(async (f) => {
        try {
          const { file } = await compressImageForLaporan(f, { forceJpeg: true });
          const fd = new FormData();
          fd.set("mesyuaratId", mesyuaratId);
          fd.set("schoolCode", schoolCode);
          fd.set("fail", file);
          const res = await muatNaikFotoBuktiMjkd(fd);
          if (res.ok) {
            nilaiRef.current = [...nilaiRef.current, res.token].slice(0, FOTO_BUKTI_MAKS);
            onUbah(nilaiRef.current);
          } else {
            setRalat(res.error);
          }
        } catch (e) {
          setRalat(e instanceof Error ? e.message : "Gagal memuat naik gambar.");
        } finally {
          setSedang((n) => n - 1);
          onSibuk(-1);
        }
      }),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {nilai.map((f, i) => (
          <div key={f} className="relative overflow-hidden rounded-md border hairline bg-cloud">
            <img
              src={urlFotoBukti(f, 400)}
              alt={`Gambar bukti ${i + 1}`}
              referrerPolicy="no-referrer"
              className="h-20 w-28 object-cover"
            />
            <button
              type="button"
              onClick={() => onUbah(nilai.filter((x) => x !== f))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-sm leading-none text-white hover:bg-ink"
              aria-label={`Buang gambar ${i + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: sedang }).map((_, i) => (
          <div
            key={`sedang-${i}`}
            className="flex h-20 w-28 animate-pulse items-center justify-center rounded-md border hairline bg-cloud text-xs text-graphite"
          >
            Memuat naik…
          </div>
        ))}
        {baki > 0 ? (
          <label
            htmlFor={id}
            className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-steel text-xs text-graphite hover:border-ink hover:text-ink"
          >
            <span className="text-xl leading-none">+</span>
            Tambah gambar
          </label>
        ) : null}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          disabled={!schoolCode || baki <= 0}
          onChange={(e) => void pilih(e.target.files)}
        />
      </div>
      {ralat ? <p className="mt-1 text-xs text-bloom-deep">{ralat}</p> : null}
    </div>
  );
}
