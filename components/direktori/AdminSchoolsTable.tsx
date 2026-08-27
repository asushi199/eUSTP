"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ROLE_INFO, ROLE_ORDER } from "@/lib/direktori/config";
import type { AdminSchoolRecord } from "@/lib/direktori/queries";

function schoolSearchHaystack(record: AdminSchoolRecord): string {
  return [
    record.schoolCode,
    record.schoolName,
    record.zone,
    ...record.roles.map((c) => c.teacherName),
  ]
    .join(" ")
    .toLowerCase();
}

function filledContacts(record: AdminSchoolRecord) {
  return record.roles.filter((c) => c.teacherName || c.phoneNormalized || c.phone);
}

function compactContactSummary(contacts: ReturnType<typeof filledContacts>): string {
  const names = contacts.map((c) => c.teacherName).filter(Boolean);
  const filled = `${contacts.length}/${ROLE_ORDER.length} diisi`;
  if (names.length === 0) return filled;
  const extra = names.length > 3 ? "…" : "";
  return `${filled} · ${names.slice(0, 3).join(", ")}${extra}`;
}

export default function AdminSchoolsTable({ records }: { records: AdminSchoolRecord[] }) {
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState("");

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => schoolSearchHaystack(r).includes(q));
  }, [query, records]);

  useEffect(() => {
    if (schoolCode && !searched.some((r) => r.schoolCode === schoolCode)) {
      setSchoolCode("");
    }
  }, [searched, schoolCode]);

  const filtered = useMemo(() => {
    if (!schoolCode) return searched;
    return searched.filter((r) => r.schoolCode === schoolCode);
  }, [searched, schoolCode]);

  const showFullContacts = filtered.length === 1;

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] sm:items-end">
        <div>
          <label className="label" htmlFor="carian">Cari sekolah / nama</label>
          <input
            id="carian"
            className="input"
            placeholder="Kod, nama sekolah, zon atau nama guru"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="tapis-sekolah">Tapis sekolah</label>
          <select
            id="tapis-sekolah"
            className="input"
            value={schoolCode}
            disabled={searched.length === 0}
            onChange={(e) => setSchoolCode(e.target.value)}
          >
            <option value="">Semua sekolah ({searched.length})</option>
            {searched.map((s) => (
              <option key={s.schoolCode} value={s.schoolCode}>
                {s.schoolCode} — {s.schoolName}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-graphite sm:pb-3">{filtered.length} sekolah</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Zon</th>
              <th className="px-4 py-3 font-semibold">Perhubungan</th>
              <th className="px-4 py-3 font-semibold">Kemaskini Terakhir</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-graphite">
                  Tiada sekolah.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const contacts = filledContacts(r);
              return (
                <tr key={r.schoolCode} className="border-b hairline last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.schoolName}</p>
                    <p className="text-xs text-graphite">{r.schoolCode}</p>
                  </td>
                  <td className="px-4 py-3 text-graphite">{r.zone || "-"}</td>
                  <td className="px-4 py-3">
                    {contacts.length === 0 ? (
                      <span className="text-graphite">-</span>
                    ) : showFullContacts ? (
                      <ul className="space-y-1">
                        {contacts.map((c) => (
                          <li key={c.role}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-graphite">
                              {ROLE_INFO[c.role].short}
                            </p>
                            <p>{c.teacherName || "-"}</p>
                            <p className="text-xs text-graphite">{c.phone || "-"}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-graphite">{compactContactSummary(contacts)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-graphite">
                    {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("ms-MY") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/direktori/sekolah/${r.schoolCode}`} className="link-blue text-sm">
                      Urus
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
