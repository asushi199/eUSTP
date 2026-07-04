import Link from "next/link";
import { notFound } from "next/navigation";
import RoleDirectoryTable from "@/components/direktori/RoleDirectoryTable";
import { ROLE_INFO, roleFromSlug } from "@/lib/direktori/config";
import { listPublicDirectory } from "@/lib/direktori/queries";

export const dynamic = "force-dynamic";

export default async function RoleDirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = roleFromSlug(slug);
  if (!role) notFound();

  const info = ROLE_INFO[role];
  const rows = await listPublicDirectory(role);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← Direktori
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{info.short}</h1>
      <p className="mt-1 text-graphite">{info.label}</p>

      <div className="mt-6">
        <RoleDirectoryTable rows={rows} />
      </div>
    </div>
  );
}
