import type { Metadata } from "next";
import PlannedModulePage from "@/components/PlannedModulePage";
import { MEDIA_PLANNED_ITEMS } from "@/lib/home-modules";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "CoE Media — NEXa Manjung",
  description:
    "Koleksi video, gambar program dan pautan media sosial USTP Manjung.",
};

export default function MediaPage() {
  const accent = getModuleAccent("/media");
  return (
    <PlannedModulePage
      eyebrow="CoE Media"
      title="Koleksi Media USTP"
      accent={accent}
      description="Video, gambar program dan pautan media sosial akan dimuatkan di sini secara berperingkat."
      items={MEDIA_PLANNED_ITEMS}
    />
  );
}
