import Link from "next/link";
import { requireUser } from "@/lib/rbac";
import { countPendingBookingsByPkg, listPkgs } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function AdminTempahanPage() {
  const user = await requireUser();
  const all = await listPkgs();
  const visible =
    user.peranan === "PKG_Admin" ? all.filter((p) => p.id === user.pkgId) : all;
  const pendingCounts = await countPendingBookingsByPkg(visible.map((p) => p.id));

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
        {visible.map((pkg) => {
          const pending = pendingCounts[pkg.id] ?? 0;
          return (
            <Link
              key={pkg.id}
              href={`/admin/tempahan/${pkg.id}`}
              className="card relative p-5 transition hover:-translate-y-0.5 hover:shadow-modal"
            >
              {pending > 0 ? (
                <span
                  className="absolute right-3 top-3 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white"
                  aria-label={`${pending} permohonan baharu menunggu tindakan`}
                >
                  {pending > 9 ? "9+" : pending}
                </span>
              ) : null}
              <p className="font-semibold">{pkg.name}</p>
              <p className="mt-1 text-sm text-graphite">
                WhatsApp: {pkg.whatsappAdminPhone || "belum ditetapkan"}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
