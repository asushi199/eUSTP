import Link from "next/link";
import BrandWordmark from "./BrandWordmark";
import PwaInstallButton from "./PwaInstallButton";

/** nav-bar-top: putih 64px. Desktop: logo dalam bar sisi. */
export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b hairline bg-white/88 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-8">
        <BrandWordmark className="md:hidden" />
        <div className="ml-auto flex items-center gap-2">
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
