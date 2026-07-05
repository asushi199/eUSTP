/** Jalur penutup institusi — teal gelap selaras portal digital USTP. */
export default function SiteFooter() {
  return (
    <footer
      className="mt-auto text-white no-print"
      style={{ backgroundColor: "var(--portal-footer, #0f3d5c)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        <p className="text-sm font-semibold">
          eUSTP<span className="text-[#5ec4e8]">+</span> Manjung
        </p>
        <p className="mt-1 text-sm text-white/70">
          Unit Sumber Teknologi Pendidikan · Pejabat Pendidikan Daerah Manjung
        </p>
        <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          Manjung / Digital / 2026
        </p>
      </div>
    </footer>
  );
}
