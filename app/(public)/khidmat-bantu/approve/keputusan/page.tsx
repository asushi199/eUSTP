import Link from "next/link";

const MESSAGES: Record<string, { title: string; body: string }> = {
  approved: {
    title: "Permohonan diluluskan ✓",
    body: "Status permohonan khidmat bantu telah dikemas kini.",
  },
  rejected: {
    title: "Permohonan ditolak",
    body: "Status permohonan telah dikemas kini.",
  },
  processed: {
    title: "Sudah diproses",
    body: "Permohonan ini telah diproses sebelum ini.",
  },
  unauthorized: {
    title: "Tiada kebenaran",
    body: "Akaun anda tidak mempunyai akses pentadbir USTP.",
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

export default async function KhidmatApproveResultPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "invalid" } = await searchParams;
  const msg = MESSAGES[status] ?? MESSAGES.invalid;

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <h1 className="text-2xl font-semibold">{msg.title}</h1>
      <p className="mt-2 text-graphite">{msg.body}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/admin/khidmat-bantu" className="btn-primary">
          Panel Admin
        </Link>
        <Link href="/khidmat-bantu" className="btn-outline-ink">
          Halaman Permohonan
        </Link>
      </div>
    </div>
  );
}
