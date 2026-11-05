/**
 * Mampat semula gambar sedia ada dalam bucket Supabase Storage `room-photos`
 * (logo PKG + gambar bilik) dan tetapkan cache-control panjang — kurangkan
 * egress (free tier 5.5 GB/bulan). Laluan TIDAK berubah, jadi URL dalam DB
 * (`pkgs.logo_src`, `rooms.image_src`) kekal sah.
 *
 *   npx tsx scripts/compress-storage-images.ts --dry-run
 *   npx tsx scripts/compress-storage-images.ts [--backup-dir <dir>] [--delete-unreferenced]
 *
 * - Fail asal disalin ke --backup-dir (lalai: backups/storage-asal/, gitignore)
 *   sebelum ditimpa.
 * - --delete-unreferenced: padam gambar (bukan PDF) yang tidak dirujuk oleh
 *   pkgs.logo_src / rooms.image_src / mjkd_mesyuarat.minit_url (cth. logo lama).
 * - Rujukan dibaca melalui PostgREST (service_role) — tidak perlu sambungan
 *   Postgres terus. Perlu NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { compressImage, type ImageKind } from "../lib/tempahan/image-compress";

config({ path: ".env.local" });

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const deleteUnreferenced = args.includes("--delete-unreferenced");
const backupDirIdx = args.indexOf("--backup-dir");
const backupDir = backupDirIdx >= 0 ? args[backupDirIdx + 1] : "backups/storage-asal";

const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? "").trim() || "room-photos";
if (!base || !key) {
  console.error("Perlu NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const auth = { Authorization: `Bearer ${key}`, apikey: key };
const CACHE_CONTROL = "max-age=31536000";
const publicPrefix = `${base}/storage/v1/object/public/${bucket}/`;

type Obj = { path: string; size: number; mimetype: string };

async function list(prefix: string): Promise<Obj[]> {
  const res = await fetch(`${base}/storage/v1/object/list/${bucket}`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ prefix, limit: 1000 }),
  });
  if (!res.ok) throw new Error(`list ${prefix}: ${res.status} ${await res.text()}`);
  const items = (await res.json()) as {
    name: string;
    id: string | null;
    metadata?: { size?: number; mimetype?: string };
  }[];
  const out: Obj[] = [];
  for (const it of items) {
    const path = prefix ? `${prefix}/${it.name}` : it.name;
    if (it.id) out.push({ path, size: it.metadata?.size ?? 0, mimetype: it.metadata?.mimetype ?? "" });
    else out.push(...(await list(path)));
  }
  return out;
}

async function rest<T>(q: string): Promise<T> {
  const res = await fetch(`${base}/rest/v1/${q}`, { headers: auth });
  if (!res.ok) throw new Error(`rest ${q}: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function referencedPaths(): Promise<Set<string>> {
  const [pkgs, rooms, mjkd] = await Promise.all([
    rest<{ logo_src: string | null }[]>("pkgs?select=logo_src"),
    rest<{ image_src: string | null }[]>("rooms?select=image_src"),
    rest<{ minit_url: string | null }[]>("mjkd_mesyuarat?select=minit_url"),
  ]);
  const urls = [
    ...pkgs.map((r) => r.logo_src),
    ...rooms.map((r) => r.image_src),
    ...mjkd.map((r) => r.minit_url),
  ];
  return new Set(
    urls.filter((u): u is string => !!u && u.startsWith(publicPrefix)).map((u) => u.slice(publicPrefix.length)),
  );
}

const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;
const isImage = (p: string) => /\.(png|jpe?g|webp)$/i.test(p);
const kindOf = (p: string): ImageKind => (/\/logo-\d+\.[a-z]+$/i.test(p) ? "logo" : "photo");

async function main() {
  const [objects, refs] = await Promise.all([list(""), referencedPaths()]);
  console.log(`${objects.length} fail dalam bucket "${bucket}", ${refs.size} dirujuk oleh DB.${dryRun ? " (--dry-run)" : ""}`);
  let before = 0;
  let after = 0;

  for (const o of objects) {
    if (!isImage(o.path)) continue;
    const referenced = refs.has(o.path);

    if (!referenced) {
      if (deleteUnreferenced) {
        console.log(`PADAM  ${o.path} (${kb(o.size)}, tidak dirujuk)`);
        if (!dryRun) {
          const dl = await fetch(`${base}/storage/v1/object/${bucket}/${o.path}`, { headers: auth });
          if (!dl.ok) throw new Error(`muat turun ${o.path}: ${dl.status}`);
          const salinan = join(backupDir, o.path);
          await mkdir(dirname(salinan), { recursive: true });
          await writeFile(salinan, Buffer.from(await dl.arrayBuffer()));
          const res = await fetch(`${base}/storage/v1/object/${bucket}`, {
            method: "DELETE",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: [o.path] }),
          });
          if (!res.ok) throw new Error(`padam ${o.path}: ${res.status} ${await res.text()}`);
        }
      } else {
        console.log(`LANGKAU ${o.path} (tidak dirujuk; guna --delete-unreferenced untuk padam)`);
      }
      continue;
    }

    const dl = await fetch(`${base}/storage/v1/object/${bucket}/${o.path}`, { headers: auth });
    if (!dl.ok) throw new Error(`muat turun ${o.path}: ${dl.status}`);
    const asal = Buffer.from(await dl.arrayBuffer());
    const type = dl.headers.get("content-type") ?? o.mimetype;
    const kind = kindOf(o.path);
    const kecil = await compressImage({ name: o.path, type, buffer: asal }, kind);

    // Laluan kekal: jangan tukar format (cth. PNG → JPEG) di bawah sambungan lama.
    const sambunganSama =
      /\.png$/i.test(o.path) ? kecil.type === "image/png" : /\.jpe?g$/i.test(o.path) ? kecil.type === "image/jpeg" : false;
    const guna = kecil.buffer !== asal && sambunganSama ? kecil : { ...kecil, buffer: asal, type };
    before += asal.length;
    after += guna.buffer.length;
    console.log(`${kind.padEnd(5)}  ${o.path}: ${kb(asal.length)} → ${kb(guna.buffer.length)}`);
    if (dryRun) continue;

    const salinan = join(backupDir, o.path);
    await mkdir(dirname(salinan), { recursive: true });
    await writeFile(salinan, asal);

    // Muat naik semula walaupun saiz sama — untuk tetapkan cache-control.
    const up = await fetch(`${base}/storage/v1/object/${bucket}/${o.path}`, {
      method: "PUT",
      headers: { ...auth, "Content-Type": guna.type, "x-upsert": "true", "cache-control": CACHE_CONTROL },
      body: new Uint8Array(guna.buffer),
    });
    if (!up.ok) throw new Error(`muat naik ${o.path}: ${up.status} ${await up.text()}`);
  }

  console.log(`Jumlah gambar dirujuk: ${kb(before)} → ${kb(after)}`);
  if (!dryRun) console.log(`Salinan asal: ${backupDir}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
