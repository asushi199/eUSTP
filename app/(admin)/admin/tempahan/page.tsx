import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { listPkgs } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function AdminTempahanPage() {
  const user = await requireUser();
  const all = await listPkgs();
  const visible =
    user.peranan === "PKG_Admin" ? all.filter((p) => p.id === user.pkgId) : all;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Tempahan PKG — Admin</h1>
      <p className="mt-1 text-sm text-graphite">Pilih PKG untuk diurus.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <div className="card p-6 text-graphite sm:col-span-2 lg:col-span-3">
            Tiada PKG untuk akaun anda. Hubungi Pentadbir Sistem.
          </div>
        )}
        {visible.map((pkg) => (
          <Link
            key={pkg.id}
            href={`/admin/tempahan/${pkg.id}`}
            className="card p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
          >
            <p className="font-semibold">{pkg.name}</p>
            <p className="mt-1 text-sm text-graphite">
              WhatsApp: {pkg.whatsappAdminPhone || "belum ditetapkan"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
