import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import SemakKhidmatForm from "@/components/khidmat-bantu/SemakKhidmatForm";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Semak Permohonan Khidmat Bantu — eUSTP Manjung",
  description:
    "Semak status permohonan khidmat bantu anda ikut nombor telefon atau kod sekolah, dan hantar semula mesej WhatsApp kepada admin.",
};

export const dynamic = "force-dynamic";

export default async function SemakKhidmatPage() {
  const accent = getModuleAccent("/khidmat-bantu");
  const schools = await listSchoolOptions();

  return (
    <PublicPageShell narrow>
      <Link href="/khidmat-bantu" className="text-sm text-graphite hover:text-ink">
        ← Permohonan Khidmat Bantu
      </Link>
      <PageHeader
        eyebrow="Khidmat Bantu"
        title="Semak Permohonan Saya"
        accent={accent}
        description="Masukkan nombor telefon atau kod sekolah yang digunakan semasa memohon. Permohonan yang masih menunggu boleh dihantar semula ke WhatsApp admin — tanpa perlu mengisi borang semula."
        className="mt-2"
      />
      <div className="mt-8">
        <SemakKhidmatForm schools={schools} />
      </div>
    </PublicPageShell>
  );
}
