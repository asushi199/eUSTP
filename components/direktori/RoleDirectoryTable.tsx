"use client";

import { useMemo, useState } from "react";
import { normalizeMalaysianMobile } from "@/lib/direktori/config";
import type { PublicDirectoryRow } from "@/lib/direktori/queries";

function ContactActions({ phone, phoneNormalized }: Pick<PublicDirectoryRow, "phone" | "phoneNormalized">) {
  const mobile = phoneNormalized || normalizeMalaysianMobile(phone);
  if (!mobile) return <span className="text-sm text-graphite">Tiada nombor mudah alih</span>;

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`tel:+${mobile}`} className="btn-outline btn-sm">Telefon</a>
      <a
        href={`https://wa.me/${mobile}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary btn-sm"
      >
        WhatsApp
      </a>
    </div>
  );
}

export default function RoleDirectoryTable({ rows }: { rows: PublicDirectoryRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.schoolCode, r.schoolName, r.zone, r.teacherName].join(" ").toLowerCase().includes(q));
  }, [query, rows]);

  return (
    <div>
      <div className="mb-4 max-w-md">
        <label className="label" htmlFor="carian">Cari sekolah / nama</label>
        <input
          id="carian"
          className="input"
          placeholder="Kod sekolah, nama sekolah atau nama"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="mt-1 text-xs text-graphite">{filtered.length} rekod</p>
      </div>

      <ul className="space-y-3 md:hidden">
        {filtered.length === 0 && <li className="card p-6 text-center text-sm text-graphite">Tiada rekod dijumpai.</li>}
        {filtered.map((r) => (
          <li key={`${r.schoolCode}-${r.role}`} className="card p-4">
            <p className="font-medium leading-snug">{r.schoolName}</p>
            <p className="mt-1 text-xs text-graphite">
              {r.schoolCode}{r.zone ? ` · ${r.zone}` : ""}
              {r.website ? <>{" · "}<a href={r.website} target="_blank" rel="noopener noreferrer" className="link-blue">Laman web</a></> : null}
            </p>
            <div className="mt-3 border-t border-fog pt-3">
              <p className="mb-3 text-sm leading-snug">{r.teacherName || <span className="text-graphite">Tiada nama direkodkan</span>}</p>
              <ContactActions phone={r.phone} phoneNormalized={r.phoneNormalized} />
            </div>
          </li>
        ))}
      </ul>

      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Zon</th>
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Hubungi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-graphite">Tiada rekod dijumpai.</td></tr>}
            {filtered.map((r) => (
              <tr key={`${r.schoolCode}-${r.role}`} className="border-b hairline last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.schoolName}</p>
                  <p className="text-xs text-graphite">
                    {r.schoolCode}
                    {r.website ? <>{" · "}<a href={r.website} target="_blank" rel="noopener noreferrer" className="link-blue">Laman web</a></> : null}
                  </p>
                </td>
                <td className="px-4 py-3 text-graphite">{r.zone || "-"}</td>
                <td className="px-4 py-3">{r.teacherName || "-"}</td>
                <td className="px-4 py-3"><ContactActions phone={r.phone} phoneNormalized={r.phoneNormalized} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
