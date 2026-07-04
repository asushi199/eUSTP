import "./load-env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../lib/schema";

/**
 * Seed awal: cipta akaun Admin lalai jika belum wujud.
 * Kata laluan awal daripada env SEED_ADMIN_PASSWORD (lalai "TukarSaya123!"),
 * dengan mustChangePassword=true supaya dipaksa tukar semasa log masuk pertama.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tidak ditetapkan");
  const client = postgres(url, { max: 1, prepare: false });
  const db = drizzle(client, { schema });

  const username = "admin";
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
  });
  if (existing) {
    console.log("Akaun admin sudah wujud — tiada perubahan.");
  } else {
    const password = process.env.SEED_ADMIN_PASSWORD ?? "TukarSaya123!";
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(schema.users).values({
      username,
      passwordHash,
      nama: "Pentadbir USTP",
      jawatan: "Pentadbir Sistem",
      peranan: "Admin",
      aktif: true,
      mustChangePassword: true,
    });
    console.log(`Akaun admin dicipta (kata laluan awal: ${password}).`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
