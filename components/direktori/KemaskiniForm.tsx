"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDirektoriSubmission } from "@/lib/actions/direktori";
import PhoneInput from "@/components/PhoneInput";
import { ROLE_ORDER, ROLE_INFO, type TeacherRole } from "@/lib/direktori/config";
import type { PublicDirectoryRow, SchoolOption } from "@/lib/direktori/queries";

type RoleState = Record<TeacherRole, { teacherName: string; phone: string }>;

const emptyRoleState: RoleState = {
  GPICT: { teacherName: "", phone: "" },
  DELIMA: { teacherName: "", phone: "" },
  GPM: { teacherName: "", phone: "" },
};

function buildRoleStateForSchool(
  rows: PublicDirectoryRow[],
  schoolCode: string,
): RoleState {
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
  // Sengaja kosong pada mula — paksa guru pilih sekolah sendiri supaya
  // tiada kemas kini tersilap ke atas sekolah pertama.
  const [schoolCode, setSchoolCode] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterPhone, setSubmitterPhone] = useState("");
  const [roleState, setRoleState] = useState<RoleState>(emptyRoleState);

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, schools]);

  // Jika sekolah terpilih tidak lagi muncul dalam hasil carian, kosongkan
  // pilihan. Bila carian menyempit kepada satu sekolah sahaja, auto-pilih ia
  // (guru sudah berniat memilih — selamat, tidak seperti auto-pilih sekolah
  // pertama tanpa carian).
  useEffect(() => {
    if (schoolCode && !filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode("");
      return;
    }
    if (!schoolCode && query.trim() !== "" && filteredSchools.length === 1) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode, query]);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.code === schoolCode) ?? null,
    [schools, schoolCode],
  );

  // Ringkasan maklumat sedia ada bagi sekolah terpilih (untuk pengesahan guru).
  const currentSummary = useMemo(() => {
    if (!schoolCode) return null;
    return ROLE_ORDER.map((role) => {
      const row = currentRows.find(
        (r) => r.schoolCode === schoolCode && r.role === role,
      );
      return { role, teacherName: row?.teacherName ?? "", phone: row?.phone ?? "" };
    });
  }, [currentRows, schoolCode]);

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
      {/* Pilih sekolah */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Pilih Sekolah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <p className="mt-1 text-xs text-graphite">
              {filteredSchools.length} sekolah sepadan
            </p>
          </div>
          <div>
            <label className="label" htmlFor="sekolah">
              Sekolah
            </label>
            <select
              id="sekolah"
              className="input"
              required
              value={schoolCode}
              disabled={filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
              <option value="" disabled>
                — Pilih sekolah —
              </option>
              {filteredSchools.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedSchool && currentSummary && (
          <div className="mt-4 rounded-lg border border-primary/40 bg-primary-soft/40 p-4">
            <p className="text-sm font-semibold text-ink">
              ✓ Sekolah dipilih: {selectedSchool.code} — {selectedSchool.name}
            </p>
            <p className="mt-1 text-xs text-graphite">
              Maklumat sedia ada — sila sahkan ini sekolah anda sebelum mengubah:
            </p>
            <dl className="mt-3 space-y-1.5 text-sm">
              {currentSummary.map(({ role, teacherName, phone }) => (
                <div key={role} className="flex flex-wrap gap-x-2">
                  <dt className="font-medium text-graphite">
                    {ROLE_INFO[role].short}:
                  </dt>
                  <dd className="text-ink">
                    {teacherName ? (
                      <>
                        {teacherName}
                        {phone ? ` — ${phone}` : ""}
                      </>
                    ) : (
                      <span className="text-steel">Belum diisi</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>

      {/* Maklumat peranan */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Maklumat Guru Penyelaras</h2>
        <p className="mt-1 text-sm text-graphite">
          Isi peranan yang berubah sahaja — maklumat sedia ada dipaparkan di bawah.
        </p>
        {!schoolCode ? (
          <p className="mt-4 rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
            Sila pilih sekolah dahulu sebelum mengisi maklumat guru.
          </p>
        ) : (
        <div className="mt-4 space-y-5">
          {ROLE_ORDER.map((role) => (
            <fieldset key={role} className="rounded-lg border hairline p-4">
              <legend className="px-1 text-sm font-semibold">
                {ROLE_INFO[role].short}
                <span className="ml-2 font-normal text-graphite">
                  {ROLE_INFO[role].label}
                </span>
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor={`${role}-nama`}>
                    Nama Guru
                  </label>
                  <input
                    id={`${role}-nama`}
                    className="input"
                    value={roleState[role].teacherName}
                    onChange={(e) =>
                      setRoleState((s) => ({
                        ...s,
                        [role]: { ...s[role], teacherName: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="label" htmlFor={`${role}-tel`}>
                    No. Telefon
                  </label>
                  <PhoneInput
                    id={`${role}-tel`}
                    placeholder="cth. 0123456789"
                    value={roleState[role].phone}
                    onChange={(e) =>
                      setRoleState((s) => ({
                        ...s,
                        [role]: { ...s[role], phone: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
        )}
      </section>

      {/* Maklumat penghantar */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">3. Maklumat Penghantar (pilihan)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="penghantar-nama">
              Nama Anda
            </label>
            <input
              id="penghantar-nama"
              className="input"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="penghantar-tel">
              No. Telefon Anda
            </label>
            <PhoneInput
              id="penghantar-tel"
              value={submitterPhone}
              onChange={(e) => setSubmitterPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending || !schoolCode}>
        {pending ? "Menghantar…" : "Hantar Kemas Kini"}
      </button>
    </form>
  );
}
