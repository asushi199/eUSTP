import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { USTP_CLUSTERS } from "../../lib/laporan-ustp/options";
import type { UstpReport } from "../../lib/schema";

const id = "8d9b2329-b170-43ce-a03f-37c92a74f755";
const oldPhotos = [{ storagePath: "drive/old1", publicUrl: "https://drive.google.com/old1" }, { storagePath: "drive/old2", publicUrl: "https://drive.google.com/old2" }];
const request = (version: number, photoSlots: number[] = []) => {
  const form = new FormData();
  Object.entries({ id, version: String(version), pkgCode: "AQA1001", cluster: USTP_CLUSTERS[0], programName: "Bengkel",
    startDate: "2026-09-05", endDate: "2026-09-06", location: "PKG Sitiawan", organiser: "USTP",
    schoolCount: "5", teacherCount: "30", studentCount: "0", communityCount: "0", objectives: "Objektif", equipmentUsed: "Tidak",
    os29000Sen: "0", os42000Sen: "0", os21000Sen: "0", otherSen: "0", otherAllocation: "", reflection: "Refleksi", preparedBy: "Pegawai",
  }).forEach(([key, value]) => form.set(key, value));
  for (const slot of photoSlots) form.set(`photo${slot}`, new File([Uint8Array.from([255, 216, 255, 217])], "photo.jpg", { type: "image/jpeg" }));
  return form;
};

// Jalankan tindakan sebenar dengan sempadan DB, sesi dan Drive palsu; tiada akses rangkaian.
async function harness(options: { existing?: boolean; stale?: boolean; uploadFailure?: number; databaseFailure?: boolean; deny?: boolean } = {}) {
  const events: string[] = [];
  let values: Record<string, unknown> = {};
  let uploads = 0;
  const row = options.existing ? { id, version: 1, photos: oldPhotos } : undefined;
  const mutation = (operation: string) => {
    const chain = {
      values: (next: Record<string, unknown>) => { values = next; return chain; },
      set: (next: Record<string, unknown>) => { values = next; return chain; },
      where: () => chain,
      onConflictDoNothing: () => chain,
      returning: async () => {
        events.push(operation);
        if (options.databaseFailure) throw new Error("Connection lost");
        return options.stale ? [] : operation === "delete" ? [{ photos: oldPhotos }] : [{ id }];
      },
    };
    return chain;
  };
  const mocks: Record<string, unknown> = {
    "@/lib/rbac": { requireUser: async () => { events.push("auth"); if (options.deny) throw new Error("Unauthenticated"); return { id: "1", peranan: "PKG_Admin" }; } },
    "@/lib/db": { db: {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => { events.push("read"); return row ? [row] : []; } }) }) }),
      insert: () => mutation("insert"), update: () => mutation("update"), delete: () => mutation("delete"),
    } },
    "@/lib/gas-upload": {
      uploadFileViaGas: async () => { uploads++; events.push(`upload${uploads}`); if (options.uploadFailure === uploads) throw new Error("Drive unavailable"); return { path: `drive/new${uploads}`, publicUrl: `https://drive.google.com/new${uploads}` }; },
      deleteLaporanPhotoViaGas: async (path: string) => { events.push(`trash:${path}`); return true; },
    },
    "next/cache": { revalidatePath: () => {} },
  };
  const result = await build({
    entryPoints: ["lib/actions/laporan-ustp.ts"], bundle: true, platform: "node", format: "cjs", packages: "external", write: false,
    plugins: [{ name: "test-boundaries", setup(builder) { builder.onResolve({ filter: /^(?:@\/lib\/(?:db|rbac|gas-upload)|next\/cache)$/ }, (args) => ({ path: args.path, external: true })); } }],
  });
  const loadedModule = { exports: {} as typeof import("../../lib/actions/laporan-ustp") };
  const realRequire = createRequire(`${process.cwd()}/package.json`);
  new Function("require", "module", "exports", result.outputFiles[0].text)((name: string) => mocks[name] ?? realRequire(name), loadedModule, loadedModule.exports);
  return { actions: loadedModule.exports, events, values: () => values as Partial<UstpReport> };
}

test("rejects unauthenticated saves and deletions before reading data or Drive", async () => {
  const h = await harness({ deny: true });
  await assert.rejects(h.actions.saveUstpReport(request(0, [0, 1])), /Unauthenticated/);
  await assert.rejects(h.actions.deleteUstpReport(id, 1), /Unauthenticated/);
  assert.deepEqual(h.events, ["auth", "auth"]);
});

test("allows a staff PKG administrator to create a report with exactly two photos", async () => {
  const h = await harness(); const result = await h.actions.saveUstpReport(request(0, [0, 1]));
  assert.ok(result.ok); assert.equal(h.values().photos?.length, 2);
  assert.deepEqual(h.events, ["auth", "read", "upload1", "upload2", "insert"]);
});

test("requires both photos before performing any upload", async () => {
  const h = await harness(); const result = await h.actions.saveUstpReport(request(0, [0]));
  assert.equal(result.ok, false); assert.deepEqual(h.events, ["auth", "read"]);
});

test("editing text keeps both original photos without reuploading", async () => {
  const h = await harness({ existing: true }); assert.ok((await h.actions.saveUstpReport(request(1))).ok);
  assert.deepEqual(h.values().photos, oldPhotos); assert.equal(h.values().version, 2);
  assert.deepEqual(h.events, ["auth", "read", "update"]);
});

test("replacing a photo removes only the replaced image after the report is saved", async () => {
  const h = await harness({ existing: true }); assert.ok((await h.actions.saveUstpReport(request(1, [0]))).ok);
  assert.equal(h.values().photos?.[1].storagePath, "drive/old2");
  assert.deepEqual(h.events, ["auth", "read", "upload1", "update", "trash:drive/old1"]);
});

test("a competing edit prevents overwrite and retains the original images", async () => {
  const h = await harness({ existing: true, stale: true }); assert.equal((await h.actions.saveUstpReport(request(1, [0]))).ok, false);
  assert.deepEqual(h.events, ["auth", "read", "upload1", "update", "trash:drive/new1"]);
});

test("upload failure leaves the stored report intact and cleans the known new upload", async () => {
  const h = await harness({ existing: true, uploadFailure: 2 }); assert.equal((await h.actions.saveUstpReport(request(1, [0, 1]))).ok, false);
  assert.deepEqual(h.events, ["auth", "read", "upload1", "upload2", "trash:drive/new1"]);
});

test("an uncertain database commit never trashes photos that might already be referenced", async () => {
  const h = await harness({ existing: true, databaseFailure: true }); assert.equal((await h.actions.saveUstpReport(request(1, [0]))).ok, false);
  assert.deepEqual(h.events, ["auth", "read", "upload1", "update"]);
});

test("deletes the record before trashing its two images", async () => {
  const h = await harness({ existing: true }); assert.ok((await h.actions.deleteUstpReport(id, 1)).ok);
  assert.deepEqual(h.events, ["auth", "delete", "trash:drive/old1", "trash:drive/old2"]);
});
