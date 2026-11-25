import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import SemakAinsApp from "@/components/tools/semak-ains/SemakAinsApp";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Semak Rekod AINS — NEXa Manjung",
  description:
    "Alat GPM untuk menyemak rekod bacaan AINS murid secara automatik dan mengesahkannya secara pukal. Data murid tidak disimpan oleh NEXa.",
};

export default function SemakAinsPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title="Semak Rekod AINS"
        accent={getModuleAccent("/tools")}
        description="Semak rekod bacaan murid yang menunggu pengesahan: lulus, perlu semak atau cadang tolak. Semakan berlaku dalam pelayar anda — data murid tidak dihantar ke NEXa."
      />
      <SemakAinsApp />
    </PublicPageShell>
  );
}
