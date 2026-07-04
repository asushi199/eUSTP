import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";
import { TOPIK_META } from "@/lib/kandungan/topik";
import KandunganCardForm from "@/components/admin/KandunganCardForm";

export const dynamic = "force-dynamic";

export default async function TambahKadPage({
  searchParams,
}: {
  searchParams: Promise<{ topik?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const topik = TOPIK_META.find((t) => t.topik === sp.topik)?.topik ?? TOPIK_META[0].topik;

  return (
    <>
      <Link href={`/admin/kandungan?topik=${topik}`} className="text-sm text-graphite hover:text-ink">
        ← Kandungan
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tambah Kad</h1>
      <div className="mt-5">
        <KandunganCardForm
          topikOptions={TOPIK_META.map((t) => ({ topik: t.topik, title: t.title }))}
          values={{
            topik,
            subtopikKey: "",
            subtopikTitle: "",
            subtopikSort: 999,
            subtopikBlurb: "",
            subtopikIcon: "",
            sort: 0,
            title: "",
            blurb: "",
            url: "",
            type: "pdf",
            previewUrl: "",
            aktif: true,
          }}
        />
      </div>
    </>
  );
}
