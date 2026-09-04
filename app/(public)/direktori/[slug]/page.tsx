import Link from "next/link";
import { notFound } from "next/navigation";
import DirectoryViewerBar from "@/components/direktori/DirectoryViewerBar";
import RoleDirectoryTable from "@/components/direktori/RoleDirectoryTable";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { ROLE_INFO, roleFromSlug } from "@/lib/direktori/config";
import { listPublicDirectory } from "@/lib/direktori/queries";
import { direktoriLoginHref } from "@/lib/moe-dl";

export const dynamic = "force-dynamic";

export default async function RoleDirectoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const role = roleFromSlug(slug);
  if (!role) notFound();

  const access = await getDirectoryContactAccess();
  const info = ROLE_INFO[role];
  const rows = await listPublicDirectory(role, { includeContacts: access.ok });
  const loginHref = direktoriLoginHref(`/direktori/${slug}`);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← Direktori
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{info.short}</h1>
      <p className="mt-1 text-graphite">{info.label}</p>

      {access.ok && access.authKind === "moe-dl" ? (
        <DirectoryViewerBar nama={access.nama} email={access.email} />
      ) : !access.ok ? (
        <div className="mt-6 rounded-xl border hairline bg-white px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm leading-relaxed text-graphite">
            Nombor telefon dan WhatsApp dilindungi. Log masuk dengan akaun{" "}
            <span className="font-medium text-ink">@moe-dl.edu.my</span>.
          </p>
          <Link href={loginHref} className="btn-primary mt-3 shrink-0 sm:mt-0">
            Log masuk MOE-DL
          </Link>
        </div>
      ) : null}

      <div className="mt-6">
        <RoleDirectoryTable rows={rows} contactsVisible={access.ok} />
      </div>
    </div>
  );
}
