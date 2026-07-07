import BrandWordmark from "@/components/BrandWordmark";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="card p-8 pt-7">
      <header className="mb-6 flex flex-col items-center gap-2 border-b hairline pb-5">
        <BrandWordmark />
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-graphite">
          Pejabat Pendidikan Daerah Manjung
        </p>
      </header>
      <p className="mb-6 text-sm text-graphite">
        Log masuk untuk pentadbir dan pegawai sahaja. Halaman awam tidak
        memerlukan akaun.
      </p>
      <LoginForm callbackUrl={sp.from ?? "/admin/tempahan"} initialError={sp.error} />
      <p className="mt-6 text-xs text-graphite">
        Lupa kata laluan? Hubungi Pentadbir Sistem USTP.
      </p>
    </div>
  );
}
