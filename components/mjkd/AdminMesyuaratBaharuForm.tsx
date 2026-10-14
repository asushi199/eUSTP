"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminBuatMesyuaratMjkd } from "@/lib/actions/mjkd";
import { lebihAwal, mesyuaratSebelumLalai } from "@/lib/mjkd/hari";

type MesyuaratPilihan = { id: string; bil: number; tahun: number; label: string };

export default function AdminMesyuaratBaharuForm({
  mesyuaratLain,
}: {
  mesyuaratLain: MesyuaratPilihan[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const tahunIni = new Date().getFullYear();
  const [bil, setBil] = useState("");
  const [tahun, setTahun] = useState(String(tahunIni));
  const [sebelumPilihan, setSebelumPilihan] = useState<string | null>(null);
  // Lalai: mesyuarat terkini sebelum (tahun, bil) yang ditaip; pilihan pengguna mengatasinya.
  const sebelum = useMemo(() => {
    if (sebelumPilihan !== null) return sebelumPilihan;
    const b = Number(bil);
    const t = Number(tahun);
    if (!Number.isInteger(b) || !Number.isInteger(t)) return "";
    return mesyuaratSebelumLalai(mesyuaratLain, { tahun: t, bil: b })?.id ?? "";
  }, [sebelumPilihan, bil, tahun, mesyuaratLain]);
  // Hanya mesyuarat yang lebih awal daripada Bil./tahun yang ditaip boleh dipilih.
  const pilihanSebelum = useMemo(() => {
    const b = Number(bil);
    const t = Number(tahun);
    if (!Number.isInteger(b) || b < 1 || !Number.isInteger(t)) return mesyuaratLain;
    return mesyuaratLain.filter((m) => lebihAwal(m, { tahun: t, bil: b }));
  }, [bil, tahun, mesyuaratLain]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminBuatMesyuaratMjkd(formData);
      if (!res.ok || !res.id) {
        setError(res.error ?? "Gagal mencipta mesyuarat.");
        return;
      }
      router.push(`/admin/mjkd/${res.id}`);
    });
  }

  return (
    <form onSubmit={onSubmit} className="card mt-6 grid gap-4 p-5 sm:grid-cols-3">
      <div>
        <label className="label" htmlFor="mjkd-baru-bil">
          Bil. *
        </label>
        <input
          id="mjkd-baru-bil"
          name="bil"
          className="input"
          type="number"
          min={1}
          max={99}
          required
          value={bil}
          onChange={(e) => setBil(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="mjkd-baru-tahun">
          Tahun *
        </label>
        <input
          id="mjkd-baru-tahun"
          name="tahun"
          className="input"
          type="number"
          min={2020}
          max={2100}
          required
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="mjkd-baru-tarikh">
          Tarikh mula *
        </label>
        <input id="mjkd-baru-tarikh" name="tarikh" className="input" type="date" required />
      </div>
      <div>
        <label className="label" htmlFor="mjkd-baru-tamat">
          Tarikh tamat (jika berbilang hari)
        </label>
        <input id="mjkd-baru-tamat" name="tarikhTamat" className="input" type="date" />
      </div>
      <div>
        <label className="label" htmlFor="mjkd-baru-tempat">
          Tempat
        </label>
        <input
          id="mjkd-baru-tempat"
          name="tempat"
          className="input"
          maxLength={300}
          autoComplete="off"
        />
      </div>
      <div>
        <label className="label" htmlFor="mjkd-baru-sebelum">
          Mesyuarat sebelum
        </label>
        <select
          id="mjkd-baru-sebelum"
          name="mesyuaratSebelumId"
          className="input"
          value={sebelum}
          onChange={(e) => setSebelumPilihan(e.target.value)}
        >
          <option value="">— Tiada —</option>
          {pilihanSebelum.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <button type="submit" className="btn-ink" disabled={pending}>
          {pending ? "Mencipta…" : "Cipta mesyuarat"}
        </button>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
      </div>
    </form>
  );
}
