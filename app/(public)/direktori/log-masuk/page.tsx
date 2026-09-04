import { redirect } from "next/navigation";
import Link from "next/link";
import MoeDlSignInPanel from "@/components/direktori/MoeDlSignInPanel";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { getModuleAccent } from "@/lib/module-theme";
import { isGoogleAuthConfigured, safeDirektoriCallbackUrl } from "@/lib/moe-dl";

export const dynamic = "force-dynamic";

export const metadata = { title: "Log Masuk Direktori — NEXa Manjung" };

function googleErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  if (error === "AccessDenied") {
    return "Sila log masuk dengan akaun @moe-dl.edu.my, bukan Gmail peribadi.";
  }
  if (error === "Configuration") {
    return "Log masuk Google belum dikonfigurasi. Sila hubungi pentadbir USTP.";
  }
  return "Log masuk tidak berjaya. Sila cuba lagi.";
}

export default async function DirektoriLogMasukPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const callbackUrl = safeDirektoriCallbackUrl(sp.from);
  const access = await getDirectoryContactAccess();
  if (access.ok) redirect(callbackUrl);

  const accent = getModuleAccent("/direktori");

  return (
    <PublicPageShell narrow className="pb-16 sm:pb-12">
      <Link href="/direktori" className="text-sm text-graphite hover:text-ink">
        ← Direktori
      </Link>
      <PageHeader
        className="mt-2"
        eyebrow="CoE Direktori"
        title="Log masuk MOE-DL"
        accent={accent}
        description="Akaun Google KPM (@moe-dl.edu.my) diperlukan untuk melihat nombor telefon rakan guru."
      />
      <div className="mt-8">
        <MoeDlSignInPanel
          callbackUrl={callbackUrl}
          googleEnabled={isGoogleAuthConfigured()}
          errorMessage={googleErrorMessage(sp.error)}
        />
      </div>
    </PublicPageShell>
  );
}
