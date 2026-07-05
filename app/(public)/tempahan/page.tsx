import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { listPkgs } from "@/lib/tempahan/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

export const metadata = { title: "Tempahan PKG — eUSTP Manjung" };

export default async function TempahanPage() {
  const pkgList = await listPkgs();
  const accent = getModuleAccent("/tempahan");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="Tempahan PKG"
        title="Tempahan Bilik PKG"
        accent={accent}
        description="Tempah bilik dan kemudahan di Pusat Kegiatan Guru daerah Manjung. Pilih PKG anda untuk melihat bilik dan slot yang tersedia."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pkgList.length === 0 && (
          <div className="card p-6 text-graphite sm:col-span-2 lg:col-span-3">
            Tiada PKG berdaftar lagi. Sila hubungi pentadbir USTP.
          </div>
        )}
        {pkgList.map((pkg) => (
          <AccentCard key={pkg.id} href={`/tempahan/${pkg.id}`} accent={accent} className="p-6">
            <p className="text-lg font-semibold">{pkg.name}</p>
            <span className="link-blue mt-3 inline-block text-sm">Lihat bilik & tempah →</span>
          </AccentCard>
        ))}
      </div>
    </PublicPageShell>
  );
}
