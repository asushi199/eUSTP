import type { Metadata } from "next";
import Link from "next/link";
import KhidmatBantuForm from "@/components/khidmat-bantu/KhidmatBantuForm";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Permohonan Khidmat Bantu — eUSTP Manjung",
  description:
    "Mohon ceramah, bengkel atau perkhidmatan MCP (siaran langsung & rakaman video) dari Unit Sumber dan Teknologi Pendidikan PPD Manjung.",
};

export const dynamic = "force-dynamic";
/** Muat naik surat melalui GAS boleh >10s (cold start); lalai Vercel Hobby hanya 10s. */
export const maxDuration = 60;

export default async function KhidmatBantuPage() {
  const accent = getModuleAccent("/khidmat-bantu");
  const schools = await listSchoolOptions();

  return (
    <PublicPageShell narrow>
      <Link href="/tempahan" className="text-sm text-graphite hover:text-ink">
        ← Tempahan & Perkhidmatan
      </Link>
      <PageHeader
        eyebrow="Khidmat Bantu"
        title="Permohonan Khidmat Bantu"
        accent={accent}
        description="Sekolah dan pegawai boleh mohon ceramah, bengkel, atau perkhidmatan Multiple Camera Product (MCP) — siaran langsung dan rakaman video."
        className="mt-2"
      />
      <div className="mt-8">
        <KhidmatBantuForm schools={schools} />
      </div>
    </PublicPageShell>
  );
}
