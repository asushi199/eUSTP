import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { requireKandunganAccess } from "@/lib/rbac";
import { db } from "@/lib/db";
import { kandunganCards } from "@/lib/schema";
import { TOPIK_META } from "@/lib/kandungan/topik";
import { deleteKandunganCard, toggleKandunganAktif } from "@/lib/actions/kandungan";
import DeleteButton from "@/components/admin/DeleteButton";
import ToggleAktifButton from "@/components/admin/ToggleAktifButton";

export const dynamic = "force-dynamic";

export default async function AdminKandunganPage({
  searchParams,
}: {
  searchParams: Promise<{ topik?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const meta = TOPIK_META.find((t) => t.topik === sp.topik) ?? TOPIK_META[0];

  const cards = await db
    .select()
    .from(kandunganCards)
    .where(eq(kandunganCards.topik, meta.topik))
    .orderBy(
      asc(kandunganCards.subtopikSort),
      asc(kandunganCards.sort),
      asc(kandunganCards.id),
    );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kandungan Sumber USTP</h1>
          <p className="mt-1 text-sm text-graphite">
            Urus kad bahan untuk halaman awam /sumber.
          </p>
        </div>
        <Link href={`/admin/kandungan/baharu?topik=${meta.topik}`} className="btn-primary">
          Tambah Kad
        </Link>
      </div>

      {/* Tab topik */}
      <nav className="hairline mt-5 flex gap-1 overflow-x-auto border-b" aria-label="Topik">
        {TOPIK_META.map((t) => (
          <Link
            key={t.topik}
            href={`/admin/kandungan?topik=${t.topik}`}
            className={`whitespace-nowrap px-3 py-2 text-sm ${
              t.topik === meta.topik
                ? "border-b-2 border-ink font-semibold text-ink"
                : "text-graphite hover:text-ink"
            }`}
          >
            {t.title}
          </Link>
        ))}
      </nav>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="hairline border-b text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Subtopik</th>
              <th className="px-4 py-3 font-semibold">Tajuk</th>
              <th className="px-4 py-3 font-semibold">Jenis</th>
              <th className="px-4 py-3 font-semibold">Susunan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-graphite">
                  Tiada kad untuk topik ini.
                </td>
              </tr>
            )}
            {cards.map((c) => (
              <tr key={c.id} className="hairline border-b last:border-0">
                <td className="px-4 py-3">
                  {c.subtopikKey ? (
                    <Link
                      href={`/admin/kandungan/subtopik?topik=${c.topik}&key=${encodeURIComponent(c.subtopikKey)}`}
                      className="hover:underline"
                    >
                      <span className="font-medium">
                        {c.subtopikIcon ? `${c.subtopikIcon} ` : ""}
                        {c.subtopikTitle || c.subtopikKey}
                      </span>
                    </Link>
                  ) : (
                    <span className="text-graphite">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.title}</p>
                  {c.blurb ? <p className="text-xs text-graphite">{c.blurb}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <span className="status-badge">{c.type}</span>
                </td>
                <td className="px-4 py-3 tabular-nums text-graphite">
                  {c.subtopikSort} / {c.sort}
                </td>
                <td className="px-4 py-3">
                  <ToggleAktifButton
                    aktif={c.aktif}
                    action={toggleKandunganAktif.bind(null, c.id)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/kandungan/${c.id}`} className="link-blue">
                      Edit
                    </Link>
                    <DeleteButton
                      action={deleteKandunganCard.bind(null, c.id)}
                      confirmText={`Padam kad "${c.title}"?`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
