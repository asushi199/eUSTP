"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminPadamKehadiranMjkd,
  adminSetKehadiranDibukaMjkd,
  adminTambahKehadiranMjkd,
} from "@/lib/actions/mjkd-kehadiran";
import { JENIS_KEHADIRAN } from "@/lib/mjkd/enums";
import { labelHariPendek } from "@/lib/mjkd/hari";
import { JENIS_KEHADIRAN_LABEL, ORGANISASI_PPD } from "@/lib/mjkd/kehadiran";

export function KehadiranSuis({ mesyuaratId, dibuka }: { mesyuaratId: string; dibuka: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTogol() {
    setError(null);
    startTransition(async () => {
      const res = await adminSetKehadiranDibukaMjkd(mesyuaratId, !dibuka);
      if (!res.ok) {
        setError(res.error ?? "Gagal menukar status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="status-badge">
        <span
          className={`status-dot ${dibuka ? "bg-storm-deep" : "bg-steel"}`}
          aria-hidden
        />
        {dibuka ? "Kehadiran dibuka" : "Kehadiran ditutup"}
      </span>
      <button
        type="button"
        className={dibuka ? "btn-outline-ink btn-sm" : "btn-ink btn-sm"}
        disabled={pending}
        onClick={onTogol}
      >
        {pending ? "Menyimpan…" : dibuka ? "Tutup kehadiran" : "Buka kehadiran"}
      </button>
      {error && <span className="text-xs text-bloom-deep">{error}</span>}
    </div>
  );
}

export function PadamKehadiranButton({ id, nama }: { id: string; nama: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onPadam() {
    if (!window.confirm(`Padam rekod kehadiran ${nama}?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await adminPadamKehadiranMjkd(id);
      if (!res.ok) {
        setError(res.error ?? "Gagal memadam.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn-outline-ink btn-sm text-bloom-deep"
        disabled={pending}
        onClick={onPadam}
      >
        Padam
      </button>
      {error && <span className="ml-2 text-xs text-bloom-deep">{error}</span>}
    </>
  );
}

export function TambahKehadiranForm({
  mesyuaratId,
  sekolah,
  hari,
  hariLalai,
}: {
  mesyuaratId: string;
  hari: string[];
  hariLalai: string;
  sekolah: { code: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [jenis, setJenis] = useState<(typeof JENIS_KEHADIRAN)[number]>("PGB");
  const perluSekolah = jenis === "PGB" || jenis === "WAKIL";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("id", mesyuaratId);
    startTransition(async () => {
      const res = await adminTambahKehadiranMjkd(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menambah.");
        return;
      }
      form.reset();
      setJenis("PGB");
      setOkMsg("Kehadiran ditambah.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="tambah-jenis">
          Jenis *
        </label>
        <select
          id="tambah-jenis"
          name="jenis"
          className="input"
          value={jenis}
          onChange={(e) => setJenis(e.target.value as (typeof JENIS_KEHADIRAN)[number])}
        >
          {JENIS_KEHADIRAN.map((j) => (
            <option key={j} value={j}>
              {JENIS_KEHADIRAN_LABEL[j]}
            </option>
          ))}
        </select>
      </div>
      {perluSekolah ? (
        <div>
          <label className="label" htmlFor="tambah-sekolah">
            Sekolah *
          </label>
          <select id="tambah-sekolah" name="schoolCode" className="input" required defaultValue="">
            <option value="" disabled>
              Pilih sekolah…
            </option>
            {sekolah.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="tambah-organisasi">
            Organisasi *
          </label>
          <input
            id="tambah-organisasi"
            name="organisasi"
            className="input"
            maxLength={200}
            required
            defaultValue={jenis === "PEGAWAI" ? ORGANISASI_PPD : ""}
            key={jenis}
          />
        </div>
      )}
      <div>
        <label className="label" htmlFor="tambah-tarikh">
          Hari *
        </label>
        <select
          id="tambah-tarikh"
          name="tarikh"
          className="input"
          required
          defaultValue={hariLalai}
        >
          {hari.map((h) => (
            <option key={h} value={h}>
              {labelHariPendek(h)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="tambah-nama">
          Nama *
        </label>
        <input id="tambah-nama" name="nama" className="input" maxLength={200} required />
      </div>
      <div>
        <label className="label" htmlFor="tambah-jawatan">
          Jawatan *
        </label>
        <input id="tambah-jawatan" name="jawatan" className="input" maxLength={200} required />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-ink btn-sm" disabled={pending}>
          {pending ? "Menambah…" : "Tambah kehadiran"}
        </button>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
        {okMsg && <p className="text-sm text-charcoal">{okMsg}</p>}
      </div>
    </form>
  );
}
