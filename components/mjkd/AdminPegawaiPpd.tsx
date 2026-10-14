"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSimpanPegawaiPpdMjkd, adminTogolPegawaiAktifMjkd } from "@/lib/actions/mjkd-kehadiran";

export type PegawaiAdminItem = {
  id: number;
  nama: string;
  jawatan: string;
  sektor: string;
  aktif: boolean;
};

function PegawaiForm({
  awal,
  onSelesai,
}: {
  awal?: PegawaiAdminItem;
  onSelesai: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const idAsas = awal?.id ?? "baharu";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    if (awal) formData.set("id", String(awal.id));
    startTransition(async () => {
      const res = await adminSimpanPegawaiPpdMjkd(formData);
      if (!res.ok) {
        setError(res.error ?? "Gagal menyimpan.");
        return;
      }
      router.refresh();
      onSelesai();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor={`peg-nama-${idAsas}`}>
          Nama *
        </label>
        <input
          id={`peg-nama-${idAsas}`}
          name="nama"
          className="input"
          required
          maxLength={200}
          defaultValue={awal?.nama}
        />
      </div>
      <div>
        <label className="label" htmlFor={`peg-jawatan-${idAsas}`}>
          Jawatan
        </label>
        <input
          id={`peg-jawatan-${idAsas}`}
          name="jawatan"
          className="input"
          maxLength={300}
          defaultValue={awal?.jawatan}
        />
      </div>
      <div>
        <label className="label" htmlFor={`peg-sektor-${idAsas}`}>
          Sektor
        </label>
        <input
          id={`peg-sektor-${idAsas}`}
          name="sektor"
          className="input"
          maxLength={100}
          defaultValue={awal?.sektor}
        />
      </div>
      <label className="flex items-center gap-3 self-end pb-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="aktif"
          value="yes"
          className="h-4 w-4 accent-ink"
          defaultChecked={awal?.aktif ?? true}
        />
        Aktif (muncul dalam carian kehadiran)
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-ink btn-sm" disabled={pending}>
          {pending ? "Menyimpan…" : awal ? "Simpan" : "Tambah pegawai"}
        </button>
        <button type="button" className="btn-outline-ink btn-sm" onClick={onSelesai}>
          Batal
        </button>
        {error && <p className="text-sm text-bloom-deep">{error}</p>}
      </div>
    </form>
  );
}

export default function AdminPegawaiPpd({ pegawai }: { pegawai: PegawaiAdminItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sunting, setSunting] = useState<number | null>(null);
  const [tambah, setTambah] = useState(false);

  function togol(p: PegawaiAdminItem) {
    setError(null);
    startTransition(async () => {
      const res = await adminTogolPegawaiAktifMjkd(p.id, !p.aktif);
      if (!res.ok) {
        setError(res.error ?? "Gagal menukar status.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-graphite">
          {pegawai.length} pegawai · {pegawai.filter((p) => p.aktif).length} aktif
        </p>
        {!tambah ? (
          <button type="button" className="btn-ink btn-sm" onClick={() => setTambah(true)}>
            Tambah pegawai
          </button>
        ) : null}
      </div>
      {error && <p className="text-sm text-bloom-deep">{error}</p>}

      {tambah ? (
        <div className="card p-5">
          <h3 className="mb-4 font-semibold">Pegawai baharu</h3>
          <PegawaiForm onSelesai={() => setTambah(false)} />
        </div>
      ) : null}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Jawatan</th>
              <th className="px-4 py-3 font-semibold">Sektor</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pegawai.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-graphite">
                  Tiada pegawai sepadan.
                </td>
              </tr>
            ) : (
              pegawai.map((p) => (
                <tr key={p.id} className="border-b hairline align-top last:border-0">
                  <td className="px-4 py-3" colSpan={sunting === p.id ? 5 : 1}>
                    {sunting === p.id ? (
                      <PegawaiForm awal={p} onSelesai={() => setSunting(null)} />
                    ) : (
                      <span className={p.aktif ? "font-medium" : "text-graphite"}>{p.nama}</span>
                    )}
                  </td>
                  {sunting === p.id ? null : (
                    <>
                      <td className="px-4 py-3">{p.jawatan || "—"}</td>
                      <td className="px-4 py-3 text-xs">{p.sektor || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="status-badge">{p.aktif ? "Aktif" : "Tidak aktif"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            className="btn-outline-ink btn-sm"
                            onClick={() => setSunting(p.id)}
                          >
                            Sunting
                          </button>
                          <button
                            type="button"
                            className="btn-outline-ink btn-sm"
                            disabled={pending}
                            onClick={() => togol(p)}
                          >
                            {p.aktif ? "Nyahaktif" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
