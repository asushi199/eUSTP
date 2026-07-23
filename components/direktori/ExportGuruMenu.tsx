"use client";

import { useEffect, useRef, useState } from "react";
import { ROLE_INFO, ROLE_ORDER } from "@/lib/direktori/config";

/**
 * Butang "CSV Guru" dengan pilihan peranan — muat turun semua peranan
 * atau satu peranan sahaja (senarai per jawatan lebih mudah diproses).
 */
export default function ExportGuruMenu() {
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

  const items = [
    { label: "Semua peranan", href: "/admin/direktori/export?listType=teachers" },
    ...ROLE_ORDER.map((role) => ({
      label: `${ROLE_INFO[role].short} sahaja`,
      href: `/admin/direktori/export?listType=teachers&roles=${role}`,
    })),
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-outline-ink btn-sm"
      >
        CSV Direktori
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-lg border border-fog bg-white py-1 shadow-modal"
        >
          {items.map((item) => (
            <a
              key={item.href}
              role="menuitem"
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink hover:bg-cloud"
            >
              {item.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
