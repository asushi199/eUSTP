import Link from "next/link";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { ROLE_GROUPS, ROLE_INFO } from "@/lib/direktori/config";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata = { title: "CoE Direktori — eUSTP Manjung" };

export default function DirektoriPage() {
  const accent = getModuleAccent("/direktori");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Direktori"
        title="Direktori Perhubungan Sekolah"
        accent={accent}
        description="Rujukan perhubungan pengurusan dan penyelaras sekolah daerah Manjung. Pilih jawatan untuk melihat senarai."
      />

      <AccentCard
        accent={accent}
        className="mt-8 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center"
      >
        <div>
          <p className="font-semibold">Maklumat sekolah anda berubah?</p>
          <p className="mt-1 text-sm text-graphite">
            Kemas kini nama dan nombor telefon mudah alih pengurusan atau penyelaras sekolah melalui borang awam.
          </p>
        </div>
        <Link href="/direktori/kemaskini" className="btn-primary shrink-0">Kemas Kini</Link>
      </AccentCard>

      <div className="mt-8 space-y-10">
        {ROLE_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`direktori-${group.id}`}>
            <div className="mb-4 border-b hairline pb-3">
              <h2 id={`direktori-${group.id}`} className="text-xl font-semibold">{group.title}</h2>
              <p className="mt-1 text-sm text-graphite">{group.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.roles.map((role) => {
                const info = ROLE_INFO[role];
                return (
                  <AccentCard key={role} href={`/direktori/${info.slug}`} accent={accent} className="p-5">
                    <p className="text-lg font-semibold">{info.short}</p>
                    <p className="mt-0.5 text-sm font-medium text-charcoal">{info.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-graphite">{info.description}</p>
                    <span className="link-blue mt-4 inline-block text-sm">Lihat senarai →</span>
                  </AccentCard>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PublicPageShell>
  );
}
