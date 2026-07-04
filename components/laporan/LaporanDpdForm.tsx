"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLaporanDpd } from "@/lib/actions/laporan";
import PhotoInput, { type PickedPhoto } from "./PhotoInput";

const JENIS_OPTIONS = [
  "Bengkel / Kursus",
  "Taklimat",
  "Pemantauan / Bimbingan",
  "Pertandingan",
  "Program Kesedaran Digital",
  "Lain-lain",
];

export default function LaporanDpdForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.delete("photos");
    for (const p of photos) formData.append("photos", p.file);

    startTransition(async () => {
      const res = await createLaporanDpd(formData);
      if (!res.ok || !res.id) {
        setError(res.error ?? "Gagal menghantar laporan.");
        return;
      }
      const q = res.warnings?.length ? `?amaran=${encodeURIComponent(res.warnings.join(" | "))}` : "";
      router.push(`/laporan-dpd/berjaya/${res.id}${q}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold">1. Maklumat Program</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tarikh">
              Tarikh Program *
            </label>
            <input id="tarikh" name="tarikh" type="date" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="jenisProgram">
              Jenis Program
            </label>
            <select id="jenisProgram" name="jenisProgram" className="input" defaultValue="">
              <option value="">— Pilih —</option>
              {JENIS_OPTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="organisasi">
              Kod & Nama Sekolah / Organisasi *
            </label>
            <input
              id="organisasi"
              name="organisasi"
              className="input"
              placeholder="cth. ABA1234 — SK CONTOH"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="namaProgram">
              Nama Program *
            </label>
            <input id="namaProgram" name="namaProgram" className="input" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="lokasi">
              Tempat / Lokasi Program
            </label>
            <input id="lokasi" name="lokasi" className="input" />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">2. Bilangan Penyertaan</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ["bilMurid", "Murid"],
              ["bilGuru", "Guru"],
              ["bilPentadbir", "Pentadbir (AKP)"],
              ["bilSwasta", "Sektor Swasta"],
            ] as const
          ).map(([name, label]) => (
            <div key={name}>
              <label className="label" htmlFor={name}>
                {label}
              </label>
              <input
                id={name}
                name={name}
                type="number"
                min={0}
                defaultValue={0}
                className="input"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold">3. Dasar Pendidikan Digital</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="teras">
              Teras Dasar Pendidikan Digital
            </label>
            <textarea id="teras" name="teras" rows={2} className="textarea" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="strategi">
                Strategi
              </label>
              <input id="strategi" name="strategi" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="inisiatif">
                Inisiatif
              </label>
              <input id="inisiatif" name="inisiatif" className="input" />
            </div>
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
        <h2 className="text-lg font-semibold">5. Maklumat Pelapor</h2>
        <div className="mt-4 max-w-md">
          <label className="label" htmlFor="emailPelapor">
            Emel Pelapor
          </label>
          <input
            id="emailPelapor"
            name="emailPelapor"
            type="email"
            className="input"
            placeholder="nama@moe.gov.my"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-bloom-rose bg-bloom-rose/30 px-3 py-2 text-sm text-bloom-deep">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Menghantar…" : "Hantar Laporan"}
      </button>
    </form>
  );
}
