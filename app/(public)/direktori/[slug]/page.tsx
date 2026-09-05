import Link from "next/link";
import { notFound } from "next/navigation";
import AccentCard from "@/components/AccentCard";
import DirectoryViewerBar from "@/components/direktori/DirectoryViewerBar";
import MobileUpdateButton from "@/components/direktori/MobileUpdateButton";
import RoleDirectoryTable from "@/components/direktori/RoleDirectoryTable";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { ROLE_INFO, roleFromSlug } from "@/lib/direktori/config";
import { listPublicDirectory } from "@/lib/direktori/queries";
import { direktoriLoginHref } from "@/lib/moe-dl";
import { getModuleAccent } from "@/lib/module-theme";

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
  const accent = getModuleAccent("/direktori");

  return (
    <>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <Link href="/direktori/sekolah" className="text-sm text-graphite hover:text-ink">
        ← Direktori Sekolah
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

      <div id="direktori-kemaskini">
        <AccentCard
          accent={accent}
          className="mt-6 flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-semibold">Maklumat tidak tepat?</p>
            <p className="mt-1 text-sm text-graphite">
              Kemas kini nama atau nombor telefon sekolah anda. Akaun MOE-DL
              diperlukan.
            </p>
          </div>
          <Link href="/direktori/kemaskini" className="btn-primary shrink-0">
            Kemas Kini
          </Link>
        </AccentCard>
      </div>

      <div className="mt-6">
        <RoleDirectoryTable rows={rows} contactsVisible={access.ok} />
      </div>
    </div>
    <MobileUpdateButton />
    </>
  );
}
