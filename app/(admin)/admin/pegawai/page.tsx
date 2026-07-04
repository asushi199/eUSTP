import { asc } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { pegawai } from "@/lib/schema";
import { deletePegawai, savePegawai } from "@/lib/actions/pegawai";
import ActionForm from "@/components/admin/ActionForm";
import DeleteButton from "@/components/admin/DeleteButton";

export const dynamic = "force-dynamic";

export default async function AdminPegawaiPage() {
  await requireKandunganAccess();
  const rows = await db.select().from(pegawai).orderBy(asc(pegawai.sort), asc(pegawai.id));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Pegawai USTP</h1>
      <p className="mt-1 text-sm text-graphite">
        Senarai pegawai untuk halaman Maklumat Asas. Foto: laluan public/ (cth.
        /pegawai/nama.png) atau pautan Drive.
      </p>

      <div className="card mt-5 divide-y divide-fog">
        {rows.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
            <ActionForm action={savePegawai} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="nama" defaultValue={p.nama} className="input w-56" required />
              <input
                name="jawatan"
                defaultValue={p.jawatan}
                className="input w-72"
                placeholder="jawatan"
              />
              <input
                name="telefon"
                defaultValue={p.telefon}
                className="input w-44"
                placeholder="telefon"
              />
              <input
                name="photoUrl"
                defaultValue={p.photoUrl}
                className="input w-56"
                placeholder="URL foto"
              />
              <input name="sort" type="number" defaultValue={p.sort} className="input w-20" />
              <label className="flex items-center gap-1 text-xs text-graphite">
                <input type="checkbox" name="aktif" defaultChecked={p.aktif} />
                aktif
              </label>
            </ActionForm>
            <DeleteButton
              action={deletePegawai.bind(null, p.id)}
              confirmText={`Padam pegawai "${p.nama}"?`}
            />
          </div>
        ))}
        <div className="px-4 py-4">
          <p className="mb-2 text-sm font-semibold">Tambah pegawai</p>
          <ActionForm
            action={savePegawai}
            submitLabel="Tambah"
            className="flex flex-wrap items-center gap-2"
          >
            <input name="nama" placeholder="Nama" className="input w-56" required />
            <input name="jawatan" placeholder="Jawatan" className="input w-72" />
            <input name="telefon" placeholder="Telefon" className="input w-44" />
            <input name="photoUrl" placeholder="URL foto" className="input w-56" />
            <input name="sort" type="number" placeholder="susunan" className="input w-24" />
            <input type="hidden" name="aktif" value="true" />
          </ActionForm>
        </div>
      </div>
    </>
  );
}
