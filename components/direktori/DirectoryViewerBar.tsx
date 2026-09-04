"use client";

import { signOut } from "next-auth/react";

export default function DirectoryViewerBar({
  nama,
  email,
}: {
  nama: string;
  email: string;
}) {
  const label = email || nama;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-xl border hairline bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-graphite">
        Log masuk sebagai <span className="font-medium text-ink">{label}</span>
      </p>
      <button
        type="button"
        className="btn-outline-ink h-10 w-full sm:w-auto"
        onClick={() => void signOut({ callbackUrl: "/direktori" })}
      >
        Log keluar
      </button>
    </div>
  );
}
