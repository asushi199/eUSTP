"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

/** Inisial daripada nama (maks. 2 huruf, cth. "Pentadbir USTP" -> "PU"). */
function initials(nama: string): string {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  const chars = parts.slice(0, 2).map((p) => p[0]);
  return (chars.join("") || "?").toUpperCase();
}

/**
 * Menu pengguna header admin — satu butang avatar menggantikan
 * nama + Kata Laluan + Log Keluar supaya bar tidak sesak di telefon.
 */
export default function AdminUserMenu({
  nama,
  peranan,
  canManageUsers = false,
}: {
  nama: string;
  peranan: string;
  canManageUsers?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu pengguna — ${nama}`}
        className="flex items-center gap-1.5 rounded-full p-1 hover:bg-cloud focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
          {initials(nama)}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 text-graphite transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-lg border border-fog bg-white shadow-modal"
        >
          <div className="border-b border-fog px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">{nama}</p>
            <p className="mt-0.5 text-xs text-graphite">{peranan}</p>
          </div>
          <div className="py-1">
            {canManageUsers ? (
              <Link
                role="menuitem"
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-ink hover:bg-cloud"
              >
                Pengguna
              </Link>
            ) : null}
            <Link
              role="menuitem"
              href="/tukar-kata-laluan"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-cloud"
            >
              Kata Laluan
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={() => void signOut({ callbackUrl: "/" })}
              className="block w-full px-4 py-2.5 text-left text-sm text-ink hover:bg-cloud"
            >
              Log Keluar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
