import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import PasangPenanda from "@/components/tools/semak-ains/PasangPenanda";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Pasang penanda Semak AINS — NEXa Manjung",
  description: "Panduan memasang penanda Semak AINS pada pelayar Chrome/Edge.",
};

export default function PasangPenandaPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title="Pasang penanda Semak AINS"
        accent={getModuleAccent("/tools")}
        description="Sekali sahaja bagi setiap pelayar. Selepas dipasang, klik penanda semasa berada di Papan Pemuka guru AINS."
      />
      <PasangPenanda />
    </PublicPageShell>
  );
}
