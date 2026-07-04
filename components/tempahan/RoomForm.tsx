"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRoom } from "@/lib/actions/tempahan-admin";

type RoomData = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  amenities: string[];
  sortOrder: number;
};

export default function RoomForm({
  pkgId,
  room,
  onDone,
}: {
  pkgId: string;
  room?: RoomData;
  onDone?: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await saveRoom(pkgId, formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan bilik.");
        return;
      }
      formRef.current?.reset();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="card space-y-4 p-5">
      <p className="font-semibold">{room ? `Sunting: ${room.name}` : "Tambah Bilik"}</p>
      {room && <input type="hidden" name="slug" value={room.slug} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nama Bilik *</label>
          <input name="name" className="input" required defaultValue={room?.name ?? ""} />
        </div>
        <div>
          <label className="label">Nama Pendek</label>
          <input name="shortName" className="input" defaultValue={room?.shortName ?? ""} />
        </div>
        <div>
          <label className="label">Kategori</label>
          <input
            name="category"
            className="input"
            placeholder="cth. Bilik Mesyuarat"
            defaultValue={room?.category ?? ""}
          />
        </div>
        <div>
          <label className="label">Susunan</label>
          <input
            name="sortOrder"
            type="number"
            min={0}
            className="input"
            defaultValue={room?.sortOrder ?? 0}
          />
        </div>
      </div>
      <div>
        <label className="label">Kemudahan (asingkan dengan koma)</label>
        <input
          name="amenities"
          className="input"
          placeholder="Projektor, WiFi, Penghawa dingin"
          defaultValue={room?.amenities.join(", ") ?? ""}
        />
      </div>
      <div>
        <label className="label">Gambar Bilik (pilihan, ≤4MB)</label>
        <input name="photo" type="file" accept="image/*" className="text-sm" />
      </div>

      {error && <p className="text-sm text-bloom-deep">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        {onDone && (
          <button type="button" className="btn-outline-ink btn-sm" onClick={onDone}>
            Batal
          </button>
        )}
      </div>
    </form>
  );
}
