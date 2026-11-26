import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import PasangPenanda from "@/components/tools/semak-ains/PasangPenanda";
import { getModuleAccent } from "@/lib/module-theme";
import { NAMA_ALAT, NAMA_PENANDA } from "@/lib/tools/semak-ains/nama";

export const metadata: Metadata = {
  title: `Pasang penanda ${NAMA_ALAT} — NEXa Manjung`,
  description: `Panduan memasang penanda ${NAMA_PENANDA} pada pelayar Chrome/Edge.`,
};

export default function PasangPenandaPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow={`CoE Tools · ${NAMA_ALAT}`}
        title="Pasang penanda"
        accent={getModuleAccent("/tools")}
        description={`Sekali sahaja bagi setiap pelayar. Selepas dipasang, klik penanda ${NAMA_PENANDA} semasa berada di Papan Pemuka guru AINS.`}
      />
      <PasangPenanda />
    </PublicPageShell>
  );
}
