import type { Metadata } from "next";
import PlannedModulePage from "@/components/PlannedModulePage";
import { RESOURCES_PLANNED_ITEMS } from "@/lib/home-modules";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "CoE Resources — NEXa Manjung",
  description:
    "Surat program, pekeliling, nota dan sijil digital Unit Sumber Teknologi Pendidikan PPD Manjung.",
};

export default function ResourcesPage() {
  const accent = getModuleAccent("/resources");
  return (
    <PlannedModulePage
      eyebrow="CoE Resources"
      title="Sumber Surat dan Pekeliling"
      accent={accent}
      description="Surat program, pekeliling dan bahan sokongan akan dipindahkan ke sini secara berperingkat."
      items={RESOURCES_PLANNED_ITEMS}
    />
  );
}
