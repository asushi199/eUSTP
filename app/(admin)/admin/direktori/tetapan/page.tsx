import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";
import { getSettings } from "@/lib/maklumat/queries";
import { TETAPAN_KEYS } from "@/lib/maklumat/tetapan-keys";
import { saveTetapan } from "@/lib/actions/tetapan";
import ActionForm from "@/components/admin/ActionForm";

export const dynamic = "force-dynamic";

export default async function AdminDirektoriTetapanPage() {
  await requireKandunganAccess();
  const settings = await getSettings(TETAPAN_KEYS.map((t) => t.key));

  return (
    <>
      <Link href="/admin/direktori" className="text-sm text-graphite hover:text-ink">
        ← CoE Directory
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tetapan USTP</h1>
      <p className="mt-1 text-sm text-graphite">
        Tajuk, imej dan takwim untuk Direktori USTP.
      </p>

      <div className="card mt-5 max-w-2xl p-6">
        <ActionForm action={saveTetapan} submitLabel="Simpan Semua" className="space-y-4">
          {TETAPAN_KEYS.map(({ key, label, hint }) => (
            <div key={key}>
              <label className="label" htmlFor={`tetapan__${key}`}>
                {label}
              </label>
              <input
                id={`tetapan__${key}`}
                name={`tetapan__${key}`}
                defaultValue={settings.get(key) ?? ""}
                className="input"
              />
              {hint ? <p className="mt-1 text-xs text-graphite">{hint}</p> : null}
            </div>
          ))}
        </ActionForm>
      </div>
    </>
  );
}
