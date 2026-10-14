"use client";

import { useCallback, useEffect, useState } from "react";
import { getKiraanKehadiranMjkd } from "@/lib/actions/mjkd-kehadiran";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  isStatusMjkd,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
import { urlBukaFotoBukti, urlFotoBukti } from "@/lib/mjkd/validation";
import type { KiraanKehadiran } from "@/lib/mjkd/kehadiran";
import type {
  ChipSekolah,
  Pembentangan,
  SlaidAnalisis,
  SlaidBahan,
  SlaidBahanIndeks,
  SlaidBahanItem,
  SlaidGrid,
  SlaidJawapan,
  SlaidKehadiran,
  SlaidKosong,
  SlaidMaklumBalas,
  SlaidMinit,
} from "@/lib/mjkd/pembentangan";

/**
 * Mod pembentangan MJKD 2026 (projektor). Reka bentuk "pentas" gelap — pengecualian reka bentuk
 * yang diluluskan pengurusan (acara seluruh daerah): latar #071c24, aksen emas, logo KPM/PPD.
 * Teks badan ≥ 28px pada 1920px; kontras putih-atas-gelap.
 */

type TabId = "kehadiran" | "minit" | "maklum-balas" | "bahan";

const TABS: { id: TabId; label: string; kunci: string }[] = [
  { id: "kehadiran", label: "Kehadiran", kunci: "1" },
  { id: "minit", label: "Minit", kunci: "2" },
  { id: "maklum-balas", label: "Maklum Balas", kunci: "3" },
  { id: "bahan", label: "Bahan", kunci: "4" },
];

/** Selang penyegaran kiraan kehadiran (milisaat) — hanya semasa tab Kehadiran kelihatan. */
const SELANG_KEHADIRAN_MS = 30_000;

const EMAS = "text-[#E3B341]";
const LOGO = "/mjkd/logo-kpm-ppd-manjung.png";

/** Saiz badan (mesti ≥ 28px pada skrin 1920px) — mengecil mengikut panjang teks. */
function saizTeks(panjang: number): string {
  if (panjang <= 200) return "text-[clamp(26px,2.6vw,56px)]";
  if (panjang <= 450) return "text-[clamp(24px,2.1vw,46px)]";
  if (panjang <= 900) return "text-[clamp(22px,1.7vw,36px)]";
  return "text-[clamp(22px,1.5vw,32px)]";
}

const LABEL = `text-[clamp(16px,1.25vw,28px)] font-semibold uppercase tracking-[0.14em] ${EMAS}`;
const TAJUK = "text-[clamp(34px,3.4vw,72px)] font-semibold leading-[1.08] tracking-tight";
/** Kad kaca atas latar gelap. */
const KACA = "rounded-[1.2vw] border border-white/10 bg-white/[0.05] backdrop-blur-sm";
const BUTANG_HANTU =
  "inline-flex items-center gap-2 rounded-full border border-white/20 px-[1.2vw] py-[0.7vh] text-[clamp(14px,1.05vw,22px)] font-semibold text-white/90 transition hover:border-white/50 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent";

/** Warna status (jelas atas projektor): hijau, ambar, merah, kelabu. */
const WARNA_STATUS: Record<StatusMjkd, string> = {
  SELESAI: "bg-emerald-500 text-white border-emerald-400",
  DALAM_PELAKSANAAN: "bg-amber-400 text-[#071c24] border-amber-300",
  BELUM: "bg-rose-500 text-white border-rose-400",
  TIDAK_BERKAITAN: "bg-slate-500 text-white border-slate-400",
};
const TEKS_STATUS: Record<StatusMjkd, string> = {
  SELESAI: "text-emerald-300",
  DALAM_PELAKSANAAN: "text-amber-300",
  BELUM: "text-rose-300",
  TIDAK_BERKAITAN: "text-slate-300",
};
const BAR_STATUS: Record<StatusMjkd, string> = {
  SELESAI: "bg-emerald-500",
  DALAM_PELAKSANAAN: "bg-amber-400",
  BELUM: "bg-rose-500",
  TIDAK_BERKAITAN: "bg-slate-500",
};

function Lencana({ status }: { status: string }) {
  const sah = isStatusMjkd(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-[1.4vw] py-[0.6vh] text-[clamp(20px,1.8vw,40px)] font-bold ${
        sah ? WARNA_STATUS[status] : "border-slate-400 bg-slate-500 text-white"
      }`}
    >
      {sah ? STATUS_MJKD_LABEL[status] : status}
    </span>
  );
}

/** Plak putih untuk logo (logo berteks hitam atas latar lutsinar). */
function PlakLogo({ besar = false, tengah = false }: { besar?: boolean; tengah?: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-[0.8vw] bg-white shadow-lg ${tengah ? "self-center" : "self-start"} ${
        besar ? "px-[1.6vw] py-[1.2vh]" : "px-[0.7vw] py-[0.5vh]"
      }`}
    >
      <img
        src={LOGO}
        alt="Kementerian Pendidikan Malaysia — Pejabat Pendidikan Daerah Manjung"
        className={besar ? "h-[11vh] w-auto" : "h-[4.2vh] min-h-7 w-auto"}
      />
    </span>
  );
}

/** Corak geometri halus (diilhamkan songket). */
function Corak() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
      <defs>
        <pattern id="mjkd-corak-pentas" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M28 2 54 28 28 54 2 28Z" fill="none" stroke="#E3B341" strokeWidth="1" />
          <path d="M28 16 40 28 28 40 16 28Z" fill="none" stroke="#fff" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mjkd-corak-pentas)" />
    </svg>
  );
}

/* --------------------------------- Kehadiran --------------------------------- */

function KiraanBesar({
  label,
  nilai,
  utama = false,
}: {
  label: string;
  nilai: string | number;
  utama?: boolean;
}) {
  return (
    <div className={`${KACA} px-[1.6vw] py-[1.6vh] ${utama ? "border-[#E3B341]/40 bg-[#E3B341]/[0.08]" : ""}`}>
      <p className="text-[clamp(15px,1.15vw,26px)] font-semibold uppercase tracking-[0.1em] text-white/60">
        {label}
      </p>
      <p
        className={`mt-[0.4vh] font-semibold tabular-nums leading-none ${
          utama ? `text-[clamp(44px,4.6vw,100px)] ${EMAS}` : "text-[clamp(34px,3.4vw,72px)]"
        }`}
      >
        {nilai}
      </p>
    </div>
  );
}

function SlaidKehadiranPaparan({
  slaid,
  kiraan,
  acara,
}: {
  slaid: SlaidKehadiran;
  kiraan: KiraanKehadiran;
  acara: Acara;
}) {
  return (
    <div className="grid min-h-full items-center gap-[4vw] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-[3vh]">
        <PlakLogo besar />
        <div>
          <p className={LABEL}>Pejabat Pendidikan Daerah Manjung</p>
          <h1 className="mt-[1.2vh] text-[clamp(40px,4.4vw,96px)] font-semibold leading-[1.04] tracking-tight">
            Mesyuarat Jawatankuasa Kurikulum Daerah{" "}
            <span className="bg-gradient-to-r from-[#F5D27A] to-[#E3B341] bg-clip-text text-transparent">
              2026
            </span>
          </h1>
          <p className="mt-[1.8vh] text-[clamp(20px,1.7vw,38px)] text-white/80">
            {acara.tarikh}
            {acara.tempat ? <span className="text-white/50"> · </span> : null}
            {acara.tempat}
          </p>
        </div>
        <div>
          <p className="mb-[1.2vh] text-[clamp(15px,1.15vw,26px)] text-white/60">
            Kiraan kehadiran hari ini · {slaid.hariLabel}
          </p>
          {/* "Lain-lain" hanya ditambah oleh admin (tab awam dibuang) — papar jika ada sahaja. */}
          <div className={`grid gap-[1vw] ${kiraan.lain > 0 ? "grid-cols-3" : "grid-cols-2"}`}>
            <KiraanBesar
              utama
              label="Sekolah"
              nilai={`${kiraan.sekolahHadir}/${kiraan.sekolahJumlah}`}
            />
            <KiraanBesar label="Pegawai PPD" nilai={kiraan.pegawai} />
            {kiraan.lain > 0 ? <KiraanBesar label="Lain-lain" nilai={kiraan.lain} /> : null}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-[2vh]">
        <p className="text-center text-[clamp(22px,2vw,44px)] font-semibold">
          Imbas untuk sahkan kehadiran
        </p>
        <div className="rounded-[1.6vw] bg-gradient-to-br from-[#F5D27A] to-[#E3B341] p-[0.6vw] shadow-[0_30px_80px_-30px_rgba(227,179,65,0.6)]">
          <img
            src={slaid.qr}
            alt="Kod QR kehadiran"
            className="aspect-square w-[min(50vh,34vw)] rounded-[1.1vw] bg-white p-[1vw]"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <p className="whitespace-nowrap text-center font-mono text-[clamp(14px,1.15vw,26px)] font-semibold text-white/85">
          {slaid.urlPendek}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------ Minit ------------------------------------ */

function SlaidMinitPaparan({ slaid }: { slaid: SlaidMinit }) {
  if (slaid.jenis === "tajuk") {
    return (
      <div className="flex min-h-full flex-col gap-[2.2vh]">
        <div className="flex flex-wrap items-end justify-between gap-[2vw]">
          <div>
            <p className={LABEL}>{slaid.nama}</p>
            <h1 className={`mt-[0.8vh] ${TAJUK}`}>{slaid.pengesahan}</h1>
            <p className="mt-[0.8vh] text-[clamp(20px,1.7vw,38px)] text-white/75">
              {slaid.tarikh}
              {slaid.tempat ? ` · ${slaid.tempat}` : ""}
            </p>
          </div>
          {slaid.minitUrl ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={slaid.muatTurunUrl}
                className="inline-flex items-center rounded-full bg-[#E3B341] px-[1.8vw] py-[1.1vh] text-[clamp(16px,1.3vw,30px)] font-bold text-[#071c24] hover:bg-[#F5D27A]"
              >
                Muat Turun Minit
              </a>
              <a
                href={slaid.minitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={BUTANG_HANTU}
              >
                Buka di tab baharu ↗
              </a>
            </div>
          ) : null}
        </div>
        {slaid.minitUrl ? (
          <div className="flex min-h-[60vh] flex-1 flex-col gap-2">
            <iframe
              title={slaid.pengesahan}
              src={slaid.minitUrl}
              className="min-h-[60vh] w-full flex-1 rounded-[1vw] border border-white/15 bg-white shadow-2xl"
            />
            <p className="text-[clamp(14px,1.05vw,22px)] text-white/50">
              Jika PDF tidak dipaparkan di sini, gunakan &quot;Buka di tab baharu&quot; atau
              &quot;Muat Turun Minit&quot;.
            </p>
          </div>
        ) : (
          <p className="text-[clamp(26px,2.4vw,52px)] text-white/80">Minit belum dimuat naik.</p>
        )}
      </div>
    );
  }
  return (
    <div className="mx-auto flex min-h-full max-w-[86vw] flex-col justify-center gap-[3.5vh]">
      <div className="flex flex-wrap items-center gap-[1vw]">
        <span className="rounded-full bg-[#E3B341] px-[1.4vw] py-[0.6vh] text-[clamp(20px,1.7vw,38px)] font-bold text-[#071c24]">
          Para {slaid.para}
        </span>
        {slaid.mukaSurat ? (
          <span className="text-[clamp(18px,1.4vw,30px)] text-white/55">m/s {slaid.mukaSurat}</span>
        ) : null}
      </div>
      <p className={`${saizTeks(slaid.perkara.length)} font-medium leading-snug text-white`}>
        {slaid.perkara}
      </p>
      <div className={`${KACA} border-l-[0.4vw] border-l-[#0E7490] px-[2vw] py-[2vh]`}>
        <p className={LABEL}>Tindakan</p>
        <p className="mt-[0.6vh] text-[clamp(26px,2.4vw,52px)] font-semibold">{slaid.tindakan}</p>
      </div>
    </div>
  );
}

/* ------------------------------- Maklum Balas ------------------------------- */

/** Bar bertindan status (lebar ikut bilangan dijangka). */
function BarStatus({ bilangan, dijangka }: { bilangan: Record<StatusMjkd, number>; dijangka: number }) {
  const jumlah = Math.max(dijangka, 1);
  return (
    <div className="flex h-[1.2vh] min-h-2 w-full overflow-hidden rounded-full bg-white/10">
      {STATUS_MJKD.map((s) =>
        bilangan[s] > 0 ? (
          <span
            key={s}
            className={BAR_STATUS[s]}
            style={{ width: `${(bilangan[s] / jumlah) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}

function Petunjuk({ bilangan }: { bilangan?: Record<StatusMjkd, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-[1.6vw] gap-y-1 text-[clamp(15px,1.15vw,26px)] text-white/80">
      {STATUS_MJKD.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`inline-block h-[1vw] min-h-3 w-[1vw] min-w-3 rounded-full ${BAR_STATUS[s]}`} aria-hidden />
          {STATUS_MJKD_LABEL[s]}
          {bilangan ? <span className="font-bold tabular-nums text-white">{bilangan[s]}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function SlaidAnalisisPaparan({ slaid }: { slaid: SlaidAnalisis }) {
  const { analisis } = slaid;
  const sel = "px-[0.9vw] py-[1vh]";
  const peratus = analisis.sekolahJumlah
    ? Math.round((analisis.sekolahDihantar / analisis.sekolahJumlah) * 100)
    : 0;
  return (
    <div className="flex min-h-full flex-col gap-[2.4vh]">
      <div className="flex flex-wrap items-end justify-between gap-[2vw]">
        <div>
          <p className={LABEL}>Analisis</p>
          <h1 className={`mt-[0.8vh] ${TAJUK}`}>{slaid.tajuk}</h1>
        </div>
        <div className={`${KACA} flex items-center gap-[1.4vw] px-[1.8vw] py-[1.4vh]`}>
          <p className={`text-[clamp(40px,4vw,88px)] font-semibold tabular-nums leading-none ${EMAS}`}>
            {analisis.sekolahDihantar}
            <span className="text-[0.5em] text-white/50">/{analisis.sekolahJumlah}</span>
          </p>
          <p className="text-[clamp(15px,1.15vw,26px)] leading-tight text-white/70">
            sekolah telah
            <br />
            menghantar ({peratus}%)
          </p>
        </div>
      </div>
      <Petunjuk />
      <div className={`${KACA} overflow-hidden`}>
        <table className="w-full border-collapse text-left text-[clamp(17px,1.35vw,30px)]">
          <thead>
            <tr className="bg-white/[0.06] text-[clamp(13px,1vw,22px)] uppercase tracking-[0.1em] text-white/60">
              <th className={sel}>Para</th>
              <th className={sel}>Perkara</th>
              {STATUS_MJKD.map((s) => (
                <th key={s} className={`${sel} text-right`}>
                  {STATUS_MJKD_LABEL[s]}
                </th>
              ))}
              <th className={`${sel} w-[16vw]`}>Dihantar</th>
            </tr>
          </thead>
          <tbody>
            {analisis.baris.map((b) => (
              <tr key={b.perkaraId} className="border-t border-white/10 align-middle">
                <td className={`${sel} whitespace-nowrap font-bold ${EMAS}`}>{b.para}</td>
                <td className={`${sel} text-white/90`}>{b.perkaraRingkas}</td>
                {STATUS_MJKD.map((s) => (
                  <td
                    key={s}
                    className={`${sel} text-right font-bold tabular-nums ${
                      b.bilangan[s] > 0 ? TEKS_STATUS[s] : "text-white/25"
                    }`}
                  >
                    {b.bilangan[s]}
                  </td>
                ))}
                <td className={sel}>
                  <p className="mb-[0.5vh] text-right font-bold tabular-nums">
                    {b.dihantar} / {b.dijangka}
                  </p>
                  <BarStatus bilangan={b.bilangan} dijangka={b.dijangka} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!slaid.adaPilihan ? (
        <p className="text-[clamp(15px,1.15vw,26px)] text-white/50">
          Belum ada jawapan dipilih untuk dibaca — pilih di tab Maklum Balas (halaman admin).
        </p>
      ) : null}
    </div>
  );
}

function Cip({ cip, onBuka }: { cip: ChipSekolah; onBuka: (c: ChipSekolah) => void }) {
  const sah = isStatusMjkd(cip.status);
  return (
    <button
      type="button"
      onClick={() => onBuka(cip)}
      className={`rounded-[0.7vw] border px-[0.9vw] py-[1vh] text-left text-[clamp(15px,1.2vw,26px)] font-semibold leading-snug shadow-sm transition hover:scale-[1.02] ${
        sah ? WARNA_STATUS[cip.status as StatusMjkd] : "border-slate-400 bg-slate-500 text-white"
      } ${cip.dipilih ? "ring-[0.25vw] ring-[#F5D27A] ring-offset-2 ring-offset-[#071c24]" : ""}`}
      aria-label={`${cip.nama} — ${sah ? STATUS_MJKD_LABEL[cip.status as StatusMjkd] : cip.status}${cip.dipilih ? " (dipilih)" : ""}`}
    >
      {cip.dipilih ? "★ " : ""}
      {cip.nama}
    </button>
  );
}

function SlaidGridPaparan({
  slaid,
  onBuka,
}: {
  slaid: SlaidGrid;
  onBuka: (c: ChipSekolah) => void;
}) {
  return (
    <div className="flex min-h-full flex-col gap-[2vh]">
      <div className="flex flex-wrap items-start justify-between gap-[2vw]">
        <div className="min-w-0 max-w-[62vw]">
          <div className="flex flex-wrap items-center gap-[1vw]">
            <span className="rounded-full bg-[#E3B341] px-[1.2vw] py-[0.5vh] text-[clamp(17px,1.4vw,32px)] font-bold text-[#071c24]">
              Para {slaid.para}
            </span>
            {slaid.mukaSurat ? (
              <span className="text-[clamp(15px,1.15vw,26px)] text-white/55">m/s {slaid.mukaSurat}</span>
            ) : null}
          </div>
          <p className="mt-[1vh] text-[clamp(20px,1.7vw,38px)] font-medium leading-snug">
            {slaid.perkaraRingkas}
          </p>
        </div>
        <div className={`${KACA} px-[1.6vw] py-[1.2vh] text-right`}>
          <p className={`text-[clamp(34px,3.2vw,70px)] font-semibold tabular-nums leading-none ${EMAS}`}>
            {slaid.dihantar}
            <span className="text-[0.5em] text-white/50">/{slaid.dijangka}</span>
          </p>
          <p className="mt-[0.5vh] text-[clamp(14px,1.05vw,22px)] text-white/65">sekolah menghantar</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-[1vw]">
        <Petunjuk bilangan={slaid.bilangan} />
        <p className="text-[clamp(15px,1.15vw,26px)] text-[#F5D27A]">
          ★ dipilih untuk dibaca ({slaid.bilDipilih})
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(18vw,260px),1fr))] gap-[0.8vw]">
        {slaid.chips.map((c) => (
          <Cip key={c.kod} cip={c} onBuka={onBuka} />
        ))}
      </div>
      <p className="text-[clamp(14px,1.05vw,22px)] text-white/45">
        Klik nama sekolah untuk memaparkan jawapannya.
      </p>
    </div>
  );
}

/** Gambar bukti (Drive) — klik untuk buka saiz penuh di tab baharu. */
function FotoBuktiPembentangan({ foto, lajur = false }: { foto: string[]; lajur?: boolean }) {
  if (foto.length === 0) return null;
  return (
    <div className={lajur ? "grid gap-[1vw]" : "mt-[2vh] flex flex-wrap gap-[1vw]"}>
      {foto.map((f) => (
        <a
          key={f}
          href={urlBukaFotoBukti(f)}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-[0.9vw] border border-white/15 bg-white/5 shadow-xl"
        >
          <img
            src={urlFotoBukti(f, 1200)}
            alt="Gambar bukti"
            referrerPolicy="no-referrer"
            className={lajur ? "max-h-[26vh] w-full object-cover" : "h-[22vh] w-auto object-cover"}
          />
        </a>
      ))}
    </div>
  );
}

function BlokJawapan({
  status,
  catatan,
  pautanBukti,
  fotoBukti,
}: {
  status: string;
  catatan: string;
  pautanBukti: string;
  fotoBukti: string[];
}) {
  const adaFoto = fotoBukti.length > 0;
  return (
    <div className={`grid gap-[2vw] ${adaFoto ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
      <div className="flex flex-col gap-[2.4vh]">
        <div>
          <Lencana status={status} />
        </div>
        <div className={`${KACA} px-[2vw] py-[2.2vh]`}>
          {catatan ? (
            <p className={`${saizTeks(catatan.length)} whitespace-pre-line leading-snug`}>{catatan}</p>
          ) : (
            <p className="text-[clamp(24px,2vw,44px)] text-white/55">Tiada catatan.</p>
          )}
        </div>
        {pautanBukti ? (
          <p className="break-all text-[clamp(17px,1.3vw,30px)] text-white/60">
            <span className={`font-semibold ${EMAS}`}>Bukti:</span> {pautanBukti}
          </p>
        ) : null}
      </div>
      {adaFoto ? <FotoBuktiPembentangan foto={fotoBukti} lajur /> : null}
    </div>
  );
}

function SlaidJawapanPaparan({ slaid }: { slaid: SlaidJawapan }) {
  return (
    <div className="flex min-h-full flex-col justify-center gap-[2.4vh]">
      <p className={LABEL}>
        Para {slaid.para} · Bacaan {slaid.nombor} / {slaid.daripada}
      </p>
      <h2 className="text-[clamp(40px,4vw,84px)] font-semibold leading-[1.05] tracking-tight">
        {slaid.namaSekolah}
      </h2>
      <BlokJawapan
        status={slaid.status}
        catatan={slaid.catatan}
        pautanBukti={slaid.pautanBukti}
        fotoBukti={slaid.fotoBukti}
      />
    </div>
  );
}

function OverlayCip({ cip, para, onTutup }: { cip: ChipSekolah; para: string; onTutup: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020b0f]/80 p-[3vw] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Jawapan ${cip.nama}`}
      onClick={onTutup}
    >
      <div
        className="max-h-full w-full max-w-[90vw] overflow-y-auto rounded-[1.4vw] border border-white/15 bg-[#0b2530] p-[3vw] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <p className={LABEL}>Para {para}</p>
          <button type="button" onClick={onTutup} className={BUTANG_HANTU}>
            Tutup (Esc)
          </button>
        </div>
        <h2 className="mt-[1vh] text-[clamp(36px,3.6vw,76px)] font-semibold leading-tight tracking-tight">
          {cip.dipilih ? <span className="text-[#F5D27A]">★ </span> : null}
          {cip.nama}
        </h2>
        {cip.namaPengisi ? (
          <p className="mt-[0.6vh] text-[clamp(16px,1.25vw,28px)] text-white/60">
            Diisi oleh {cip.namaPengisi}
            {cip.jawatanPengisi ? `, ${cip.jawatanPengisi}` : ""}
          </p>
        ) : null}
        <div className="mt-[2.4vh]">
          <BlokJawapan
            status={cip.status}
            catatan={cip.catatan}
            pautanBukti={cip.pautanBukti}
            fotoBukti={cip.fotoBukti}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ Bahan ------------------------------------ */

function SlaidBahanIndeksPaparan({
  slaid,
  onPilih,
}: {
  slaid: SlaidBahanIndeks;
  onPilih: (indeks: number) => void;
}) {
  return (
    <div className="flex min-h-full flex-col gap-[2.6vh]">
      <div>
        <p className={LABEL}>Bahan pembentangan</p>
        <h1 className={`mt-[0.8vh] ${TAJUK}`}>Bahan MJKD 2026</h1>
      </div>
      {slaid.kumpulan.map((k) => (
        <section key={k.hari}>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-[1vw] py-[0.4vh] text-[clamp(15px,1.15vw,26px)] font-semibold">
            <span className="h-[0.6vw] min-h-2 w-[0.6vw] min-w-2 rounded-full bg-[#E3B341]" aria-hidden />
            {k.label}
          </p>
          <div className="mt-[1.4vh] grid gap-[1.6vh]">
            {k.sektor.map((s) => (
              <div key={s.sektorUnit}>
                <p className="text-[clamp(20px,1.7vw,38px)] font-semibold">{s.sektorUnit}</p>
                <ul className="mt-[0.8vh] grid grid-cols-[repeat(auto-fill,minmax(min(28vw,420px),1fr))] gap-[0.8vw]">
                  {s.bahan.map((b) => (
                    <li key={`${k.hari}-${b.id}`}>
                      <button
                        type="button"
                        onClick={() => onPilih(b.slaid)}
                        className={`${KACA} flex h-full w-full items-center gap-[1vw] px-[1.2vw] py-[1.4vh] text-left transition hover:border-[#E3B341]/60 hover:bg-white/[0.09]`}
                      >
                        <span className="flex h-[5vh] min-h-9 w-[5vh] min-w-9 shrink-0 items-center justify-center rounded-[0.6vw] bg-[#E3B341] text-[clamp(14px,1.1vw,24px)] font-bold text-[#071c24]">
                          ▶
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[clamp(18px,1.45vw,32px)] font-semibold leading-snug">
                            {b.tajuk}
                          </span>
                          <span className="block text-[clamp(14px,1.05vw,22px)] text-white/60">
                            {b.namaPembentang}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SlaidBahanItemPaparan({ slaid }: { slaid: SlaidBahanItem }) {
  return (
    <div className="flex min-h-full flex-col gap-[1.8vh]">
      <div className="flex flex-wrap items-end justify-between gap-[2vw]">
        <div className="min-w-0">
          <p className={LABEL}>
            {slaid.sektorUnit} · {slaid.hariLabel} · {slaid.nombor} / {slaid.daripada}
          </p>
          <h1 className="mt-[0.6vh] text-[clamp(30px,3vw,64px)] font-semibold leading-tight tracking-tight">
            {slaid.tajuk}
          </h1>
          <p className="text-[clamp(18px,1.5vw,34px)] text-white/70">{slaid.namaPembentang}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={slaid.bukaUrl} target="_blank" rel="noopener noreferrer" className={BUTANG_HANTU}>
            Buka di tab baharu ↗
          </a>
          {slaid.muatTurunUrl ? (
            <a href={slaid.muatTurunUrl} className={BUTANG_HANTU}>
              Muat Turun
            </a>
          ) : null}
        </div>
      </div>
      {slaid.embedUrl ? (
        <iframe
          title={slaid.tajuk}
          src={slaid.embedUrl}
          allow="fullscreen"
          allowFullScreen
          className="min-h-[62vh] w-full flex-1 rounded-[1vw] border border-white/15 bg-white shadow-2xl"
        />
      ) : (
        <div className={`${KACA} flex flex-1 flex-col items-center justify-center gap-[2vh] text-center`}>
          <p className="text-[clamp(26px,2.4vw,52px)] text-white/80">
            Bahan ini tidak boleh dipaparkan di sini. Gunakan &quot;Buka di tab baharu&quot;.
          </p>
        </div>
      )}
    </div>
  );
}

function SlaidKosongPaparan({ slaid }: { slaid: SlaidKosong }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-[3vh] text-center">
      <PlakLogo besar tengah />
      <h2 className={TAJUK}>{slaid.tajuk}</h2>
      <p className="max-w-[70vw] text-[clamp(24px,2.2vw,48px)] leading-snug text-white/70">
        {slaid.mesej}
      </p>
    </div>
  );
}

/* ---------------------------------- Komponen ---------------------------------- */

type SlaidSemua = SlaidKehadiran | SlaidMinit | SlaidMaklumBalas | SlaidBahan;

/** Maklumat acara untuk slaid pembuka (tarikh dalam teks, tempat). */
export type Acara = { tarikh: string; tempat: string };

export default function PembentanganMjkd({
  mesyuaratId,
  pembentangan,
  acara,
}: {
  mesyuaratId: string;
  pembentangan: Pembentangan;
  acara: Acara;
}) {
  const [sedangKeluar, setSedangKeluar] = useState(false);
  const [tab, setTab] = useState<TabId>("kehadiran");
  const [indeks, setIndeks] = useState<Record<TabId, number>>({
    kehadiran: 0,
    minit: 0,
    "maklum-balas": 0,
    bahan: 0,
  });
  const [skrinPenuh, setSkrinPenuh] = useState(false);
  const [cipTerbuka, setCipTerbuka] = useState<{ cip: ChipSekolah; para: string } | null>(null);
  const [kiraan, setKiraan] = useState<KiraanKehadiran | null>(null);

  const senarai: SlaidSemua[] =
    tab === "kehadiran"
      ? pembentangan.kehadiran
      : tab === "minit"
        ? pembentangan.minit
        : tab === "maklum-balas"
          ? pembentangan.maklumBalas
          : pembentangan.bahan;
  const jumlah = senarai.length;
  const semasa = Math.min(indeks[tab], Math.max(jumlah - 1, 0));
  const slaid = senarai[semasa];

  const gerak = useCallback(
    (delta: number) => {
      setCipTerbuka(null);
      setIndeks((prev) => {
        const maks = Math.max(senarai.length - 1, 0);
        const seterusnya = Math.min(Math.max(prev[tab] + delta, 0), maks);
        return { ...prev, [tab]: seterusnya };
      });
    },
    [senarai.length, tab],
  );

  const keSlaid = useCallback(
    (n: number) => {
      setCipTerbuka(null);
      setIndeks((prev) => ({ ...prev, [tab]: n }));
    },
    [tab],
  );

  const tukarTab = useCallback((t: TabId) => {
    setCipTerbuka(null);
    setTab(t);
  }, []);

  // Navigasi penuh (bukan router.push/Link): lapisan pembentangan menutup seluruh skrin dan tiada
  // loading.tsx, jadi navigasi klien yang menunggu halaman admin (atau tindakan pelayan kiraan
  // kehadiran yang sedang berjalan) kelihatan "tiada reaksi". Pelayar terus memaparkan kemajuan.
  const keluar = useCallback(() => {
    setSedangKeluar(true);
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      /* Fullscreen API tidak tersedia */
    }
    window.location.assign(`/admin/mjkd/${mesyuaratId}`);
  }, [mesyuaratId]);

  const togolSkrinPenuh = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      } else {
        void document.documentElement.requestFullscreen().catch(() => undefined);
      }
    } catch {
      /* Fullscreen API tidak tersedia */
    }
  }, []);

  useEffect(() => {
    const onFullscreen = () => setSkrinPenuh(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  // Segarkan kiraan kehadiran setiap 30 saat, hanya semasa tab Kehadiran dipaparkan dan halaman kelihatan.
  useEffect(() => {
    if (tab !== "kehadiran") return;
    let batal = false;
    async function segar() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await getKiraanKehadiranMjkd(mesyuaratId);
        if (!batal && res.ok && res.kiraan) setKiraan(res.kiraan);
      } catch {
        /* kekalkan kiraan terakhir */
      }
    }
    void segar();
    const t = window.setInterval(() => void segar(), SELANG_KEHADIRAN_MS);
    const onVisible = () => void segar();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      batal = true;
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tab, mesyuaratId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          gerak(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          gerak(-1);
          break;
        case "1":
          tukarTab("kehadiran");
          break;
        case "2":
          tukarTab("minit");
          break;
        case "3":
          tukarTab("maklum-balas");
          break;
        case "4":
          tukarTab("bahan");
          break;
        case "Escape":
          // Tutup lapisan jawapan dahulu; tekan lagi untuk keluar.
          if (cipTerbuka) setCipTerbuka(null);
          else keluar();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gerak, keluar, tukarTab, cipTerbuka]);

  function isi(s: SlaidSemua) {
    switch (s.jenis) {
      case "kehadiran":
        return <SlaidKehadiranPaparan slaid={s} kiraan={kiraan ?? s.kiraan} acara={acara} />;
      case "tajuk":
      case "perkara":
        return <SlaidMinitPaparan slaid={s} />;
      case "analisis":
        return <SlaidAnalisisPaparan slaid={s} />;
      case "grid":
        return (
          <SlaidGridPaparan slaid={s} onBuka={(cip) => setCipTerbuka({ cip, para: s.para })} />
        );
      case "jawapan":
        return <SlaidJawapanPaparan slaid={s} />;
      case "bahan-indeks":
        return <SlaidBahanIndeksPaparan slaid={s} onPilih={keSlaid} />;
      case "bahan":
        return <SlaidBahanItemPaparan slaid={s} />;
      case "kosong":
        return <SlaidKosongPaparan slaid={s} />;
    }
  }

  const kemajuan = jumlah === 0 ? 0 : ((semasa + 1) / jumlah) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#071c24] text-white">
      {/* Latar pentas */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_100%_0%,rgba(14,116,144,0.55)_0%,transparent_70%),radial-gradient(60%_60%_at_0%_100%,rgba(18,59,74,0.9)_0%,transparent_70%)]"
        aria-hidden
      />
      <Corak />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-[2vw] py-[1.2vh]">
        <div className="flex items-center gap-[1.2vw]">
          <PlakLogo />
          <div className="hidden leading-tight sm:block">
            <p className={`text-[clamp(14px,1.05vw,22px)] font-bold tracking-[0.12em] ${EMAS}`}>
              MJKD 2026
            </p>
            <p className="text-[clamp(12px,0.85vw,18px)] text-white/55">{acara.tarikh}</p>
          </div>
        </div>
        <nav
          aria-label="Bahagian pembentangan"
          className="flex flex-wrap gap-1 rounded-full border border-white/10 bg-white/[0.05] p-[0.35vw]"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              className={`rounded-full px-[1.3vw] py-[0.7vh] text-[clamp(14px,1.1vw,24px)] font-semibold transition ${
                tab === t.id
                  ? "bg-[#E3B341] text-[#071c24] shadow"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => tukarTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-[0.8vw]">
          <span
            className="text-[clamp(14px,1.1vw,24px)] font-semibold tabular-nums text-white/70"
            aria-live="polite"
          >
            {jumlah === 0 ? 0 : semasa + 1} / {jumlah}
          </span>
          <button type="button" className={BUTANG_HANTU} onClick={togolSkrinPenuh}>
            {skrinPenuh ? "Keluar skrin penuh" : "Skrin penuh"}
          </button>
          <button type="button" className={BUTANG_HANTU} onClick={keluar} disabled={sedangKeluar}>
            {sedangKeluar ? "Keluar…" : "Keluar"}
          </button>
        </div>
      </header>
      <div className="relative h-[3px] bg-white/5" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-[#E3B341] to-[#F5D27A] transition-[width] duration-300"
          style={{ width: `${kemajuan}%` }}
        />
      </div>

      <main
        key={`${tab}-${semasa}`}
        className="relative min-h-0 flex-1 overflow-y-auto px-[4vw] py-[3vh] motion-safe:animate-[mjkd-masuk_320ms_ease-out]"
      >
        {slaid ? isi(slaid) : null}
      </main>

      <footer className="relative flex items-center justify-between border-t border-white/10 px-[2vw] py-[1.1vh]">
        <button
          type="button"
          className={BUTANG_HANTU}
          disabled={semasa === 0}
          onClick={() => gerak(-1)}
        >
          ← Sebelum
        </button>
        <span className="text-[clamp(12px,0.9vw,20px)] text-white/40">
          ← → slaid · 1 / 2 / 3 / 4 bahagian · Esc keluar
        </span>
        <button
          type="button"
          className={BUTANG_HANTU}
          disabled={semasa >= jumlah - 1}
          onClick={() => gerak(1)}
        >
          Seterusnya →
        </button>
      </footer>

      {cipTerbuka ? (
        <OverlayCip
          cip={cipTerbuka.cip}
          para={cipTerbuka.para}
          onTutup={() => setCipTerbuka(null)}
        />
      ) : null}

      <style>{`@keyframes mjkd-masuk{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
