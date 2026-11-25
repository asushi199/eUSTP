"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminSemakKunjungBantu, type TindakanSemakan } from "@/lib/actions/kunjung-bantu";
import {
  ASPEK,
  ITEM_DIISI,
  formatPeratus,
  isPautan,
  nilaiAuto,
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
  tarikhPenilaian: string;
  delima: DelimaSekolah | null;
};

const SAHKAN_MESEJ =
  "Sahkan instrumen sekolah ini sebagai BERJAYA? Rekod akan dikunci dan cop pengesahan dipaparkan pada cetakan.";

export default function SemakanPegawaiForm(props: Props) {
  const router = useRouter();
  const dikunci = props.status === "DISAHKAN";
  const [semakan, setSemakan] = useState<Semakan>(props.semakan);
  const [isu, setIsu] = useState(props.isu);
  const [ulasan, setUlasan] = useState(props.ulasanPegawai);
  const [namaPegawai, setNamaPegawai] = useState(props.namaPegawai);
  const [tarikh, setTarikh] = useState(props.tarikhPenilaian);
  const [mesej, setMesej] = useState<{ ok: boolean; teks: string } | null>(null);
  const [sibuk, start] = useTransition();

  function setItem(id: string, patch: Partial<{ status: StatusSemakItem | null; catatan: string }>) {
    setSemakan((prev) => {
      const lama = prev[id] ?? { status: null, catatan: "" };
      return { ...prev, [id]: { ...lama, ...patch } };
    });
  }

  function semuaSah() {
    setSemakan((prev) => {
      const out: Semakan = { ...prev };
      for (const it of ITEM_DIISI) {
        if (!out[it.id]?.status) out[it.id] = { status: "SAH", catatan: out[it.id]?.catatan ?? "" };
      }
      return out;
    });
  }

  function jalankan(tindakan: TindakanSemakan) {
    if (tindakan === "SAH" && !window.confirm(SAHKAN_MESEJ)) return;
    if (tindakan === "BUKA" && !window.confirm("Buka semula rekod ini? Cop pengesahan akan ditarik balik.")) return;
    setMesej(null);
    start(async () => {
      const r = await adminSemakKunjungBantu({
        schoolCode: props.schoolCode,
        tindakan,
        semakan,
        isu,
        ulasanPegawai: ulasan,
        namaPegawai,
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

  const bilBaiki = ITEM_DIISI.filter((it) => semakan[it.id]?.status === "BAIKI").length;
  const bilSah = ITEM_DIISI.filter((it) => semakan[it.id]?.status === "SAH").length;

  return (
    <div className="space-y-6">
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kb-pegawai">
            Nama pegawai penilai
          </label>
          <input
            id="kb-pegawai"
            className="input"
            value={namaPegawai}
            disabled={dikunci}
            maxLength={200}
            onChange={(e) => setNamaPegawai(e.target.value)}
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
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Semakan item</h2>
            <p className="text-sm text-graphite">
              {bilSah} disahkan · {bilBaiki} perlu dibaiki · {ITEM_DIISI.length - bilSah - bilBaiki} belum ditanda
            </p>
          </div>
          {!dikunci ? (
            <button type="button" className="btn-outline-ink" onClick={semuaSah}>
              Tanda baki sebagai disahkan
            </button>
          ) : null}
        </div>
        <div className="mt-4 space-y-4">
          {ASPEK.map((a) => (
            <div key={a.bil} className="card overflow-hidden">
              <div className="border-b hairline bg-cloud px-5 py-3">
                <p className="font-semibold text-ink">
                  {a.bil}. {a.tajuk}
                </p>
                {a.subtajuk ? <p className="text-xs text-graphite">{a.subtajuk}</p> : null}
              </div>
              <ul className="divide-y divide-fog">
                {a.items.map((it) => {
                  if (a.auto) {
                    const v = nilaiAuto(props.delima, it.id);
                    return (
                      <li key={it.id} className="flex items-baseline justify-between gap-4 px-5 py-3 text-sm">
                        <span>
                          <span className="mr-2 text-graphite">{it.no}</span>
                          {it.item}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {v ? `${formatPeratus(v.peratus)} (${v.aktif}/${v.jumlah})` : "—"}
                        </span>
                      </li>
                    );
                  }
                  const j = props.jawapan[it.id];
                  const s = semakan[it.id] ?? { status: null, catatan: "" };
                  return (
                    <li key={it.id} className={`px-5 py-3 ${s.status === "BAIKI" ? "bg-bloom-rose/30" : ""}`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 text-sm">
                          <p className="text-[15px] text-ink">
                            <span className="mr-2 font-semibold text-graphite">{it.no}</span>
                            {it.item}
                          </p>
                          <p className="mt-1">
                            Sekolah:{" "}
                            <span className={`font-semibold ${j?.ya ? "text-ink" : "text-graphite"}`}>
                              {j?.ya === true ? "Ya" : j?.ya === false ? "Tidak" : "—"}
                            </span>
                            {j?.catatan ? (
                              isPautan(j.catatan) ? (
                                <>
                                  {" · "}
                                  <a href={j.catatan} target="_blank" rel="noopener noreferrer" className="link-blue break-all">
                                    {j.catatan}
                                  </a>
                                </>
                              ) : (
                                <span className="text-charcoal"> · {j.catatan}</span>
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
                                onClick={() => setItem(it.id, { status: aktif ? null : nilai })}
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
                          onChange={(e) => setItem(it.id, { catatan: e.target.value })}
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

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

      <div className="card sticky bottom-4 z-10 flex flex-col gap-3 p-4 shadow-modal sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm">
          {mesej ? (
            <p className={`font-semibold ${mesej.ok ? "text-ink" : "text-bloom-deep"}`}>{mesej.teks}</p>
          ) : (
            <p className="text-graphite">
              {dikunci ? "Rekod disahkan dan dikunci." : "Simpan semakan bila-bila masa; keputusan boleh dibuat kemudian."}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/cetak/kunjung-bantu?kod=${encodeURIComponent(props.schoolCode)}`}
            target="_blank"
            className="btn-outline-ink"
          >
            Cetak
          </Link>
          {dikunci ? (
            <button type="button" className="btn-outline-ink" disabled={sibuk} onClick={() => jalankan("BUKA")}>
              Buka semula
            </button>
          ) : (
            <>
              <button type="button" className="btn-outline-ink" disabled={sibuk} onClick={() => jalankan("SIMPAN")}>
                Simpan
              </button>
              <button type="button" className="btn-outline-ink" disabled={sibuk} onClick={() => jalankan("BAIKI")}>
                Minta pembetulan
              </button>
              <button type="button" className="btn-primary" disabled={sibuk} onClick={() => jalankan("SAH")}>
                Sahkan berjaya
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
