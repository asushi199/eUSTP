"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { TebusBukuStudent } from "@/lib/tebus-buku/types";

type StatusFilter = "semua" | "belum-tebus" | "belum-guna" | "sudah-siap";

function StatusMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "status-badge",
        done ? "text-ink" : "text-graphite",
      )}
    >
      <span
        className="status-dot"
        style={{ backgroundColor: done ? "#1a1a1a" : "#c8c8c8" }}
      />
      {done ? label : `Belum ${label.toLowerCase()}`}
    </span>
  );
}

export default function StudentLookup({
  students,
  tingkatan,
}: {
  students: TebusBukuStudent[];
  tingkatan: string[];
}) {
  const [query, setQuery] = useState("");
  const [tingkatanFilter, setTingkatanFilter] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length >= 2;
  const hasTingkatan = tingkatanFilter !== "";
  const ready = hasQuery || hasTingkatan;

  const results = useMemo(() => {
    if (!ready) return [];
    return students.filter((student) => {
      if (hasTingkatan && student.tingkatan !== tingkatanFilter) return false;
      if (hasQuery && !student.nama.toLowerCase().includes(normalizedQuery)) {
        return false;
      }
      if (status === "belum-tebus" && student.sudahTebus) return false;
      if (status === "belum-guna" && student.sudahGuna) return false;
      if (status === "sudah-siap" && !(student.sudahTebus && student.sudahGuna)) {
        return false;
      }
      return true;
    });
  }, [hasQuery, hasTingkatan, normalizedQuery, ready, status, students, tingkatanFilter]);

  return (
    <div className="mt-8">
      <label htmlFor="carian-pelajar-tebus" className="label">
        Cari pelajar
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
          id="carian-pelajar-tebus"
          className="input pl-10"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Taip sekurang-kurangnya 2 huruf nama"
          autoComplete="off"
        />
      </div>

      <div className="mt-4">
        <label htmlFor="tingkatan-tebus" className="label">
          Tingkatan
        </label>
        <select
          id="tingkatan-tebus"
          className="input"
          value={tingkatanFilter}
          onChange={(event) => setTingkatanFilter(event.target.value)}
        >
          <option value="">Semua tingkatan</option>
          {tingkatan.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tapisan status">
        {(
          [
            ["semua", "Semua"],
            ["belum-tebus", "Belum tebus"],
            ["belum-guna", "Belum guna"],
            ["sudah-siap", "Sudah siap"],
          ] as const
        ).map(([value, label]) => {
          const active = status === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                "h-11 rounded-md px-4 text-xs font-semibold uppercase tracking-[0.7px]",
                active ? "btn-ink" : "btn-outline-ink",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!ready ? (
        <p className="mt-6 text-sm leading-relaxed text-graphite">
          Taip nama pelajar atau pilih tingkatan. Senarai penuh tidak dipaparkan
          supaya carian kekal kemas.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-sm text-graphite">Tiada pelajar yang sepadan.</p>
      ) : (
        <ul className="mt-5 divide-y divide-fog/80 rounded-xl border border-fog/70 bg-white">
          {results.map((student, index) => (
            <li
              key={`${student.tingkatan}-${student.nama}-${index}`}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{student.nama}</p>
                <p className="mt-0.5 text-sm text-graphite">{student.tingkatan}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusMark done={student.sudahTebus} label="Tebus" />
                <StatusMark done={student.sudahGuna} label="Guna" />
              </div>
            </li>
          ))}
        </ul>
      )}

      {ready && results.length > 0 ? (
        <p className="mt-3 text-sm text-graphite">{results.length} pelajar</p>
      ) : null}
    </div>
  );
}
