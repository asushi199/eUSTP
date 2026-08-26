"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { compareTingkatan, csvCell } from "@/lib/tebus-buku/format";
import type { TebusBukuStudent } from "@/lib/tebus-buku/types";

type StatusFilter = "semua" | "belum-tebus" | "belum-guna" | "sudah-siap";

const STATUS_BUTTONS: ReadonlyArray<[StatusFilter, string]> = [
  ["semua", "Semua"],
  ["belum-tebus", "Belum tebus"],
  ["belum-guna", "Belum guna"],
  ["sudah-siap", "Selesai"],
];

const STATUS_SUMMARY: Record<StatusFilter, string> = {
  semua: "",
  "belum-tebus": "Belum tebus dan belum guna baucar",
  "belum-guna": "Sudah tebus baucar, belum guna baucar",
  "sudah-siap": "Selesai",
};

const STATUS_PENERANGAN: ReadonlyArray<{ key: StatusFilter; title: string; meaning: string }> = [
  {
    key: "belum-tebus",
    title: "Belum tebus",
    meaning: "belum tebus dan belum guna baucar",
  },
  {
    key: "belum-guna",
    title: "Belum guna",
    meaning: "sudah tebus baucar, belum guna baucar",
  },
  {
    key: "sudah-siap",
    title: "Selesai",
    meaning: "sudah tebus dan sudah guna baucar",
  },
];

function matchesStatus(student: TebusBukuStudent, status: StatusFilter) {
  if (status === "belum-tebus") return !student.sudahTebus && !student.sudahGuna;
  if (status === "belum-guna") return student.sudahTebus && !student.sudahGuna;
  if (status === "sudah-siap") return student.sudahTebus && student.sudahGuna;
  return true;
}

function StatusMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={cn("status-badge", done ? "text-ink" : "text-graphite")}>
      <span
        className="status-dot"
        style={{ backgroundColor: done ? "#1a1a1a" : "#c8c8c8" }}
      />
      {done ? label : `Belum ${label.toLowerCase()}`}
    </span>
  );
}

function tebusLabel(done: boolean) {
  return done ? "Sudah Tebus" : "Belum Tebus";
}

function gunaLabel(done: boolean) {
  return done ? "Sudah Guna" : "Belum Guna";
}

function fileSlug(value: string) {
  return value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function StudentLookup({
  schoolCode,
  schoolName,
  students,
  tingkatan,
}: {
  schoolCode: string;
  schoolName: string;
  students: TebusBukuStudent[];
  tingkatan: string[];
}) {
  const [query, setQuery] = useState("");
  const [tingkatanFilter, setTingkatanFilter] = useState("");
  const [status, setStatus] = useState<StatusFilter>("semua");

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length >= 2;
  const hasTingkatan = tingkatanFilter !== "";

  const results = useMemo(() => {
    return students
      .filter((student) => {
        if (hasTingkatan && student.tingkatan !== tingkatanFilter) return false;
        if (hasQuery && !student.nama.toLowerCase().includes(normalizedQuery)) {
          return false;
        }
        return matchesStatus(student, status);
      })
      .sort((a, b) => {
        const byTingkatan = compareTingkatan(a.tingkatan, b.tingkatan);
        if (byTingkatan !== 0) return byTingkatan;
        return a.nama.localeCompare(b.nama, "ms");
      });
  }, [hasQuery, hasTingkatan, normalizedQuery, status, students, tingkatanFilter]);

  function downloadCsv() {
    if (results.length === 0) return;
    const header = [
      "Kod Sekolah",
      "Nama Sekolah",
      "Nama Pelajar",
      "Tingkatan",
      "Tebus",
      "Guna",
    ];
    const rows = results.map((student) => [
      schoolCode,
      schoolName,
      student.nama,
      student.tingkatan,
      tebusLabel(student.sudahTebus),
      gunaLabel(student.sudahGuna),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}\r\n`], {
      type: "text/csv;charset=utf-8",
    });
    const parts = [
      "tebus-buku",
      schoolCode,
      hasTingkatan ? tingkatanFilter : null,
      status === "semua" ? null : status,
      hasQuery ? "carian" : null,
    ].filter(Boolean);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${parts.map((part) => fileSlug(String(part))).join("-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

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
          placeholder="Nama pelajar"
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

      <div className="mt-4 rounded-xl border border-fog/70 bg-cloud/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.7px] text-graphite">
          Penerangan
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-charcoal">
          {STATUS_PENERANGAN.map((item) => (
            <li key={item.key}>
              <span className="font-semibold text-ink">{item.title}</span>
              {" = "}
              {item.meaning}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Tapisan status">
        {STATUS_BUTTONS.map(([value, label]) => {
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

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite">
          {results.length} pelajar
          {hasTingkatan ? ` · ${tingkatanFilter}` : ""}
          {status !== "semua" ? ` · ${STATUS_SUMMARY[status]}` : ""}
        </p>
        <button
          type="button"
          className="btn-outline-ink btn-sm"
          onClick={downloadCsv}
          disabled={results.length === 0}
        >
          Muat Turun CSV
        </button>
      </div>

      {results.length === 0 ? (
        <p className="mt-4 text-sm text-graphite">Tiada pelajar yang sepadan.</p>
      ) : (
        <ul className="mt-3 divide-y divide-fog/80 rounded-xl border border-fog/70 bg-white">
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
    </div>
  );
}
