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
    max: isServerless ? 1 : 5,
    /**
     * Serverless: tutup sambungan melahu dengan cepat supaya kita tidak membawa
     * sambungan "hampir mati" masuk ke kitaran beku (freeze) Vercel. Bila fungsi
     * dibekukan, pooler Supabase memutuskan sambungan melahu; menggunakan semula
     * soket mati itu menyebabkan query tergantung sehingga 300s (Vercel timeout).
     * idle_timeout rendah → query seterusnya buat sambungan baharu yang sihat.
     */
    idle_timeout: isServerless ? 3 : 20,
    connect_timeout: 10,
    max_lifetime: isServerless ? 60 : 60 * 5,
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
