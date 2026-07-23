"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";
import { createDirektoriSubmission } from "@/lib/actions/direktori";
import { ROLE_GROUPS, ROLE_INFO, type DirectoryRole } from "@/lib/direktori/config";
import type { PublicDirectoryRow, SchoolOption } from "@/lib/direktori/queries";

type RoleState = Record<DirectoryRole, { teacherName: string; phone: string }>;

const emptyRoleState: RoleState = {
  PGB: { teacherName: "", phone: "" },
  PK_PENTADBIRAN: { teacherName: "", phone: "" },
  PK_HEM: { teacherName: "", phone: "" },
  PK_KOKURIKULUM: { teacherName: "", phone: "" },
  PK_PPKI: { teacherName: "", phone: "" },
  GPICT: { teacherName: "", phone: "" },
  DELIMA: { teacherName: "", phone: "" },
  GPM: { teacherName: "", phone: "" },
};

function buildRoleStateForSchool(rows: PublicDirectoryRow[], schoolCode: string): RoleState {
  const next: RoleState = structuredClone(emptyRoleState);
  for (const row of rows) {
    if (row.schoolCode === schoolCode) {
      next[row.role] = { teacherName: row.teacherName, phone: row.phone };
    }
  }
  return next;
}

export default function KemaskiniForm({
  schools,
  currentRows,
}: {
  schools: SchoolOption[];
  currentRows: PublicDirectoryRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [roleState, setRoleState] = useState<RoleState>(emptyRoleState);

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q));
  }, [query, schools]);

  useEffect(() => {
    if (query.trim() === "") return;
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) setSchoolCode(filteredSchools[0].code);
  }, [filteredSchools, schoolCode, query]);

  useEffect(() => {
    setRoleState(buildRoleStateForSchool(currentRows, schoolCode));
  }, [currentRows, schoolCode]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createDirektoriSubmission({
        schoolCode,
        submitterName,
        submitterPhone,
        roles: roleState,
      });
      if (!res.ok) {
        setError(res.error ?? "Gagal menghantar kemas kini.");
        return;
      }
      router.push("/direktori/kemaskini/berjaya");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Pilih Sekolah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="carian-sekolah">Cari sekolah</label>
            <input
              id="carian-sekolah"
              className="input"
              placeholder="Kod atau nama sekolah"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <p className="mt-1 text-xs text-graphite">{filteredSchools.length} sekolah sepadan</p>
          </div>
          <div>
            <label className="label" htmlFor="sekolah">Sekolah</label>
            <select
              id="sekolah"
              className="input"
              required
              value={schoolCode}
              disabled={filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
              <option value="" disabled>Pilih sekolah</option>
              {filteredSchools.map((s) => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Maklumat Perhubungan Sekolah</h2>
        <p className="mt-1 text-sm text-graphite">
          Semak dan kemas kini maklumat bagi setiap jawatan. Nombor bukan telefon mudah alih tidak disimpan.
        </p>
        {!schoolCode ? (
          <p className="mt-4 rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
            Sila pilih sekolah dahulu sebelum mengisi maklumat perhubungan.
          </p>
        ) : (
          <div className="mt-5 space-y-7">
            {ROLE_GROUPS.map((group) => (
              <section key={group.id} aria-labelledby={`kemaskini-${group.id}`}>
                <div className="border-b hairline pb-2">
                  <h3 id={`kemaskini-${group.id}`} className="font-semibold">{group.title}</h3>
                  <p className="mt-0.5 text-sm text-graphite">{group.description}</p>
                </div>
                <div className="mt-3 space-y-3">
                  {group.roles.map((role) => (
                    <fieldset key={role} className="rounded-lg border hairline p-4">
                      <legend className="px-1 text-sm font-semibold">
                        {ROLE_INFO[role].short}
                        <span className="ml-2 font-normal text-graphite">{ROLE_INFO[role].label}</span>
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="label" htmlFor={`${role}-nama`}>Nama</label>
                          <input
                            id={`${role}-nama`}
                            className="input"
                            value={roleState[role].teacherName}
                            onChange={(e) => setRoleState((s) => ({
                              ...s,
                              [role]: { ...s[role], teacherName: e.target.value },
                            }))}
                          />
                        </div>
                        <div>
                          <label className="label" htmlFor={`${role}-tel`}>No. Telefon Mudah Alih</label>
                          <PhoneInput
                            id={`${role}-tel`}
                            placeholder="cth. 0123456789"
                            value={roleState[role].phone}
                            onChange={(e) => setRoleState((s) => ({
                              ...s,
                              [role]: { ...s[role], phone: e.target.value },
                            }))}
                          />
                        </div>
                      </div>
                    </fieldset>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">3. Maklumat Penghantar (pilihan)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="penghantar-nama">Nama Anda</label>
            <input id="penghantar-nama" className="input" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="penghantar-tel">No. Telefon Anda</label>
            <PhoneInput id="penghantar-tel" value={submitterPhone} onChange={(e) => setSubmitterPhone(e.target.value)} />
          </div>
        </div>
      </section>

      {error && <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">{error}</div>}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending || !schoolCode}>
        {pending ? "Menghantar…" : "Hantar Kemas Kini"}
      </button>
    </form>
  );
}
