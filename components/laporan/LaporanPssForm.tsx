"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLaporanPss } from "@/lib/actions/laporan";
import type { SchoolOption } from "@/lib/direktori/queries";
import PhotoInput, { type PickedPhoto } from "./PhotoInput";

export default function LaporanPssForm({ schools }: { schools: SchoolOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  const [query, setQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(schools[0]?.code ?? "");

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      [s.code, s.name, s.zone].join(" ").toLowerCase().includes(q),
    );
  }, [query, schools]);

  useEffect(() => {
    if (filteredSchools.length === 0) {
      setSchoolCode("");
      return;
    }
    if (!filteredSchools.some((s) => s.code === schoolCode)) {
      setSchoolCode(filteredSchools[0].code);
    }
  }, [filteredSchools, schoolCode]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("schoolCode", schoolCode);
    formData.delete("photos");
    for (const p of photos) formData.append("photos", p.file);

    startTransition(async () => {
      const res = await createLaporanPss(formData);
      if (!res.ok || !res.id) {
        setError(res.error ?? "Gagal menghantar laporan.");
        return;
      }
      const q = res.warnings?.length
        ? `?amaran=${encodeURIComponent(res.warnings.join(" | "))}`
        : "";
      router.push(`/laporan-pss/berjaya/${res.id}${q}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Sekolah & Program</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="carian-sekolah">
              Cari sekolah
            </label>
            <input
              id="carian-sekolah"
              className="input"
              placeholder="Kod atau nama sekolah"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <p className="mt-1 text-xs text-graphite">
              {filteredSchools.length} sekolah sepadan
            </p>
          </div>
          <div>
            <label className="label" htmlFor="sekolah">
              Sekolah *
            </label>
            <select
              id="sekolah"
              className="input"
              required
              value={schoolCode}
              disabled={filteredSchools.length === 0}
              onChange={(e) => setSchoolCode(e.target.value)}
            >
              {filteredSchools.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="namaProgram">
              Nama Program *
            </label>
            <input id="namaProgram" name="namaProgram" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="tarikhMula">
              Tarikh Mula *
            </label>
            <input id="tarikhMula" name="tarikhMula" type="date" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="tarikhTamat">
              Tarikh Tamat (jika berbeza)
            </label>
            <input id="tarikhTamat" name="tarikhTamat" type="date" className="input" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Penyertaan</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:max-w-sm">
          <div>
            <label className="label" htmlFor="bilGuru">
              Pegawai / Guru
            </label>
            <input
              id="bilGuru"
              name="bilGuru"
              type="number"
              min={0}
              defaultValue={0}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="bilMurid">
              Murid
            </label>
            <input
              id="bilMurid"
              name="bilMurid"
              type="number"
              min={0}
              defaultValue={0}
              className="input"
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">3. Butiran Aktiviti</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="objektif">
              Objektif
            </label>
            <textarea id="objektif" name="objektif" rows={3} className="textarea" />
          </div>
          <div>
            <label className="label" htmlFor="ringkasan">
              Ringkasan Program
            </label>
            <textarea id="ringkasan" name="ringkasan" rows={4} className="textarea" />
          </div>
          <div>
            <label className="label" htmlFor="impak">
              Impak
            </label>
            <textarea id="impak" name="impak" rows={3} className="textarea" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">4. Gambar Program</h2>
        <div className="mt-4">
          <PhotoInput photos={photos} onChange={setPhotos} disabled={pending} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">5. Pelapor</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="pelapor">
              Nama Pelapor *
            </label>
            <input id="pelapor" name="pelapor" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="jawatan">
              Jawatan
            </label>
            <input
              id="jawatan"
              name="jawatan"
              className="input"
              placeholder="cth. Guru Perpustakaan & Media"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={pending || !schoolCode}
      >
        {pending ? "Menghantar…" : "Hantar Laporan"}
      </button>
    </form>
  );
}
