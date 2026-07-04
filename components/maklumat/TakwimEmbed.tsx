"use client";

import { useState } from "react";

/** Takwim Google Calendar — iframe hanya dimuat selepas klik (jimat muatan). */
export default function TakwimEmbed({ embedUrl, title }: { embedUrl: string; title: string }) {
  const [open, setOpen] = useState(false);
  if (!embedUrl) return null;
  return (
    <div className="card p-5">
      <p className="font-semibold">{title || "Takwim"}</p>
      {open ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-fog">
          <iframe src={embedUrl} title={title || "Takwim"} className="h-[480px] w-full" />
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="btn-outline-ink mt-3">
          Papar Takwim
        </button>
      )}
    </div>
  );
}
