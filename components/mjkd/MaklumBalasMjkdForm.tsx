"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adminSimpanMaklumBalasMjkd,
  bacaDrafMjkd,
  getPrefillPgbMjkd,
  padamDrafMjkd,
  simpanDrafMjkd,
  submitMaklumBalasMjkd,
} from "@/lib/actions/mjkd";
import {
  CATATAN_MIN,
  CONTOH_5W1H,
  FOTO_BUKTI_MAKS,
  sahkanMaklumBalas,
} from "@/lib/mjkd/validation";
import { MINIT_RUJUKAN } from "@/lib/mjkd/acara";
import FotoBuktiInput from "@/components/mjkd/FotoBuktiInput";
import {
  STATUS_MJKD,
  STATUS_MJKD_LABEL,
  type StatusMjkd,
} from "@/lib/mjkd/enums";
import { MESEJ_PENGHANTARAN_TIDAK_PASTI, MESEJ_RALAT_SAMBUNGAN } from "@/lib/mjkd/ralat-db";
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
  items: {
    perkaraId: string;
    status: string;
    catatan: string;
    pautanBukti: string;
    fotoBukti: string[];
  }[];
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
  /** Kod sekolah yang sudah menghantar — borang baharu dikunci untuk sekolah ini. */
  sudahHantar?: string[];
};

type Jawapan = { status: string; catatan: string; pautanBukti: string; fotoBukti: string[] };

function matchesSchoolQuery(school: SchoolOption, rawQuery: string) {
  const tokens = rawQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [school.code, school.name, school.zone].join(" ").toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

/** Sama seperti syarat `sahkanMaklumBalas` bagi satu perkara — untuk tanda ✓ dan kiraan kemajuan. */
function perkaraLengkap(j: Jawapan | undefined): boolean {
  if (!j?.status) return false;
  return j.status === "TIDAK_BERKAITAN" || j.catatan.trim().length >= CATATAN_MIN;
}

function jawapanAwal(existing?: JawapanAwal | null): Record<string, Jawapan> {
  const out: Record<string, Jawapan> = {};
  for (const it of existing?.items ?? []) {
    out[it.perkaraId] = {
      status: it.status,
      catatan: it.catatan,
      pautanBukti: it.pautanBukti,
      fotoBukti: it.fotoBukti,
    };
  }
  return out;
}

// ── Draf auto-simpan ────────────────────────────────────────────────────────
// 1) localStorage pelayar ini (cache segera / tanpa talian).
// 2) Borang BAHARU (bukan kemaskini/admin): draf juga disimpan di pelayan per sekolah, jadi PGB boleh
//    menyambung dari peranti lain dengan memilih sekolah yang sama (tiada kod/tiket diperlukan).
// Draf dibuang selepas berjaya menghantar, atau apabila pengguna menekan "Buang draf".
// Kemaskini selepas dihantar tetap perlukan nombor tiket (tiada draf pelayan).
type Draf = {
  schoolCode: string;
  namaPengisi: string;
  jawatanPengisi: string;
  jawapan: Record<string, Jawapan>;
  disimpan: string;
  /** Ada suntingan yang belum sampai ke pelayan. Tiada (draf lama) = banding masa `disimpan`. */
  belumSegerak?: boolean;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function bacaDraf(kunci: string): Draf | null {
  try {
    const raw = window.localStorage.getItem(kunci);
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<Draf>;
    const jawapan: Record<string, Jawapan> = {};
    for (const [id, j] of Object.entries(d.jawapan ?? {})) {
      if (!j || typeof j !== "object") continue;
      jawapan[id] = {
        status: str(j.status),
        catatan: str(j.catatan),
        pautanBukti: str(j.pautanBukti),
        fotoBukti: Array.isArray(j.fotoBukti) ? j.fotoBukti.filter((f) => typeof f === "string") : [],
      };
    }
    return {
      schoolCode: str(d.schoolCode),
      namaPengisi: str(d.namaPengisi),
      jawatanPengisi: str(d.jawatanPengisi),
      jawapan,
      disimpan: str(d.disimpan),
      belumSegerak: typeof d.belumSegerak === "boolean" ? d.belumSegerak : undefined,
    };
  } catch {
    return null;
  }
}

/** Tanda draf pelayar sudah disegerakkan — hanya jika isinya masih sama dengan yang disimpan ke pelayan. */
function tandaSegerak(kunci: string, kod: string, json: string) {
  try {
    const raw = window.localStorage.getItem(kunci);
    if (!raw) return;
    const d = JSON.parse(raw) as Record<string, unknown>;
    if (d.schoolCode !== kod) return;
    const isi = JSON.stringify({
      namaPengisi: d.namaPengisi,
      jawatanPengisi: d.jawatanPengisi,
      jawapan: d.jawapan,
    });
    if (isi !== json || d.belumSegerak === false) return;
    window.localStorage.setItem(kunci, JSON.stringify({ ...d, belumSegerak: false }));
  } catch {
    /* localStorage tidak tersedia */
  }
}

function buangDraf(kunci: string) {
  try {
    window.localStorage.removeItem(kunci);
  } catch {
    /* localStorage tidak tersedia */
  }
}

function adaIsi(jawapan: Record<string, Jawapan>): boolean {
  return Object.values(jawapan).some(
    (j) => j.status || j.catatan.trim() || j.pautanBukti.trim() || j.fotoBukti.length,
  );
}

function masaDraf(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleString("ms-MY", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MaklumBalasMjkdForm({
  mesyuarat,
  schools,
  perkara,
  initialSchoolCode,
  existing,
  initialReceiptToken,
  adminMode = false,
  sudahHantar,
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
  const [muatNaik, setMuatNaik] = useState(0);
  const [navBuka, setNavBuka] = useState(false);
  // Elak menimpa nama/jawatan yang sudah disunting pengguna (atau datang daripada rekod sedia ada).
  const disentuh = useRef(Boolean(existing));

  const dikunci = adminMode || Boolean(existing && initialReceiptToken);

  // Draf: borang baharu = satu draf per mesyuarat; kemaskini = satu draf per sekolah. Admin tiada draf.
  const kunciDraf = adminMode
    ? null
    : existing
      ? `mjkd-draf:${mesyuarat.id}:${initialSchoolCode ?? ""}`
      : `mjkd-draf:${mesyuarat.id}`;
  const [drafSedia, setDrafSedia] = useState(false);
  const [drafDipulih, setDrafDipulih] = useState<string | null>(null);
  // Draf pelayan hanya untuk borang baharu awam.
  const drafPelayan = Boolean(kunciDraf) && !existing;
  const [kodStabil, setKodStabil] = useState("");
  const [kodDimuat, setKodDimuat] = useState("");
  // Sekolah yang bacaan draf pelayannya sudah selesai (berjaya ATAU gagal) — bahagian C dikunci sehingga
  // itu, supaya draf yang tiba lewat tidak menimpa apa yang baru ditaip.
  const [kodDisemak, setKodDisemak] = useState("");
  const [statusPelayan, setStatusPelayan] = useState<
    { jenis: "menyimpan" | "disimpan" | "gagal"; masa?: string } | null
  >(null);
  const adaUbah = useRef(false); // pengguna sebenarnya menyunting (bukan pemulihan/prefill)
  const tempatan = useRef({ kod: "", ts: "" }); // draf pelayar terakhir: sekolah + masa
  const drafAdaDiPelayan = useRef<Record<string, boolean>>({});
  const dicipta = useRef<string | null>(null); // sekolah yang drafnya dicipta sesi ini
  const dimuatJson = useRef<string | null>(null); // kandungan yang dimuat dari draf pelayan
  const terakhirJson = useRef("");
  const kodSebelum = useRef("");
  const rantai = useRef<Promise<void>>(Promise.resolve());
  const isiRef = useRef({ namaPengisi, jawatanPengisi, jawapan });
  isiRef.current = { namaPengisi, jawatanPengisi, jawapan };
  const asalJson = useRef(
    JSON.stringify({
      schoolCode: initialSchoolCode ?? "",
      namaPengisi: existing?.namaPengisi ?? "",
      jawatanPengisi: existing?.jawatanPengisi ?? "",
      jawapan: jawapanAwal(existing),
    }),
  );

  // Pulihkan draf sekali selepas mount (localStorage tiada semasa SSR).
  useEffect(() => {
    if (!kunciDraf) return;
    const d = bacaDraf(kunciDraf);
    if (d) {
      // Hanya pulihkan jika ada jawapan sebenar (bukan sekadar sekolah dipilih + prefill nama).
      if (adaIsi(d.jawapan)) {
        tempatan.current = { kod: d.schoolCode, ts: d.disimpan };
        if (d.namaPengisi || d.jawatanPengisi) {
          disentuh.current = true; // jangan ditimpa oleh prefill direktori
          setNamaPengisi(d.namaPengisi);
          setJawatanPengisi(d.jawatanPengisi);
        }
        if (!existing && d.schoolCode && schools.some((s) => s.code === d.schoolCode)) {
          setSchoolCode(d.schoolCode);
        }
        setJawapan((prev) => ({ ...prev, ...d.jawapan }));
        setDrafDipulih(d.disimpan);
      }
    }
    setDrafSedia(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekali sahaja semasa mount
  }, []);

  // Simpan draf setiap kali borang berubah (selepas pemulihan selesai).
  useEffect(() => {
    if (!kunciDraf || !drafSedia) return;
    const kini = JSON.stringify({ schoolCode, namaPengisi, jawatanPengisi, jawapan });
    if (kini === asalJson.current) {
      buangDraf(kunciDraf);
      return;
    }
    // Pemulihan / draf pelayan / prefill bukan suntingan — jangan segarkan masa draf tempatan.
    if (!adaUbah.current) return;
    const kini2 = new Date().toISOString();
    tempatan.current = { kod: schoolCode, ts: kini2 };
    // Sama dengan salinan terakhir di pelayan untuk sekolah ini → sudah segerak.
    const segerak =
      drafPelayan &&
      kodDimuat === schoolCode &&
      JSON.stringify({ namaPengisi, jawatanPengisi, jawapan }) === terakhirJson.current;
    try {
      window.localStorage.setItem(
        kunciDraf,
        JSON.stringify({
          schoolCode,
          namaPengisi,
          jawatanPengisi,
          jawapan,
          disimpan: kini2,
          belumSegerak: !segerak,
        }),
      );
    } catch {
      /* localStorage penuh / tidak tersedia — borang masih berfungsi */
    }
  }, [kunciDraf, drafSedia, drafPelayan, kodDimuat, schoolCode, namaPengisi, jawatanPengisi, jawapan]);

  function buangDrafDanSetSemula() {
    if (!kunciDraf) return;
    if (!window.confirm("Buang draf dan kosongkan jawapan yang belum dihantar?")) return;
    const asal = JSON.parse(asalJson.current) as Omit<Draf, "disimpan">;
    disentuh.current = Boolean(existing);
    setSchoolCode(asal.schoolCode);
    setQuery("");
    setNamaPengisi(asal.namaPengisi);
    setJawatanPengisi(asal.jawatanPengisi);
    setJawapan(asal.jawapan);
    setDrafDipulih(null);
    buangDraf(kunciDraf);
    if (drafPelayan && schoolCode) {
      void padamDrafMjkd(mesyuarat.id, schoolCode);
      drafAdaDiPelayan.current[schoolCode] = false;
      dicipta.current = null;
      dimuatJson.current = null;
      terakhirJson.current = "";
      adaUbah.current = false;
      setStatusPelayan(null);
    }
  }

  // ── Draf pelayan (merentas peranti) ──
  // Kod sekolah dianggap "stabil" selepas 700ms — carian menukar pilihan sekolah semasa menaip.
  useEffect(() => {
    if (!drafPelayan) return;
    const t = setTimeout(() => setKodStabil(schoolCode), schoolCode ? 700 : 0);
    return () => clearTimeout(t);
  }, [drafPelayan, schoolCode]);

  // Baca draf pelayan apabila sekolah (stabil) berubah.
  useEffect(() => {
    if (!drafPelayan || !drafSedia || !kodStabil) return;
    let batal = false;
    const sebelum = kodSebelum.current;
    kodSebelum.current = kodStabil;
    setKodDimuat("");
    setStatusPelayan(null);
    // Tersalah pilih sekolah: padam draf yang dicipta sesi ini untuk sekolah sebelumnya.
    if (sebelum && sebelum !== kodStabil && dicipta.current === sebelum) {
      void padamDrafMjkd(mesyuarat.id, sebelum);
      drafAdaDiPelayan.current[sebelum] = false;
      dicipta.current = null;
    }
    (async () => {
      let res = await bacaDrafMjkd(mesyuarat.id, kodStabil);
      for (let cuba = 0; !res.ok && cuba < 2 && !batal; cuba++) {
        await new Promise((r) => setTimeout(r, 2000));
        if (batal) return;
        res = await bacaDrafMjkd(mesyuarat.id, kodStabil);
      }
      if (batal) return;
      if (!res.ok) {
        // Jangan simpan ke pelayan jika bacaan gagal — elak menimpa draf yang sedia ada.
        // Buka kunci borang: pengguna masih boleh mengisi (disimpan dalam pelayar sahaja).
        setStatusPelayan({ jenis: "gagal" });
        setKodDisemak(kodStabil);
        return;
      }
      const isi = isiRef.current;
      drafAdaDiPelayan.current[kodStabil] = Boolean(res.draf);
      // Isi yang dipaparkan masih draf pelayan sekolah LAIN (tidak disunting) — bukan milik sekolah ini.
      const isiSekolahLain =
        Boolean(sebelum) &&
        sebelum !== kodStabil &&
        dimuatJson.current !== null &&
        JSON.stringify(isi) === dimuatJson.current;
      // Draf pelayar peranti ini untuk sekolah ini (dibaca semula — isi borang mungkin milik sekolah lain).
      const lokalRaw = kunciDraf ? bacaDraf(kunciDraf) : null;
      const lokal =
        lokalRaw && lokalRaw.schoolCode === kodStabil && adaIsi(lokalRaw.jawapan) ? lokalRaw : null;
      const pelayan = res.draf;
      // Draf pelayar menang hanya jika ada suntingan yang belum sampai ke pelayan — bukan banding masa
      // (jam telefon boleh tersasar daripada jam pelayan). Draf pelayar lama tanpa tanda: banding masa.
      const lokalMenang =
        lokal !== null &&
        (!pelayan || (lokal.belumSegerak ?? lokal.disimpan >= pelayan.disimpan));
      const guna = lokalMenang ? "lokal" : pelayan ? "pelayan" : lokal ? "lokal" : null;
      if (guna) {
        const d = guna === "lokal" ? lokal! : pelayan!;
        // Isi sedia ada sudah milik sekolah ini dan sama baharu → kekalkan (elak menimpa suntingan).
        const kekal =
          guna === "lokal" && !isiSekolahLain && adaIsi(isi.jawapan) && tempatan.current.kod === kodStabil;
        if (!kekal) {
          disentuh.current = true; // jangan ditimpa oleh prefill direktori
          setNamaPengisi(d.namaPengisi);
          setJawatanPengisi(d.jawatanPengisi);
          setJawapan(d.jawapan);
          setDrafDipulih(d.disimpan);
          if (guna === "lokal") tempatan.current = { kod: kodStabil, ts: d.disimpan };
        }
        if (guna === "pelayan") {
          const json = JSON.stringify({
            namaPengisi: d.namaPengisi,
            jawatanPengisi: d.jawatanPengisi,
            jawapan: d.jawapan,
          });
          dimuatJson.current = json;
          terakhirJson.current = json;
        } else {
          // Draf pelayar lebih baharu: isi ini milik sekolah ini — benarkan ia disegerakkan ke pelayan.
          dimuatJson.current = null;
          terakhirJson.current = "";
        }
      } else if (isiSekolahLain) {
        // Tiada draf untuk sekolah ini dan isi yang dipaparkan milik sekolah lain — kosongkan.
        dimuatJson.current = null;
        terakhirJson.current = "";
        disentuh.current = false;
        setNamaPengisi("");
        setJawatanPengisi("");
        setJawapan({});
        setDrafDipulih(null);
        getPrefillPgbMjkd(kodStabil)
          .then((p) => {
            if (batal || disentuh.current) return;
            setNamaPengisi(p.nama);
            setJawatanPengisi(p.jawatan);
          })
          .catch(() => undefined);
      }
      setKodDimuat(kodStabil);
      setKodDisemak(kodStabil);
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya apabila sekolah stabil berubah
  }, [drafPelayan, drafSedia, kodStabil]);

  // Simpan draf ke pelayan SEKARANG jika ada perubahan — hanya selepas draf sekolah itu selesai dibaca.
  // Dipanggil oleh debounce dan apabila halaman ke latar belakang (ref: pendengar acara nampak keadaan terkini).
  const simpanSekarang = useRef<() => void>(() => undefined);
  simpanSekarang.current = () => {
    if (!drafPelayan || !drafSedia || pending || muatNaik > 0) return;
    if (!schoolCode || kodDimuat !== schoolCode || kodStabil !== schoolCode) return;
    if (!adaIsi(jawapan)) return;
    const json = JSON.stringify({ namaPengisi, jawatanPengisi, jawapan });
    if (json === terakhirJson.current) return;
    const kod = schoolCode;
    const isi = { namaPengisi, jawatanPengisi, jawapan };
    // Serialkan simpanan supaya yang lama tidak menimpa yang baharu.
    rantai.current = rantai.current.then(async () => {
      if (json === terakhirJson.current) return; // sudah disimpan oleh panggilan sebelum ini
      setStatusPelayan({ jenis: "menyimpan" });
      const res = await simpanDrafMjkd({
        mesyuaratId: mesyuarat.id,
        schoolCode: kod,
        ...isi,
      }).catch(() => ({ ok: false as const, disimpan: undefined }));
      if (res.ok) {
        terakhirJson.current = json;
        if (kunciDraf) tandaSegerak(kunciDraf, kod, json);
        if (!drafAdaDiPelayan.current[kod]) dicipta.current = kod;
        drafAdaDiPelayan.current[kod] = true;
        setStatusPelayan({ jenis: "disimpan", masa: masaDraf(res.disimpan ?? new Date().toISOString()) });
      } else {
        setStatusPelayan({ jenis: "gagal" });
      }
    });
  };

  // Debounce 2.5 s selepas suntingan terakhir.
  useEffect(() => {
    if (!drafPelayan || !drafSedia || pending || muatNaik > 0) return;
    if (!schoolCode || kodDimuat !== schoolCode || kodStabil !== schoolCode) return;
    if (!adaIsi(jawapan)) return;
    if (JSON.stringify({ namaPengisi, jawatanPengisi, jawapan }) === terakhirJson.current) return;
    const t = setTimeout(() => simpanSekarang.current(), 2500);
    return () => clearTimeout(t);
  }, [drafPelayan, drafSedia, pending, muatNaik, schoolCode, kodDimuat, kodStabil, namaPengisi, jawatanPengisi, jawapan, mesyuarat.id]);

  // Telefon: bertukar aplikasi/tab menjeda pemasa debounce dan pelayar boleh membuang tab di latar
  // belakang — simpan serta-merta semasa halaman disembunyikan / ditutup.
  useEffect(() => {
    if (!drafPelayan) return;
    const tersembunyi = () => {
      if (document.visibilityState === "hidden") simpanSekarang.current();
    };
    const keluar = () => simpanSekarang.current();
    document.addEventListener("visibilitychange", tersembunyi);
    window.addEventListener("pagehide", keluar);
    return () => {
      document.removeEventListener("visibilitychange", tersembunyi);
      window.removeEventListener("pagehide", keluar);
    };
  }, [drafPelayan]);

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
  const bilLengkap = terpakai.filter((p) => perkaraLengkap(jawapan[p.id])).length;

  // Borang baharu sahaja: sekolah yang sudah menghantar tidak perlu mengisi semula.
  const sudahSet = useMemo(() => new Set(sudahHantar ?? []), [sudahHantar]);
  const borangBaharu = !adminMode && !existing;
  const sudahDihantar = (s: SchoolOption) => borangBaharu && sudahSet.has(s.code);
  const statusDipilih = Boolean(selected && sudahDihantar(selected));
  const memuatDraf = drafPelayan && Boolean(schoolCode) && !statusDipilih && kodDisemak !== schoolCode;

  // Isi awal nama PGB (nama sahaja) + jawatan daripada direktori apabila sekolah dipilih.
  useEffect(() => {
    if (!schoolCode || (dikunci && !adminMode) || disentuh.current || statusDipilih) return;
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
  }, [schoolCode, dikunci, adminMode, statusDipilih]);

  // Tutup senarai dahulu, kemudian tatal — bar melekat mengecil, jadi tatal selepas susun atur baharu.
  function lompatKe(e: React.MouseEvent<HTMLAnchorElement>, perkaraId: string) {
    e.preventDefault();
    setNavBuka(false);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(`perkara-${perkaraId}`)?.scrollIntoView({ block: "start" }),
      ),
    );
  }

  function ubahJawapan(perkaraId: string, patch: Partial<Jawapan>) {
    adaUbah.current = true;
    setJawapan((prev) => ({
      ...prev,
      [perkaraId]: {
        status: prev[perkaraId]?.status ?? "",
        catatan: prev[perkaraId]?.catatan ?? "",
        pautanBukti: prev[perkaraId]?.pautanBukti ?? "",
        fotoBukti: prev[perkaraId]?.fotoBukti ?? [],
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
    if (muatNaik > 0) {
      setError("Sila tunggu gambar selesai dimuat naik.");
      return;
    }
    const items = terpakai.map((p) => ({
      perkaraId: p.id,
      status: jawapan[p.id]?.status ?? "",
      catatan: jawapan[p.id]?.catatan ?? "",
      pautanBukti: jawapan[p.id]?.pautanBukti ?? "",
      fotoBukti: jawapan[p.id]?.fotoBukti ?? [],
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
      let res: Awaited<ReturnType<typeof submitMaklumBalasMjkd>>;
      try {
        res = adminMode
          ? await adminSimpanMaklumBalasMjkd(payload)
          : await submitMaklumBalasMjkd(payload);
      } catch {
        // Rangkaian/500: tindakan mungkin sudah sampai ke pelayan — status tidak pasti.
        setError(adminMode ? MESEJ_RALAT_SAMBUNGAN : MESEJ_PENGHANTARAN_TIDAK_PASTI);
        return;
      }
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
      if (kunciDraf) buangDraf(kunciDraf);
      const q = new URLSearchParams({ kod: res.schoolCode, resit: res.receiptToken });
      router.push(`/laporan-mjkd/berjaya?${q.toString()}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {drafDipulih !== null && !statusDipilih ? (
        <div className="flex flex-col gap-3 rounded-xl border-2 border-ink bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink">
            <span className="font-semibold">Draf anda telah dipulihkan</span>
            {masaDraf(drafDipulih) ? ` (disimpan ${masaDraf(drafDipulih)})` : ""}. Sambung mengisi
            dan tekan hantar apabila selesai.
          </p>
          <button
            type="button"
            className="btn-outline-ink shrink-0"
            onClick={buangDrafDanSetSemula}
          >
            Buang draf
          </button>
        </div>
      ) : null}

      <section className="card p-6">
        <h2 className="text-lg font-semibold">A. Sekolah</h2>
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
                  {sudahDihantar(s) ? " ✓" : ""}
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
                          <span className="min-w-0 flex-1">{s.name}</span>
                          {sudahDihantar(s) ? (
                            <span
                              className="shrink-0 text-sm font-semibold text-ink"
                              title="Sudah dihantar"
                              aria-label="Sudah dihantar"
                            >
                              ✓
                            </span>
                          ) : null}
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

      {statusDipilih ? (
        <section className="card border-2 border-ink p-6" role="status">
          <p className="text-lg font-semibold text-ink">
            ✓ Sekolah ini sudah menghantar maklum balas
          </p>
          <p className="mt-1 text-[15px] text-charcoal">
            Tidak perlu mengisi semula. Untuk menyemak atau mengemaskini jawapan, gunakan nombor
            tiket yang diterima semasa menghantar.
          </p>
          <Link
            href={`/laporan-mjkd/semak?kod=${encodeURIComponent(schoolCode)}`}
            className="btn-outline-ink mt-4 w-full sm:w-auto"
          >
            Semak / kemaskini maklum balas sekolah ini
          </Link>
        </section>
      ) : (
      <>
      <section className="card p-6">
        <h2 className="text-lg font-semibold">B. Pengisi maklum balas</h2>
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
                adaUbah.current = true;
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
                adaUbah.current = true;
                setJawatanPengisi(e.target.value);
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            C. Perkara tindakan (Minit {MINIT_RUJUKAN.label})
          </h2>
          <p className="mt-1 text-sm text-graphite">
            {selected
              ? `${terpakai.length} perkara tindakan terpakai kepada sekolah ini. Jawab setiap perkara di bawah.`
              : "Pilih sekolah untuk melihat perkara tindakan yang terpakai."}
          </p>
        </div>

        {terpakai.length > 0 ? (
          // Bar kemajuan melekat di bawah TopNav (h-16): lompat terus ke mana-mana perkara.
          // Telefon: ringkas (kiraan + jalur segmen); senarai nombor dibuka dengan butang supaya
          // bar melekat tidak memakan skrin. sm+: senarai sentiasa dipaparkan.
          <nav
            aria-label="Lompat ke perkara"
            className="sticky top-16 z-30 rounded-xl border border-steel/60 bg-white/95 px-4 py-3 shadow-lift backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-sm font-semibold text-ink">
                <span className="tabular-nums">
                  {bilLengkap} / {terpakai.length}
                </span>{" "}
                <span className="hidden sm:inline">perkara </span>lengkap
                <span className="hidden font-normal text-graphite sm:inline"> · tekan nombor untuk melompat</span>
              </p>
              <div className="flex min-w-0 flex-1 gap-1 sm:hidden" aria-hidden>
                {terpakai.map((p) => (
                  <span
                    key={p.id}
                    className={`h-2 flex-1 rounded-full ${
                      perkaraLengkap(jawapan[p.id]) ? "bg-ink" : "bg-steel/40"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md border border-steel bg-white px-3 text-sm font-semibold text-ink sm:hidden"
                aria-expanded={navBuka}
                aria-controls="mjkd-senarai-perkara"
                onClick={() => setNavBuka((b) => !b)}
              >
                {navBuka ? "Tutup" : "Senarai"}
                <span aria-hidden className={`transition ${navBuka ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
            </div>
            <div
              id="mjkd-senarai-perkara"
              className={`${navBuka ? "flex" : "hidden"} mt-3 flex-wrap gap-2 sm:mt-2 sm:flex`}
            >
              {terpakai.map((p) => {
                const lengkap = perkaraLengkap(jawapan[p.id]);
                return (
                  <a
                    key={p.id}
                    href={`#perkara-${p.id}`}
                    onClick={(e) => lompatKe(e, p.id)}
                    aria-label={`Perkara ${p.para}${lengkap ? " (lengkap)" : ""}`}
                    className={`inline-flex h-10 min-w-[3.5rem] shrink-0 items-center justify-center gap-1 rounded-md border px-3 text-sm font-bold tabular-nums transition ${
                      lengkap
                        ? "border-ink bg-ink text-white"
                        : "border-steel bg-white text-ink hover:border-ink"
                    }`}
                  >
                    {lengkap ? <span aria-hidden>✓</span> : null}
                    {p.para}
                  </a>
                );
              })}
            </div>
          </nav>
        ) : null}

        {memuatDraf && terpakai.length > 0 ? (
          <p
            role="status"
            className="flex items-center gap-3 rounded-xl border-2 border-ink bg-white px-5 py-4 text-[15px] text-ink"
          >
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-steel border-t-ink"
            />
            <span>
              <span className="font-semibold">Memuatkan draf…</span> Sila tunggu sebentar sebelum
              mengisi.
            </span>
          </p>
        ) : null}

        {/* Dikunci semasa draf pelayan sekolah ini dimuat — draf yang tiba lewat akan menimpa isian. */}
        <fieldset
          disabled={memuatDraf}
          aria-busy={memuatDraf}
          className={`min-w-0 space-y-6 transition-opacity ${memuatDraf ? "opacity-50" : ""}`}
        >
        {terpakai.map((p, i) => {
          const j = jawapan[p.id];
          const tidakBerkaitan = j?.status === "TIDAK_BERKAITAN";
          const lengkap = perkaraLengkap(j);
          return (
            <article
              key={p.id}
              id={`perkara-${p.id}`}
              // scroll-mt: TopNav (64px) + bar kemajuan melekat.
              className="scroll-mt-36 overflow-hidden sm:scroll-mt-48 rounded-xl border-2 border-steel/70 bg-white shadow-lift"
            >
              <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-steel/50 bg-cloud px-5 py-4 sm:px-6">
                <span
                  className={`flex h-14 min-w-[3.5rem] shrink-0 items-center justify-center rounded-lg bg-ink px-3 font-bold tabular-nums text-white ${
                    p.para.length > 6 ? "text-lg" : "text-2xl"
                  }`}
                >
                  {p.para}
                </span>
                <div className="min-w-[8rem] flex-1">
                  <p className="text-base font-semibold text-ink">
                    Perkara {i + 1} daripada {terpakai.length}
                  </p>
                  {p.mukaSurat ? (
                    <p className="text-sm text-graphite">Minit m/s {p.mukaSurat}</p>
                  ) : null}
                </div>
                {lengkap ? (
                  <span className="shrink-0 rounded-full border border-ink bg-white px-3 py-1 text-sm font-semibold text-ink">
                    ✓ Lengkap
                  </span>
                ) : (
                  <span className="hidden shrink-0 rounded-full border border-steel bg-white px-3 py-1 text-sm text-graphite sm:inline">
                    Belum lengkap
                  </span>
                )}
              </header>

              <div className="space-y-6 p-5 sm:p-6">
              <div>
                <p className="text-[17px] leading-relaxed text-ink">{p.perkara}</p>
                <p className="mt-3 text-[15px] leading-relaxed text-charcoal">
                  <span className="font-semibold text-ink">Tindakan:</span> {p.tindakan}
                </p>
              </div>

              {p.panduan ? (
                <p className="border-l-4 border-steel pl-4 text-[15px] leading-relaxed text-charcoal">
                  {p.panduan}
                </p>
              ) : null}

              <fieldset>
                <legend className="label text-[15px]">Status *</legend>
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
                      <span className="flex min-h-12 items-center rounded-md border border-steel bg-white px-4 py-2 text-[15px] text-ink transition peer-checked:border-ink peer-checked:bg-ink peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2">
                        {STATUS_MJKD_LABEL[s]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label text-[15px]" htmlFor={`catatan-${p.id}`}>
                  Catatan{tidakBerkaitan ? " (pilihan)" : " *"}
                </label>
                {!tidakBerkaitan ? (
                  <p className="mb-2 text-sm leading-relaxed text-graphite">
                    <span className="font-semibold text-ink">Wajib ikut 5W1H</span> — Apa, Siapa,
                    Bila, Di mana, Mengapa dan Bagaimana (sekurang-kurangnya {CATATAN_MIN} aksara).
                  </p>
                ) : null}
                <textarea
                  id={`catatan-${p.id}`}
                  className="textarea"
                  rows={5}
                  maxLength={2000}
                  placeholder={tidakBerkaitan ? "" : CONTOH_5W1H}
                  value={j?.catatan ?? ""}
                  onChange={(e) => ubahJawapan(p.id, { catatan: e.target.value })}
                />
                {!tidakBerkaitan ? (
                  <p
                    className={`mt-1 text-right text-sm tabular-nums ${
                      (j?.catatan.trim().length ?? 0) >= CATATAN_MIN
                        ? "text-graphite"
                        : "text-bloom-deep"
                    }`}
                  >
                    {j?.catatan.trim().length ?? 0} / {CATATAN_MIN} aksara minimum
                  </p>
                ) : null}
              </div>

              <div className="border-t border-fog pt-5">
                <p className="label text-[15px]">Bukti (pilihan)</p>
                <p className="text-sm leading-relaxed text-graphite">
                  Boleh beri <span className="font-semibold text-ink">pautan sahaja</span> (cth.
                  Canva, OPR, Google Drive), <span className="font-semibold text-ink">gambar
                  sahaja</span> (maks {FOTO_BUKTI_MAKS}), atau kedua-duanya. Pastikan pautan
                  dikongsi &quot;sesiapa yang ada pautan boleh lihat&quot;.
                </p>
                <label className="label mt-3" htmlFor={`bukti-${p.id}`}>
                  Pautan bukti
                </label>
                <input
                  id={`bukti-${p.id}`}
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder="https://www.canva.com/… atau pautan OPR / Google Drive"
                  maxLength={500}
                  value={j?.pautanBukti ?? ""}
                  onChange={(e) => ubahJawapan(p.id, { pautanBukti: e.target.value })}
                />
                <p className="label mt-3">Gambar bukti</p>
                <FotoBuktiInput
                  id={`foto-${p.id}`}
                  mesyuaratId={mesyuarat.id}
                  schoolCode={schoolCode}
                  nilai={j?.fotoBukti ?? []}
                  onUbah={(fotoBukti) => ubahJawapan(p.id, { fotoBukti })}
                  onSibuk={(d) => setMuatNaik((n) => n + d)}
                />
              </div>
              </div>
            </article>
          );
        })}
        </fieldset>
      </section>

      {error && (
        <div className="rounded-md border border-bloom-deep/30 bg-white px-4 py-3 text-[15px] text-bloom-deep">
          <p>{error}</p>
          {!adminMode && error.includes("sudah menghantar") ? (
            <Link
              href={`/laporan-mjkd/semak${schoolCode ? `?kod=${encodeURIComponent(schoolCode)}` : ""}`}
              className="btn-outline-ink mt-3 w-full sm:w-auto"
            >
              Semak / kemaskini maklum balas sekolah ini
            </Link>
          ) : null}
        </div>
      )}
      {okMsg && <p className="text-sm text-charcoal">{okMsg}</p>}

      <div className="flex flex-col gap-3 rounded-xl border-2 border-steel/70 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        {terpakai.length > 0 ? (
          <div>
            <p className="text-[15px] text-charcoal">
              <span className="font-semibold tabular-nums text-ink">
                {bilLengkap} / {terpakai.length}
              </span>{" "}
              perkara lengkap
              {bilLengkap < terpakai.length ? " — lengkapkan semua sebelum menghantar." : "."}
            </p>
            {drafPelayan ? (
              <p className="mt-1 text-sm text-graphite">
                Draf disimpan secara automatik untuk sekolah ini — boleh disambung dari peranti lain
                dengan memilih sekolah yang sama.{" "}
                <span className="font-medium text-ink" role="status">
                  {statusPelayan?.jenis === "menyimpan"
                    ? "Menyimpan…"
                    : statusPelayan?.jenis === "disimpan"
                      ? `Disimpan ke pelayan${statusPelayan.masa ? ` (${statusPelayan.masa})` : ""}.`
                      : statusPelayan?.jenis === "gagal"
                        ? "Belum dapat disimpan ke pelayan — buat masa ini hanya dalam pelayar ini."
                        : ""}
                </span>
              </p>
            ) : kunciDraf ? (
              <p className="mt-1 text-sm text-graphite">
                Draf disimpan secara automatik dalam pelayar ini — jika tertutup, buka semula
                halaman ini untuk menyambung.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-[15px] text-graphite">Pilih sekolah dahulu.</p>
        )}
        <button
          type="submit"
          className="btn-primary h-14 w-full shrink-0 text-base sm:w-auto sm:px-10"
          disabled={pending || muatNaik > 0 || !selected || terpakai.length === 0}
        >
          {muatNaik > 0 ? "Memuat naik gambar…" : pending ? "Menghantar…" : existing ? "Kemaskini maklum balas" : "Hantar maklum balas"}
        </button>
      </div>
      </>
      )}
    </form>
  );
}
