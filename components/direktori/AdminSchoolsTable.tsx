"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ROLE_ORDER } from "@/lib/direktori/config";
import type { AdminSchoolRecord } from "@/lib/direktori/queries";

export default function AdminSchoolsTable({ records }: { records: AdminSchoolRecord[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => [r.schoolCode, r.schoolName, r.zone].join(" ").toLowerCase().includes(q));
  }, [query, records]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md flex-1">
          <label className="label" htmlFor="carian">Cari sekolah</label>
          <input id="carian" className="input" placeholder="Kod, nama atau zon" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <p className="text-xs text-graphite">{filtered.length} sekolah</p>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Zon</th>
              <th className="px-4 py-3 font-semibold">Maklumat Diisi</th>
              <th className="px-4 py-3 font-semibold">Kemaskini Terakhir</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-graphite">Tiada sekolah.</td></tr>}
            {filtered.map((r) => {
              const filled = r.roles.filter((c) => c.teacherName || c.phoneNormalized || c.phone).length;
              return (
                <tr key={r.schoolCode} className="border-b hairline last:border-0 align-top">
                  <td className="px-4 py-3"><p className="font-medium">{r.schoolName}</p><p className="text-xs text-graphite">{r.schoolCode}</p></td>
                  <td className="px-4 py-3 text-graphite">{r.zone || "-"}</td>
                  <td className="px-4 py-3 tabular-nums">{filled}/{ROLE_ORDER.length}</td>
                  <td className="px-4 py-3 text-graphite">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("ms-MY") : "-"}</td>
                  <td className="px-4 py-3"><Link href={`/admin/direktori/sekolah/${r.schoolCode}`} className="link-blue text-sm">Urus</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
