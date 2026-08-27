"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DIRECTORY_ROLES,
  ROLE_INFO,
  normalizeMalaysianMobile,
  type DirectoryRole,
} from "@/lib/direktori/config";
import {
  isSchoolListQuery,
  matchSchoolLines,
  parseSchoolListQuery,
} from "@/lib/direktori/school-name-match";

type BroadcastSchool = {
  schoolCode: string;
  schoolName: string;
  zone: string;
  roles: Array<{
    role: DirectoryRole;
    teacherName: string;
    phone: string;
    phoneNormalized: string;
  }>;
};

type Recipient = {
  phone: string;
  teacherName: string;
  schoolName: string;
  schoolCode: string;
  roles: DirectoryRole[];
};

type InvalidContact = {
  teacherName: string;
  schoolName: string;
  schoolCode: string;
  role: DirectoryRole;
  phone: string;
  reason: "Nombor belum diisi" | "Format nombor tidak sah";
};

const DEFAULT_MESSAGE = "Salam sejahtera,\n\nMakluman daripada NEXa Manjung:\n\nTerima kasih.";

function whatsappUrl(phone: string, message: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message.trim())}`;
}

export default function WhatsAppBroadcastPanel({ records }: { records: BroadcastSchool[] }) {
  const zones = useMemo(
    () => [...new Set(records.map((record) => record.zone.trim()).filter(Boolean))].sort(),
    [records],
  );
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<DirectoryRole[]>(["PGB"]);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [openedPhones, setOpenedPhones] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const schoolsInZones = useMemo(() => {
    if (selectedZones.length === 0) return records;
    return records.filter((school) => selectedZones.includes(school.zone));
  }, [records, selectedZones]);

  const listLines = useMemo(() => parseSchoolListQuery(schoolQuery), [schoolQuery]);
  const listMode = isSchoolListQuery(schoolQuery);

  const lineMatches = useMemo(() => {
    if (!listMode) return [];
    return matchSchoolLines(
      listLines,
      schoolsInZones.map((school) => ({ code: school.schoolCode, name: school.schoolName })),
    );
  }, [listLines, listMode, schoolsInZones]);

  useEffect(() => {
    const allowed = new Set(listLines);
    setPicks((current) => {
      const next: Record<string, string> = {};
      for (const [query, code] of Object.entries(current)) {
        if (allowed.has(query)) next[query] = code;
      }
      const same =
        Object.keys(next).length === Object.keys(current).length &&
        Object.keys(next).every((key) => next[key] === current[key]);
      return same ? current : next;
    });
  }, [listLines]);

  useEffect(() => {
    if (schoolCode && !schoolsInZones.some((school) => school.schoolCode === schoolCode)) {
      setSchoolCode("");
    }
  }, [schoolCode, schoolsInZones]);

  const selectedSchoolCodes = useMemo(() => {
    if (listMode) {
      const codes = new Set<string>();
      for (const row of lineMatches) {
        if (row.status === "matched") codes.add(row.school.code);
        else if (row.status === "ambiguous" && picks[row.query]) codes.add(picks[row.query]);
      }
      return codes;
    }
    if (schoolCode) return new Set([schoolCode]);
    return null;
  }, [lineMatches, listMode, picks, schoolCode]);

  const searchedSchools = useMemo(() => {
    if (listMode) {
      return schoolsInZones.filter((school) => selectedSchoolCodes?.has(school.schoolCode));
    }
    const q = schoolQuery.trim().toLowerCase();
    if (!q) return schoolsInZones;
    return schoolsInZones.filter((school) => {
      const haystack = [school.schoolCode, school.schoolName, ...school.roles.map((c) => c.teacherName)]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [listMode, schoolQuery, schoolsInZones, selectedSchoolCodes]);

  const matchSummary = useMemo(() => {
    const matched = lineMatches.filter((row) => row.status === "matched").length;
    const ambiguous = lineMatches.filter((row) => row.status === "ambiguous");
    const unresolved = ambiguous.filter((row) => !picks[row.query]);
    const unmatched = lineMatches.filter((row) => row.status === "unmatched");
    return { matched, ambiguous, unresolved, unmatched };
  }, [lineMatches, picks]);

  const { recipients, invalidContacts, duplicateCount } = useMemo(() => {
    const unique = new Map<string, Recipient>();
    const invalid: InvalidContact[] = [];
    let duplicates = 0;
    const q = listMode ? "" : schoolQuery.trim().toLowerCase();

    for (const school of searchedSchools) {
      if (selectedSchoolCodes && !selectedSchoolCodes.has(school.schoolCode)) continue;
      const schoolMatches =
        !q || `${school.schoolCode} ${school.schoolName}`.toLowerCase().includes(q);

      for (const contact of school.roles) {
        if (!selectedRoles.includes(contact.role)) continue;
        if (q && !schoolMatches && !contact.teacherName.toLowerCase().includes(q)) continue;
        const phone = normalizeMalaysianMobile(contact.phoneNormalized || contact.phone);
        if (!phone) {
          invalid.push({
            teacherName: contact.teacherName || "Tanpa nama",
            schoolName: school.schoolName,
            schoolCode: school.schoolCode,
            role: contact.role,
            phone: contact.phone.trim(),
            reason: contact.phone.trim() ? "Format nombor tidak sah" : "Nombor belum diisi",
          });
          continue;
        }

        const existing = unique.get(phone);
        if (existing) {
          duplicates += 1;
          if (!existing.roles.includes(contact.role)) existing.roles.push(contact.role);
          continue;
        }

        unique.set(phone, {
          phone,
          teacherName: contact.teacherName || "Tanpa nama",
          schoolName: school.schoolName,
          schoolCode: school.schoolCode,
          roles: [contact.role],
        });
      }
    }

    return {
      recipients: [...unique.values()].sort((a, b) =>
        `${a.schoolName} ${a.teacherName}`.localeCompare(`${b.schoolName} ${b.teacherName}`, "ms"),
      ),
      invalidContacts: invalid.sort((a, b) =>
        `${a.schoolName} ${a.teacherName}`.localeCompare(`${b.schoolName} ${b.teacherName}`, "ms"),
      ),
      duplicateCount: duplicates,
    };
  }, [listMode, schoolQuery, searchedSchools, selectedRoles, selectedSchoolCodes]);

  function toggleZone(zone: string) {
    setSelectedZones((current) =>
      current.includes(zone) ? current.filter((item) => item !== zone) : [...current, zone],
    );
  }

  function toggleRole(role: DirectoryRole) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  async function copyMessage() {
    if (!message.trim() || !navigator.clipboard) return;
    await navigator.clipboard.writeText(message.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function openConversation(recipient: Recipient) {
    window.open(whatsappUrl(recipient.phone, message), "_blank", "noopener,noreferrer");
    setOpenedPhones((current) =>
      current.includes(recipient.phone) ? current : [...current, recipient.phone],
    );
  }

  const canOpen = recipients.length > 0 && Boolean(message.trim());

  return (
    <section className="card overflow-hidden">
      <div className="bg-blue-50/60 px-5 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Penghantaran mengikut sasaran</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink">Siaran WhatsApp</h2>
            <p className="mt-1 text-sm text-graphite">
              Tampal senarai sekolah atau pilih PKG dan jawatan, kemudian buka perbualan seorang demi seorang.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-sm font-medium tabular-nums text-brand">{recipients.length} nombor unik</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-brand/20 bg-white px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              onClick={() => setIsExpanded((current) => !current)}
              aria-expanded={isExpanded}
              aria-controls="siaran-whatsapp-kandungan"
            >
              {isExpanded ? "Sembunyikan" : "Buka siaran"}
              <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && <div id="siaran-whatsapp-kandungan" className="grid gap-6 border-t hairline p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <div className="space-y-6">
          <fieldset>
            <legend className="label">PKG / zon sekolah</legend>
            <p className="mb-3 text-xs text-graphite">Kosongkan pilihan untuk semua PKG.</p>
            <div className="flex flex-wrap gap-2">
              {zones.map((zone) => {
                const checked = selectedZones.includes(zone);
                return (
                  <label key={zone} className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors ${checked ? "border-brand bg-blue-50 text-brand" : "border-slate-200 text-graphite hover:border-brand/50"}`}>
                    <input className="sr-only" type="checkbox" checked={checked} onChange={() => toggleZone(zone)} />
                    {zone}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="carian-sekolah-siaran">Cari atau tampal senarai sekolah</label>
            <textarea
              id="carian-sekolah-siaran"
              className="input min-h-28 resize-y"
              placeholder={"Kod, nama, atau tampal senarai — satu sekolah satu baris.\nContoh: SK BERUAS\nSJKC HWA LIAN 1"}
              value={schoolQuery}
              onChange={(event) => setSchoolQuery(event.target.value)}
            />
            {listMode ? (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-graphite">
                  {matchSummary.matched + (matchSummary.ambiguous.length - matchSummary.unresolved.length)}/{listLines.length} sekolah sepadan
                  {matchSummary.unresolved.length > 0 ? ` · ${matchSummary.unresolved.length} perlu pilih` : ""}
                  {matchSummary.unmatched.length > 0 ? ` · ${matchSummary.unmatched.length} tidak dijumpai` : ""}
                </p>
                {matchSummary.unresolved.map((row) => (
                  row.status === "ambiguous" ? (
                    <div key={row.query} className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                      <p className="text-sm font-medium text-ink">Pilih sekolah untuk “{row.query}”</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {row.schools.map((school) => (
                          <button
                            key={school.code}
                            type="button"
                            className="btn-outline-ink btn-sm"
                            onClick={() => setPicks((current) => ({ ...current, [row.query]: school.code }))}
                          >
                            {school.code} — {school.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null
                ))}
                {matchSummary.unmatched.length > 0 && (
                  <p className="text-xs text-amber-900">
                    Tidak dijumpai: {matchSummary.unmatched.map((row) => row.query).join(", ")}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <p className="text-xs text-graphite">{searchedSchools.length} sekolah sepadan. Tampal lebih daripada satu baris untuk tapis senarai.</p>
                </div>
                <div>
                  <label className="label" htmlFor="tapis-sekolah-siaran">Tapis sekolah</label>
                  <select
                    id="tapis-sekolah-siaran"
                    className="input"
                    value={schoolCode}
                    disabled={searchedSchools.length === 0}
                    onChange={(event) => setSchoolCode(event.target.value)}
                  >
                    <option value="">Semua sekolah ({searchedSchools.length})</option>
                    {searchedSchools.map((school) => (
                      <option key={school.schoolCode} value={school.schoolCode}>
                        {school.schoolCode} — {school.schoolName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <fieldset>
            <legend className="label">Jawatan penerima</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DIRECTORY_ROLES.map((role) => {
                const checked = selectedRoles.includes(role);
                return (
                  <label key={role} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${checked ? "border-brand bg-blue-50/70" : "border-slate-200 hover:border-brand/50"}`}>
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#024ad8]" checked={checked} onChange={() => toggleRole(role)} />
                    <span>
                      <span className="font-medium text-ink">{ROLE_INFO[role].short}</span>
                      <span className="mt-0.5 block text-xs text-graphite">{ROLE_INFO[role].label}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="label" htmlFor="mesej-siaran">Mesej WhatsApp</label>
            <textarea id="mesej-siaran" className="input min-h-36 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-graphite">Mesej yang sama akan disediakan untuk setiap penerima.</p>
              <button type="button" className="btn-outline-ink btn-sm shrink-0" onClick={copyMessage} disabled={!message.trim()}>
                {copied ? "Disalin" : "Salin mesej"}
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <h3 className="font-semibold text-ink">Senarai penghantaran</h3>
          <p className="mt-1 text-sm text-graphite">
            {selectedRoles.length === 0 ? "Pilih sekurang-kurangnya satu jawatan." : "Nombor berulang digabungkan supaya tidak dihantar dua kali."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-2.5 py-1 text-ink shadow-sm">{recipients.length} sedia dihantar</span>
            {invalidContacts.length > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{invalidContacts.length} perlu disemak</span>}
            {duplicateCount > 0 && <span className="rounded-full bg-white px-2.5 py-1 text-graphite">{duplicateCount} digabungkan</span>}
          </div>

          <div className="mt-4 max-h-[29rem] space-y-2 overflow-y-auto pr-1">
            {recipients.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-sm text-graphite">Tiada nombor WhatsApp yang sepadan dengan pilihan ini.</p>
            ) : recipients.map((recipient) => {
              const opened = openedPhones.includes(recipient.phone);
              return (
                <div key={recipient.phone} className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{recipient.teacherName}</p>
                      <p className="mt-0.5 truncate text-xs text-graphite">{recipient.schoolName} · {recipient.schoolCode}</p>
                      <p className="mt-1 text-xs text-brand">{recipient.roles.map((role) => ROLE_INFO[role].short).join(" · ")}</p>
                    </div>
                    <button type="button" className="btn-primary btn-sm shrink-0" onClick={() => openConversation(recipient)} disabled={!canOpen}>
                      {opened ? "Buka semula" : "Buka WhatsApp"}
                    </button>
                  </div>
                  {opened && <p className="mt-2 text-xs text-emerald-700">Perbualan telah dibuka. Hantar mesej dalam WhatsApp selepas semakan.</p>}
                </div>
              );
            })}
          </div>

          {invalidContacts.length > 0 && (
            <div className="mt-4 border-t hairline pt-4">
              <h4 className="text-sm font-semibold text-ink">Maklumat perlu disemak</h4>
              <p className="mt-1 text-xs text-graphite">Sekolah ini tidak dimasukkan dalam senarai penghantaran.</p>
              <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                {invalidContacts.map((contact) => (
                  <div key={`${contact.schoolCode}-${contact.role}`} className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs">
                    <p className="font-medium text-ink">{contact.schoolName}</p>
                    <p className="mt-0.5 text-graphite">{contact.schoolCode} · {ROLE_INFO[contact.role].short} · {contact.teacherName}</p>
                    <p className="mt-1 text-amber-900">{contact.reason}{contact.phone ? `: ${contact.phone}` : ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 border-t hairline pt-3 text-xs leading-relaxed text-graphite">Untuk melindungi akaun WhatsApp, sistem tidak menghantar mesej secara automatik. Semak dan tekan hantar dalam setiap perbualan yang dibuka.</p>
        </aside>
      </div>}
    </section>
  );
}
