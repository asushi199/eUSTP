"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  cariPegawaiMjkd,
  getKehadiranSekolahMjkd,
  sahkanKehadiranMjkd,
  type KehadiranPayload,
  type KehadiranSekolahInfo,
  type RekodKehadiranAwam,
} from "@/lib/actions/mjkd-kehadiran";
import { labelHariPendek } from "@/lib/mjkd/hari";
import { CARIAN_PEGAWAI_MIN, ORGANISASI_PPD } from "@/lib/mjkd/kehadiran";
import { MESEJ_RALAT_SAMBUNGAN } from "@/lib/mjkd/ralat-db";
import type { SchoolOption } from "@/lib/direktori/queries";

type Props = {
  mesyuarat: { id: string; bil: number; tahun: number };
  schools: SchoolOption[];
};

type Tab = "sekolah" | "pegawai";
type PegawaiHasil = { id: number; nama: string; jawatan: string };

const TABS: { value: Tab; label: string }[] = [
  { value: "sekolah", label: "Sekolah" },
  { value: "pegawai", label: "Pegawai PPD" },
];

const MAKS_SENARAI_SEKOLAH = 8;

function formatMasa(iso: string): string {
  return new Date(iso).toLocaleString("ms-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function matchesSchoolQuery(school: SchoolOption, rawQuery: string) {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const haystack = [school.code, school.name].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function Maklumat({ rekod }: { rekod: Pick<RekodKehadiranAwam, "nama" | "jawatan" | "organisasi"> }) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      <div>
        <dt className="text-graphite">Nama</dt>
        <dd className="font-semibold text-ink">{rekod.nama}</dd>
      </div>
      <div>
        <dt className="text-graphite">Jawatan</dt>
        <dd className="text-ink">{rekod.jawatan}</dd>
      </div>
      <div>
        <dt className="text-graphite">Organisasi</dt>
        <dd className="text-ink">{rekod.organisasi}</dd>
      </div>
    </dl>
  );
}

export default function KehadiranMjkdForm({ mesyuarat, schools }: Props) {
  const storageKey = `mjkd-hadir-${mesyuarat.id}`;
  const [tab, setTab] = useState<Tab>("sekolah");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selesai, setSelesai] = useState<{ rekod: RekodKehadiranAwam; duplikat: boolean } | null>(
    null,
  );
  const [terakhir, setTerakhir] = useState<RekodKehadiranAwam | null>(null);

  // Sekolah
  const [query, setQuery] = useState("");
  const [kodDipilih, setKodDipilih] = useState("");
  const [info, setInfo] = useState<KehadiranSekolahInfo | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [wakil, setWakil] = useState(false);
  const [namaManual, setNamaManual] = useState("");
  const [jawatanWakil, setJawatanWakil] = useState("");

  // Pegawai
  const [qPegawai, setQPegawai] = useState("");
  const [hasil, setHasil] = useState<PegawaiHasil[]>([]);
  const [mencari, setMencari] = useState(false);
  const [pegawai, setPegawai] = useState<PegawaiHasil | null>(null);
  const urutanCari = useRef(0);
  // Pegawai PPD yang tiada dalam senarai: isi nama + jawatan sendiri.
  const [pegawaiManual, setPegawaiManual] = useState(false);
  const [manualNama, setManualNama] = useState("");
  const [manualJawatan, setManualJawatan] = useState("");

  // Ingat kehadiran terakhir pada peranti ini (pilihan; tidak dipercayai).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setTerakhir(JSON.parse(raw) as RekodKehadiranAwam);
    } catch {
      /* localStorage tidak tersedia */
    }
  }, [storageKey]);

  const padanSekolah = useMemo(
    () => schools.filter((s) => matchesSchoolQuery(s, query)).slice(0, MAKS_SENARAI_SEKOLAH),
    [query, schools],
  );

  function pilihSekolah(kod: string) {
    setKodDipilih(kod);
    setQuery("");
    setInfo(null);
    setWakil(false);
    setNamaManual("");
    setJawatanWakil("");
    setError(null);
    setMemuat(true);
    getKehadiranSekolahMjkd(mesyuarat.id, kod)
      .then((res) => {
        if (!res.ok) setError(res.error ?? "Gagal memuat maklumat sekolah.");
        setInfo(res);
      })
      .catch(() => setError("Gagal memuat maklumat sekolah."))
      .finally(() => setMemuat(false));
  }

  // Carian pegawai di pelayan (min 2 aksara; senarai penuh tidak dihantar ke pelayar).
  useEffect(() => {
    const kata = qPegawai.trim();
    if (kata.length < CARIAN_PEGAWAI_MIN) {
      setHasil([]);
      setMencari(false);
      return;
    }
    const no = ++urutanCari.current;
    setMencari(true);
    const t = window.setTimeout(() => {
      cariPegawaiMjkd(kata)
        .then((r) => {
          if (no === urutanCari.current) setHasil(r);
        })
        .catch(() => {
          if (no === urutanCari.current) setHasil([]);
        })
        .finally(() => {
          if (no === urutanCari.current) setMencari(false);
        });
    }, 250);
    return () => window.clearTimeout(t);
  }, [qPegawai]);

  function hantar(payload: KehadiranPayload) {
    setError(null);
    startTransition(async () => {
      let res: Awaited<ReturnType<typeof sahkanKehadiranMjkd>>;
      try {
        res = await sahkanKehadiranMjkd(payload);
      } catch {
        // Selamat diulang: indeks unik per hari + laluan pendua mesra.
        setError(MESEJ_RALAT_SAMBUNGAN + " Tekan \"Sahkan Kehadiran\" sekali lagi.");
        return;
      }
      if (!res.ok || !res.rekod) {
        setError(res.error ?? "Gagal merekodkan kehadiran.");
        return;
      }
      setSelesai({ rekod: res.rekod, duplikat: Boolean(res.duplikat) });
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(res.rekod));
      } catch {
        /* abaikan */
      }
      setTerakhir(res.rekod);
    });
  }

  function mulaSemula() {
    setSelesai(null);
    setError(null);
    setKodDipilih("");
    setInfo(null);
    setWakil(false);
    setNamaManual("");
    setJawatanWakil("");
    setQuery("");
    setQPegawai("");
    setHasil([]);
    setPegawai(null);
    setPegawaiManual(false);
    setManualNama("");
    setManualJawatan("");
  }

  if (selesai) {
    const hariLabel = labelHariPendek(selesai.rekod.tarikh);
    return (
      <section className="card p-6" aria-live="polite">
        <h2 className="text-xl font-semibold text-ink">
          {selesai.duplikat ? "Anda telah direkodkan hadir" : "Kehadiran direkodkan"}
        </h2>
        <p className="mt-1 text-sm text-graphite">
          {selesai.duplikat
            ? `Anda telah direkodkan hadir pada ${formatMasa(selesai.rekod.masa)}. Tiada tindakan lanjut diperlukan.`
            : `Terima kasih. Dicatat pada ${formatMasa(selesai.rekod.masa)}.`}
        </p>
        <Maklumat rekod={selesai.rekod} />
        <p className="mt-3 text-sm text-graphite">Kehadiran bagi hari: {hariLabel}</p>
        <button type="button" className="btn-outline-ink mt-6" onClick={mulaSemula}>
          Rekod kehadiran orang lain
        </button>
      </section>
    );
  }

  const sekolahDipilih = schools.find((s) => s.code === kodDipilih);
  const namaPgb = info?.pgb?.nama ?? "";

  return (
    <div className="space-y-6">
      {terakhir ? (
        <p className="rounded-lg border hairline bg-cloud/60 px-4 py-3 text-sm text-charcoal">
          Kehadiran terakhir pada peranti ini: <strong>{terakhir.nama}</strong> (
          {formatMasa(terakhir.masa)}).
        </p>
      ) : null}

      <div role="tablist" aria-label="Jenis kehadiran" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={tab === t.value ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
            onClick={() => {
              setTab(t.value);
              setError(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sekolah" ? (
        <section className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="hadir-cari-sekolah">
              Cari sekolah
            </label>
            <input
              id="hadir-cari-sekolah"
              className="input"
              placeholder="Kod atau nama sekolah"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {query.trim() ? (
            padanSekolah.length === 0 ? (
              <p className="rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
                Tiada sekolah sepadan. Cuba kod atau sebahagian nama.
              </p>
            ) : (
              <ul className="rounded-lg border hairline">
                {padanSekolah.map((s) => (
                  <li key={s.code} className="border-b hairline last:border-0">
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-baseline gap-3 px-4 py-2.5 text-left text-sm text-ink hover:bg-cloud/55"
                      onClick={() => pilihSekolah(s.code)}
                    >
                      <span className="shrink-0 font-mono text-xs text-graphite">{s.code}</span>
                      <span>{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}

          {kodDipilih ? (
            <div className="rounded-xl border border-fog bg-cloud/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
                {sekolahDipilih?.code}
              </p>
              <p className="mt-1 text-lg font-semibold text-ink">{sekolahDipilih?.name}</p>

              {memuat ? <p className="mt-3 text-sm text-graphite">Memuat…</p> : null}

              {info?.ok && info.sudahHadir ? (
                <p className="mt-3 text-sm text-charcoal">
                  <strong>{info.sudahHadir.nama}</strong> telah direkodkan hadir pada{" "}
                  {formatMasa(info.sudahHadir.masa)}. Jika orang lain mewakili sekolah, pilih
                  &quot;Saya wakil sekolah&quot; di bawah.
                </p>
              ) : null}

              {info?.ok && !wakil && !info.sudahHadir ? (
                <div className="mt-4">
                  {namaPgb ? (
                    <>
                      <p className="text-sm text-graphite">{info.pgb?.jawatan}</p>
                      <p className="text-base font-semibold text-ink">{namaPgb}</p>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-graphite">
                        Nama {info.pgb?.jawatan} belum ada dalam direktori. Sila isi nama anda.
                      </p>
                      <label className="label mt-2" htmlFor="hadir-nama-pgb">
                        Nama *
                      </label>
                      <input
                        id="hadir-nama-pgb"
                        className="input"
                        maxLength={200}
                        value={namaManual}
                        onChange={(e) => setNamaManual(e.target.value)}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full sm:w-auto"
                    disabled={pending || (!namaPgb && !namaManual.trim())}
                    onClick={() =>
                      hantar({
                        mesyuaratId: mesyuarat.id,
                        jenis: "PGB",
                        schoolCode: kodDipilih,
                        nama: namaPgb ? undefined : namaManual,
                      })
                    }
                  >
                    {pending ? "Merekod…" : "Sahkan Kehadiran"}
                  </button>
                </div>
              ) : null}

              {info?.ok ? (
                <div className="mt-4 border-t hairline pt-4">
                  {!wakil ? (
                    <button
                      type="button"
                      className="text-sm font-medium text-charcoal underline underline-offset-2 hover:text-ink"
                      onClick={() => setWakil(true)}
                    >
                      Saya wakil sekolah
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-ink">Wakil sekolah</p>
                      {info.wakilPilihan && info.wakilPilihan.length > 0 ? (
                        <div>
                          <p className="text-xs text-graphite">
                            Isi pantas daripada direktori (atau taip nama lain di bawah):
                          </p>
                          <ul className="mt-1 flex flex-wrap gap-2">
                            {info.wakilPilihan.map((w) => (
                              <li key={w.jawatan}>
                                <button
                                  type="button"
                                  className="status-badge min-h-9 hover:border-steel"
                                  onClick={() => {
                                    setNamaManual(w.nama);
                                    setJawatanWakil(w.jawatan);
                                  }}
                                >
                                  {w.jawatan}: {w.nama}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div>
                        <label className="label" htmlFor="hadir-wakil-nama">
                          Nama *
                        </label>
                        <input
                          id="hadir-wakil-nama"
                          className="input"
                          maxLength={200}
                          value={namaManual}
                          onChange={(e) => setNamaManual(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="hadir-wakil-jawatan">
                          Jawatan *
                        </label>
                        <input
                          id="hadir-wakil-jawatan"
                          className="input"
                          maxLength={200}
                          value={jawatanWakil}
                          onChange={(e) => setJawatanWakil(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={pending || !namaManual.trim() || !jawatanWakil.trim()}
                          onClick={() =>
                            hantar({
                              mesyuaratId: mesyuarat.id,
                              jenis: "WAKIL",
                              schoolCode: kodDipilih,
                              nama: namaManual,
                              jawatan: jawatanWakil,
                            })
                          }
                        >
                          {pending ? "Merekod…" : "Sahkan Kehadiran"}
                        </button>
                        <button
                          type="button"
                          className="text-sm text-graphite hover:text-ink"
                          onClick={() => setWakil(false)}
                        >
                          Kembali
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "pegawai" ? (
        <section className="card space-y-4 p-6">
          {!pegawaiManual ? (
            <>
              <div>
                <label className="label" htmlFor="hadir-cari-pegawai">
                  Cari nama pegawai
                </label>
                <input
                  id="hadir-cari-pegawai"
                  className="input"
                  placeholder="Taip sekurang-kurangnya 2 huruf nama"
                  autoComplete="off"
                  value={qPegawai}
                  onChange={(e) => {
                    setQPegawai(e.target.value);
                    setPegawai(null);
                  }}
                />
              </div>
              {qPegawai.trim().length >= CARIAN_PEGAWAI_MIN && !pegawai ? (
                mencari ? (
                  <p className="text-sm text-graphite">Mencari…</p>
                ) : hasil.length === 0 ? (
                  <p className="rounded-lg border hairline bg-fog/40 px-4 py-3 text-sm text-graphite">
                    Tiada pegawai sepadan. Jika nama anda tiada, klik &quot;Tiada dalam
                    senarai&quot; di bawah.
                  </p>
                ) : (
                  <ul className="rounded-lg border hairline">
                    {hasil.map((p) => (
                      <li key={p.id} className="border-b hairline last:border-0">
                        <button
                          type="button"
                          className="block min-h-11 w-full px-4 py-2.5 text-left text-sm hover:bg-cloud/55"
                          onClick={() => setPegawai(p)}
                        >
                          <span className="block font-medium text-ink">{p.nama}</span>
                          <span className="block text-xs text-graphite">{p.jawatan}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
              {pegawai ? (
                <div className="rounded-xl border border-fog bg-cloud/60 p-5">
                  <Maklumat
                    rekod={{ nama: pegawai.nama, jawatan: pegawai.jawatan, organisasi: ORGANISASI_PPD }}
                  />
                  <button
                    type="button"
                    className="btn-primary mt-4 w-full sm:w-auto"
                    disabled={pending}
                    onClick={() =>
                      hantar({ mesyuaratId: mesyuarat.id, jenis: "PEGAWAI", pegawaiId: pegawai.id })
                    }
                  >
                    {pending ? "Merekod…" : "Sahkan Kehadiran"}
                  </button>
                </div>
              ) : null}
              <div className="border-t hairline pt-4">
                <button
                  type="button"
                  className="text-sm font-medium text-charcoal underline underline-offset-2 hover:text-ink"
                  onClick={() => {
                    setPegawaiManual(true);
                    setPegawai(null);
                    setError(null);
                  }}
                >
                  Tiada dalam senarai
                </button>
                <p className="mt-1 text-xs text-graphite">
                  Untuk pegawai PPD Manjung sahaja. Wakil sekolah sila guna tab Sekolah.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-ink">Pegawai PPD — tiada dalam senarai</p>
                <p className="mt-1 text-xs text-graphite">
                  Untuk pegawai PPD Manjung sahaja. Wakil sekolah sila guna tab Sekolah.
                </p>
              </div>
              <div>
                <label className="label" htmlFor="hadir-pegawai-nama">
                  Nama *
                </label>
                <input
                  id="hadir-pegawai-nama"
                  className="input"
                  maxLength={200}
                  value={manualNama}
                  onChange={(e) => setManualNama(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="hadir-pegawai-jawatan">
                  Jawatan / Sektor *
                </label>
                <input
                  id="hadir-pegawai-jawatan"
                  className="input"
                  maxLength={200}
                  placeholder="Contoh: Penolong PPD Sektor Pembelajaran"
                  value={manualJawatan}
                  onChange={(e) => setManualJawatan(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={pending || !manualNama.trim() || !manualJawatan.trim()}
                  onClick={() =>
                    hantar({
                      mesyuaratId: mesyuarat.id,
                      jenis: "PEGAWAI",
                      nama: manualNama,
                      jawatan: manualJawatan,
                    })
                  }
                >
                  {pending ? "Merekod…" : "Sahkan Kehadiran"}
                </button>
                <button
                  type="button"
                  className="text-sm text-graphite hover:text-ink"
                  onClick={() => setPegawaiManual(false)}
                >
                  Kembali ke carian
                </button>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {error && (
        <p className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-sm text-bloom-deep">
          {error}
        </p>
      )}
    </div>
  );
}
