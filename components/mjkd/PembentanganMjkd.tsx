"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getKiraanKehadiranMjkd } from "@/lib/actions/mjkd-kehadiran";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  isStatusMjkd,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
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

type TabId = "kehadiran" | "minit" | "maklum-balas" | "bahan";

const TABS: { id: TabId; label: string; kunci: string }[] = [
  { id: "kehadiran", label: "Kehadiran", kunci: "1" },
  { id: "minit", label: "Minit", kunci: "2" },
  { id: "maklum-balas", label: "Maklum Balas", kunci: "3" },
  { id: "bahan", label: "Bahan", kunci: "4" },
];

/** Selang penyegaran kiraan kehadiran (milisaat) — hanya semasa tab Kehadiran kelihatan. */
const SELANG_KEHADIRAN_MS = 30_000;

/** Saiz badan (mesti ≥ 28px pada skrin 1920px) — mengecil mengikut panjang teks. */
function saizTeks(panjang: number): string {
  if (panjang <= 200) return "text-[clamp(26px,2.6vw,56px)]";
  if (panjang <= 450) return "text-[clamp(24px,2.1vw,46px)]";
  if (panjang <= 900) return "text-[clamp(22px,1.7vw,36px)]";
  return "text-[clamp(22px,1.5vw,32px)]";
}

const LABEL = "text-[clamp(18px,1.4vw,30px)] font-semibold uppercase tracking-[0.08em] text-neutral-700";
const TAJUK = "text-[clamp(34px,3.4vw,72px)] font-bold leading-tight";

const WARNA_LENCANA: Record<StatusMjkd, string> = {
  SELESAI: "bg-primary text-white",
  DALAM_PELAKSANAAN: "bg-storm-deep text-white",
  BELUM: "bg-bloom-deep text-white",
  TIDAK_BERKAITAN: "bg-graphite text-white",
};

/** Cip sekolah: tanpa biru (banyak cip serentak). */
const WARNA_CIP: Record<StatusMjkd, string> = {
  SELESAI: "bg-storm-deep text-white border-storm-deep",
  DALAM_PELAKSANAAN: "bg-storm-mist text-black border-storm-mist",
  BELUM: "bg-bloom-deep text-white border-bloom-deep",
  TIDAK_BERKAITAN: "bg-neutral-200 text-black border-neutral-400",
};

function Lencana({ status }: { status: string }) {
  const sah = isStatusMjkd(status);
  return (
    <span
      className={`inline-block rounded-full px-[1.4vw] py-[0.6vh] text-[clamp(22px,2vw,44px)] font-bold ${
        sah ? WARNA_LENCANA[status] : "bg-graphite text-white"
      }`}
    >
      {sah ? STATUS_MJKD_LABEL[status] : status}
    </span>
  );
}

/* --------------------------------- Kehadiran --------------------------------- */

function KiraanBesar({ label, nilai }: { label: string; nilai: string | number }) {
  return (
    <div className="rounded-lg border-2 border-black px-[1.2vw] py-[1vh]">
      <p className="text-[clamp(16px,1.3vw,28px)] font-semibold text-neutral-700">{label}</p>
      <p className="text-[clamp(32px,3.4vw,72px)] font-bold tabular-nums leading-tight">{nilai}</p>
    </div>
  );
}

function SlaidKehadiranPaparan({
  slaid,
  kiraan,
}: {
  slaid: SlaidKehadiran;
  kiraan: KiraanKehadiran;
}) {
  return (
    <div className="flex min-h-full flex-col gap-[2vh]">
      <div>
        <h1 className={TAJUK}>{slaid.tajuk}</h1>
        <p className="text-[clamp(22px,2vw,44px)] text-neutral-700">
          Kiraan hari ini · {slaid.hariLabel}
        </p>
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-center gap-[4vw]">
        <div className="flex flex-col items-center gap-[1.5vh]">
          <img
            src={slaid.qr}
            alt="Kod QR kehadiran"
            className="aspect-square w-[min(52vh,38vw)] bg-white"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="break-all text-center font-mono text-[clamp(22px,2vw,44px)] font-bold">
            {slaid.urlPendek}
          </p>
        </div>
        <div className="grid min-w-[30vw] gap-[1.5vh]">
          <KiraanBesar
            label="Sekolah hadir"
            nilai={`${kiraan.sekolahHadir} / ${kiraan.sekolahJumlah}`}
          />
          <KiraanBesar label="Pegawai PPD" nilai={kiraan.pegawai} />
          <KiraanBesar label="Lain-lain" nilai={kiraan.lain} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ Minit ------------------------------------ */

function SlaidMinitPaparan({ slaid }: { slaid: SlaidMinit }) {
  if (slaid.jenis === "tajuk") {
    return (
      <div className="flex min-h-full flex-col gap-[2vh]">
        <div className="flex flex-wrap items-end justify-between gap-[2vw]">
          <div>
            <p className={LABEL}>{slaid.nama}</p>
            <h1 className="text-[clamp(34px,3.6vw,76px)] font-bold leading-tight">
              {slaid.pengesahan}
            </h1>
            <p className="text-[clamp(22px,2vw,44px)]">
              {slaid.tarikh}
              {slaid.tempat ? ` · ${slaid.tempat}` : ""}
            </p>
          </div>
          {slaid.minitUrl ? (
            <div className="flex flex-wrap gap-3">
              <a
                href={slaid.muatTurunUrl}
                className="inline-flex items-center rounded-md bg-primary px-[1.8vw] py-[1.2vh] text-[clamp(20px,1.6vw,36px)] font-semibold text-white hover:bg-primary-bright"
              >
                Muat Turun Minit
              </a>
              <a
                href={slaid.minitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-md border-2 border-black px-[1.8vw] py-[1.2vh] text-[clamp(20px,1.6vw,36px)] font-semibold"
              >
                Buka di tab baharu
              </a>
            </div>
          ) : null}
        </div>
        {slaid.minitUrl ? (
          <div className="flex min-h-[60vh] flex-1 flex-col gap-2">
            <iframe
              title={slaid.pengesahan}
              src={slaid.minitUrl}
              className="min-h-[60vh] w-full flex-1 rounded border-2 border-black bg-neutral-100"
            />
            <p className="text-[clamp(16px,1.2vw,26px)] text-neutral-700">
              Jika PDF tidak dipaparkan di sini, gunakan &quot;Buka di tab baharu&quot; atau
              &quot;Muat Turun Minit&quot;.
            </p>
          </div>
        ) : (
          <p className="text-[clamp(26px,2.4vw,52px)]">Minit belum dimuat naik.</p>
        )}
      </div>
    );
  }
  return (
    <div className="flex min-h-full flex-col justify-center gap-[3vh]">
      <p className={LABEL}>
        Para {slaid.para}
        {slaid.mukaSurat ? ` · m/s ${slaid.mukaSurat}` : ""}
      </p>
      <p className={`${saizTeks(slaid.perkara.length)} font-medium leading-snug`}>
        {slaid.perkara}
      </p>
      <div className="border-l-[0.5vw] border-black pl-[1.6vw]">
        <p className={LABEL}>Tindakan</p>
        <p className="mt-1 text-[clamp(26px,2.4vw,52px)] font-semibold">{slaid.tindakan}</p>
      </div>
    </div>
  );
}

/* ------------------------------- Maklum Balas ------------------------------- */

function SlaidAnalisisPaparan({ slaid }: { slaid: SlaidAnalisis }) {
  const { analisis } = slaid;
  const sel = "px-[0.8vw] py-[0.8vh]";
  return (
    <div className="flex min-h-full flex-col gap-[2vh]">
      <div className="flex flex-wrap items-end justify-between gap-[2vw]">
        <h1 className="text-[clamp(30px,3vw,64px)] font-bold leading-tight">{slaid.tajuk}</h1>
        <p className="text-[clamp(24px,2.2vw,48px)] font-bold tabular-nums">
          Sekolah telah menghantar: {analisis.sekolahDihantar} / {analisis.sekolahJumlah}
        </p>
      </div>
      <table className="w-full border-collapse text-left text-[clamp(18px,1.4vw,30px)]">
        <thead>
          <tr className="border-b-2 border-black text-[clamp(16px,1.2vw,26px)] uppercase tracking-wide">
            <th className={sel}>Para</th>
            <th className={sel}>Perkara</th>
            {STATUS_MJKD.map((s) => (
              <th key={s} className={`${sel} text-right`}>
                {STATUS_MJKD_LABEL[s]}
              </th>
            ))}
            <th className={`${sel} text-right`}>Dihantar</th>
          </tr>
        </thead>
        <tbody>
          {analisis.baris.map((b) => (
            <tr key={b.perkaraId} className="border-b border-neutral-300 align-top">
              <td className={`${sel} whitespace-nowrap font-bold`}>{b.para}</td>
              <td className={sel}>{b.perkaraRingkas}</td>
              {STATUS_MJKD.map((s) => (
                <td key={s} className={`${sel} text-right font-semibold tabular-nums`}>
                  {b.bilangan[s]}
                </td>
              ))}
              <td className={`${sel} whitespace-nowrap text-right font-bold tabular-nums`}>
                {b.dihantar} / {b.dijangka}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!slaid.adaPilihan ? (
        <p className="text-[clamp(18px,1.4vw,30px)] text-neutral-700">
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
      className={`rounded-lg border-2 px-[0.9vw] py-[0.9vh] text-left text-[clamp(16px,1.25vw,26px)] font-semibold leading-snug ${
        sah ? WARNA_CIP[cip.status as StatusMjkd] : "bg-neutral-200 text-black border-neutral-400"
      } ${cip.dipilih ? "ring-4 ring-black ring-offset-2" : ""}`}
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
      <div>
        <p className={LABEL}>
          Para {slaid.para}
          {slaid.mukaSurat ? ` · m/s ${slaid.mukaSurat}` : ""}
        </p>
        <p className="text-[clamp(22px,1.8vw,40px)] font-medium leading-snug">
          {slaid.perkaraRingkas}
        </p>
        <p className="mt-1 text-[clamp(22px,2vw,44px)] font-bold">
          {slaid.dihantar} daripada {slaid.dijangka} sekolah telah menghantar
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-[1.5vw] gap-y-1 text-[clamp(16px,1.3vw,28px)]">
          {STATUS_MJKD.map((s) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`inline-block h-[1.3vw] min-h-4 w-[1.3vw] min-w-4 rounded border-2 ${WARNA_CIP[s]}`}
                aria-hidden
              />
              {STATUS_MJKD_LABEL[s]} {slaid.bilangan[s]}
            </li>
          ))}
          <li>★ dipilih untuk dibaca ({slaid.bilDipilih})</li>
        </ul>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(18vw,260px),1fr))] gap-[0.8vw]">
        {slaid.chips.map((c) => (
          <Cip key={c.kod} cip={c} onBuka={onBuka} />
        ))}
      </div>
      <p className="text-[clamp(16px,1.2vw,26px)] text-neutral-700">
        Klik nama sekolah untuk memaparkan jawapannya.
      </p>
    </div>
  );
}

function SlaidJawapanPaparan({ slaid }: { slaid: SlaidJawapan }) {
  return (
    <div className="flex min-h-full flex-col justify-center gap-[3vh]">
      <p className={LABEL}>
        Para {slaid.para} · {slaid.nombor} / {slaid.daripada}
      </p>
      <h2 className="text-[clamp(40px,4vw,84px)] font-bold leading-tight">{slaid.namaSekolah}</h2>
      <div>
        <Lencana status={slaid.status} />
      </div>
      {slaid.catatan ? (
        <p className={`${saizTeks(slaid.catatan.length)} whitespace-pre-line leading-snug`}>
          {slaid.catatan}
        </p>
      ) : (
        <p className="text-[clamp(24px,2vw,44px)] text-neutral-700">Tiada catatan.</p>
      )}
      {slaid.pautanBukti ? (
        <p className="break-all text-[clamp(22px,1.6vw,34px)] text-neutral-700">
          Bukti: {slaid.pautanBukti}
        </p>
      ) : null}
    </div>
  );
}

function OverlayCip({ cip, para, onTutup }: { cip: ChipSekolah; para: string; onTutup: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-[3vw]"
      role="dialog"
      aria-modal="true"
      aria-label={`Jawapan ${cip.nama}`}
      onClick={onTutup}
    >
      <div
        className="max-h-full w-full max-w-[88vw] overflow-y-auto rounded-xl bg-white p-[3vw] text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <p className={LABEL}>Para {para}</p>
          <button
            type="button"
            onClick={onTutup}
            className="rounded border-2 border-black px-[1vw] py-[0.6vh] text-[clamp(16px,1.2vw,26px)] font-semibold"
          >
            Tutup (Esc)
          </button>
        </div>
        <h2 className="mt-2 text-[clamp(36px,3.6vw,76px)] font-bold leading-tight">
          {cip.dipilih ? "★ " : ""}
          {cip.nama}
        </h2>
        <div className="mt-[2vh]">
          <Lencana status={cip.status} />
        </div>
        {cip.catatan ? (
          <p className={`mt-[2vh] ${saizTeks(cip.catatan.length)} whitespace-pre-line leading-snug`}>
            {cip.catatan}
          </p>
        ) : (
          <p className="mt-[2vh] text-[clamp(24px,2vw,44px)] text-neutral-700">Tiada catatan.</p>
        )}
        {cip.pautanBukti ? (
          <p className="mt-[2vh] break-all text-[clamp(22px,1.6vw,34px)] text-neutral-700">
            Bukti: {cip.pautanBukti}
          </p>
        ) : null}
        {cip.namaPengisi ? (
          <p className="mt-[2vh] text-[clamp(18px,1.4vw,30px)] text-neutral-700">
            Diisi oleh {cip.namaPengisi}
            {cip.jawatanPengisi ? `, ${cip.jawatanPengisi}` : ""}
          </p>
        ) : null}
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
    <div className="flex min-h-full flex-col gap-[2vh]">
      <h1 className={TAJUK}>Bahan MJKD</h1>
      {slaid.kumpulan.map((k) => (
        <section key={k.hari}>
          <h2 className={LABEL}>{k.label}</h2>
          <div className="mt-2 space-y-[1.5vh]">
            {k.sektor.map((s) => (
              <div key={s.sektorUnit}>
                <p className="text-[clamp(22px,1.9vw,42px)] font-bold">{s.sektorUnit}</p>
                <ul className="mt-1 grid gap-[0.8vh]">
                  {s.bahan.map((b) => (
                    <li key={`${k.hari}-${b.id}`}>
                      <button
                        type="button"
                        onClick={() => onPilih(b.slaid)}
                        className="w-full rounded-lg border-2 border-black px-[1.2vw] py-[1vh] text-left text-[clamp(20px,1.6vw,34px)] font-semibold hover:bg-neutral-100"
                      >
                        {b.tajuk}
                        <span className="ml-3 text-[clamp(16px,1.2vw,26px)] font-normal text-neutral-700">
                          {b.namaPembentang}
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
    <div className="flex min-h-full flex-col gap-[1.5vh]">
      <div className="flex flex-wrap items-end justify-between gap-[2vw]">
        <div className="min-w-0">
          <p className={LABEL}>
            {slaid.sektorUnit} · {slaid.hariLabel} · {slaid.nombor} / {slaid.daripada}
          </p>
          <h1 className="text-[clamp(30px,3vw,64px)] font-bold leading-tight">{slaid.tajuk}</h1>
          <p className="text-[clamp(20px,1.8vw,40px)]">{slaid.namaPembentang}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={slaid.bukaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border-2 border-black px-[1.6vw] py-[1.1vh] text-[clamp(18px,1.5vw,32px)] font-semibold"
          >
            Buka di tab baharu
          </a>
          {slaid.muatTurunUrl ? (
            <a
              href={slaid.muatTurunUrl}
              className="inline-flex items-center rounded-md border-2 border-black px-[1.6vw] py-[1.1vh] text-[clamp(18px,1.5vw,32px)] font-semibold"
            >
              Muat Turun
            </a>
          ) : null}
        </div>
      </div>
      {slaid.embedUrl ? (
        <iframe
          title={slaid.tajuk}
          src={slaid.embedUrl}
          allowFullScreen
          className="min-h-[62vh] w-full flex-1 rounded border-2 border-black bg-neutral-100"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-[2vh] text-center">
          <p className="text-[clamp(26px,2.4vw,52px)]">
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
      <h2 className={TAJUK}>{slaid.tajuk}</h2>
      <p className="max-w-[70vw] text-[clamp(26px,2.4vw,52px)] leading-snug">{slaid.mesej}</p>
    </div>
  );
}

/* ---------------------------------- Komponen ---------------------------------- */

type SlaidSemua = SlaidKehadiran | SlaidMinit | SlaidMaklumBalas | SlaidBahan;

export default function PembentanganMjkd({
  mesyuaratId,
  pembentangan,
}: {
  mesyuaratId: string;
  pembentangan: Pembentangan;
}) {
  const router = useRouter();
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

  const keluar = useCallback(() => {
    router.push(`/admin/mjkd/${mesyuaratId}`);
  }, [router, mesyuaratId]);

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

  const butang =
    "rounded border-2 border-black px-[1vw] py-[0.6vh] text-[clamp(16px,1.2vw,26px)] font-semibold";

  function isi(s: SlaidSemua) {
    switch (s.jenis) {
      case "kehadiran":
        return <SlaidKehadiranPaparan slaid={s} kiraan={kiraan ?? s.kiraan} />;
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

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white text-black">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black px-[2vw] py-[1vh]">
        <nav aria-label="Bahagian pembentangan" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              className={`${butang} ${tab === t.id ? "bg-black text-white" : "bg-white text-black"}`}
              onClick={() => tukarTab(t.id)}
            >
              {t.label} <span className="opacity-60">({t.kunci})</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span
            className="text-[clamp(18px,1.4vw,30px)] font-semibold tabular-nums"
            aria-live="polite"
          >
            Slaid {jumlah === 0 ? 0 : semasa + 1} / {jumlah}
          </span>
          <button type="button" className={butang} onClick={togolSkrinPenuh}>
            {skrinPenuh ? "Keluar skrin penuh" : "Skrin penuh"}
          </button>
          <Link href={`/admin/mjkd/${mesyuaratId}`} className={`${butang} bg-black text-white`}>
            Keluar
          </Link>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-[4vw] py-[2.5vh]">
        {slaid ? isi(slaid) : null}
      </main>

      <footer className="flex items-center justify-between border-t-2 border-black px-[2vw] py-[1vh]">
        <button
          type="button"
          className={`${butang} disabled:opacity-30`}
          disabled={semasa === 0}
          onClick={() => gerak(-1)}
        >
          ← Sebelum
        </button>
        <span className="text-[clamp(14px,1vw,22px)] text-neutral-700">
          ← → slaid · 1 / 2 / 3 / 4 tab · Esc keluar
        </span>
        <button
          type="button"
          className={`${butang} disabled:opacity-30`}
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
    </div>
  );
}
