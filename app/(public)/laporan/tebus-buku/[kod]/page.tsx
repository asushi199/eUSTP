import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import StudentLookup from "@/components/tebus-buku/StudentLookup";
import { withDbTimeout } from "@/lib/db";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kod } = await params;
  try {
    const page = await withDbTimeout(getTebusBukuSchoolPage(kod));
    if (!page) return { title: "Semak Tebus Buku — NEXa Manjung" };
    return {
      title: `${shortSchoolName(page.school.name)} — Semak Tebus Buku — NEXa Manjung`,
    };
  } catch {
    return { title: "Semak Tebus Buku — NEXa Manjung" };
  }
}

export default async function TebusBukuSchoolPage({ params }: Props) {
  const { kod } = await params;
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
      <StudentLookup students={page.students} tingkatan={page.tingkatan} />
    </PublicPageShell>
  );
}
