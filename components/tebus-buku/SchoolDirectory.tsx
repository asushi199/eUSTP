"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCount, shortSchoolName } from "@/lib/tebus-buku/format";
import type { TebusBukuSchool } from "@/lib/tebus-buku/types";

export default function SchoolDirectory({ schools }: { schools: TebusBukuSchool[] }) {
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return schools;
    return schools.filter((school) => {
      const haystack = `${school.name} ${shortSchoolName(school.name)} ${school.code}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query, schools]);

  return (
    <>
      <div className="mt-8">
        <label htmlFor="carian-sekolah-tebus" className="label">
          Cari sekolah
        </label>
        <div className="relative">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-graphite"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            id="carian-sekolah-tebus"
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nama atau kod sekolah"
            autoComplete="off"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-graphite">Tiada sekolah yang sepadan.</p>
      ) : (
        <ul className="mt-5 divide-y divide-fog/80 rounded-xl border border-fog/70 bg-white">
          {items.map((school) => (
            <li key={school.code}>
              <Link
                href={`/laporan/tebus-buku/${school.code}`}
                className="flex items-start justify-between gap-4 px-4 py-3.5 transition hover:bg-cloud/70"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {shortSchoolName(school.name)}
                  </span>
                  <span className="mt-0.5 block text-sm text-graphite">
                    {school.code} · {formatCount(school.tebusCount)}/{formatCount(school.total)}{" "}
                    tebus · {formatCount(school.gunaCount)} guna
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-1 h-5 w-5 shrink-0 text-steel"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
