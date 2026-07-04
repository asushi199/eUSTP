import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../lib/schema";
import { isKnownPeranan, type UserPeranan } from "../lib/roles";

/**
 * Penggunaan:
 *   npm run db:create-user -- <username> <password> <nama> <jawatan> [peranan] [pkg_id]
 *
 * peranan: Admin | Pegawai | PKG_Admin (lalai: Pegawai)
 * pkg_id : wajib untuk PKG_Admin (cth. "sitiawan")
 */
async function main() {
  const [usernameRaw, password, nama, jawatan = "", perananArg = "Pegawai", pkgId] =
    process.argv.slice(2);
  if (!usernameRaw || !password || !nama) {
    console.error(
      "Penggunaan: npm run db:create-user -- <username> <password> <nama> <jawatan> [Admin|Pegawai|PKG_Admin] [pkg_id]",
    );
    process.exit(1);
  }
  const username = usernameRaw.toLowerCase();
  const peranan: UserPeranan = isKnownPeranan(perananArg) ? perananArg : "Pegawai";

  if (peranan === "PKG_Admin" && !pkgId) {
    console.error("PKG_Admin memerlukan pkg_id (cth. sitiawan).");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL!;
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  if (existing) {
    console.error("Pengguna sudah wujud:", username);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(schema.users).values({
    username,
    passwordHash,
    nama,
    jawatan,
    peranan,
    pkgId: peranan === "PKG_Admin" ? pkgId : null,
    aktif: true,
    mustChangePassword: true,
  });

  console.log("Pengguna dicipta:", username, "—", peranan, pkgId ? `(${pkgId})` : "");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
