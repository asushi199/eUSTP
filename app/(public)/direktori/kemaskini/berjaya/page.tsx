import Link from "next/link";

export const metadata = { title: "Berjaya — eUSTP Manjung" };

export default function KemaskiniBerjayaPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
      <p className="text-5xl">✓</p>
      <h1 className="mt-4 text-2xl font-semibold">Kemas kini diterima</h1>
      <p className="mt-2 text-graphite">
        Terima kasih! Maklumat guru penyelaras sekolah anda telah dikemaskini
        dalam direktori.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/direktori" className="btn-primary">
          Kembali ke Direktori
        </Link>
        <Link href="/" className="btn-outline-ink">
          Laman Utama
        </Link>
      </div>
    </div>
  );
}
