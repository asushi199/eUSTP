"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchool } from "@/lib/actions/direktori";

export default function TambahSekolahForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");

  if (!open) {
    return (
      <button type="button" className="btn-outline-ink btn-sm" onClick={() => setOpen(true)}>
        + Tambah Sekolah
      </button>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createSchool({ code, name, zone });
      if (!res.ok) {
        setError(res.error ?? "Gagal menambah sekolah.");
        return;
      }
      setCode("");
      setName("");
      setZone("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 p-5">
      <p className="font-semibold">Tambah Sekolah</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="kod">
            Kod
          </label>
          <input
            id="kod"
            className="input"
            placeholder="ABA0001"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="nama">
            Nama Sekolah
          </label>
          <input
            id="nama"
            className="input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <div className="max-w-xs">
        <label className="label" htmlFor="zon">
          Zon PKG
        </label>
        <input
          id="zon"
          className="input"
          placeholder="cth. PKG Sitiawan"
          value={zone}
          onChange={(e) => setZone(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-bloom-deep">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary btn-sm" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          className="btn-outline-ink btn-sm"
          onClick={() => setOpen(false)}
        >
          Batal
        </button>
      </div>
    </form>
  );
}
