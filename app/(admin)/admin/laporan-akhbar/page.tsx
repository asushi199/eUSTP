import Link from "next/link";
import { requireKandunganAccess } from "@/lib/rbac";
import { AKHBAR_YEAR } from "@/lib/laporan-akhbar/enums";
import {
  listAkhbarAdminRows,
  type AkhbarSchoolListItem,
} from "@/lib/laporan-akhbar/queries";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "belum-hantar", label: "Belum hantar" },
  { value: "sudah-hantar", label: "Sudah hantar" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function parseStatusFilter(raw: string | undefined): StatusFilter {
  return STATUS_FILTERS.some((f) => f.value === raw)
    ? (raw as StatusFilter)
    : "";
}

function matchesSearch(row: AkhbarSchoolListItem, query: string) {
  if (!query) return true;
  return [row.schoolCode, row.schoolName, row.zone]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function listHref(status: StatusFilter, cari: string) {
  const values = new URLSearchParams();
  if (status) values.set("status", status);
  if (cari) values.set("cari", cari);
  const qs = values.toString();
  return qs ? `/admin/laporan-akhbar?${qs}` : "/admin/laporan-akhbar";
}

function formatRm(value: number) {
  return value.toLocaleString("ms-MY", { minimumFractionDigits: 2 });
}

export default async function AdminLaporanAkhbarPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; cari?: string }>;
}) {
  await requireKandunganAccess();
  const sp = await searchParams;
  const status = parseStatusFilter(sp.status);
  const cari = sp.cari?.trim().slice(0, 200) ?? "";
  const query = cari.toLowerCase();

  const rows = await listAkhbarAdminRows(AKHBAR_YEAR);
  const submitted = rows.filter((r) => r.record).length;
  const belumHantar = rows.length - submitted;
  const disahkan = rows.filter((r) => r.record?.disahkan === "Ya").length;

  const filtered = rows.filter((r) => {
    if (status === "belum-hantar" && r.record) return false;
    if (status === "sudah-hantar" && !r.record) return false;
    return matchesSearch(r, query);
  });

  const filterCounts: Record<StatusFilter, number> = {
    "": rows.length,
    "belum-hantar": belumHantar,
    "sudah-hantar": submitted,
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Laporan Akhbar {AKHBAR_YEAR}
          </h1>
          <p className="mt-1 text-sm text-graphite">
            {submitted}/{rows.length} sekolah menghantar · {belumHantar} belum
            hantar · {disahkan} disahkan
          </p>
        </div>
        <Link href="/admin/laporan-akhbar/export" className="btn-primary">
          Eksport Excel JPN
        </Link>
      </div>

      <div className="card mt-6 p-5">
        <div>
          <h2 className="font-semibold text-ink">Tapis senarai</h2>
          <p className="mt-1 text-sm text-graphite">
            Gunakan tapisan untuk mencari sekolah yang belum mengisi tinjauan.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = status === f.value;
            return (
              <Link
                key={f.value || "semua"}
                href={listHref(f.value, cari)}
                className={active ? "btn-ink btn-sm" : "btn-outline-ink btn-sm"}
                aria-current={active ? "page" : undefined}
              >
                {f.label} ({filterCounts[f.value]})
              </Link>
            );
          })}
        </div>

        <form
          method="get"
          className="mt-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]"
        >
          {status ? (
            <input type="hidden" name="status" value={status} />
          ) : null}
          <div>
            <label className="label" htmlFor="akhbar-cari">
              Cari sekolah
            </label>
            <input
              id="akhbar-cari"
              name="cari"
              className="input"
              defaultValue={cari}
              placeholder="Kod, nama atau zon"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button type="submit" className="btn-ink btn-sm">
              Cari
            </button>
            {status || cari ? (
              <Link href="/admin/laporan-akhbar" className="btn-outline-ink btn-sm">
                Set semula
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">Senarai mengikut tapisan</h2>
        <span className="text-sm font-semibold tabular-nums text-charcoal">
          {filtered.length.toLocaleString("ms-MY")} /{" "}
          {rows.length.toLocaleString("ms-MY")} sekolah
        </span>
      </div>

      <div className="card mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b hairline text-xs uppercase tracking-wide text-graphite">
              <th className="px-4 py-3 font-semibold">Kod</th>
              <th className="px-4 py-3 font-semibold">Sekolah</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Semakan PPD</th>
              <th className="px-4 py-3 font-semibold">Baki 2026 (RM)</th>
              <th className="px-4 py-3 font-semibold">Baki 2024–2025 (RM)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-graphite">
                  Tiada sekolah sepadan. Ubah tapisan atau kata carian.
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const rec = r.record;
                return (
                  <tr
                    key={r.schoolCode}
                    className="border-b hairline last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{r.schoolCode}</td>
                    <td className="px-4 py-3">{r.schoolName}</td>
                    <td className="px-4 py-3">
                      {rec ? (
                        <span className="status-badge">{rec.statusSekolah}</span>
                      ) : (
                        <span className="text-graphite">Belum hantar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {rec ? (
                        <>
                          <div>Lengkap: {rec.semakanLengkap ?? "—"}</div>
                          <div>Disahkan: {rec.disahkan ?? "—"}</div>
                          <div>Pembetulan: {rec.perluPembetulan ?? "—"}</div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {rec ? formatRm(rec.bakiPeruntukanRm) : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {rec ? formatRm(rec.bakiPeruntukan20242025Rm) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/laporan-akhbar/${encodeURIComponent(r.schoolCode)}`}
                        className="link-blue"
                      >
                        Buka
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm">
        <Link href="/admin/pelaporan" className="text-graphite hover:text-ink">
          ← CoE Reports
        </Link>
      </p>
    </>
  );
}
