import Link from "next/link";
import { notFound } from "next/navigation";
import PkgSettingsForm from "@/components/tempahan/PkgSettingsForm";
import { requireTempahanAccess } from "@/lib/rbac";
import { getPkg } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function AdminPkgSettingsPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  await requireTempahanAccess(pkgId);

  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  return (
    <>
      <Link href={`/admin/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← {pkg.name}
      </Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tetapan PKG</h1>

      <div className="mt-6 max-w-md">
        <PkgSettingsForm pkgId={pkgId} whatsappAdminPhone={pkg.whatsappAdminPhone ?? ""} />
      </div>
    </>
  );
}
