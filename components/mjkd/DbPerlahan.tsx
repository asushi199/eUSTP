/** Kad notis apabila pangkalan data perlahan (laluan awam MJKD) — dengan pautan muat semula. */
export default function DbPerlahan({ href }: { href: string }) {
  return (
    <div className="card mt-8 p-6" role="alert">
      <p className="font-semibold text-ink">Sambungan ke pangkalan data perlahan</p>
      <p className="mt-1 text-sm text-graphite">
        Sila muat semula halaman ini. Jika masalah berterusan, cuba semula sebentar lagi.
      </p>
      <a href={href} className="btn-primary mt-4 inline-flex">
        Muat semula
      </a>
    </div>
  );
}
