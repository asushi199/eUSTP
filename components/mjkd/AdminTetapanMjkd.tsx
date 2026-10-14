"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adminKemaskiniMesyuaratMjkd,
  adminMuatNaikMinitMjkd,
} from "@/lib/actions/mjkd";

type Props = {
  /** Mesyuarat lain untuk pilihan "Mesyuarat sebelum" (tanpa mesyuarat ini). */
  mesyuaratLain: { id: string; label: string }[];
  mesyuarat: {
    id: string;
    bil: number;
    tahun: number;
    tarikh: string;
    tarikhTamat: string | null;
    mesyuaratSebelumId: string | null;
    tempat: string;
    minitUrl: string;
    maklumBalasDibuka: boolean;
    tarikhTutupMaklumBalas: string | null;
  };
};

export default function AdminTetapanMjkd({ mesyuarat, mesyuaratLain }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [muatNaikPending, startMuatNaik] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [minitError, setMinitError] = useState<string | null>(null);
  const [minitOk, setMinitOk] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.set("id", mesyuarat.id);
    startTransition(async () => {
      const res = await adminKemaskiniMesyuaratMjkd(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      setOkMsg("Disimpan.");
      router.refresh();
    });
  }

  function onMuatNaik(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMinitError(null);
    setMinitOk(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("id", mesyuarat.id);
    startMuatNaik(async () => {
      const res = await adminMuatNaikMinitMjkd(formData);
      if (!res.ok) {
        setMinitError(res.error ?? "Gagal memuat naik minit.");
        return;
      }
      form.reset();
      setMinitOk("Minit dimuat naik.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="card space-y-5 p-6">
        <h2 className="text-lg font-semibold">Maklumat mesyuarat</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tet-bil">
              Bil. *
            </label>
            <input
              id="tet-bil"
              name="bil"
              className="input"
              type="number"
              min={1}
              max={99}
              required
              defaultValue={mesyuarat.bil}
            />
          </div>
          <div>
            <label className="label" htmlFor="tet-tahun">
              Tahun *
            </label>
            <input
              id="tet-tahun"
              name="tahun"
              className="input"
              type="number"
              min={2020}
              max={2100}
              required
              defaultValue={mesyuarat.tahun}
            />
          </div>
          <div>
            <label className="label" htmlFor="tet-tarikh">
              Tarikh mula *
            </label>
            <input
              id="tet-tarikh"
              name="tarikh"
              className="input"
              type="date"
              required
              defaultValue={mesyuarat.tarikh}
            />
          </div>
          <div>
            <label className="label" htmlFor="tet-tamat">
              Tarikh tamat (jika berbilang hari)
            </label>
            <input
              id="tet-tamat"
              name="tarikhTamat"
              className="input"
              type="date"
              defaultValue={mesyuarat.tarikhTamat ?? ""}
            />
            <p className="mt-1 text-xs text-graphite">Kosong = satu hari sahaja.</p>
          </div>
          <div>
            <label className="label" htmlFor="tet-sebelum">
              Mesyuarat sebelum
            </label>
            <select
              id="tet-sebelum"
              name="mesyuaratSebelumId"
              className="input"
              defaultValue={mesyuarat.mesyuaratSebelumId ?? ""}
            >
              <option value="">— Tiada (guna mesyuarat ini sendiri) —</option>
              {mesyuaratLain.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-graphite">
              Minit dan maklum balas mesyuarat ini dipaparkan semasa pembentangan mesyuarat semasa.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="tet-tempat">
              Tempat
            </label>
            <input
              id="tet-tempat"
              name="tempat"
              className="input"
              maxLength={300}
              defaultValue={mesyuarat.tempat}
            />
          </div>
        </div>

        <div className="border-t hairline pt-5">
          <h3 className="font-semibold">Maklum balas sekolah</h3>
          <label className="mt-3 flex items-start gap-3 text-sm font-medium leading-relaxed text-ink">
            <input
              type="checkbox"
              name="maklumBalasDibuka"
              value="yes"
              className="mt-1 h-4 w-4 shrink-0 accent-ink"
              defaultChecked={mesyuarat.maklumBalasDibuka}
            />
            <span>Buka maklum balas kepada sekolah (borang awam diaktifkan)</span>
          </label>
          <div className="mt-4 max-w-xs">
            <label className="label" htmlFor="tet-tutup">
              Tarikh tutup (pilihan)
            </label>
            <input
              id="tet-tutup"
              name="tarikhTutupMaklumBalas"
              className="input"
              type="date"
              defaultValue={mesyuarat.tarikhTutupMaklumBalas ?? ""}
            />
            <p className="mt-1 text-xs text-graphite">
              Hari terakhir maklum balas diterima. Kosongkan jika tiada had tarikh.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-ink" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan tetapan"}
          </button>
          {error && <p className="text-sm text-bloom-deep">{error}</p>}
          {okMsg && <p className="text-sm text-charcoal">{okMsg}</p>}
        </div>
      </form>

      <form onSubmit={onMuatNaik} className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold">Minit mesyuarat (PDF)</h2>
        {mesyuarat.minitUrl ? (
          <p className="text-sm">
            Minit semasa:{" "}
            <a
              href={mesyuarat.minitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-blue"
            >
              Buka PDF
            </a>
          </p>
        ) : (
          <p className="text-sm text-graphite">Belum ada minit dimuat naik.</p>
        )}
        <div className="max-w-md">
          <label className="label" htmlFor="tet-minit">
            {mesyuarat.minitUrl ? "Ganti minit (PDF, maks 8 MB)" : "Muat naik minit (PDF, maks 8 MB)"}
          </label>
          <input
            id="tet-minit"
            name="minit"
            className="input"
            type="file"
            accept="application/pdf,.pdf"
            required
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-outline-ink" disabled={muatNaikPending}>
            {muatNaikPending ? "Memuat naik…" : "Muat naik"}
          </button>
          {minitError && <p className="text-sm text-bloom-deep">{minitError}</p>}
          {minitOk && <p className="text-sm text-charcoal">{minitOk}</p>}
        </div>
      </form>
    </div>
  );
}
