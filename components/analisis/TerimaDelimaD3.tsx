"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { terimaDelimaD3, type HasilTerimaD3 } from "@/lib/actions/delima-d3";
import { KUNCI_MUATAN_D3, muatanDariSerpihan } from "@/lib/analisis/delima-d3-penanda";
import type { D3Pop } from "@/lib/analisis/delima-d3-parse";
import type { RingkasanD3 } from "@/lib/analisis/delima-d3-simpan";

type Fasa =
  | { jenis: "memuat" }
  | { jenis: "tiada" }
  | { jenis: "log-masuk" }
  | { jenis: "ralat"; mesej: string; bolehCuba: boolean }
  | { jenis: "pratonton"; ringkasan: RingkasanD3; menyimpan: boolean; ralat?: string }
  | { jenis: "disimpan"; ringkasan: RingkasanD3 };

const nombor = (n: number) => n.toLocaleString("ms-MY");
const pop = (p: D3Pop) => `${nombor(p.aktif)} / ${nombor(p.jumlah)} (${p.peratus}%)`;

function beza(kini: D3Pop, dahulu: D3Pop): string {
  const d = kini.aktif - dahulu.aktif;
  return d === 0 ? "tiada perubahan" : `${d > 0 ? "+" : "−"}${nombor(Math.abs(d))} aktif`;
}

/** Terima data penanda d3 (serpihan URL → sessionStorage), papar semakan, simpan selepas disahkan pegawai. */
export default function TerimaDelimaD3() {
  const [fasa, setFasa] = useState<Fasa>({ jenis: "memuat" });
  const muatan = useRef<unknown>(null);

  const semak = useCallback(async () => {
    setFasa({ jenis: "memuat" });
    let hasil: HasilTerimaD3;
    try {
      hasil = await terimaDelimaD3(muatan.current, false);
    } catch {
      setFasa({ jenis: "ralat", mesej: "Tidak dapat menghubungi NEXa. Semak sambungan internet.", bolehCuba: true });
      return;
    }
    if (hasil.ok) setFasa({ jenis: "pratonton", ringkasan: hasil.ringkasan, menyimpan: false });
    else if (hasil.kod === "log-masuk") setFasa({ jenis: "log-masuk" });
    else setFasa({ jenis: "ralat", mesej: hasil.error, bolehCuba: hasil.kod === "ralat" });
  }, []);

  useEffect(() => {
    // Data tiba dalam serpihan URL (tidak sampai ke pelayan); simpan dahulu supaya kekal semasa log masuk.
    const dariUrl = muatanDariSerpihan(window.location.hash);
    if (dariUrl) {
      try {
        window.sessionStorage.setItem(KUNCI_MUATAN_D3, JSON.stringify(dariUrl));
      } catch {
        /* storan penuh/disekat — teruskan dengan data dalam ingatan */
      }
      window.history.replaceState(null, "", window.location.pathname);
      muatan.current = dariUrl;
    } else {
      try {
        const s = window.sessionStorage.getItem(KUNCI_MUATAN_D3);
        muatan.current = s ? JSON.parse(s) : null;
      } catch {
        muatan.current = null;
      }
    }
    if (muatan.current) void semak();
    else setFasa({ jenis: "tiada" });
  }, [semak]);

  const buang = () => {
    try {
      window.sessionStorage.removeItem(KUNCI_MUATAN_D3);
    } catch {
      /* abaikan */
    }
    muatan.current = null;
  };

  const simpan = async (ringkasan: RingkasanD3) => {
    setFasa({ jenis: "pratonton", ringkasan, menyimpan: true });
    let hasil: HasilTerimaD3;
    try {
      hasil = await terimaDelimaD3(muatan.current, true);
    } catch {
      setFasa({ jenis: "pratonton", ringkasan, menyimpan: false, ralat: "Tidak dapat menghubungi NEXa. Cuba lagi." });
      return;
    }
    if (hasil.ok && hasil.ringkasan.disimpan) {
      buang();
      setFasa({ jenis: "disimpan", ringkasan: hasil.ringkasan });
    } else if (!hasil.ok && hasil.kod === "log-masuk") {
      setFasa({ jenis: "log-masuk" });
    } else {
      setFasa({
        jenis: "pratonton",
        ringkasan,
        menyimpan: false,
        ralat: hasil.ok ? "Data tidak disimpan. Cuba lagi." : hasil.error,
      });
    }
  };

  if (fasa.jenis === "memuat") {
    return (
      <p className="card mt-6 px-4 py-4 text-sm text-graphite" role="status">
        Menyemak data daripada DELIMa…
      </p>
    );
  }

  if (fasa.jenis === "tiada") {
    return (
      <div className="card mt-6 px-4 py-4 text-sm leading-relaxed text-graphite">
        <p className="font-semibold text-ink">Tiada data untuk disimpan.</p>
        <p className="mt-2">
          Halaman ini dibuka oleh penanda DELIMa. Log masuk ke d3.delima.edu.my, kemudian klik penanda
          &ldquo;DELIMa → NEXa&rdquo; pada bar penanda. Belum ada penanda? Pasang di{" "}
          <Link href="/admin/analisis?modul=delima" className="link-blue">
            Admin → Analisis → DELIMa
          </Link>
          .
        </p>
      </div>
    );
  }

  if (fasa.jenis === "log-masuk") {
    return (
      <div className="card mt-6 px-4 py-4 text-sm leading-relaxed text-graphite">
        <p className="font-semibold text-ink">Log masuk NEXa diperlukan.</p>
        <p className="mt-2">Data daripada DELIMa disimpan sementara dalam pelayar ini dan tidak akan hilang.</p>
        <Link href="/login?from=/penanda/delima-d3" className="btn-primary mt-4 inline-flex">
          Log masuk
        </Link>
      </div>
    );
  }

  if (fasa.jenis === "ralat") {
    return (
      <div className="card mt-6 px-4 py-4 text-sm leading-relaxed" role="alert">
        <p className="font-semibold text-bloom-deep">Data tidak boleh disimpan.</p>
        <p className="mt-2 whitespace-pre-line text-graphite">{fasa.mesej}</p>
        <p className="mt-2 text-graphite">Tiada perubahan dibuat pada NEXa.</p>
        {fasa.bolehCuba ? (
          <button type="button" className="btn-outline-ink mt-4" onClick={() => void semak()}>
            Cuba lagi
          </button>
        ) : null}
      </div>
    );
  }

  const r = fasa.ringkasan;
  const butiran = (
    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-graphite">Tempoh</dt>
        <dd className="font-semibold text-ink">{r.tempoh}</dd>
      </div>
      <div>
        <dt className="text-graphite">Sekolah</dt>
        <dd className="font-semibold text-ink">
          {r.bilSekolah}
          {r.bilCapai != null ? ` · ${r.bilCapai} capai KPI murid` : ""}
        </dd>
      </div>
      <div>
        <dt className="text-graphite">Guru aktif</dt>
        <dd className="font-semibold text-ink">{pop(r.guru)}</dd>
        {r.sebelum ? <dd className="text-xs text-graphite">{beza(r.guru, r.sebelum.guru)}</dd> : null}
      </div>
      <div>
        <dt className="text-graphite">Murid aktif</dt>
        <dd className="font-semibold text-ink">{pop(r.murid)}</dd>
        {r.sebelum ? <dd className="text-xs text-graphite">{beza(r.murid, r.sebelum.murid)}</dd> : null}
      </div>
    </dl>
  );

  if (fasa.jenis === "disimpan") {
    return (
      <div className="card mt-6 px-4 py-4" role="status">
        <p className="text-sm font-semibold text-ink">Disimpan. Paparan awam sudah dikemas kini.</p>
        {butiran}
        <Link href="/?analisis=delima" className="btn-outline-ink mt-4 inline-flex">
          Lihat di CoE Analytics
        </Link>
      </div>
    );
  }

  return (
    <div className="card mt-6 px-4 py-4">
      <p className="text-sm font-semibold text-ink">Semakan lulus: jumlah sekolah sama dengan angka PPD.</p>
      {butiran}
      <p className="mt-3 text-xs text-graphite">
        {r.sebelum
          ? `Menggantikan snapshot bulan ini (${r.sebelum.tempoh}). Perbandingan di atas ialah dengan snapshot itu.`
          : "Snapshot baharu untuk bulan ini."}
      </p>
      {fasa.ralat ? (
        <p className="mt-3 whitespace-pre-line text-sm text-bloom-deep" role="alert">
          {fasa.ralat}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" disabled={fasa.menyimpan} onClick={() => void simpan(r)}>
          {fasa.menyimpan ? "Menyimpan…" : "Simpan ke NEXa"}
        </button>
        <button
          type="button"
          className="btn-outline-ink"
          disabled={fasa.menyimpan}
          onClick={() => {
            buang();
            setFasa({ jenis: "tiada" });
          }}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
