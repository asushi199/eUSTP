import Link from "next/link";
import { listPkgs } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tempahan PKG — eUSTP Manjung" };

export default async function TempahanPage() {
  const pkgList = await listPkgs();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Tempahan Bilik PKG</h1>
      <p className="mt-3 max-w-xl text-graphite">
        Tempah bilik dan kemudahan di Pusat Kegiatan Guru daerah Manjung.
        Pilih PKG anda untuk melihat bilik dan slot yang tersedia.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pkgList.length === 0 && (
          <div className="card p-6 text-graphite sm:col-span-2 lg:col-span-3">
            Tiada PKG berdaftar lagi. Sila hubungi pentadbir USTP.
          </div>
        )}
        {pkgList.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/tempahan/${pkg.id}`}
            className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-modal"
          >
            <p className="text-lg font-semibold">{pkg.name}</p>
            <span className="link-blue mt-3 inline-block text-sm">
              Lihat bilik & tempah →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
