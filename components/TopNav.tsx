import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import PublicModuleSearch from "./PublicModuleSearch";
import PwaInstallButton from "./PwaInstallButton";

/** Desktop: carian + Admin. Telefon: logo + Admin. */
export default function TopNav() {
  return (
    <header className="portal-topnav sticky top-0 z-40 h-[4.25rem]">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <BrandWordmark className="md:hidden" />
        <PublicModuleSearch />
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <PwaInstallButton variant="nav-link" className="pwa-topnav" />
          <Link href="/admin" className="portal-admin-chip">
            <span className="portal-admin-chip-avatar" aria-hidden>
              A
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-ink">Admin</span>
              <span className="block text-[11px] text-graphite">Log masuk</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
