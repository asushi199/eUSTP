import { requireUser } from "@/lib/rbac";
import ChangePasswordForm from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function TukarKataLaluanPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="mb-1 text-xl font-semibold">Tukar Kata Laluan</h1>
        <p className="mb-4 text-sm text-graphite">
          {user.mustChangePassword
            ? "Anda perlu tukar kata laluan sebelum meneruskan."
            : "Kemas kini kata laluan akaun anda."}
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
