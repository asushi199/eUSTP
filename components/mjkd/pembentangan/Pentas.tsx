"use client";

import "./pentas.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  adminPilihBacaMjkd,
  getDataPembentanganMjkd,
  getKehadiranPembentanganMjkd,
  getVersiPembentanganMjkd,
} from "@/lib/actions/mjkd";
import { STATUS_MJKD_LABEL, type StatusMjkd } from "@/lib/mjkd/enums";
import {
  KUNCI_PAPAN_PEMUKA,
  binaDek,
  cariIndeks,
  jawapanSemuaPerkara,
  kunciPerkara,
  type Bab,
  type DataPentas,
  type Slaid,
  type SlaidPerkara as SlaidPerkaraT,
} from "@/lib/mjkd/pembentangan";
import { urlFotoBukti } from "@/lib/mjkd/validation";
import Kanvas from "./Kanvas";
import Krom from "./Krom";
import { KonteksLapisan } from "./LapisanPenuh";
import Navigator from "./Navigator";
import Spotlight from "./Spotlight";
import SpotlightSekolah, { type KawalanSpotSekolah } from "./SpotlightSekolah";
import SpotlightStatus, { type KawalanSpotStatus } from "./SpotlightStatus";
import { KonteksPentas, type KonteksSlaid } from "./konteks";
import { TEMPOH_BARU_MS, useDataLangsung, type SumberData } from "./useDataLangsung";
import SlaidAturCara from "./slaid/SlaidAturCara";
import SlaidBahan from "./slaid/SlaidBahan";
import SlaidKehadiran from "./slaid/SlaidKehadiran";
import SlaidMinit from "./slaid/SlaidMinit";
import SlaidPapanPemuka from "./slaid/SlaidPapanPemuka";
import SlaidPembukaan from "./slaid/SlaidPembukaan";
import SlaidPenutup from "./slaid/SlaidPenutup";
import SlaidPerkara from "./slaid/SlaidPerkara";
import SlaidSemuaSoalan from "./slaid/SlaidSemuaSoalan";

/** Sumber lalai + togol Sorotan (server action). */
export type SumberPentas = SumberData & {
  sorotan: (itemId: string, dipilih: boolean) => Promise<{ ok: boolean; error?: string }>;
};

const KUNCI_TEMA = "mjkd-pentas-tema";
const SELANG_KEHADIRAN_MS = 15_000;
const SELANG_LAIN_MS = 30_000;
const SOROK_KROM_MS = 3_000;

type Toast = { id: number; teks: string; ralat?: boolean };

function Isi({ slaid }: { slaid: Slaid }) {
  switch (slaid.jenis) {
    case "pembukaan":
      return <SlaidPembukaan slaid={slaid} />;
    case "kehadiran":
      return <SlaidKehadiran slaid={slaid} />;
    case "minit":
      return <SlaidMinit slaid={slaid} />;
    case "papan-pemuka":
      return <SlaidPapanPemuka slaid={slaid} />;
    case "perkara":
      return <SlaidPerkara slaid={slaid} />;
    case "semua-soalan":
      return <SlaidSemuaSoalan slaid={slaid} />;
    case "atur-cara":
      return <SlaidAturCara slaid={slaid} />;
    case "bahan":
      return <SlaidBahan slaid={slaid} />;
    case "penutup":
      return <SlaidPenutup slaid={slaid} />;
  }
}

/**
 * Mod Pembentangan MJKD 2026 (v2): satu dek berterusan (← → / PgUp PgDn / Space merentas bab),
 * kanvas tetap 1920×1080 diskala, data langsung (polling + cache localStorage), Spotlight sekolah.
 * Kekunci: P Papan Pemuka · G semua slaid · T tema · F skrin penuh · B skrin hitam · R segar data · S sorotan
 * seterusnya · Esc tutup lapisan / (dua kali) keluar.
 */
export default function Pentas({
  mesyuaratId,
  awal,
  acara,
  kehadiran,
  sumber: sumberLuar,
  keluarHref,
  urlFoto = urlFotoBukti,
}: {
  mesyuaratId: string;
  /** null = pangkalan data perlahan semasa halaman dimuat (guna cache jika ada). */
  awal: DataPentas | null;
  acara: { tarikh: string; tempat: string };
  kehadiran: { url: string; qr: string };
  /** Pratonton dev sahaja — lalai server action. */
  sumber?: SumberPentas;
  keluarHref?: string;
  /** Pratonton dev sahaja — lalai thumbnail Drive. */
  urlFoto?: (path: string, sz: number) => string;
}) {
  const sumber = useMemo<SumberPentas>(
    () =>
      sumberLuar ?? {
        versi: () => getVersiPembentanganMjkd(mesyuaratId),
        penuh: () => getDataPembentanganMjkd(mesyuaratId),
        kehadiran: () => getKehadiranPembentanganMjkd(mesyuaratId),
        sorotan: (itemId, dipilih) => adminPilihBacaMjkd(itemId, dipilih),
      },
    [sumberLuar, mesyuaratId],
  );

  const akarRef = useRef<HTMLDivElement>(null);
  const [akar, setAkar] = useState<HTMLElement | null>(null);
  const [kedudukan, setKedudukan] = useState<{ kunci: string; bab: Bab }>({ kunci: "pembukaan", bab: "pembukaan" });
  const [tema, setTema] = useState<"terang" | "gelap">("terang");
  const [nav, setNav] = useState(false);
  const [hitam, setHitam] = useState(false);
  const [sorok, setSorok] = useState(false);
  const [skrinPenuh, setSkrinPenuh] = useState(false);
  const [sedangKeluar, setSedangKeluar] = useState(false);
  /**
   * Spotlight jawapan. `status` = dibuka dari lapisan status (← → antara sekolah berstatus itu
   * sahaja); `ikutSekolah` = dibuka dari "semua jawapan sekolah" (← → antara perkara sekolah itu).
   */
  const [spot, setSpot] = useState<{ perkaraId: string; kod: string; status?: StatusMjkd; ikutSekolah?: boolean } | null>(null);
  /** Kod sekolah — lapisan "semua jawapan satu sekolah" (Spotlight perkara boleh dibuka di atasnya). */
  const [spotSekolah, setSpotSekolah] = useState<string | null>(null);
  /** Lapisan satu status (kotak status Papan Pemuka) — Spotlight boleh dibuka di atasnya. */
  const [spotStatus, setSpotStatus] = useState<{ status: StatusMjkd; perkaraId: string | null } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [baru, setBaru] = useState<Map<string, number>>(new Map());
  const escRef = useRef(0);
  const hashSasaranRef = useRef<string | null>(null);
  const idToast = useRef(0);

  const toast = useCallback((teks: string, ralat = false) => {
    const id = ++idToast.current;
    setToasts((t) => [...t.slice(-3), { id, teks, ralat }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const babSemasaRef = useRef<Bab>("pembukaan");
  const dataRef = useRef<DataPentas | null>(awal);
  const { data, status, segar, ubahSetempat } = useDataLangsung({
    mesyuaratId,
    awal,
    sumber,
    selangMs:
      kedudukan.bab === "pembukaan" || kedudukan.bab === "kehadiran" ? SELANG_KEHADIRAN_MS : SELANG_LAIN_MS,
    onBaru: (kod) => {
      const tamat = Date.now() + TEMPOH_BARU_MS;
      setBaru((m) => {
        const n = new Map(m);
        for (const k of kod) n.set(k, tamat);
        return n;
      });
      if (babSemasaRef.current === "maklum-balas") {
        const nama = (k: string) => dataRef.current?.sekolah.find((s) => s.code === k)?.name ?? k;
        if (kod.length <= 3) kod.forEach((k) => toast(`${nama(k)} baru menghantar maklum balas`));
        else toast(`${kod.length} sekolah baru menghantar maklum balas`);
      }
    },
  });
  dataRef.current = data;

  // Buang tanda BARU yang tamat.
  useEffect(() => {
    if (baru.size === 0) return;
    const t = window.setInterval(() => {
      const kini = Date.now();
      setBaru((m) => {
        const n = new Map([...m].filter(([, tamat]) => tamat > kini));
        return n.size === m.size ? m : n;
      });
    }, 5000);
    return () => window.clearInterval(t);
  }, [baru.size]);

  const setBaruKod = useMemo(() => new Set(baru.keys()), [baru]);
  const dek = useMemo(() => (data ? binaDek({ data, baru: setBaruKod }) : []), [data, setBaruKod]);
  const indeks = dek.length ? cariIndeks(dek, kedudukan.kunci, kedudukan.bab) : 0;
  const slaid = dek[indeks];
  babSemasaRef.current = slaid?.bab ?? kedudukan.bab;

  /* ------------------------------ kesan awal ------------------------------ */

  useEffect(() => {
    setAkar(akarRef.current);
    try {
      const t = window.localStorage.getItem(KUNCI_TEMA);
      if (t === "gelap" || t === "terang") setTema(t);
    } catch {
      /* storan disekat */
    }
    const dariHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) return;
      hashSasaranRef.current = hash;
      setKedudukan((k) => (k.kunci === hash ? k : { ...k, kunci: hash }));
    };
    dariHash();
    const onFs = () => setSkrinPenuh(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("hashchange", dariHash);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("hashchange", dariHash);
    };
  }, []);

  // Simpan kedudukan dalam URL (#kunci) supaya muat semula kekal di slaid yang sama.
  // Jangan tulis sebelum slaid sasaran #hash dicapai (StrictMode menjalankan kesan dua kali).
  useEffect(() => {
    if (!slaid) return;
    const sasaran = hashSasaranRef.current;
    if (sasaran && sasaran !== slaid.kunci && dek.some((s) => s.kunci === sasaran)) return;
    hashSasaranRef.current = null;
    try {
      window.history.replaceState(null, "", `#${encodeURIComponent(slaid.kunci)}`);
    } catch {
      /* abaikan */
    }
  }, [slaid?.kunci]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------- navigasi ------------------------------- */

  const keIndeks = useCallback(
    (i: number) => {
      const s = dek[Math.max(0, Math.min(dek.length - 1, i))];
      if (!s) return;
      setSpot(null);
      setSpotSekolah(null);
      setSpotStatus(null);
      setNav(false);
      setKedudukan({ kunci: s.kunci, bab: s.bab });
    },
    [dek],
  );
  const gerak = useCallback((d: number) => keIndeks(indeks + d), [indeks, keIndeks]);
  const keKunci = useCallback(
    (kunci: string) => {
      const i = dek.findIndex((s) => s.kunci === kunci);
      if (i >= 0) keIndeks(i);
    },
    [dek, keIndeks],
  );
  const keBab = useCallback(
    (b: Bab) => {
      const i = dek.findIndex((s) => s.bab === b);
      if (i >= 0) keIndeks(i);
    },
    [dek, keIndeks],
  );

  const keluar = useCallback(() => {
    setSedangKeluar(true);
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    } catch {
      /* Fullscreen API tidak tersedia */
    }
    // Navigasi penuh: lapisan menutup seluruh skrin; pelayar terus memaparkan kemajuan.
    window.location.assign(keluarHref ?? `/admin/mjkd/${mesyuaratId}`);
  }, [keluarHref, mesyuaratId]);

  const togolPenuh = useCallback(() => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      else void document.documentElement.requestFullscreen().catch(() => undefined);
    } catch {
      /* Fullscreen API tidak tersedia */
    }
  }, []);

  const togolTema = useCallback(() => {
    setTema((t) => {
      const baruT = t === "terang" ? "gelap" : "terang";
      try {
        window.localStorage.setItem(KUNCI_TEMA, baruT);
      } catch {
        /* abaikan */
      }
      return baruT;
    });
  }, []);

  /* ------------------------------- Spotlight ------------------------------- */

  const slaidPerkara = useMemo(() => dek.filter((s): s is SlaidPerkaraT => s.jenis === "perkara"), [dek]);
  const slaidSpot = spot ? slaidPerkara.find((s) => s.perkaraId === spot.perkaraId) : undefined;
  const jubinSpot = useMemo(() => {
    const j = slaidSpot?.jubin ?? [];
    return spot?.status ? j.filter((t) => t.status === spot.status) : j;
  }, [slaidSpot, spot?.status]);
  /** Perkara yang dijawab sekolah Spotlight (mod "Semua soalan": ← → ikut perkara). */
  const urutanPerkaraSpot = useMemo(
    () =>
      spot?.ikutSekolah && data
        ? jawapanSemuaPerkara(data, spot.kod).baris.flatMap((b) => (b.item ? [{ id: b.perkara.id, para: b.perkara.para }] : []))
        : undefined,
    [spot?.ikutSekolah, spot?.kod, data],
  );

  const bukaSpot = useCallback((perkaraId: string, kod: string) => setSpot({ perkaraId, kod }), []);
  const bukaSekolah = useCallback((kod: string) => setSpotSekolah(kod), []);
  const bukaStatus = useCallback((status: StatusMjkd) => setSpotStatus({ status, perkaraId: null }), []);
  const slaidSemua = spotSekolah ? dek.find((s) => s.jenis === "semua-soalan") : undefined;
  const jubinSekolah = slaidSemua?.jenis === "semua-soalan" ? slaidSemua.jubin : [];

  const togolSorotan = useCallback(
    async (itemId: string, dipilih: boolean) => {
      const tetap = (v: boolean) =>
        ubahSetempat((d) => ({
          ...d,
          items: d.items.map((it) => (it.id === itemId ? { ...it, dipilih: v } : it)),
        }));
      tetap(dipilih);
      try {
        const r = await sumber.sorotan(itemId, dipilih);
        if (!r.ok) throw new Error(r.error);
      } catch {
        tetap(!dipilih);
        toast("Gagal mengemas kini sorotan. Cuba lagi.", true);
      }
    },
    [sumber, toast, ubahSetempat],
  );

  /** S — buka sekolah Sorotan seterusnya pada slaid perkara semasa. */
  const sorotanSeterusnya = useCallback(() => {
    if (slaid?.jenis !== "perkara") return;
    const disorot = slaid.jubin.filter((j) => j.sorotan).map((j) => j.kod);
    if (disorot.length === 0) {
      toast("Tiada sekolah ★ Sorotan bagi perkara ini.");
      return;
    }
    const i = spot ? disorot.indexOf(spot.kod) : -1;
    setSpot({ perkaraId: slaid.perkaraId, kod: disorot[(i + 1) % disorot.length]! });
  }, [slaid, spot, toast]);

  /* ------------------------------ papan kekunci ------------------------------ */

  const spotRef = useRef<{ langkah: (d: number) => boolean; esc: () => boolean } | null>(null);
  const spotSekolahRef = useRef<KawalanSpotSekolah | null>(null);
  const spotStatusRef = useRef<KawalanSpotStatus | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (hitam && k.toLowerCase() !== "b") return;
      switch (k) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          if (k === " " && document.activeElement instanceof HTMLElement) document.activeElement.blur();
          if (spot) spotRef.current?.langkah(1);
          else if (spotSekolah) spotSekolahRef.current?.langkah(1);
          else if (spotStatus) spotStatusRef.current?.langkah(1);
          else if (!nav) gerak(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          if (spot) spotRef.current?.langkah(-1);
          else if (spotSekolah) spotSekolahRef.current?.langkah(-1);
          else if (spotStatus) spotStatusRef.current?.langkah(-1);
          else if (!nav) gerak(-1);
          break;
        case "Escape":
          if (spot) {
            if (!spotRef.current?.esc()) setSpot(null);
          } else if (spotSekolah) setSpotSekolah(null);
          else if (spotStatus) setSpotStatus(null);
          else if (nav) setNav(false);
          else if (Date.now() - escRef.current < 3000) keluar();
          else {
            escRef.current = Date.now();
            toast("Tekan Esc sekali lagi untuk keluar.");
          }
          break;
        case "g":
        case "G":
          setSpot(null);
          setSpotSekolah(null);
          setSpotStatus(null);
          setNav((v) => !v);
          break;
        case "p":
        case "P":
          // Kembali ke Papan Pemuka (tutup semua lapisan).
          keKunci(KUNCI_PAPAN_PEMUKA);
          break;
        case "t":
        case "T":
          togolTema();
          break;
        case "f":
        case "F":
          togolPenuh();
          break;
        case "b":
        case "B":
          setHitam((v) => !v);
          break;
        case "r":
        case "R":
          toast("Menyegarkan data…");
          void segar(true);
          break;
        case "s":
        case "S":
          sorotanSeterusnya();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gerak, hitam, keKunci, keluar, nav, segar, sorotanSeterusnya, spot, spotSekolah, spotStatus, toast, togolPenuh, togolTema]);

  // Krom pudar selepas 3 s tanpa gerakan tetikus / kekunci.
  useEffect(() => {
    let t = 0;
    const aktif = () => {
      setSorok(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setSorok(true), SOROK_KROM_MS);
    };
    aktif();
    window.addEventListener("mousemove", aktif);
    window.addEventListener("keydown", aktif);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", aktif);
      window.removeEventListener("keydown", aktif);
    };
  }, []);

  /* --------------------------------- paparan --------------------------------- */

  const konteks = useMemo<KonteksSlaid>(
    () => ({ acara, kehadiran, keKunci, gerak, bukaSpot, bukaSekolah, bukaStatus, urlFoto }),
    [acara, kehadiran, keKunci, gerak, bukaSpot, bukaSekolah, bukaStatus, urlFoto],
  );

  // Masuk animasi hanya bila slaid bertukar (bukan bila data disegarkan).
  const kunciAnim = slaid?.kunci ?? "kosong";

  return (
    <div ref={akarRef} className={`pentas${tema === "terang" ? " terang" : ""}${sorok && !nav ? " sorok" : ""}`}>
      <KonteksLapisan.Provider
        value={{ akar, sorokSemua: nav || hitam, sorokSlaid: spot !== null || spotSekolah !== null || spotStatus !== null }}
      >
        <KonteksPentas.Provider value={konteks}>
          <Kanvas>
            <Krom
              tarikh={acara.tarikh}
              bab={slaid?.bab ?? kedudukan.bab}
              onBab={keBab}
              status={status}
              kedudukan={indeks}
              jumlah={dek.length}
              onGerak={gerak}
              tema={tema}
              onTema={togolTema}
              onNav={() => setNav(true)}
              skrinPenuh={skrinPenuh}
              onPenuh={togolPenuh}
              onKeluar={keluar}
              sedangKeluar={sedangKeluar}
            />
            {slaid ? (
              <main key={kunciAnim} className="pt-slaid masuk">
                <Isi slaid={slaid} />
              </main>
            ) : (
              <main className="pt-slaid">
                <div className="pt-kosong">
                  <h2 className="pt-tajuk">Sambungan ke pangkalan data perlahan</h2>
                  <p className="pt-redup" style={{ fontSize: 28, margin: 0 }}>
                    Data pembentangan belum dapat dimuat dan tiada salinan tersimpan pada peranti ini.
                  </p>
                  <button type="button" className="pt-butang-emas" style={{ fontSize: 22 }} onClick={() => void segar(true)}>
                    Cuba lagi
                  </button>
                </div>
              </main>
            )}

            {spotSekolah && data ? (
              <SpotlightSekolah
                data={data}
                kod={spotSekolah}
                jubin={jubinSekolah}
                ditindih={spot !== null}
                kawalan={spotSekolahRef}
                onPilih={setSpotSekolah}
                onPerkara={(perkaraId) => setSpot({ perkaraId, kod: spotSekolah, ikutSekolah: true })}
                onTutup={() => setSpotSekolah(null)}
              />
            ) : null}

            {spotStatus ? (
              <SpotlightStatus
                status={spotStatus.status}
                perkara={slaidPerkara}
                perkaraId={spotStatus.perkaraId}
                ditindih={spot !== null}
                kawalan={spotStatusRef}
                onPerkara={(perkaraId) => setSpotStatus({ ...spotStatus, perkaraId })}
                onSekolah={(perkaraId, kod) => setSpot({ perkaraId, kod, status: spotStatus.status })}
                onSlaidPerkara={(perkaraId) => keKunci(kunciPerkara(perkaraId))}
                onTutup={() => setSpotStatus(null)}
              />
            ) : null}

            {spot && data ? (
              <Spotlight
                data={data}
                perkaraId={spot.perkaraId}
                kod={spot.kod}
                jubin={jubinSpot}
                kawalan={spotRef}
                onPilih={(kod) => setSpot({ ...spot, kod })}
                urutanPerkara={urutanPerkaraSpot}
                onPilihPerkara={(perkaraId) => setSpot({ ...spot, perkaraId })}
                ketUrutan={spot.status ? `sekolah · ${STATUS_MJKD_LABEL[spot.status]}` : undefined}
                onTutup={() => setSpot(null)}
                onSorotan={togolSorotan}
              />
            ) : null}

            {nav ? <Navigator dek={dek} semasa={indeks} onPilih={keIndeks} onTutup={() => setNav(false)} /> : null}

            <div className="pt-toast" aria-live="polite">
              {toasts.map((t) => (
                <div key={t.id} className={t.ralat ? "ralat" : undefined}>
                  {t.teks}
                </div>
              ))}
            </div>
            <div className="pt-maju" style={{ width: `${dek.length ? ((indeks + 1) / dek.length) * 100 : 0}%` }} />
            <div className="pt-petunjuk">
              ← → slaid · P papan pemuka · G semua slaid · T tema · F skrin penuh · B skrin hitam · R segar · klik sekolah untuk jawapan
            </div>
            {hitam ? <div className="pt-hitam" onClick={() => setHitam(false)} /> : null}
          </Kanvas>
        </KonteksPentas.Provider>
      </KonteksLapisan.Provider>
    </div>
  );
}
