"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  hantarKunjungBantu,
  muatSekolahKunjungBantu,
  padamDrafKunjungBantu,
  simpanDrafKunjungBantu,
} from "@/lib/actions/kunjung-bantu";
import {
  ASPEK,
  ITEM_DIISI,
  SESI_KUNJUNG_BANTU,
  aspekLengkap,
  formatPeratus,
  itemLengkap,
  kiraYa,
  maklumatLengkap,
  nilaiAuto,
  semakLengkap,
  type AspekInstrumen,
  type DelimaSekolah,
  type Jawapan,
  type MaklumatSekolah,
  type Semakan,
} from "@/lib/kunjung-bantu/instrumen";
import BarBahagian, { NavBahagian, tatalKeBahagian } from "@/components/kunjung-bantu/BarBahagian";
import { URL_CETAK_DRAF, simpanCetakDraf } from "@/lib/kunjung-bantu/cetak-draf";

type SchoolOption = { code: string; name: string; zone: string };

type Props = {
  schools: SchoolOption[];
  /** Kod sekolah yang sudah menghantar — borang baharu dikunci bagi sekolah ini. */
  sudahHantar: string[];
  /** Mod kemaskini (nombor tiket sudah disahkan oleh halaman). */
  existing?: {
    schoolCode: string;
    receiptToken: string;
    maklumat: MaklumatSekolah;
    jawapan: Jawapan;
    semakan: Semakan;
    delima: DelimaSekolah | null;
  } | null;
};

/** Tab: "maklumat" atau "a{bil}" bagi setiap aspek. */
const TAB_MAKLUMAT = "maklumat";
const TABS: { id: string; no: string; label: string; aspek: AspekInstrumen | null }[] = [
  { id: TAB_MAKLUMAT, no: "B", label: "Maklumat", aspek: null },
  ...ASPEK.map((a) => ({ id: `a${a.bil}`, no: String(a.bil), label: a.tajukPendek, aspek: a })),
];

const MAKLUMAT_KOSONG: MaklumatSekolah = { namaPgb: "", namaPkPentadbiran: "", namaAdminDelima: "" };

type DrafTempatan = { maklumat: MaklumatSekolah; jawapan: Jawapan; disimpan: string };

function kunciDraf(kod: string, kemaskini: boolean) {
  return `kb-draf:${SESI_KUNJUNG_BANTU}:${kemaskini ? "kemaskini:" : ""}${kod}`;
}

function bacaTempatan(kunci: string): DrafTempatan | null {
  try {
    const raw = window.localStorage.getItem(kunci);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<DrafTempatan>;
    if (!d || typeof d !== "object" || !d.jawapan || !d.maklumat) return null;
    return { maklumat: d.maklumat, jawapan: d.jawapan, disimpan: String(d.disimpan ?? "") };
  } catch {
    return null;
  }
}

function tulisTempatan(kunci: string, d: DrafTempatan) {
  try {
    window.localStorage.setItem(kunci, JSON.stringify(d));
  } catch {
    /* localStorage tidak tersedia */
  }
}

function buangTempatan(kunci: string) {
  try {
    window.localStorage.removeItem(kunci);
  } catch {
    /* abai */
  }
}

function masa(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" });
}

function padanSekolah(s: SchoolOption, q: string) {
  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const hay = `${s.code} ${s.name} ${s.zone}`.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export default function BorangKunjungBantu({ schools, sudahHantar, existing }: Props) {
  const router = useRouter();
  const kemaskini = Boolean(existing);
  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(existing?.schoolCode ?? "");
  const [maklumat, setMaklumat] = useState<MaklumatSekolah>(existing?.maklumat ?? MAKLUMAT_KOSONG);
  const [jawapan, setJawapan] = useState<Jawapan>(existing?.jawapan ?? {});
  const [delima, setDelima] = useState<DelimaSekolah | null>(existing?.delima ?? null);
  const [memuat, setMemuat] = useState(false);
  const [sedia, setSedia] = useState(kemaskini); // borang boleh diisi
  const [sekolahSudahHantar, setSekolahSudahHantar] = useState(false);
  const [statusSimpan, setStatusSimpan] = useState<string | null>(null);
  const [drafDipulih, setDrafDipulih] = useState<string | null>(null);
  const [ralat, setRalat] = useState<string | null>(null);
  const [itemRalat, setItemRalat] = useState<string | null>(null);
  const [menghantar, startHantar] = useTransition();
  // Mod kemaskini dengan pembetulan: buka terus bahagian pertama yang ada item "perlu dibaiki".
  const [tab, setTab] = useState<string>(() => {
    const s = existing?.semakan ?? {};
    const a = ASPEK.find((x) => x.items.some((it) => s[it.id]?.status === "BAIKI"));
    return a ? `a${a.bil}` : TAB_MAKLUMAT;
  });
  const navTabRef = useRef<HTMLDivElement | null>(null);
  const ubah = useRef(false); // ada suntingan pengguna sejak dimuat
  const pemasa = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dihantarSet = useMemo(() => new Set(sudahHantar), [sudahHantar]);
  const senarai = useMemo(
    () => (query.trim() ? schools.filter((s) => padanSekolah(s, query)) : schools),
    [schools, query],
  );
  const dipilih = schools.find((s) => s.code === schoolCode) ?? null;
  const semakan = existing?.semakan ?? {};

  // Mod kemaskini: pulihkan draf pelayar (suntingan belum dihantar) sekali selepas mount.
  useEffect(() => {
    if (!existing) return;
    const d = bacaTempatan(kunciDraf(existing.schoolCode, true));
    if (d) {
      setMaklumat(d.maklumat);
      setJawapan(d.jawapan);
      setDrafDipulih(d.disimpan);
    }
  }, [existing]);

  // Borang baharu: muat prefill + draf pelayan apabila sekolah dipilih.
  async function pilihSekolah(kod: string) {
    setSchoolCode(kod);
    setRalat(null);
    setItemRalat(null);
    setDrafDipulih(null);
    setSedia(false);
    setSekolahSudahHantar(false);
    setTab(TAB_MAKLUMAT);
    ubah.current = false;
    if (!kod) return;
    setMemuat(true);
    const r = await muatSekolahKunjungBantu(kod);
    setMemuat(false);
    if (!r.ok) {
      setRalat("Gagal memuatkan maklumat sekolah. Sila cuba semula.");
      return;
    }
    if (r.sudahHantar) {
      setSekolahSudahHantar(true);
      return;
    }
    setDelima(r.delima);
    const tempatan = bacaTempatan(kunciDraf(kod, false));
    const pelayan = r.draf;
    const pilih =
      tempatan && (!pelayan || tempatan.disimpan > pelayan.disimpan) ? tempatan : pelayan;
    const prefillLaman: Jawapan = r.laman ? { "1.8": { ya: null, catatan: r.laman } } : {};
    if (pilih) {
      setMaklumat({
        namaPgb: pilih.maklumat.namaPgb || r.prefill.namaPgb,
        namaPkPentadbiran: pilih.maklumat.namaPkPentadbiran || r.prefill.namaPkPentadbiran,
        namaAdminDelima: pilih.maklumat.namaAdminDelima || r.prefill.namaAdminDelima,
      });
      setJawapan({ ...prefillLaman, ...pilih.jawapan });
      setDrafDipulih(pilih.disimpan);
    } else {
      setMaklumat(r.prefill);
      setJawapan(prefillLaman);
    }
    setSedia(true);
  }

  // Auto-simpan 1.2 s selepas suntingan terakhir.
  useEffect(() => {
    if (!sedia || !schoolCode || !ubah.current) return;
    if (pemasa.current) clearTimeout(pemasa.current);
    pemasa.current = setTimeout(async () => {
      const now = new Date().toISOString();
      tulisTempatan(kunciDraf(schoolCode, kemaskini), { maklumat, jawapan, disimpan: now });
      if (kemaskini) {
        setStatusSimpan(`Draf disimpan dalam peranti ini ${masa(now)}`);
        return;
      }
      setStatusSimpan("Menyimpan…");
      const r = await simpanDrafKunjungBantu({ schoolCode, maklumat, jawapan });
      setStatusSimpan(
        r.ok && r.disimpan
          ? `Draf disimpan ${masa(r.disimpan)}`
          : "Draf disimpan dalam peranti ini sahaja (pelayan tidak dapat dihubungi)",
      );
    }, 1200);
    return () => {
      if (pemasa.current) clearTimeout(pemasa.current);
    };
  }, [maklumat, jawapan, schoolCode, sedia, kemaskini]);

  function setItem(id: string, patch: Partial<{ ya: boolean | null; catatan: string }>) {
    ubah.current = true;
    setRalat(null);
    if (itemRalat === id) setItemRalat(null);
    setJawapan((prev) => {
      const lama = prev[id] ?? { ya: null, catatan: "" };
      return { ...prev, [id]: { ...lama, ...patch } };
    });
  }

  function setMaklumatMedan(k: keyof MaklumatSekolah, v: string) {
    ubah.current = true;
    setRalat(null);
    setMaklumat((m) => ({ ...m, [k]: v }));
  }

  async function buangDraf() {
    if (!schoolCode) return;
    buangTempatan(kunciDraf(schoolCode, kemaskini));
    if (kemaskini && existing) {
      setMaklumat(existing.maklumat);
      setJawapan(existing.jawapan);
      setDrafDipulih(null);
      setStatusSimpan(null);
      return;
    }
    await padamDrafKunjungBantu(schoolCode);
    setStatusSimpan(null);
    await pilihSekolah(schoolCode);
  }

  /** Cetak jawapan semasa (belum dihantar) dalam tab baharu. */
  function cetakDraf() {
    if (!schoolCode) return;
    const ok = simpanCetakDraf({
      sekolah: { code: schoolCode, name: dipilih?.name ?? "" },
      maklumat,
      jawapan,
      semakan,
      delima,
      dicetak: new Date().toISOString(),
      kembali: `${window.location.pathname}${window.location.search}`,
    });
    if (!ok) {
      setRalat("Pelayar ini tidak membenarkan simpanan setempat — draf tidak dapat dicetak.");
      return;
    }
    const w = window.open(URL_CETAK_DRAF, "_blank");
    if (!w) window.location.href = URL_CETAK_DRAF;
  }

  function hantar() {
    setRalat(null);
    const salah = semakLengkap(maklumat, jawapan);
    if (salah) {
      setRalat(salah);
      if (!maklumatLengkap(maklumat)) {
        bukaTab(TAB_MAKLUMAT);
        return;
      }
      const item = ITEM_DIISI.find((it) => !itemLengkap(it, jawapan));
      const aspek = item ? ASPEK.find((a) => a.items.includes(item)) : null;
      if (item && aspek) {
        setItemRalat(item.id);
        setTab(`a${aspek.bil}`);
        // Tunggu tab dipaparkan sebelum menatal ke item.
        setTimeout(() => {
          document.getElementById(`kb-item-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
      return;
    }
    startHantar(async () => {
      if (pemasa.current) clearTimeout(pemasa.current);
      const r = await hantarKunjungBantu({
        schoolCode,
        receiptToken: existing?.receiptToken,
        maklumat,
        jawapan,
      });
      if (!r.ok || !r.receiptToken) {
        setRalat(r.error ?? "Gagal menghantar. Sila cuba semula.");
        return;
      }
      buangTempatan(kunciDraf(schoolCode, false));
      buangTempatan(kunciDraf(schoolCode, true));
      router.push(
        `/laporan-kunjung-bantu/berjaya?kod=${encodeURIComponent(r.schoolCode ?? schoolCode)}&resit=${encodeURIComponent(r.receiptToken)}${kemaskini ? "&kemaskini=1" : ""}`,
      );
    });
  }

  function tabLengkap(id: string): boolean {
    const t = TABS.find((x) => x.id === id);
    if (!t) return false;
    return t.aspek ? aspekLengkap(t.aspek, jawapan) : maklumatLengkap(maklumat);
  }

  function tabAdaBaiki(id: string): boolean {
    const a = TABS.find((x) => x.id === id)?.aspek;
    return Boolean(a?.items.some((it) => semakan[it.id]?.status === "BAIKI"));
  }

  /** Tukar tab dan bawa pengguna ke atas bahagian (tidak perlu tatal ke atas sendiri). */
  function bukaTab(id: string) {
    setTab(id);
    tatalKeBahagian(navTabRef.current, `kb-tab-${id}`);
  }

  const idxTab = Math.max(0, TABS.findIndex((t) => t.id === tab));
  const tabSemasa = TABS[idxTab]!;
  const tabSebelum = idxTab > 0 ? TABS[idxTab - 1] : null;
  const tabSeterus = idxTab < TABS.length - 1 ? TABS[idxTab + 1] : null;

  const { ya, jumlah } = kiraYa(jawapan);
  const dijawab = ITEM_DIISI.filter((it) => jawapan[it.id]?.ya != null).length;

  return (
    <div className="space-y-6">
      {/* A. Sekolah */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold">A. Sekolah</h2>
        {kemaskini && dipilih ? (
          <p className="mt-3 text-[15px]">
            <span className="font-semibold">{dipilih.code}</span> — {dipilih.name}
            <span className="block text-xs text-graphite">PPD Manjung · {dipilih.zone || "—"}</span>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="kb-cari">
                Cari sekolah
              </label>
              <input
                id="kb-cari"
                className="input"
                placeholder="Kod atau nama sekolah"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <p className="mt-1 text-xs text-graphite">{senarai.length} sekolah sepadan</p>
            </div>
            <div>
              <label className="label" htmlFor="kb-sekolah">
                Sekolah *
              </label>
              <select
                id="kb-sekolah"
                className="input"
                value={schoolCode}
                disabled={memuat || senarai.length === 0}
                onChange={(e) => void pilihSekolah(e.target.value)}
              >
                <option value="">Pilih sekolah…</option>
                {senarai.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                    {dihantarSet.has(s.code) ? " ✓" : ""}
                  </option>
                ))}
              </select>
              {dipilih ? (
                <p className="mt-1 text-xs text-graphite">PPD Manjung · {dipilih.zone || "—"}</p>
              ) : null}
            </div>
          </div>
        )}
        {memuat ? <p className="mt-4 text-sm text-graphite">Memuatkan maklumat sekolah…</p> : null}
        {sekolahSudahHantar ? (
          <div className="mt-4 rounded-lg border-2 border-ink p-4">
            <p className="font-semibold text-ink">Sekolah ini sudah menghantar instrumen.</p>
            <p className="mt-1 text-sm text-charcoal">
              Untuk melihat status semakan PPD atau mengemaskini jawapan, guna nombor tiket.
            </p>
            <Link
              href={`/laporan-kunjung-bantu/semak?kod=${encodeURIComponent(schoolCode)}`}
              className="btn-outline-ink mt-3 inline-flex"
            >
              Semak / Kemaskini
            </Link>
          </div>
        ) : null}
      </section>

      {sedia ? (
        <>
          {drafDipulih ? (
            <div className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-charcoal">
                Draf yang belum dihantar dipulihkan
                {masa(drafDipulih) ? ` (disimpan ${masa(drafDipulih)})` : ""}. Teruskan mengisi.
              </p>
              <button type="button" className="btn-outline-ink shrink-0" onClick={() => void buangDraf()}>
                Buang draf
              </button>
            </div>
          ) : null}

          {/* Bar bahagian (tab) */}
          <BarBahagian
            tabs={TABS.map((t) => ({
              id: t.id,
              no: t.no,
              label: t.label,
              lengkap: tabLengkap(t.id),
              baiki: tabAdaBaiki(t.id),
            }))}
            aktif={tab}
            onPilih={bukaTab}
            sauhRef={navTabRef}
            awalanId="kb-tab"
          />

          {/* Kandungan bahagian semasa */}
          {tabSemasa.aspek === null ? (
            <section id="kb-maklumat" className="card p-6">
              <h2 className="text-lg font-semibold">B. Maklumat sekolah</h2>
              <p className="mt-1 text-sm text-graphite">Diisi daripada direktori — betulkan jika perlu.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    ["namaPgb", "Nama Pengetua / Guru Besar *"],
                    ["namaPkPentadbiran", "Nama PK Pentadbiran"],
                    ["namaAdminDelima", "Nama Admin DELIMa *"],
                  ] as const
                ).map(([k, label]) => (
                  <div key={k}>
                    <label className="label" htmlFor={`kb-${k}`}>
                      {label}
                    </label>
                    <input
                      id={`kb-${k}`}
                      className="input"
                      value={maklumat[k]}
                      maxLength={200}
                      onChange={(e) => setMaklumatMedan(k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-graphite">
                Bahagian 1–6: tandakan <b>Ya</b> jika sudah dilaksanakan dan bukti boleh ditunjukkan
                semasa lawatan PPD, atau <b>Tidak</b> jika belum. Catatan/pautan bukti adalah pilihan.
              </p>
            </section>
          ) : (
            <BahagianAspek
              aspek={tabSemasa.aspek}
              jawapan={jawapan}
              semakan={semakan}
              delima={delima}
              itemRalat={itemRalat}
              setItem={setItem}
            />
          )}

          {/* Navigasi bahagian */}
          <NavBahagian
            sebelum={tabSebelum}
            seterus={tabSeterus}
            onPilih={bukaTab}
            akhir={
              <>
                Bahagian terakhir — tekan <b>{kemaskini ? "Kemaskini" : "Hantar"}</b> di bawah.
              </>
            }
          />

          {/* Bar hantar */}
          <div className="card sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 px-4 py-3 shadow-modal lg:bottom-4">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-ink">
                {dijawab}/{jumlah}
                <span className="hidden sm:inline"> item</span> dijawab · {ya} Ya
              </p>
              <p className="text-xs text-graphite">{statusSimpan ?? "Jawapan disimpan secara automatik."}</p>
              {ralat ? <p className="mt-1 text-sm font-semibold text-bloom-deep">{ralat}</p> : null}
            </div>
            <button
              type="button"
              className="btn-outline-ink h-12 w-12 shrink-0 px-0 sm:w-auto sm:px-5"
              onClick={cetakDraf}
              aria-label="Cetak draf"
              title="Cetak draf (belum dihantar)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span className="hidden sm:inline">Cetak draf</span>
            </button>
            <button
              type="button"
              className="btn-primary h-12 shrink-0 px-5 sm:px-10"
              disabled={menghantar}
              onClick={hantar}
            >
              {menghantar ? "Menghantar…" : kemaskini ? "Kemaskini" : "Hantar"}
            </button>
          </div>
        </>
      ) : null}
      {!sedia && ralat ? <p className="text-sm text-bloom-deep">{ralat}</p> : null}
    </div>
  );
}

/** Satu bahagian (aspek) instrumen: senarai item Ya/Tidak, atau nilai automatik d3. */
function BahagianAspek({
  aspek: a,
  jawapan,
  semakan,
  delima,
  itemRalat,
  setItem,
}: {
  aspek: AspekInstrumen;
  jawapan: Jawapan;
  semakan: Semakan;
  delima: DelimaSekolah | null;
  itemRalat: string | null;
  setItem: (id: string, patch: Partial<{ ya: boolean | null; catatan: string }>) => void;
}) {
  return (
    <section className="card overflow-hidden" aria-label={`Aspek ${a.bil}`}>
      <div className="border-b hairline bg-cloud px-5 py-3">
        <p className="font-semibold text-ink">
          {a.bil}. {a.tajuk}
        </p>
        {a.subtajuk ? <p className="text-xs text-graphite">{a.subtajuk}</p> : null}
      </div>
      {a.auto ? (
        <div className="px-5 py-4">
          <ul className="divide-y divide-fog">
            {a.items.map((it) => {
              const v = nilaiAuto(delima, it.id);
              return (
                <li key={it.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span>
                    <span className="mr-2 text-graphite">{it.no}</span>
                    {it.item}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {v ? formatPeratus(v.peratus) : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-graphite">
            {delima
              ? `Data automatik d3 DELIMa (${delima.tempoh}) — tidak perlu diisi. Dikemas kini setiap kali PPD mengimport data baharu.`
              : "Data d3 DELIMa sekolah ini belum ada — PPD akan menyemak semasa lawatan."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-fog">
          {a.items.map((it) => {
            const j = jawapan[it.id] ?? { ya: null, catatan: "" };
            const s = semakan[it.id];
            const baiki = s?.status === "BAIKI";
            return (
              <li
                key={it.id}
                id={`kb-item-${it.id}`}
                className={`scroll-mt-48 px-5 py-4 ${baiki ? "bg-bloom-rose/40" : ""} ${
                  itemRalat === it.id ? "ring-2 ring-inset ring-bloom-deep" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">
                      <span className="mr-2 font-semibold text-graphite">{it.no}</span>
                      {it.item}
                    </p>
                    {it.panduan ? <p className="mt-0.5 text-xs text-graphite">{it.panduan}</p> : null}
                    {it.pautan ? (
                      <a
                        href={it.pautan.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-blue mt-0.5 inline-block text-xs"
                      >
                        {it.pautan.label} ↗
                      </a>
                    ) : null}
                    {baiki ? (
                      <p className="mt-1 text-sm font-semibold text-bloom-deep">
                        PPD: perlu dibaiki{s?.catatan ? ` — ${s.catatan}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2" role="radiogroup" aria-label={`Item ${it.no}`}>
                    {(
                      [
                        [true, "Ya"],
                        [false, "Tidak"],
                      ] as const
                    ).map(([nilai, label]) => {
                      const aktif = j.ya === nilai;
                      return (
                        <button
                          key={label}
                          type="button"
                          role="radio"
                          aria-checked={aktif}
                          onClick={() => setItem(it.id, { ya: aktif ? null : nilai })}
                          className={`h-11 w-20 rounded border text-sm font-semibold transition ${
                            aktif
                              ? nilai
                                ? "border-ink bg-ink text-white"
                                : "border-graphite bg-graphite text-white"
                              : "border-steel bg-white text-charcoal hover:border-ink"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {j.ya !== null || it.wajibPautan ? (
                  <input
                    className="input mt-3"
                    value={j.catatan}
                    maxLength={1000}
                    placeholder={
                      it.placeholderCatatan ??
                      (j.ya === false
                        ? "Catatan (pilihan): sebab / perancangan"
                        : "Catatan / pautan bukti (pilihan)")
                    }
                    onChange={(e) => setItem(it.id, { catatan: e.target.value })}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
