import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import StudentLookup from "@/components/tebus-buku/StudentLookup";
import TebusProgress from "@/components/tebus-buku/TebusProgress";
import { withDbTimeout } from "@/lib/db";
import { getDirectoryContactAccess } from "@/lib/direktori/access";
import { direktoriLoginHref } from "@/lib/moe-dl";
import {
  formatCount,
  formatTarikhSnapshot,
  shortSchoolName,
} from "@/lib/tebus-buku/format";
import { getTebusBukuSchoolPage } from "@/lib/tebus-buku/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ kod: string }>;
};

/** Senarai nama pelajar ialah data peribadi — jangan benarkan enjin carian mengindeks. */
const NO_INDEX = { index: false, follow: false } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  try {
    const page = await withDbTimeout(getTebusBukuSchoolPage(kod));
    if (!page) return { title: "Semak Tebus Buku — NEXa Manjung", robots: NO_INDEX };
    return {
      title: `${shortSchoolName(page.school.name)} — Semak Tebus Buku — NEXa Manjung`,
      robots: NO_INDEX,
    };
  } catch {
    return { title: "Semak Tebus Buku — NEXa Manjung", robots: NO_INDEX };
  }
}

export default async function TebusBukuSchoolPage({ params }: Props) {
  const { kod } = await params;

  // Senarai nama pelajar hanya untuk akaun MOE-DL (@moe-dl.edu.my) atau staf USTP.
  const access = await getDirectoryContactAccess();
  if (!access.ok) {
    redirect(direktoriLoginHref(`/laporan/tebus-buku/${encodeURIComponent(kod)}`));
  }

  const accent = getModuleAccent("/laporan/tebus-buku");

  let page = null;
  try {
    page = await withDbTimeout(getTebusBukuSchoolPage(kod));
  } catch {
    page = null;
  }

  if (!page) notFound();

  const tarikh = formatTarikhSnapshot(page.sourcedAt);
  const total = formatCount(page.school.total);
  const tebus = formatCount(page.school.tebusCount);
  const guna = formatCount(page.school.gunaCount);

  return (
    <PublicPageShell narrow>
      <Link
        href="/laporan/tebus-buku"
        className="text-sm text-graphite hover:text-ink"
      >
        ← Semua sekolah
      </Link>
      <PageHeader
        eyebrow="Semak Tebus Buku"
        title={shortSchoolName(page.school.name)}
        accent={accent}
        description={`${page.school.code}${tarikh ? ` · data ${tarikh}` : ""}`}
        className="mt-2"
      />
      <p className="mt-4 text-sm text-graphite">
        {tebus} / {total} sudah tebus · {guna} sudah guna
      </p>
      <TebusProgress
        className="mt-3"
        total={page.school.total}
        tebusCount={page.school.tebusCount}
        gunaCount={page.school.gunaCount}
      />
      <StudentLookup
        schoolCode={page.school.code}
        schoolName={page.school.name}
        students={page.students}
        tingkatan={page.tingkatan}
      />
    </PublicPageShell>
  );
}
