import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

import { normalizeDatabaseUrl } from "./database-url";

const connectionString = normalizeDatabaseUrl(process.env.DATABASE_URL);

/** Vercel serverless: satu sambungan per instance; elak habiskan pool Supabase (≈15). */
const isServerless = process.env.VERCEL === "1";

const globalForPg = globalThis as unknown as {
  pg: ReturnType<typeof postgres> | undefined;
};

const client =
  globalForPg.pg ??
  postgres(connectionString, {
    /**
     * max > 1 di serverless: dengan hanya SATU sambungan, satu soket mati
     * (pooler putus semasa instance beku) menyekat SEMUA query instance itu
     * selama-lamanya kerana query beratur pada sambungan yang sama. Dengan 3,
     * query lain masih boleh lalu sementara soket rosak dikitar semula.
     */
    max: isServerless ? 3 : 5,
    /**
     * Tutup sambungan melahu cepat supaya tidak membawa soket "hampir mati"
     * masuk ke kitaran beku Vercel — punca halaman tergantung 300s (diagnosis
     * 2026-07-05: /api/diag OK ms-level manakala halaman timeout, berselang).
     */
    idle_timeout: isServerless ? 3 : 20,
    connect_timeout: 10,
    max_lifetime: isServerless ? 60 : 60 * 5,
    /** TCP keep-alive: OS kesan peer mati → soket ralat, bukan tunggu selamanya. */
    keep_alive: 20,
    /** Wajib untuk Supabase Transaction pooler (port 6543). */
    prepare: false,
  });

globalForPg.pg = client;

export const db = drizzle(client, { schema });
export { schema };

/**
 * Pembungkus timeout sisi-klien untuk query DB.
 *
 * statement_timeout Postgres tidak membantu jika soket sudah mati (query tidak
 * sampai ke server), jadi kita kuatkuasakan had masa di sisi klien: jika DB
 * tidak menjawab dalam `ms`, kita lontar ralat supaya halaman boleh render
 * fallback dan bukannya tergantung 300 saat.
 */
export async function withDbTimeout<T>(
  promise: Promise<T>,
  ms = 8000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Pangkalan data tidak bertindak balas dalam ${ms}ms`)),
      ms,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
