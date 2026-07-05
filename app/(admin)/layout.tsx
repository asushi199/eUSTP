import BrandWordmark from "@/components/BrandWordmark";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import { requireUser } from "@/lib/rbac";
import { PERANAN_LABEL } from "@/lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="flex min-h-screen flex-col bg-cloud">
      <header className="sticky top-0 z-40 h-16 border-b hairline bg-white no-print">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <BrandWordmark href="/admin" />
            <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              Admin
            </span>
          </div>
          <AdminUserMenu nama={user.nama} peranan={PERANAN_LABEL[user.peranan]} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
