import Link from "next/link";
import AdminPegawaiPpd from "@/components/mjkd/AdminPegawaiPpd";
import { requireKandunganAccess } from "@/lib/rbac";
import { listPegawaiPpdAdmin } from "@/lib/mjkd/queries";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ cari?: string }>;
};

/** Senarai pegawai PPD untuk kehadiran MJKD (bukan jadual pengguna/pegawai USTP). */
export default async function AdminPegawaiPpdPage({ searchParams }: Props) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const cari = sp.cari?.trim().slice(0, 100) ?? "";
  const pegawai = await listPegawaiPpdAdmin(cari);

  return (
    <>
      <p className="text-sm text-graphite">
        <Link href="/admin/mjkd" className="hover:text-ink">
          ← MJKD 2026
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Pegawai PPD</h1>
      <p className="mt-1 text-sm text-graphite">
        Senarai untuk carian kehadiran MJKD. Pegawai tidak aktif tidak muncul dalam carian awam.
        Tiada nombor IC atau nama pengguna disimpan di sini.
      </p>

      <form method="get" className="card mt-6 grid gap-3 p-5 sm:grid-cols-[minmax(220px,1fr)_auto]">
        <div>
          <label className="label" htmlFor="pegawai-cari">
            Cari pegawai
          </label>
          <input
            id="pegawai-cari"
            name="cari"
            className="input"
            defaultValue={cari}
            placeholder="Nama, jawatan atau sektor"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button type="submit" className="btn-ink btn-sm">
            Cari
          </button>
          {cari ? (
            <Link href="/admin/mjkd/pegawai" className="btn-outline-ink btn-sm">
              Set semula
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-6">
        <AdminPegawaiPpd
          pegawai={pegawai.map((p) => ({
            id: p.id,
            nama: p.nama,
            jawatan: p.jawatan,
            sektor: p.sektor,
            aktif: p.aktif,
          }))}
        />
      </div>
    </>
  );
}
