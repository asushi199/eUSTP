"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminSimpanMaklumBalasMjkd,
  getPrefillPgbMjkd,
  submitMaklumBalasMjkd,
} from "@/lib/actions/mjkd";
import {
  CATATAN_MIN,
  sahkanMaklumBalas,
} from "@/lib/mjkd/validation";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  labelMesyuarat,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
import { perkaraUntukSekolah } from "@/lib/mjkd/sasaran";
import type { SchoolOption } from "@/lib/direktori/queries";

export type PerkaraBorang = {
  id: string;
  para: string;
  mukaSurat: string;
  perkara: string;
  tindakan: string;
  panduan: string;
  sasaran: string;
  sekolahKhusus: string[];
};

export type JawapanAwal = {
  namaPengisi: string;
  jawatanPengisi: string;
  items: { perkaraId: string; status: string; catatan: string; pautanBukti: string }[];
};

type Props = {
  mesyuarat: { id: string; bil: number; tahun: number };
  schools: SchoolOption[];
  perkara: PerkaraBorang[];
  initialSchoolCode?: string;
  existing?: JawapanAwal | null;
  /** Nombor tiket yang telah disahkan di halaman semakan. */
  initialReceiptToken?: string;
  /** Mod admin: sekolah dikunci, tiada nombor tiket, simpan melalui tindakan admin. */
  adminMode?: boolean;
};

type Jawapan = { status: string; catatan: string; pautanBukti: string };

function matchesSchoolQuery(school: SchoolOption, rawQuery: string) {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [school.code, school.name, school.zone].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function jawapanAwal(existing?: JawapanAwal | null): Record<string, Jawapan> {
  const out: Record<string, Jawapan> = {};
  for (const it of existing?.items ?? []) {
    out[it.perkaraId] = {
      status: it.status,
      catatan: it.catatan,
      pautanBukti: it.pautanBukti,
    };
  }
  return out;
}

export default function MaklumBalasMjkdForm({
  mesyuarat,
  schools,
  perkara,
  initialSchoolCode,
  existing,
  initialReceiptToken,
  adminMode = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(initialSchoolCode ?? "");
  const [namaPengisi, setNamaPengisi] = useState(existing?.namaPengisi ?? "");
  const [jawatanPengisi, setJawatanPengisi] = useState(existing?.jawatanPengisi ?? "");
  const [receiptToken, setReceiptToken] = useState(initialReceiptToken ?? "");
  const [jawapan, setJawapan] = useState<Record<string, Jawapan>>(() => jawapanAwal(existing));
  // Elak menimpa nama/jawatan yang sudah disunting pengguna (atau datang daripada rekod sedia ada).
  const disentuh = useRef(Boolean(existing));

  const dikunci = adminMode || Boolean(existing && initialReceiptToken);

  const filteredSchools = useMemo(
    () => schools.filter((school) => matchesSchoolQuery(school, query)),
    [query, schools],
  );

  useEffect(() => {
    if (query.trim() === "") return;
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode, query]);

  const selected = schools.find((s) => s.code === schoolCode);

  const terpakai = useMemo(
    () => (selected ? perkaraUntukSekolah(perkara, selected) : []),
    [perkara, selected],
  );

  // Isi awal nama PGB (nama sahaja) + jawatan daripada direktori apabila sekolah dipilih.
  useEffect(() => {
    if (!schoolCode || (dikunci && !adminMode) || disentuh.current) return;
    let batal = false;
    getPrefillPgbMjkd(schoolCode)
      .then((p) => {
        if (batal || disentuh.current) return;
        setNamaPengisi(p.nama);
        setJawatanPengisi(p.jawatan);
      })
      .catch(() => {
        /* tiada prefill — pengguna isi sendiri */
      });
    return () => {
      batal = true;
    };
  }, [schoolCode, dikunci, adminMode]);

  function ubahJawapan(perkaraId: string, patch: Partial<Jawapan>) {
    setJawapan((prev) => ({
      ...prev,
      [perkaraId]: {
        status: prev[perkaraId]?.status ?? "",
        catatan: prev[perkaraId]?.catatan ?? "",
        pautanBukti: prev[perkaraId]?.pautanBukti ?? "",
        ...patch,
      },
    }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (!schoolCode) {
      setError("Sila pilih sekolah.");
      return;
    }
    const items = terpakai.map((p) => ({
      perkaraId: p.id,
      status: jawapan[p.id]?.status ?? "",
      catatan: jawapan[p.id]?.catatan ?? "",
      pautanBukti: jawapan[p.id]?.pautanBukti ?? "",
    }));
    // Semakan serta-merta di pelayar (pelayan mengesahkan semula).
    const sah = sahkanMaklumBalas(
      { namaPengisi, jawatanPengisi, items },
      terpakai.map((p) => ({ id: p.id, para: p.para })),
    );
    if (!sah.ok) {
      setError(sah.error);
      return;
    }

    startTransition(async () => {
      const payload = {
        mesyuaratId: mesyuarat.id,
        schoolCode,
        namaPengisi,
        jawatanPengisi,
        receiptToken: receiptToken || undefined,
        items,
      };
      const res = adminMode
        ? await adminSimpanMaklumBalasMjkd(payload)
        : await submitMaklumBalasMjkd(payload);
      if (!res.ok) {
        setError(res.error ?? "Gagal menghantar.");
        return;
      }
      if (adminMode) {
        setOkMsg("Disimpan.");
        router.refresh();
        return;
      }
      if (!res.receiptToken || !res.schoolCode) {
        setError("Gagal menghantar.");
        return;
      }
      const q = new URLSearchParams({ kod: res.schoolCode, resit: res.receiptToken });
      router.push(`/laporan-mjkd/berjaya?${q.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Sekolah</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {!adminMode ? (
            <div>
              <label className="label" htmlFor="mjkd-carian-sekolah">
                Cari sekolah
              </label>
              <input
                id="mjkd-carian-sekolah"
                className="input"
                placeholder="Kod atau nama sekolah"
                autoComplete="off"
                value={query}
                disabled={dikunci}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="mt-1 text-xs text-graphite">
                {filteredSchools.length} sekolah sepadan
              </p>
            </div>
          ) : null}
          <div className={adminMode ? "sm:col-span-2" : undefined}>
            <label className="label" htmlFor="mjkd-sekolah">
              Sekolah *
            </label>
            <select
              id="mjkd-sekolah"
              className="input"
              required
              value={schoolCode}
              disabled={dikunci || filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
              <option value="" disabled>
                Pilih sekolah…
              </option>
              {filteredSchools.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-xs text-graphite">
                PPD Manjung · {selected.zone || "—"}
              </p>
            )}
          </div>
          {query.trim() && !dikunci ? (
            <div className="sm:col-span-2">
              {filteredSchools.length === 0 ? (
                <p className="rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
                  Tiada sekolah sepadan. Cuba kod atau sebahagian nama.
                </p>
              ) : (
                <ul className="max-h-56 overflow-auto rounded-lg border hairline">
                  {filteredSchools.map((s) => {
                    const active = s.code === schoolCode;
                    return (
                      <li key={s.code} className="border-b hairline last:border-0">
                        <button
                          type="button"
                          className={`flex w-full items-baseline gap-3 px-4 py-2.5 text-left text-sm ${
                            active
                              ? "bg-cloud font-medium text-ink"
                              : "text-ink hover:bg-cloud/55"
                          }`}
                          onClick={() => setSchoolCode(s.code)}
                        >
                          <span className="shrink-0 font-mono text-xs text-graphite">
                            {s.code}
                          </span>
                          <span>{s.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {!adminMode && existing ? (
          <div className="mt-4">
            <label className="label" htmlFor="mjkd-resit">
              Nombor tiket (untuk kemaskini) *
            </label>
            <input
              id="mjkd-resit"
              className="input font-mono uppercase"
              required
              value={receiptToken}
              disabled={dikunci}
              onChange={(e) => setReceiptToken(e.target.value.toUpperCase())}
            />
            <p className="mt-1 text-xs text-graphite">Nombor tiket telah disahkan.</p>
          </div>
        ) : null}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Pengisi maklum balas</h2>
        <p className="mt-1 text-sm text-graphite">
          Nama Pengetua / Guru Besar diisi daripada direktori sekolah — sila betulkan jika
          pengisi ialah orang lain.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mjkd-nama">
              Nama pengisi *
            </label>
            <input
              id="mjkd-nama"
              className="input"
              required
              maxLength={200}
              value={namaPengisi}
              onChange={(e) => {
                disentuh.current = true;
                setNamaPengisi(e.target.value);
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="mjkd-jawatan">
              Jawatan pengisi *
            </label>
            <input
              id="mjkd-jawatan"
              className="input"
              required
              maxLength={120}
              value={jawatanPengisi}
              onChange={(e) => {
                disentuh.current = true;
                setJawatanPengisi(e.target.value);
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            3. Perkara tindakan ({labelMesyuarat(mesyuarat)})
          </h2>
          <p className="mt-1 text-sm text-graphite">
            {selected
              ? `${terpakai.length} perkara tindakan terpakai kepada sekolah ini.`
              : "Pilih sekolah untuk melihat perkara tindakan yang terpakai."}
          </p>
        </div>

        {terpakai.map((p) => {
          const j = jawapan[p.id];
          const tidakBerkaitan = j?.status === "TIDAK_BERKAITAN";
          return (
            <article key={p.id} className="card space-y-4 p-6">
              <header>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                  Para {p.para}
                  {p.mukaSurat ? ` · m/s ${p.mukaSurat}` : ""}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink">{p.perkara}</p>
                <p className="mt-2 text-sm text-graphite">
                  <span className="font-medium text-charcoal">Tindakan:</span> {p.tindakan}
                </p>
              </header>

              {p.panduan ? (
                <p className="rounded-lg border hairline bg-cloud/60 px-4 py-3 text-sm text-charcoal">
                  {p.panduan}
                </p>
              ) : null}

              <fieldset>
                <legend className="label">Status *</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STATUS_MJKD.map((s: StatusMjkd) => (
                    <label key={s} className="block cursor-pointer">
                      <input
                        type="radio"
                        name={`status-${p.id}`}
                        value={s}
                        className="peer sr-only"
                        checked={j?.status === s}
                        onChange={() => ubahJawapan(p.id, { status: s })}
                      />
                      <span className="flex min-h-11 items-center rounded-md border border-steel bg-white px-4 py-2 text-sm text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2">
                        {STATUS_MJKD_LABEL[s]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label" htmlFor={`catatan-${p.id}`}>
                  Catatan{tidakBerkaitan ? " (pilihan)" : ` * (sekurang-kurangnya ${CATATAN_MIN} aksara)`}
                </label>
                <textarea
                  id={`catatan-${p.id}`}
                  className="textarea"
                  rows={3}
                  maxLength={2000}
                  value={j?.catatan ?? ""}
                  onChange={(e) => ubahJawapan(p.id, { catatan: e.target.value })}
                />
              </div>

              <div>
                <label className="label" htmlFor={`bukti-${p.id}`}>
                  Pautan bukti (pilihan)
                </label>
                <input
                  id={`bukti-${p.id}`}
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  maxLength={500}
                  value={j?.pautanBukti ?? ""}
                  onChange={(e) => ubahJawapan(p.id, { pautanBukti: e.target.value })}
                />
              </div>
            </article>
          );
        })}
      </section>

      {error && (
        <p className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-sm text-bloom-deep">
          {error}
        </p>
      )}
      {okMsg && <p className="text-sm text-charcoal">{okMsg}</p>}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={pending || !selected || terpakai.length === 0}
      >
        {pending ? "Menghantar…" : existing ? "Kemaskini maklum balas" : "Hantar maklum balas"}
      </button>
    </form>
  );
}
