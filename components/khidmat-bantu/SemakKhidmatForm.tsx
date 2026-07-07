"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import PhoneInput from "@/components/PhoneInput";
import {
  semakKhidmatBantuAction,
  type SemakKhidmatResult,
  type SemakKhidmatState,
} from "@/lib/actions/khidmat-bantu";
import type { SchoolOption } from "@/lib/direktori/queries";
import { cn } from "@/lib/cn";

const initialState: SemakKhidmatState = { ok: false, message: "", results: [] };

const STATUS: Record<string, { label: string; dot: string }> = {
  pending: { label: "Menunggu", dot: "bg-graphite" },
  approved: { label: "Diluluskan", dot: "bg-primary" },
  rejected: { label: "Ditolak", dot: "bg-bloom-deep" },
  cancelled: { label: "Dibatalkan", dot: "bg-graphite" },
};

function monthKey(date: string | null): string {
  return date && /^\d{4}-\d{2}/.test(date) ? date.slice(0, 7) : "none";
}
function monthLabel(key: string): string {
  if (key === "none") return "Tiada tarikh";
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ms-MY", {
    month: "long",
    year: "numeric",
  });
}
function dayLabel(date: string | null): string {
  if (!date) return "Tarikh belum ditetapkan";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SemakKhidmatForm({ schools }: { schools: SchoolOption[] }) {
  const [state, formAction, pending] = useActionState(semakKhidmatBantuAction, initialState);
  const [mode, setMode] = useState<"telefon" | "sekolah">("telefon");
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(schools[0]?.code ?? "");

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, schools]);

  useEffect(() => {
    if (filteredSchools.length === 0) return;
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode]);

  const groups = useMemo(() => {
    const map = new Map<string, SemakKhidmatResult[]>();
    for (const r of state.results) {
      const k = monthKey(r.activityDate);
      const list = map.get(k) ?? [];
      list.push(r);
      map.set(k, list);
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "none") return 1;
      if (b[0] === "none") return -1;
      return a[0] < b[0] ? 1 : -1;
    });
  }, [state.results]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="card space-y-4 p-6">
        <input type="hidden" name="mode" value={mode} />

        <div className="inline-flex rounded-lg border border-fog p-0.5">
          {(["telefon", "sekolah"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition",
                mode === m ? "bg-ink text-white" : "text-graphite hover:text-ink",
              )}
            >
              {m === "telefon" ? "No. Telefon" : "Kod Sekolah"}
            </button>
          ))}
        </div>

        {mode === "telefon" ? (
          <div>
            <label className="label" htmlFor="contact">
              No. telefon (semasa memohon)
            </label>
            <PhoneInput id="contact" name="contact" placeholder="cth. 0123456789" required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="carian-sekolah">
                Cari sekolah
              </label>
              <input
                id="carian-sekolah"
                className="input"
                placeholder="Kod atau nama sekolah"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="schoolCode">
                Sekolah
              </label>
              <select
                id="schoolCode"
                name="schoolCode"
                className="input"
                value={schoolCode}
                disabled={filteredSchools.length === 0}
                onChange={(e) => setSchoolCode(e.target.value)}
              >
                {filteredSchools.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? "Menyemak…" : "Semak Permohonan"}
        </button>
      </form>

      {state.message && (
        <p className={cn("text-sm", state.ok ? "text-graphite" : "text-bloom-deep")}>
          {state.message}
        </p>
      )}

      {groups.length > 0 && (
        <div className="space-y-3">
          {groups.map(([key, items], gi) => (
            <details
              key={key}
              open={gi === 0}
              className="group card overflow-hidden p-0"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 hover:bg-cloud">
                <span className="font-semibold">{monthLabel(key)}</span>
                <span className="flex items-center gap-2 text-sm text-graphite">
                  {items.length} permohonan
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>

              <div className="space-y-3 border-t border-fog p-4">
                {items.map((r) => {
                  const st = STATUS[r.status] ?? STATUS.pending;
                  return (
                    <div key={r.id} className="rounded-lg border border-fog/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-graphite">{r.serviceLabel}</p>
                          <p className="mt-0.5 font-semibold leading-snug">{r.title}</p>
                        </div>
                        <span className="status-badge shrink-0">
                          <span className={cn("status-dot", st.dot)} />
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-graphite">
                        {r.orgName} · {dayLabel(r.activityDate)}
                      </p>
                      {r.whatsappUrl ? (
                        <a
                          href={r.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline-ink mt-3 inline-flex w-full justify-center"
                        >
                          Hantar semula WhatsApp kepada admin
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
