import { NAMA_ACARA } from "@/lib/mjkd/acara";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireKandunganAccess } from "@/lib/rbac";
import { urlKehadiranAwam } from "@/lib/mjkd/base-url";
import { getMesyuarat } from "@/lib/mjkd/queries";
import { qrDataUrl } from "@/lib/mjkd/qr";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Paparan penuh QR kehadiran untuk projektor — besar, kontras tinggi. */
export default async function AdminMjkdQrPage({ params }: Props) {
  await requireKandunganAccess();
  const { id } = await params;
  const mesyuarat = await getMesyuarat(id);
  if (!mesyuarat) notFound();

  const url = await urlKehadiranAwam();
  const qr = await qrDataUrl(url, 1400);
  const pendek = url.replace(/^https?:\/\//, "");

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-[2vmin] overflow-auto bg-white p-[3vmin] text-black">
      <Link
        href={`/admin/mjkd/${mesyuarat.id}?tab=kehadiran`}
        className="absolute right-4 top-4 rounded border border-black px-3 py-1.5 text-sm font-semibold"
      >
        Tutup
      </Link>
      <h1 className="text-center text-[4.5vmin] font-bold leading-tight">
        Imbas untuk sahkan kehadiran
      </h1>
      <p className="text-center text-[3vmin] font-semibold">
        {NAMA_ACARA}
      </p>
      <img
        src={qr}
        alt="Kod QR kehadiran"
        className="aspect-square w-[min(70vh,90vw)] bg-white"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="break-all text-center font-mono text-[3.2vmin] font-bold">{pendek}</p>
    </div>
  );
}
