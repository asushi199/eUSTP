"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { searchPublicEntries, type PublicSearchEntry } from "@/lib/public-search";

export default function PublicModuleSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const results: PublicSearchEntry[] = searchPublicEntries(query);
  const showList = open && query.trim().length > 0;

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative hidden min-w-0 flex-1 justify-center md:flex">
      <label className="relative w-full max-w-xl">
        <span className="sr-only">Cari modul</span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Cari modul, laporan, direktori…"
          className="h-11 w-full rounded-full border-0 bg-[#eef2f7] px-5 pr-12 text-sm text-ink outline-none ring-1 ring-transparent placeholder:text-steel focus:bg-white focus:ring-primary/25"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showList}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-graphite">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
        </span>
      </label>
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-[calc(100%+0.5rem)] z-50 w-full max-w-xl overflow-hidden rounded-2xl border hairline bg-white py-1 shadow-modal"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-graphite">Tiada padanan.</li>
          ) : (
            results.map((item) => (
              <li key={item.href} role="option">
                <Link
                  href={item.href}
                  className="block px-4 py-2.5 hover:bg-cloud"
                  onClick={() => {
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[11px] text-graphite">{item.group}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
