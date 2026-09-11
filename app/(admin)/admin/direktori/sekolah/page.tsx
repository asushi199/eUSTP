import Link from "next/link";
import AdminSchoolsTable from "@/components/direktori/AdminSchoolsTable";
import ExportGuruMenu from "@/components/direktori/ExportGuruMenu";
import TambahSekolahForm from "@/components/direktori/TambahSekolahForm";
import WhatsAppBroadcastPanel, {
  type BroadcastLetter,
} from "@/components/direktori/WhatsAppBroadcastPanel";
import { requireKandunganAccess } from "@/lib/rbac";
import { listAdminSchools } from "@/lib/direktori/queries";
import { listResourcesCardsGrouped } from "@/lib/resources/queries";

export const dynamic = "force-dynamic";

export default async function AdminDirektoriSekolahPage({
  searchParams,
}: {
  searchParams: Promise<{ surat?: string | string[] }>;
}) {
  await requireKandunganAccess();
  const [records, grouped, sp] = await Promise.all([
    listAdminSchools(),
    listResourcesCardsGrouped({ includeHidden: true }),
    searchParams,
  ]);

  // Arkib (kertas kerja lama) tidak disiarkan — kecualikan daripada pemilih.
  const letters: BroadcastLetter[] = grouped
    .filter((group) => group.slug !== "arkib")
    .flatMap((group) =>
      group.cards
        .filter((card) => card.url.trim())
        .map((card) => ({
          id: card.id,
          title: card.title,
          url: card.url,
          kategoriSlug: group.slug,
          kategoriTitle: group.title,
          letterMonth: card.letterMonth ?? null,
          aktif: card.aktif,
        })),
    );

  const suratRaw = sp.surat;
  const initialLetterIds = (Array.isArray(suratRaw) ? suratRaw : suratRaw ? [suratRaw] : [])
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  return (
    <>
      <Link href="/admin/direktori" className="text-sm text-graphite hover:text-ink">
        ← CoE Directory
      </Link>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Direktori Sekolah</h1>
          <p className="mt-1 text-sm text-graphite">
            {records.length} sekolah · versi semasa dipaparkan
          </p>
        </div>
        <div className="flex gap-2">
          <ExportGuruMenu />
          <Link
            href="/admin/direktori/export?listType=schools"
            className="btn-outline-ink btn-sm"
            prefetch={false}
          >
            CSV Sekolah
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <WhatsAppBroadcastPanel
          records={records}
          letters={letters}
          initialLetterIds={initialLetterIds}
        />
      </div>

      <div className="mt-6">
        <AdminSchoolsTable records={records} />
      </div>

      <div className="mt-8 max-w-xl">
        <TambahSekolahForm />
      </div>
    </>
  );
}
