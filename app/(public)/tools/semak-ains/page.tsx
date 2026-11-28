import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import SemakAinsApp from "@/components/tools/semak-ains/SemakAinsApp";
import { getModuleAccent } from "@/lib/module-theme";
import { NAMA_ALAT } from "@/lib/tools/semak-ains/nama";

export const metadata: Metadata = {
  title: `${NAMA_ALAT} — NEXa Manjung`,
  description:
    "Alat GPM untuk menyemak rekod bacaan AINS murid secara automatik dan mengesahkannya secara pukal. Data murid tidak disimpan oleh NEXa.",
};

export default function SemakAinsPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title={NAMA_ALAT}
        accent={getModuleAccent("/tools")}
        description="Semak dan sahkan rekod bacaan murid yang menunggu pengesahan secara pukal. Semakan berlaku dalam pelayar anda — data murid tidak dihantar ke NEXa."
      />
      <SemakAinsApp />
    </PublicPageShell>
  );
}
