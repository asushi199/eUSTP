"use client";

import { useState } from "react";
import FotoBuktiThumbs from "@/components/mjkd/FotoBuktiThumbs";
import PilihBacaKawalan from "@/components/mjkd/PilihBacaKawalan";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  isStatusMjkd,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
import {
  JENIS_SEKOLAH,
  labelJenisSekolah,
  type JenisSekolah,
} from "@/lib/mjkd/jenis-sekolah";
import { kiraStatus } from "@/lib/mjkd/ringkasan";
import { perkaraUntukSekolah } from "@/lib/mjkd/sasaran";
import type { DataMaklumBalasAdmin } from "@/lib/mjkd/admin-data";

type Props = {
  mesyuaratId: string;
  data: Pick<DataMaklumBalasAdmin, "perkara" | "sekolah" | "maklumBalas" | "items">;
  perkaraId: string;
  status: StatusMjkd | "";
  jenis: JenisSekolah | "";
};

/**
 * "Mengikut perkara" (admin). Semua data sudah dimuat oleh halaman, jadi bertukar perkara /
 * tapisan dibuat di pelayar — tiada navigasi pelayan (loading.tsx akan menggantikan halaman
 * dengan rangka dan melompat ke atas). URL dikemas kini dengan replaceState supaya muat semula
 * dan `router.refresh()` (★ Sorotan) kekal pada perkara yang sama.
 */
export default function AdminPaparanPerkara({ mesyuaratId, data, ...awal }: Props) {
  const [perkaraId, setPerkaraId] = useState(awal.perkaraId);
  const [status, setStatus] = useState<StatusMjkd | "">(awal.status);
  const [jenis, setJenis] = useState<JenisSekolah | "">(awal.jenis);

  const aktif = data.perkara.filter((p) => p.aktif);
  const perkara = aktif.find((p) => p.id === perkaraId) ?? aktif[0];

  function tukar(patch: { p?: string; status?: StatusMjkd | ""; jenis?: JenisSekolah | "" }) {
    const p = patch.p ?? perkara?.id ?? "";
    const s = patch.status ?? status;
    const j = patch.jenis ?? jenis;
    setPerkaraId(p);
    setStatus(s);
    setJenis(j);
    const q = new URLSearchParams({ tab: "maklum-balas", view: "perkara", p });
    if (s) q.set("status", s);
    if (j) q.set("jenis", j);
    window.history.replaceState(null, "", `/admin/mjkd/${mesyuaratId}?${q.toString()}`);
  }

  if (!perkara) {
    return <p className="card p-6 text-sm text-graphite">Belum ada perkara aktif.</p>;
  }

  const sekolahMengikutKod = new Map(data.sekolah.map((s) => [s.code, s]));
  const mbMengikutId = new Map(data.maklumBalas.map((m) => [m.id, m]));
  const semuaJawapan = data.items
    .filter((it) => it.perkaraId === perkara.id)
    .map((it) => {
      const mb = mbMengikutId.get(it.maklumBalasId)!;
      return { it, mb, sekolah: sekolahMengikutKod.get(mb.schoolCode) };
    })
    .filter((x) => x.sekolah);
  const bilangan = kiraStatus(semuaJawapan.map((x) => x.it));
  const dijangka = data.sekolah.filter(
    (s) => perkaraUntukSekolah([perkara], s).length > 0,
  ).length;

  // Sorotan (lajur `dipilih`) di atas; tanda sahaja — tidak menentukan susunan pembentangan.
  const dipilihSusun = semuaJawapan
    .filter((x) => x.it.dipilih)
    .sort((a, b) => a.mb.schoolCode.localeCompare(b.mb.schoolCode));

  const lulusTapis = (x: (typeof semuaJawapan)[number]) =>
    (!status || x.it.status === status) && (!jenis || x.sekolah!.jenis === jenis);
  const senarai = [
    ...dipilihSusun.filter(lulusTapis),
    ...semuaJawapan
      .filter((x) => !x.it.dipilih && lulusTapis(x))
      .sort((a, b) => a.mb.schoolCode.localeCompare(b.mb.schoolCode)),
  ];

  const kelasButang = (aktifKah: boolean) =>
    aktifKah ? "btn-ink btn-sm" : "btn-outline-ink btn-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {aktif.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => tukar({ p: p.id })}
            className={kelasButang(p.id === perkara.id)}
            aria-pressed={p.id === perkara.id}
            title={p.perkara}
          >
            {p.para}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-graphite">
          Para {perkara.para}
          {perkara.mukaSurat ? ` · m/s ${perkara.mukaSurat}` : ""}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">{perkara.perkara}</p>
        <p className="mt-2 text-sm text-graphite">
          <span className="font-medium text-charcoal">Tindakan:</span> {perkara.tindakan}
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {STATUS_MJKD.map((s) => (
            <li key={s} className="status-badge">
              {STATUS_MJKD_LABEL[s]} {bilangan[s]}
            </li>
          ))}
          <li className="status-badge">
            Belum menjawab {Math.max(dijangka - semuaJawapan.length, 0)}
          </li>
        </ul>
        <p className="mt-2 text-xs text-graphite">
          {semuaJawapan.length} / {dijangka} sekolah telah menjawab · {dipilihSusun.length} ★ Sorotan
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite">Status</span>
          <button
            type="button"
            className={kelasButang(!status)}
            aria-pressed={!status}
            onClick={() => tukar({ status: "" })}
          >
            Semua
          </button>
          {STATUS_MJKD.map((s) => (
            <button
              key={s}
              type="button"
              className={kelasButang(status === s)}
              aria-pressed={status === s}
              onClick={() => tukar({ status: s })}
            >
              {STATUS_MJKD_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-graphite">
            Jenis sekolah
          </span>
          <button
            type="button"
            className={kelasButang(!jenis)}
            aria-pressed={!jenis}
            onClick={() => tukar({ jenis: "" })}
          >
            Semua
          </button>
          {JENIS_SEKOLAH.map((j) => (
            <button
              key={j}
              type="button"
              className={kelasButang(jenis === j)}
              aria-pressed={jenis === j}
              onClick={() => tukar({ jenis: j })}
            >
              {labelJenisSekolah(j)}
            </button>
          ))}
        </div>
      </div>

      {senarai.length === 0 ? (
        <p className="card p-6 text-sm text-graphite">Tiada jawapan sepadan dengan tapisan.</p>
      ) : (
        <ul className="space-y-3">
          {senarai.map(({ it, mb, sekolah }) => (
            <li key={it.id} className={`card p-5 ${it.dipilih ? "border-ink" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">
                    {sekolah!.name}{" "}
                    <span className="font-mono text-xs font-normal text-graphite">
                      {sekolah!.code} · {labelJenisSekolah(sekolah!.jenis)} · {sekolah!.zone || "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-graphite">
                    {mb.namaPengisi} · {mb.jawatanPengisi}
                  </p>
                </div>
                <span className="status-badge">
                  {isStatusMjkd(it.status) ? STATUS_MJKD_LABEL[it.status] : it.status}
                </span>
              </div>
              {it.catatan ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">
                  {it.catatan}
                </p>
              ) : (
                <p className="mt-3 text-sm text-graphite">Tiada catatan.</p>
              )}
              {it.pautanBukti ? (
                <p className="mt-2 text-sm">
                  <a
                    href={it.pautanBukti}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-blue break-all"
                  >
                    Pautan bukti
                  </a>
                </p>
              ) : null}
              <FotoBuktiThumbs foto={it.fotoBukti} className="mt-3" />
              <div className="mt-4">
                <PilihBacaKawalan itemId={it.id} dipilih={it.dipilih} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
