import Link from "next/link";
import { notFound } from "next/navigation";
import EditSchoolNameForm from "@/components/direktori/EditSchoolNameForm";
import EditSchoolWebsiteForm from "@/components/direktori/EditSchoolWebsiteForm";
import RestoreButton from "@/components/direktori/RestoreButton";
import { ROLE_GROUPS, ROLE_INFO, normalizeSchoolCode } from "@/lib/direktori/config";
import { getSchoolHistory } from "@/lib/direktori/queries";
import { requireKandunganAccess } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function SekolahHistoryPage({ params }: { params: Promise<{ code: string }> }) {
  await requireKandunganAccess();
  const { code } = await params;
  const { school, versions } = await getSchoolHistory(normalizeSchoolCode(code));
  if (!school) notFound();

  return (
    <>
      <Link href="/admin/direktori" className="text-sm text-graphite hover:text-ink">← CoE Direktori Admin</Link>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{school.name}</h1>
          <p className="mt-0.5 text-sm text-graphite">{school.code} · {school.zone || "tiada zon"}</p>
        </div>
        <EditSchoolNameForm schoolCode={school.code} currentName={school.name} />
      </div>
      <div className="mt-3"><EditSchoolWebsiteForm schoolCode={school.code} currentWebsite={school.website} /></div>

      <h2 className="mt-8 text-lg font-semibold">Sejarah Versi ({versions.length})</h2>
      <div className="mt-3 space-y-3">
        {versions.length === 0 && <div className="card p-6 text-graphite">Belum ada versi untuk sekolah ini.</div>}
        {versions.map((v) => (
          <div key={v.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {new Date(v.submittedAt).toLocaleString("ms-MY")}
                  {v.isCurrent && <span className="status-badge ml-2"><span className="status-dot bg-primary" />Semasa</span>}
                </p>
                <p className="mt-0.5 text-xs text-graphite">
                  {v.submitterName ? `Oleh ${v.submitterName}` : "Tanpa nama"}
                  {v.submitterPhone ? ` · ${v.submitterPhone}` : ""}
                  {v.source ? ` · ${v.source}` : ""}
                </p>
              </div>
              {!v.isCurrent && <RestoreButton versionId={v.id} />}
            </div>
            <div className="mt-5 space-y-5">
              {ROLE_GROUPS.map((group) => (
                <section key={group.id}>
                  <h3 className="border-b hairline pb-2 text-sm font-semibold">{group.title}</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.roles.map((role) => {
                      const contact = v.roles.find((c) => c.role === role);
                      return (
                        <div key={role} className="rounded-lg bg-cloud p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-graphite">{ROLE_INFO[role].short}</p>
                          <p className="mt-1 text-sm">{contact?.teacherName || "-"}</p>
                          <p className="text-xs text-graphite">{contact?.phone || "-"}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
