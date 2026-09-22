import BrandWordmark from "@/components/BrandWordmark";
import { AdminMobileNav } from "@/components/admin/AdminContextNav";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import { NotifyPemohonProvider } from "@/components/admin/NotifyPemohonProvider";
import { requireUser } from "@/lib/rbac";
import { canManageKandungan, PERANAN_LABEL } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const showContent = canManageKandungan(user.peranan);
  return (
    <NotifyPemohonProvider>
      <div className="flex min-h-screen flex-col bg-cloud">
        <AdminSidebar showContent={showContent} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64 print:pl-0">
          <header className="sticky top-0 z-40 h-16 border-b hairline bg-white no-print lg:bg-white/88 lg:backdrop-blur-md">
            <div className="flex h-full items-center justify-between px-4 sm:px-8">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <BrandWordmark href="/admin" />
                <span className="shrink-0 rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Admin
                </span>
              </div>
              <div className="ml-auto">
                <AdminUserMenu nama={user.nama} peranan={PERANAN_LABEL[user.peranan]} />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-8 lg:pb-8">
            {children}
          </main>
        </div>
        <AdminMobileNav />
      </div>
    </NotifyPemohonProvider>
  );
}
