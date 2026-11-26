import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import ContohSemakAins from "@/components/tools/semak-ains/ContohSemakAins";
import type { Fasa } from "@/components/tools/semak-ains/useSambunganAins";
import { getModuleAccent } from "@/lib/module-theme";
import { NAMA_ALAT } from "@/lib/tools/semak-ains/nama";

export const dynamic = "force-dynamic";

const FASA: Fasa[] = ["tiada-penanda", "menunggu", "sedia", "membaca", "keputusan", "melaksana"];

/**
 * PRATONTON DEV SahPantas AINS dengan DATA SINTETIK — tiada AINS, tiada DB, tiada log.
 * Untuk semakan reka letak semua fasa (?fasa=keputusan). 404 dalam produksi.
 */
export default async function DevSemakAinsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const fasa = FASA.find((f) => f === sp.fasa) ?? "keputusan";
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title={NAMA_ALAT}
        accent={getModuleAccent("/tools")}
        description="Semak dan sahkan rekod bacaan murid yang menunggu pengesahan secara pukal. Semakan berlaku dalam pelayar anda — data murid tidak dihantar ke NEXa."
      />
      <ContohSemakAins fasaAwal={fasa} />
    </PublicPageShell>
  );
}
