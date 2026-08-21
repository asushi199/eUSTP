import "./load-env";
import { randomUUID } from "crypto";
import postgres from "postgres";

type BookingRow = {
  id: string;
  pkg_id: string;
  room_slug: string;
  date: string;
  name: string;
  school_or_unit: string;
  purpose: string;
  contact_normalized: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  autosijil_event_id: string | null;
  created_at: string;
};

type Candidate = {
  rows: BookingRow[];
  canApply: boolean;
};

function isConsecutive(rows: BookingRow[]) {
  return rows.every((row, index) => {
    if (index === 0) return true;
    const previous = new Date(`${rows[index - 1]!.date}T00:00:00Z`).getTime();
    const current = new Date(`${row.date}T00:00:00Z`).getTime();
    return current - previous === 86_400_000;
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditemui.");

  const apply = process.argv.includes("--apply");
  const sql = postgres(url, { max: 1, prepare: false });

  try {
    const rows = await sql<BookingRow[]>`
      select
        id, pkg_id, room_slug, date::text, name, school_or_unit, purpose,
        contact_normalized, status, autosijil_event_id, created_at::text
      from bookings
      where group_id is null
      order by pkg_id, room_slug, created_at, date
    `;

    const buckets = new Map<string, BookingRow[]>();
    for (const row of rows) {
      // Baris tempahan lama yang benar-benar dibuat dalam transaksi yang sama
      // mempunyai masa ciptaan sama; syarat ini mengelak tempahan berasingan
      // dengan butiran kebetulan serupa daripada digabungkan.
      const key = [
        row.pkg_id,
        row.room_slug,
        row.created_at,
        row.name,
        row.school_or_unit,
        row.purpose,
        row.contact_normalized,
      ].join("\u0001");
      buckets.set(key, [...(buckets.get(key) ?? []), row]);
    }

    const candidates: Candidate[] = [...buckets.values()]
      .filter((group) => group.length > 1 && isConsecutive(group))
      .map((group) => ({
        rows: group,
        // Kelulusan lama mungkin sudah mempunyai acara Autosijil individu.
        // Ia tidak boleh digabungkan tanpa memindahkan rekod kehadiran, jadi
        // hanya tempahan belum diluluskan dibetulkan secara automatik.
        canApply: group.every(
          (row) => row.status === "pending" && !row.autosijil_event_id,
        ),
      }));

    const safe = candidates.filter((candidate) => candidate.canApply);
    const review = candidates.filter((candidate) => !candidate.canApply);
    const reviewSummary = review.reduce<Record<string, number>>(
      (summary, candidate) => {
        const statuses = [...new Set(candidate.rows.map((row) => row.status))]
          .sort()
          .join(",");
        const key = `${statuses}${candidate.rows.some((row) => row.autosijil_event_id) ? "+autosijil" : ""}`;
        summary[key] = (summary[key] ?? 0) + 1;
        return summary;
      },
      {},
    );

    console.log(
      JSON.stringify({
        ungroupedRows: rows.length,
        multiDayCandidates: candidates.length,
        safePendingGroups: safe.length,
        requiresManualReview: review.length,
        manualReviewSummary: reviewSummary,
        mode: apply ? "apply" : "dry-run",
      }),
    );

    if (!apply) return;

    await sql.begin(async (tx) => {
      for (const candidate of safe) {
        const groupId = randomUUID();
        const ids = candidate.rows.map((row) => row.id);
        await tx`update bookings set group_id = ${groupId} where id = any(${ids}::uuid[]) and group_id is null`;
      }
    });

    console.log(JSON.stringify({ correctedGroups: safe.length }));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
