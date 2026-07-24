import Link from "next/link";
import AccentCard from "@/components/AccentCard";
import MobileUpdateButton from "@/components/direktori/MobileUpdateButton";
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

      <div id="direktori-kemaskini">
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
      </div>

      <nav
        aria-label="Pilih kategori direktori"
        className="sticky top-16 z-30 -mx-4 mt-6 grid grid-cols-2 gap-3 border-y hairline bg-white/95 px-4 py-2 backdrop-blur-sm sm:hidden"
      >
        {ROLE_GROUPS.map((group) => (
          <Link
            key={group.id}
            href={`#direktori-${group.id}`}
            className="btn-outline h-auto min-h-11 px-3 py-2.5 text-center normal-case tracking-normal"
          >
            {group.title}
          </Link>
        ))}
      </nav>

      <div className="mt-6 space-y-10 sm:mt-8">
        {ROLE_GROUPS.map((group) => (
          <section
            key={group.id}
            id={`direktori-${group.id}`}
            aria-labelledby={`direktori-${group.id}-title`}
            className="scroll-mt-32"
          >
            <div className="mb-4 sm:border-b sm:pb-3">
              <h2 id={`direktori-${group.id}-title`} className="sr-only sm:not-sr-only sm:text-xl sm:font-semibold">
                {group.title}
              </h2>
              <p className="mt-1 hidden text-sm text-graphite sm:block">{group.description}</p>
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

      <MobileUpdateButton />
    </PublicPageShell>
  );
}
