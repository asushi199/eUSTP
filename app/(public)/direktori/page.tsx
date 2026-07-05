import Link from "next/link";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { ROLE_ORDER, ROLE_INFO } from "@/lib/direktori/config";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata = { title: "Direktori — eUSTP Manjung" };

export default function DirektoriPage() {
  const accent = getModuleAccent("/direktori");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="Direktori GPICT"
        title="Direktori Guru Penyelaras"
        accent={accent}
        description="Rujukan terkini GPM, GPICT dan GP DELIMa bagi semua sekolah daerah Manjung. Pilih peranan untuk melihat senarai."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {ROLE_ORDER.map((role) => {
          const info = ROLE_INFO[role];
          return (
            <AccentCard key={role} href={`/direktori/${info.slug}`} accent={accent} className="p-6">
              <p className="text-xl font-semibold">{info.short}</p>
              <p className="mt-0.5 text-sm font-medium text-charcoal">{info.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-graphite">{info.description}</p>
              <span className="link-blue mt-4 inline-block text-sm">Lihat senarai →</span>
            </AccentCard>
          );
        })}
      </div>

      <AccentCard accent={accent} className="mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold">Maklumat sekolah anda berubah?</p>
          <p className="mt-1 text-sm text-graphite">
            Kemas kini nama dan nombor telefon guru penyelaras melalui borang awam —
            tiada log masuk diperlukan.
          </p>
        </div>
        <Link href="/direktori/kemaskini" className="btn-primary shrink-0">
          Kemas Kini
        </Link>
      </AccentCard>
    </PublicPageShell>
  );
}
