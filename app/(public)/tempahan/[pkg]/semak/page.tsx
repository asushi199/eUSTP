import Link from "next/link";
import { notFound } from "next/navigation";
import SemakForm from "@/components/tempahan/SemakForm";
import { getPkg, listRooms } from "@/lib/tempahan/queries";

export const dynamic = "force-dynamic";

export default async function SemakPage({
  params,
}: {
  params: Promise<{ pkg: string }>;
}) {
  const { pkg: pkgId } = await params;
  const pkg = await getPkg(pkgId);
  if (!pkg) notFound();

  const rooms = await listRooms(pkgId, true);
  const roomNames = Object.fromEntries(rooms.map((r) => [r.slug, r.name]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      <Link href={`/tempahan/${pkgId}`} className="text-sm text-graphite hover:text-ink">
        ← {pkg.name}
      </Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Semak Tempahan Saya</h1>
      <p className="mt-2 text-graphite">
        Masukkan nombor telefon yang digunakan semasa membuat tempahan. Untuk permohonan
        menunggu kelulusan, anda boleh hantar semula mesej WhatsApp kepada admin. Tempahan
        yang diluluskan akan memaparkan butang «Urus kehadiran» untuk pautan pendaftaran dan
        kod QR.
      </p>
      <div className="mt-6">
        <SemakForm pkgId={pkgId} roomNames={roomNames} />
      </div>
    </div>
  );
}
