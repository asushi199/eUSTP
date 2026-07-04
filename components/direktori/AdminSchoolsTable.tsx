"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AdminSchoolRecord } from "@/lib/direktori/queries";
import { ROLE_ORDER, ROLE_INFO } from "@/lib/direktori/config";

export default function AdminSchoolsTable({ records }: { records: AdminSchoolRecord[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      [r.schoolCode, r.schoolName, r.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, records]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md flex-1">
          <label className="label" htmlFor="carian">
            Cari sekolah
          </label>
          <input
            id="carian"
            className="input"
            placeholder="Kod, nama atau zon"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <p className="text-xs text-graphite">{filtered.length} sekolah</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Zon</th>
              {ROLE_ORDER.map((role) => (
                <th key={role} className="px-4 py-3 font-semibold">
                  {ROLE_INFO[role].short}
                </th>
              ))}
              <th className="px-4 py-3 font-semibold">Kemaskini Terakhir</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-graphite">
                  Tiada sekolah.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.schoolCode} className="border-b hairline last:border-0 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.schoolName}</p>
                  <p className="text-xs text-graphite">{r.schoolCode}</p>
                </td>
                <td className="px-4 py-3 text-graphite">{r.zone || "-"}</td>
                {ROLE_ORDER.map((role) => {
                  const contact = r.roles.find((c) => c.role === role);
                  const filled = contact && (contact.teacherName || contact.phone);
                  return (
                    <td key={role} className="px-4 py-3">
                      {filled ? (
                        <>
                          <p>{contact.teacherName || "-"}</p>
                          <p className="text-xs text-graphite">{contact.phone || "-"}</p>
                        </>
                      ) : (
                        <span className="text-graphite">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-graphite">
                  {r.submittedAt
                    ? new Date(r.submittedAt).toLocaleDateString("ms-MY")
                    : "-"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/direktori/sekolah/${r.schoolCode}`}
                    className="link-blue text-sm"
                  >
                    Sejarah
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
