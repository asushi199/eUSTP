import BrandWordmark from "@/components/BrandWordmark";
import { AdminDesktopNav, AdminMobileNav } from "@/components/admin/AdminContextNav";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan, canManageUsers, PERANAN_LABEL } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const showContent = canManageKandungan(user.peranan);
  return (
    <div className="flex min-h-screen flex-col bg-cloud">
      <header className="sticky top-0 z-40 h-16 border-b hairline bg-white no-print">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandWordmark href="/admin" />
            <span className="shrink-0 rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Admin
            </span>
          </div>
          <AdminDesktopNav showContent={showContent} />
          <AdminUserMenu
            nama={user.nama}
            peranan={PERANAN_LABEL[user.peranan]}
            canManageUsers={canManageUsers(user.peranan)}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-8 md:pb-8">
        {children}
      </main>
      <AdminMobileNav showContent={showContent} />
    </div>
  );
}
