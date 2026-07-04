"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRoomActive } from "@/lib/actions/tempahan-admin";
import RoomForm from "./RoomForm";

type RoomData = {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  amenities: string[];
  sortOrder: number;
  active: boolean;
  imageSrc: string | null;
};

export default function RoomAdminList({
  pkgId,
  rooms,
}: {
  pkgId: string;
  rooms: RoomData[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  function onToggle(slug: string, active: boolean) {
    const msg = active
      ? "Sembunyikan bilik ini daripada tempahan? (rekod lama kekal)"
      : "Aktifkan semula bilik ini?";
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      await toggleRoomActive(pkgId, slug);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {rooms.length === 0 && (
        <div className="card p-6 text-graphite">Belum ada bilik didaftarkan.</div>
      )}
      {rooms.map((room) =>
        editingSlug === room.slug ? (
          <RoomForm
            key={room.slug}
            pkgId={pkgId}
            room={room}
            onDone={() => setEditingSlug(null)}
          />
        ) : (
          <div
            key={room.slug}
            className="card flex flex-wrap items-center justify-between gap-3 p-4"
          >
            <div className="flex items-center gap-3">
              {room.imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.imageSrc}
                  alt={room.name}
                  className="h-12 w-16 rounded-md border hairline object-cover"
                />
              ) : (
                <div className="flex h-12 w-16 items-center justify-center rounded-md bg-cloud text-xs text-graphite">
                  Tiada
                </div>
              )}
              <div>
                <p className="font-medium">
                  {room.name}
                  {!room.active && (
                    <span className="status-badge ml-2">
                      <span className="status-dot bg-graphite" />
                      Disembunyikan
                    </span>
                  )}
                </p>
                <p className="text-xs text-graphite">
                  {room.category || "tiada kategori"} ·{" "}
                  {room.amenities.length > 0 ? room.amenities.join(", ") : "tiada kemudahan"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="link-blue text-sm"
                onClick={() => setEditingSlug(room.slug)}
              >
                Sunting
              </button>
              <button
                type="button"
                className="text-sm font-medium text-graphite hover:text-ink disabled:opacity-50"
                disabled={pending}
                onClick={() => onToggle(room.slug, room.active)}
              >
                {room.active ? "Sembunyi" : "Aktifkan"}
              </button>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
