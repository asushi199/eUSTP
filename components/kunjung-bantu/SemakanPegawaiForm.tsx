"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  adminSemakKunjungBantu,
  type TindakanSemakan,
} from "@/lib/actions/kunjung-bantu";
import BarBahagian, {
  NavBahagian,
  tatalKeBahagian,
} from "@/components/kunjung-bantu/BarBahagian";
import {
  ASPEK,
  ITEM_DIISI,
  formatPeratus,
  isPautan,
  nilaiAuto,
  type AspekInstrumen,
  type DelimaSekolah,
  type Jawapan,
  type Semakan,
  type StatusRekod,
  type StatusSemakItem,
} from "@/lib/kunjung-bantu/instrumen";

type Props = {
  schoolCode: string;
  status: StatusRekod;
  jawapan: Jawapan;
  semakan: Semakan;
  isu: string;
  ulasanPegawai: string;
  namaPegawai: string;
  jawatanPegawai: string;
  tarikhPenilaian: string;
  delima: DelimaSekolah | null;
  /** Pegawai USTP aktif (jadual `pegawai`) — nama + jawatan rasmi untuk tandatangan/cop. */
  pegawaiPilihan: { nama: string; jawatan: string }[];
};

/** Tab semakan: Pegawai, Aspek 1–6, Ulasan. */
const TAB_PEGAWAI = "pegawai";
const TAB_ULASAN = "ulasan";
const TABS: {
  id: string;
  no: string;
  label: string;
  aspek: AspekInstrumen | null;
}[] = [
  { id: TAB_PEGAWAI, no: "P", label: "Pegawai", aspek: null },
  ...ASPEK.map((a) => ({
    id: `a${a.bil}`,
    no: String(a.bil),
    label: a.tajukPendek,
    aspek: a,
  })),
  { id: TAB_ULASAN, no: "U", label: "Ulasan", aspek: null },
];

const SAHKAN_MESEJ =
  "Sahkan instrumen sekolah ini sebagai BERJAYA? Rekod akan dikunci dan cop pengesahan dipaparkan pada cetakan.";

export default function SemakanPegawaiForm(props: Props) {
  const router = useRouter();
  const dikunci = props.status === "DISAHKAN";
  const [semakan, setSemakan] = useState<Semakan>(props.semakan);
  const [isu, setIsu] = useState(props.isu);
  const [ulasan, setUlasan] = useState(props.ulasanPegawai);
  const [namaPegawai, setNamaPegawai] = useState(props.namaPegawai);
  const [jawatanPegawai, setJawatanPegawai] = useState(props.jawatanPegawai);
  const pilihan =
    props.namaPegawai &&
    !props.pegawaiPilihan.some((p) => p.nama === props.namaPegawai)
      ? [
          ...props.pegawaiPilihan,
          { nama: props.namaPegawai, jawatan: props.jawatanPegawai },
        ]
      : props.pegawaiPilihan;

  function pilihPegawai(nama: string) {
    setNamaPegawai(nama);
    setJawatanPegawai(pilihan.find((p) => p.nama === nama)?.jawatan ?? "");
  }
  const [tarikh, setTarikh] = useState(props.tarikhPenilaian);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(
    null,
  );
  const [sibuk, start] = useTransition();
  const [tab, setTab] = useState<string>(() =>
    props.namaPegawai && props.jawatanPegawai && props.tarikhPenilaian
      ? "a1"
      : TAB_PEGAWAI,
  );
  const sauhRef = useRef<HTMLDivElement | null>(null);

  function bukaTab(id: string) {
    setTab(id);
    tatalKeBahagian(sauhRef.current, `kbs-tab-${id}`);
  }

  function setItem(
    id: string,
    patch: Partial<{ status: StatusSemakItem | null; catatan: string }>,
  ) {
    setSemakan((prev) => {
      const lama = prev[id] ?? { status: null, catatan: "" };
      return { ...prev, [id]: { ...lama, ...patch } };
    });
  }

  /** Tanda item yang belum ditanda sebagai disahkan (satu aspek, atau semua). */
  function semuaSah(aspek?: AspekInstrumen) {
    const senarai = aspek ? aspek.items : ITEM_DIISI;
    setSemakan((prev) => {
      const out: Semakan = { ...prev };
      for (const it of senarai) {
        if (!out[it.id]?.status)
          out[it.id] = { status: "SAH", catatan: out[it.id]?.catatan ?? "" };
      }
      return out;
    });
  }

  function jalankan(tindakan: TindakanSemakan) {
    if (tindakan === "SAH" && !window.confirm(SAHKAN_MESEJ)) return;
    if (
      tindakan === "BUKA" &&
      !window.confirm(
        "Buka semula rekod ini? Cop pengesahan akan ditarik balik.",
      )
    )
      return;
    setMesej(null);
    start(async () => {
      const r = await adminSemakKunjungBantu({
        schoolCode: props.schoolCode,
        tindakan,
        semakan,
        isu,
        ulasanPegawai: ulasan,
        namaPegawai,
        jawatanPegawai,
        tarikhPenilaian: tarikh,
      });
      if (!r.ok) {
        setMesej({ ok: false, teks: r.error ?? "Gagal menyimpan." });
        return;
      }
      // Pelayan menanda item yang belum ditanda sebagai disahkan — selaraskan paparan.
      if (tindakan === "SAH") semuaSah();
      setMesej({
        ok: true,
        teks:
          tindakan === "SAH"
            ? "Disahkan. Sekolah kini boleh mencetak instrumen bercop."
            : tindakan === "BAIKI"
              ? "Dihantar semula kepada sekolah untuk pembetulan."
              : tindakan === "BUKA"
                ? "Rekod dibuka semula."
                : "Semakan disimpan.",
      });
      router.refresh();
    });
  }

  const bilBaiki = ITEM_DIISI.filter(
    (it) => semakan[it.id]?.status === "BAIKI",
  ).length;
  const bilSah = ITEM_DIISI.filter(
    (it) => semakan[it.id]?.status === "SAH",
  ).length;

  function tabLengkap(id: string): boolean {
    if (id === TAB_PEGAWAI)
      return Boolean(namaPegawai && jawatanPegawai && tarikh);
    if (id === TAB_ULASAN) return Boolean(isu.trim() || ulasan.trim());
    const a = TABS.find((t) => t.id === id)?.aspek;
    return Boolean(
      a && (a.auto || a.items.every((it) => semakan[it.id]?.status)),
    );
  }

  function tabAdaBaiki(id: string): boolean {
    const a = TABS.find((t) => t.id === id)?.aspek;
    return Boolean(a?.items.some((it) => semakan[it.id]?.status === "BAIKI"));
  }

  const idxTab = Math.max(
    0,
    TABS.findIndex((t) => t.id === tab),
  );
  const tabSemasa = TABS[idxTab]!;
  const tabSebelum = idxTab > 0 ? TABS[idxTab - 1]! : null;
  const tabSeterus = idxTab < TABS.length - 1 ? TABS[idxTab + 1]! : null;

  return (
    <div className="space-y-6">
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
        sauhRef={sauhRef}
        awalanId="kbs-tab"
        label="bahagian disemak"
      />

      {tab === TAB_PEGAWAI ? (
        <section className="card grid gap-4 p-6 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="kb-pegawai">
              Pegawai penilai
            </label>
            <select
              id="kb-pegawai"
              className="input"
              value={namaPegawai}
              disabled={dikunci}
              onChange={(e) => pilihPegawai(e.target.value)}
            >
              <option value="">Pilih pegawai…</option>
              {pilihan.map((p) => (
                <option key={p.nama} value={p.nama}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="kb-jawatan">
              Jawatan rasmi
            </label>
            <input
              id="kb-jawatan"
              className="input"
              value={jawatanPegawai}
              disabled={dikunci}
              maxLength={200}
              placeholder="Dicetak di bawah tandatangan"
              onChange={(e) => setJawatanPegawai(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="kb-tarikh">
              Tarikh penilaian (lawatan)
            </label>
            <input
              id="kb-tarikh"
              type="date"
              className="input"
              value={tarikh}
              disabled={dikunci}
              onChange={(e) => setTarikh(e.target.value)}
            />
          </div>
          <p className="text-sm text-graphite sm:col-span-3">
            Seterusnya, semak bahagian 1–6 berdasarkan bukti di sekolah:{" "}
            <b>Disahkan</b> atau <b>Perlu dibaiki</b> (dengan catatan). {bilSah}{" "}
            disahkan · {bilBaiki} perlu dibaiki ·{" "}
            {ITEM_DIISI.length - bilSah - bilBaiki} belum ditanda.
          </p>
        </section>
      ) : null}

      {tabSemasa.aspek ? (
        <section>
          {[tabSemasa.aspek].map((a) => (
            <div key={a.bil} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline bg-cloud px-5 py-3">
                <div>
                  <p className="font-semibold text-ink">
                    {a.bil}. {a.tajuk}
                  </p>
                  {a.subtajuk ? (
                    <p className="text-xs text-graphite">{a.subtajuk}</p>
                  ) : null}
                </div>
                {!dikunci && !a.auto ? (
                  <button
                    type="button"
                    className="btn-outline-ink btn-sm"
                    onClick={() => semuaSah(a)}
                  >
                    Sahkan baki bahagian ini
                  </button>
                ) : null}
              </div>
              <ul className="divide-y divide-fog">
                {a.items.map((it) => {
                  if (a.auto) {
                    const v = nilaiAuto(props.delima, it.id);
                    return (
                      <li
                        key={it.id}
                        className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm"
                      >
                        <span>
                          <span className="mr-2 text-graphite">{it.no}</span>
                          {it.item}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {v
                            ? `${formatPeratus(v.peratus)} (${v.aktif}/${v.jumlah})`
                            : "—"}
                        </span>
                      </li>
                    );
                  }
                  const j = props.jawapan[it.id];
                  const s = semakan[it.id] ?? { status: null, catatan: "" };
                  return (
                    <li
                      key={it.id}
                      className={`px-5 py-3 ${s.status === "BAIKI" ? "bg-bloom-rose/30" : ""}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 text-sm">
                          <p className="text-[15px] text-ink">
                            <span className="mr-2 font-semibold text-graphite">
                              {it.no}
                            </span>
                            {it.item}
                          </p>
                          <p className="mt-1">
                            Sekolah:{" "}
                            <span
                              className={`font-semibold ${j?.ya ? "text-ink" : "text-graphite"}`}
                            >
                              {j?.ya === true
                                ? "Ya"
                                : j?.ya === false
                                  ? "Tidak"
                                  : "—"}
                            </span>
                            {j?.catatan ? (
                              isPautan(j.catatan) ? (
                                <>
                                  {" · "}
                                  <a
                                    href={j.catatan}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-blue break-all"
                                  >
                                    {j.catatan}
                                  </a>
                                </>
                              ) : (
                                <span className="text-charcoal">
                                  {" "}
                                  · {j.catatan}
                                </span>
                              )
                            ) : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {(
                            [
                              ["SAH", "Disahkan"],
                              ["BAIKI", "Perlu dibaiki"],
                            ] as const
                          ).map(([nilai, label]) => {
                            const aktif = s.status === nilai;
                            return (
                              <button
                                key={nilai}
                                type="button"
                                disabled={dikunci}
                                aria-pressed={aktif}
                                onClick={() =>
                                  setItem(it.id, {
                                    status: aktif ? null : nilai,
                                  })
                                }
                                className={`h-11 rounded border px-3 text-sm font-semibold transition disabled:opacity-70 ${
                                  aktif
                                    ? nilai === "SAH"
                                      ? "border-ink bg-ink text-white"
                                      : "border-bloom-deep bg-bloom-deep text-white"
                                    : "border-steel bg-white text-charcoal hover:border-ink"
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {s.status === "BAIKI" || s.catatan ? (
                        <input
                          className="input mt-2"
                          value={s.catatan}
                          disabled={dikunci}
                          maxLength={1000}
                          placeholder="Catatan pegawai (apa yang perlu dibaiki)"
                          onChange={(e) =>
                            setItem(it.id, { catatan: e.target.value })
                          }
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {tab === TAB_ULASAN ? (
        <section className="card grid gap-4 p-6">
          <div>
            <label className="label" htmlFor="kb-isu">
              Isu-isu
            </label>
            <textarea
              id="kb-isu"
              className="textarea"
              rows={3}
              value={isu}
              disabled={dikunci}
              maxLength={4000}
              onChange={(e) => setIsu(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="kb-ulasan">
              Ulasan dan cadangan pegawai
            </label>
            <textarea
              id="kb-ulasan"
              className="textarea"
              rows={3}
              value={ulasan}
              disabled={dikunci}
              maxLength={4000}
              onChange={(e) => setUlasan(e.target.value)}
            />
          </div>
        </section>
      ) : null}

      <NavBahagian
        sebelum={tabSebelum}
        seterus={tabSeterus}
        onPilih={bukaTab}
        akhir={<>Bahagian terakhir — pilih keputusan di bawah.</>}
      />

      {/* Telefon: di atas menu bawah admin; butang grid 2×2 supaya bar tidak menutup kandungan. */}
      <div className="card sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 space-y-2 p-3 shadow-modal sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0 sm:p-4 lg:bottom-4">
        <div className="min-w-0 text-sm">
          {mesej ? (
            <p
              className={`font-semibold ${mesej.ok ? "text-ink" : "text-bloom-deep"}`}
            >
              {mesej.teks}
            </p>
          ) : (
            <p className={`text-graphite ${dikunci ? "" : "hidden sm:block"}`}>
              {dikunci
                ? "Rekod disahkan dan dikunci."
                : "Simpan semakan bila-bila masa; keputusan boleh dibuat kemudian."}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Link
            href={`/cetak/kunjung-bantu?kod=${encodeURIComponent(props.schoolCode)}`}
            target="_blank"
            className="btn-outline-ink"
          >
            Cetak
          </Link>
          {dikunci ? (
            <button
              type="button"
              className="btn-outline-ink"
              disabled={sibuk}
              onClick={() => jalankan("BUKA")}
            >
              Buka semula
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-outline-ink"
                disabled={sibuk}
                onClick={() => jalankan("SIMPAN")}
              >
                Simpan
              </button>
              <button
                type="button"
                className="btn-outline-ink"
                disabled={sibuk}
                onClick={() => jalankan("BAIKI")}
              >
                Minta pembetulan
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={sibuk}
                onClick={() => jalankan("SAH")}
              >
                Sahkan berjaya
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
