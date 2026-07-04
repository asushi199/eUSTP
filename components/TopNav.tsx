import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import PwaInstallButton from "./PwaInstallButton";

const NAV_LINKS = [
  { href: "/laporan-dpd", label: "Laporan DPD" },
  { href: "/laporan-pss", label: "Laporan PSS" },
  { href: "/sumber", label: "Sumber" },
  { href: "/analisis", label: "Analisis" },
  { href: "/direktori", label: "Direktori" },
  { href: "/tempahan", label: "Tempahan" },
];

/** nav-bar-top hp: putih 64px, garis rambut bawah. */
export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b hairline bg-white">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <BrandWordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-4 py-2 text-[15px] text-ink hover:bg-cloud"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <PwaInstallButton variant="nav-link" className="pwa-topnav" />
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-sm text-graphite hover:bg-cloud hover:text-ink"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
