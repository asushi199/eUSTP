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
    "Mohon ceramah, bengkel, perkhidmatan MCP (siaran langsung & rakaman video), atau lain-lain dari USTP PPD Manjung.",
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
        description="Sekolah dan pegawai boleh mohon ceramah, bengkel, perkhidmatan MCP (siaran langsung & rakaman video), atau lain-lain daripada USTP."
        className="mt-2"
      />
      <div className="mt-4 rounded-lg border border-fog bg-cloud/60 px-4 py-3 text-sm">
        <span className="text-graphite">Sudah menghantar permohonan? </span>
        <Link href="/khidmat-bantu/semak" className="link-blue font-medium">
          Semak permohonan saya
        </Link>
      </div>
      <div className="mt-6">
        <KhidmatBantuForm schools={schools} />
      </div>
    </PublicPageShell>
  );
}
