import { notFound } from "next/navigation";
import PentasContoh from "@/components/mjkd/pembentangan/PentasContoh";
import { qrDataUrl } from "@/lib/mjkd/qr";

export const dynamic = "force-dynamic";

/**
 * PRATONTON DEV mod pembentangan MJKD dengan DATA CONTOH (~102 sekolah) — tiada akses DB.
 * Untuk semakan reka letak/resolusi & simulasi data langsung. 404 dalam produksi.
 */
export default async function DevPentasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const url = "https://nexa-ustpmanjung.vercel.app/laporan-mjkd/hadir";
  const sp = await searchParams;
  return <PentasContoh qr={await qrDataUrl(url)} url={url} luar={sp.luar !== undefined} />;
}
