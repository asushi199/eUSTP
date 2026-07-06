"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  APPLICANT_TYPES,
  SERVICE_TYPES,
} from "@/lib/khidmat-bantu/config";
import {
  createKhidmatBantuAction,
  type KhidmatBantuFormState,
} from "@/lib/actions/khidmat-bantu";
import SuratPermohonanInput from "@/components/khidmat-bantu/SuratPermohonanInput";
import type { SchoolOption } from "@/lib/direktori/queries";

const initialState: KhidmatBantuFormState = { ok: false, message: "" };

export default function KhidmatBantuForm({ schools }: { schools: SchoolOption[] }) {
  const [state, formAction, pending] = useActionState(createKhidmatBantuAction, initialState);

  const [applicantType, setApplicantType] = useState<(typeof APPLICANT_TYPES)[number]["id"]>(
    "sekolah",
  );
  const [serviceType, setServiceType] = useState<(typeof SERVICE_TYPES)[number]["id"]>("ceramah");
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(schools[0]?.code ?? "");
  const [orgName, setOrgName] = useState(() => schools[0]?.name ?? "");
  const [activityDate, setActivityDate] = useState("");
  const [suratReady, setSuratReady] = useState(false);

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, schools]);

  useEffect(() => {
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode]);

  useEffect(() => {
    if (applicantType === "sekolah") {
      const school = schools.find((s) => s.code === schoolCode);
      if (school) setOrgName(school.name);
      return;
    }
    setOrgName("");
  }, [applicantType, schoolCode, schools]);

  return (
    <form action={formAction} className="card space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Permohonan baharu
          </p>
          <h2 className="mt-1 text-lg font-semibold">Khidmat Bantu USTP</h2>
        </div>
        <span className="status-badge shrink-0">
          <span className="status-dot bg-amber-400" />
          Perlu kelulusan
        </span>
      </div>
      <p className="text-xs text-graphite">
        Selepas permohonan dihantar, klik butang WhatsApp untuk maklumkan admin USTP.
      </p>

      {state.message && state.ok ? (
        <div className="space-y-3">
          <p className="rounded-md border border-primary/20 bg-primary-soft/30 px-3 py-2 text-sm font-medium text-primary-deep">
            ✓ {state.message}
          </p>
          {state.whatsappUrl && (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex w-full justify-center sm:w-auto"
            >
              Hantar WhatsApp kepada Admin
            </a>
          )}
        </div>
      ) : (
        <>
          {state.message && !state.ok && (
            <p className="rounded-md border border-bloom/30 bg-bloom-soft/20 px-3 py-2 text-sm text-bloom-deep">
              {state.message}
            </p>
          )}

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-ink">Maklumat Pemohon</legend>

            <div>
              <label className="label" htmlFor="applicantType">
                Jenis pemohon
              </label>
              <select
                id="applicantType"
                name="applicantType"
                className="input"
                value={applicantType}
                onChange={(e) =>
                  setApplicantType(e.target.value as (typeof APPLICANT_TYPES)[number]["id"])
                }
              >
                {APPLICANT_TYPES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {applicantType === "sekolah" ? (
              <>
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
                    name="schoolCode"
                    className="input"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value)}
                  >
                    {filteredSchools.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input type="hidden" name="orgName" value={orgName} />
              </>
            ) : (
              <div>
                <label className="label" htmlFor="orgName">
                  {applicantType === "pegawai_ppd" ? "Nama jabatan / unit" : "Nama organisasi"}
                </label>
                <input
                  id="orgName"
                  name="orgName"
                  className="input"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={
                    applicantType === "pegawai_ppd"
                      ? "cth. PPD Manjung / Bahagian Kurikulum"
                      : "Nama unit atau organisasi"
                  }
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="applicantName">
                  Nama pemohon
                </label>
                <input
                  id="applicantName"
                  name="applicantName"
                  className="input"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="label" htmlFor="contact">
                  No. telefon
                </label>
                <input
                  id="contact"
                  name="contact"
                  className="input"
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="cth. 0123456789"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="email">
                Emel (opsyenal)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="input"
                autoComplete="email"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4 border-t border-fog pt-6">
            <legend className="text-sm font-semibold text-ink">Perkhidmatan Dimohon</legend>

            <div>
              <label className="label" htmlFor="serviceType">
                Jenis perkhidmatan
              </label>
              <select
                id="serviceType"
                name="serviceType"
                className="input"
                value={serviceType}
                onChange={(e) =>
                  setServiceType(e.target.value as (typeof SERVICE_TYPES)[number]["id"])
                }
              >
                {SERVICE_TYPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="tajukProgram">
                Tajuk program
              </label>
              <input
                id="tajukProgram"
                name="tajukProgram"
                className="input"
                required
                maxLength={300}
                placeholder="cth. Bengkel STEM Tahun 6"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="activityDate">
                  Tarikh cadangan
                </label>
                <input
                  id="activityDate"
                  name="activityDate"
                  type="date"
                  className="input"
                  required
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="activityTime">
                  Masa cadangan
                </label>
                <input
                  id="activityTime"
                  name="activityTime"
                  className="input"
                  required
                  placeholder="cth. 9:00 pagi – 12:00 tengah hari"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="lokasi">
                Lokasi / venue
              </label>
              <input id="lokasi" name="lokasi" className="input" required />
            </div>

            <div>
              <label className="label" htmlFor="surat-upload">
                Muat naik surat permohonan
              </label>
              <SuratPermohonanInput
                disabled={pending}
                orgName={orgName}
                activityDate={activityDate}
                serviceType={serviceType}
                onReadyChange={setSuratReady}
              />
            </div>
          </fieldset>

          <button
            type="submit"
            className="btn-primary w-full sm:w-auto"
            disabled={pending || !suratReady}
          >
            {pending ? "Menghantar…" : "Hantar Permohonan"}
          </button>
        </>
      )}
    </form>
  );
}
