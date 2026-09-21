"use client";

import { useRouter } from "next/navigation";
import TahunSelect from "@/components/analisis/TahunSelect";

export default function AnalisisTahunSelect({
  year,
  years,
}: {
  year: number;
  years: number[];
}) {
  const router = useRouter();
  return (
    <TahunSelect
      year={year}
      years={years}
      onChange={(next) => {
        router.replace(`/analisis?tahun=${next}`, { scroll: false });
      }}
    />
  );
}
