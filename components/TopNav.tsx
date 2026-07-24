import Link from "next/link";
import { resolveLaporanModuleHref } from "@/lib/laporan-entry";
import BrandWordmark from "./BrandWordmark";
import PwaInstallButton from "./PwaInstallButton";

const dpdNav = resolveLaporanModuleHref("dpd", "/laporan-dpd");
const pssNav = resolveLaporanModuleHref("pss", "/laporan-pss");

const NAV_LINKS = [
  { href: dpdNav.href, label: "Laporan DPD", external: dpdNav.external },
  { href: pssNav.href, label: "Laporan PSS", external: pssNav.external },
  { href: "/direktori", label: "CoE Direktori", external: false },
  { href: "/tempahan", label: "CoE Booking", external: false },
] as const;

const navLinkClass = "rounded-md px-4 py-2 text-[15px] text-ink hover:bg-cloud";

/** nav-bar-top hp: putih 64px, garis rambut bawah. */
export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b hairline bg-white/88 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-8">
        <BrandWordmark />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) =>
            l.external ? (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={navLinkClass}
              >
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={navLinkClass}>
                {l.label}
              </Link>
            ),
          )}
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
