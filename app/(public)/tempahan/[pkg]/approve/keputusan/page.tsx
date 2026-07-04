import Link from "next/link";

const MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: "Tempahan diluluskan ✓",
    body: "Pemohon boleh menyemak status melalui halaman Semak Tempahan.",
  },
  rejected: {
    title: "Tempahan ditolak",
    body: "Status tempahan telah dikemas kini.",
  },
  processed: {
    title: "Sudah diproses",
    body: "Tempahan ini telah diproses sebelum ini.",
  },
  unauthorized: {
    title: "Tiada kebenaran",
    body: "Akaun anda tidak mempunyai akses kepada PKG ini.",
  },
  invalid: {
    title: "Pautan tidak sah",
    body: "Pautan kelulusan tidak sah atau telah tamat.",
  },
  error: {
    title: "Ralat",
    body: "Tindakan tidak berjaya. Sila cuba lagi di panel admin.",
  },
};

export default async function ApproveResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ pkg: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { pkg: pkgId } = await params;
  const { status = "invalid" } = await searchParams;
  const msg = MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <h1 className="text-2xl font-semibold">{msg.title}</h1>
      <p className="mt-2 text-graphite">{msg.body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href={`/admin/tempahan/${pkgId}`} className="btn-primary">
          Panel Admin
        </Link>
        <Link href={`/tempahan/${pkgId}`} className="btn-outline-ink">
          Halaman Tempahan
        </Link>
      </div>
    </div>
  );
}
