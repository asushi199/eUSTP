/** Jalur penutup institusi — teal gelap selaras portal digital USTP. */
export default function SiteFooter() {
  return (
    <footer
      className="mt-auto mb-[calc(3.5rem+env(safe-area-inset-bottom))] text-white no-print md:mb-0"
      style={{ backgroundColor: "var(--portal-footer, #0f3d5c)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 leading-snug sm:px-8">
        <p className="text-sm font-semibold">
          NEXa<span className="text-[#5ec4e8]">+</span> Manjung
        </p>
        <p className="mt-0.5 text-sm text-white/70">
          Unit Sumber Teknologi Pendidikan · Pejabat Pendidikan Daerah Manjung
        </p>
        <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-white/70">
          <a href="/privasi" className="hover:text-white">
            Dasar Privasi
          </a>
          <a href="/terma" className="hover:text-white">
            Terma Penggunaan
          </a>
        </p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          Manjung / Digital / 2026
        </p>
      </div>
    </footer>
  );
}
