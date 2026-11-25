# CoE Tools — Semak Rekod AINS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new **CoE Tools** hub (`/tools`) whose first tool, **Semak Rekod AINS**, lets GPM teachers read pending AINS reading records via a bookmarklet, auto-classify them (hijau / kuning / merah) with rule-based checks in the browser, and bulk-approve/reject them through their own AINS session.

**Architecture:** A self-contained bookmarklet (`public/tools/semak-ains/penanda.js`) runs inside the logged-in AINS tab, reads `/web/teacher-record-list` pages, and exchanges `postMessage`s with a public NEXa page (`/tools/semak-ains`). The NEXa page runs a pure-TypeScript rules engine (`lib/tools/semak-ains/`) entirely client-side; no student data reaches the NEXa server. Approve/reject commands go back to the bookmarklet, which executes them one by one with confirmation and throttling. Only aggregate counts are POSTed to `/api/semak-ains/log` → table `semak_ains_log` → admin view `/admin/semak-ains`.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript (strict), Drizzle ORM + drizzle-kit (Postgres/Supabase), zod 3, `node:test` via `tsx --test` (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-11-25-semak-rekod-ains-design.md` (read §4–§7 before starting).

## Global Constraints

- UI text 100% Bahasa Melayu. Code comments may be BM or English.
- Next 15: `params` / `searchParams` / `cookies()` / `headers()` are Promises — always `await`.
- Design: white canvas; blue `#024ad8` only for CTA/accents, **max 2 blue elements per screen** (use `.btn-primary` for at most one main CTA; links use `text-ink underline`, not `.link-blue`). Existing classes: `.btn-primary/.btn-ink/.btn-outline/.btn-outline-ink`, `.card`, `.input`, `.textarea`, `.label`, `.status-badge`. Ink `#1a1a1a`; greys `graphite/steel/fog/cloud`.
- Design exception (spec §4.2): three status colours only on status dots/badges/reason chips: hijau `#16A34A`, kuning `#CA8A04`, merah `#DC2626`.
- CoE Tools hub accent: indigo `#4F46E5`. Home page gets a **6th** `HOME_MODULES` card (full-colour head like the others — do not desaturate).
- Every new `public` table: `ENABLE ROW LEVEL SECURITY` with no policies, in its migration.
- Never select full rows from large tables; admin query aggregates in SQL.
- **No real student names/text in the repo** (fixtures are synthetic). No student data in DB, logs or analytics.
- The bookmarklet must stay self-contained (no remote script loading into AINS), must only accept messages from the NEXa origin, and must only act on record IDs it read in the current session.
- Bump `VERSI_ENJIN` when `standard.ts` defaults change; bump `VERSI_PENANDA` (and `VERSI_PENANDA_MIN` if incompatible) when `penanda.js` changes.
- Git: work on branch `feat/coe-tools-semak-ains`. The working tree contains the user's unrelated uncommitted changes (kunjung-bantu files, `AI_CONTEXT_LOG.md`, `package-lock.json`, `exports/`) — **always `git add` explicit paths; never `git add -A` / `git add .`; never commit `AI_CONTEXT_LOG.md` without asking the user.**
- After the last task: `npm run build` + `npm run typecheck` + `npm run test:tools` + smoke of all new routes.

## File Structure

**Engine (pure TS, no DOM/DB) — `lib/tools/semak-ains/`**

| File | Responsibility |
|---|---|
| `jenis.ts` | Shared types (`RekodAins`, `Keputusan`, `KodSebab`, …) |
| `normal.ts` | Text normalisation, `bukuSama`, `tarikhHantar` |
| `tahap.ts` | Class string → level code & threshold band |
| `bahasa.ts` | Language detection, Han/Tamil helpers, word split |
| `panjang.ts` | Length measure (Han chars vs words) |
| `rawak.ts` | Gibberish / repetition / filler-symbol detection |
| `standard.ts` | District defaults, GPM settings merge, diffs |
| `pendua.ts` | Duplicate/template/class-activity/resubmission detection |
| `komen.ts` | BM labels and rejection comment templates |
| `peraturan.ts` | `semak()` orchestration + `ringkaskan()` |
| `csv.ts` | CSV export (BOM, quoting, formula-injection guard) |
| `mesej.ts` | postMessage protocol types/validation |
| `versi.ts` | `VERSI_ENJIN`, `VERSI_PENANDA_MIN` |
| `storan.ts` | localStorage settings (client only) |
| `log-klien.ts` | POST counts to `/api/semak-ains/log` (client only) |
| `queries.ts` | Admin aggregate query (server only) |
| `*.test.ts` | `node:test` unit tests |

**Bookmarklet:** `public/tools/semak-ains/penanda.js`

**UI — `components/tools/semak-ains/`:** `warna.ts`, `useSambunganAins.ts`, `PanelTapisan.tsx`, `RingkasanWarna.tsx`, `SenaraiRekod.tsx`, `PanelTindakan.tsx`, `LaciTetapan.tsx`, `SemakAinsApp.tsx`, `PasangPenanda.tsx`

**Routes:** `app/(public)/tools/page.tsx`, `app/(public)/tools/semak-ains/page.tsx`, `app/(public)/tools/semak-ains/pasang/page.tsx`, `app/api/semak-ains/log/route.ts`, `app/(admin)/admin/semak-ains/page.tsx`

**Modified:** `package.json`, `lib/schema.ts`, `drizzle/0063_semak_ains_log.sql` (+ meta), `lib/module-theme.ts`, `lib/home-modules.ts`, `lib/public-navigation.ts`, `components/home/HomeModuleIcon.tsx`, `components/PublicNavIcon.tsx`, `app/(admin)/admin/pelaporan/page.tsx`, `lib/admin/desktop-navigation.ts`, `CLAUDE.md`

---

### Task 0: Branch and commit the design docs

**Files:** none created (docs already exist)

- [ ] **Step 1: Create the feature branch (keeps the user's uncommitted changes in the working tree)**

```bash
git switch -c feat/coe-tools-semak-ains
```
Expected: `Switched to a new branch 'feat/coe-tools-semak-ains'`

- [ ] **Step 2: Commit only the spec and plan**

```bash
git add docs/superpowers/specs/2026-11-25-semak-rekod-ains-design.md docs/superpowers/plans/2026-11-25-coe-tools-semak-ains.md
git commit -m "docs(semak-ains): reka bentuk & pelan CoE Tools — Semak Rekod AINS"
```

---

### Task 1: Test harness + core types, normalisation, level parsing

**Files:**
- Modify: `package.json` (scripts)
- Create: `lib/tools/semak-ains/jenis.ts`, `lib/tools/semak-ains/normal.ts`, `lib/tools/semak-ains/tahap.ts`
- Test: `lib/tools/semak-ains/normal.test.ts`, `lib/tools/semak-ains/tahap.test.ts`

**Interfaces:**
- Produces: types `Bahasa`, `Jalur`, `Warna`, `Ukuran`, `RekodAins`, `KodSebab`, `KodMaklumat`, `Keputusan`; `normalTeks(s: string): string`; `bukuSama(a: string, b: string): boolean`; `tarikhHantar(meta: string): string`; `type Tahap = { kod: string; jalur: Jalur }`; `huraiKelas(kelas: string): Tahap`.

- [ ] **Step 1: Add the test script to `package.json` `scripts`** (after `"typecheck"`)

```json
    "test:tools": "tsx --test \"lib/tools/**/*.test.ts\"",
```

- [ ] **Step 2: Create `lib/tools/semak-ains/jenis.ts`**

```ts
/** Jenis data Semak Rekod AINS — dikongsi enjin, halaman dan protokol mesej. */

export type Bahasa = "zh" | "ta" | "bm" | "en" | "campur" | "lain";
export type Jalur = "D1-2" | "D3-4" | "D5-6" | "M";
export type Warna = "hijau" | "kuning" | "merah";
/** Unit ukuran panjang: perkataan ("kata") atau aksara Han ("zh"). */
export type Ukuran = "kata" | "zh";

/** Satu rekod menunggu seperti dibaca daripada senarai AINS. */
export type RekodAins = {
  id: string;
  tajuk: string;
  /** cth. "Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm" */
  meta: string;
  rumusan: string;
  pengajaran: string;
  murid: string;
  /** cth. "TAHUN 4 4D", "TINGKATAN 2 …", "PERALIHAN …" */
  kelas: string;
};

export type KodSebab =
  | "ruangan-kosong"
  | "terlalu-pendek"
  | "templat"
  | "rumusan-sama-pengajaran"
  | "hantar-semula-sama"
  | "teks-rawak"
  | "bahasa-tak-sepadan"
  | "agak-pendek"
  | "terlalu-panjang"
  | "rumusan-sama-2-buku"
  | "sama-murid-lain"
  | "buku-sama-berulang"
  | "simbol-pengisi"
  | "tiada-unsur-pengajaran";

export type KodMaklumat = "murid-luar-biasa" | "frasa-ai";

export type Keputusan = {
  id: string;
  warna: Warna;
  merah: KodSebab[];
  kuning: KodSebab[];
  maklumat: KodMaklumat[];
  bahasa: Bahasa;
  jalur: Jalur;
  /** D1–D6, T1–T5, P atau "?" */
  kodTahap: string;
  panjang: number;
};
```

- [ ] **Step 3: Write the failing tests**

`lib/tools/semak-ains/normal.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { bukuSama, normalTeks, tarikhHantar } from "./normal";

test("normalTeks buang tanda baca, ruang dan huruf besar", () => {
  assert.equal(normalTeks("Modul Etika - BAB 1!"), "moduletikabab1");
  assert.equal(normalTeks("《小王子》 "), "小王子");
});

test("bukuSama: sama tepat atau satu mengandungi yang lain (≥ 6 aksara)", () => {
  assert.equal(bukuSama("sangkancil", "sangkancil"), true);
  assert.equal(
    bukuSama(normalTeks("MODUL ETIKA SIBER - PRIVASI DIGITAL"), normalTeks("PRIVASI DIGITAL")),
    true,
  );
  assert.equal(bukuSama("abc", "abcd"), false);
  assert.equal(bukuSama("sangkancil", "sangbuaya"), false);
});

test("tarikhHantar daripada meta AINS", () => {
  assert.equal(tarikhHantar("Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm"), "25 Nov 2026");
  assert.equal(tarikhHantar("Buku / e-Buku"), "");
});
```

`lib/tools/semak-ains/tahap.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { huraiKelas } from "./tahap";

test("huraiKelas: sekolah rendah", () => {
  assert.deepEqual(huraiKelas("TAHUN 1 1A"), { kod: "D1", jalur: "D1-2" });
  assert.deepEqual(huraiKelas("TAHUN 4 4D"), { kod: "D4", jalur: "D3-4" });
  assert.deepEqual(huraiKelas("Tahun 6 Bestari"), { kod: "D6", jalur: "D5-6" });
});

test("huraiKelas: menengah dan peralihan", () => {
  assert.deepEqual(huraiKelas("TINGKATAN 2 CEMERLANG"), { kod: "T2", jalur: "M" });
  assert.deepEqual(huraiKelas("PERALIHAN P1"), { kod: "P", jalur: "M" });
});

test("huraiKelas: tidak dikenali → D5-6", () => {
  assert.deepEqual(huraiKelas(""), { kod: "?", jalur: "D5-6" });
});
```

- [ ] **Step 4: Run to verify they fail**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./normal` / `./tahap`.

- [ ] **Step 5: Implement `lib/tools/semak-ains/normal.ts`**

```ts
/** Normalkan teks untuk perbandingan: NFKC, huruf kecil, buang semua selain huruf/tanda/angka. */
export function normalTeks(s: string): string {
  return s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, "");
}

/**
 * Dua tajuk (sudah dinormalkan) dianggap buku sama jika sama, atau salah satu
 * mengandungi yang lain dan kedua-duanya ≥ 6 aksara.
 */
export function bukuSama(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 6 || b.length < 6) return false;
  return a.includes(b) || b.includes(a);
}

/** Tarikh hantar daripada meta AINS, cth. "25 Nov 2026"; "" jika tiada. */
export function tarikhHantar(meta: string): string {
  const m = meta.match(/Dihantar\s+(\d{1,2}\s+\S+\s+\d{4})/);
  return m?.[1]?.replace(/\s+/g, " ") ?? "";
}
```

- [ ] **Step 6: Implement `lib/tools/semak-ains/tahap.ts`**

```ts
import type { Jalur } from "./jenis";

export type Tahap = { kod: string; jalur: Jalur };

/** Hurai kelas AINS → kod tahap (D1–D6, T1–T5, P) dan jalur ambang. */
export function huraiKelas(kelas: string): Tahap {
  const k = kelas.toUpperCase();
  const t = k.match(/TINGKATAN\s*(\d)/);
  if (t) return { kod: `T${t[1] ?? ""}`, jalur: "M" };
  if (/PERALIHAN/.test(k)) return { kod: "P", jalur: "M" };
  const d = k.match(/TAHUN\s*(\d)/);
  if (d) {
    const n = Number(d[1]);
    return { kod: `D${n}`, jalur: n <= 2 ? "D1-2" : n <= 4 ? "D3-4" : "D5-6" };
  }
  return { kod: "?", jalur: "D5-6" };
}
```

- [ ] **Step 7: Run tests**

Run: `npm run test:tools`
Expected: PASS (6 tests).

- [ ] **Step 8: Commit**

```bash
git add package.json lib/tools/semak-ains/jenis.ts lib/tools/semak-ains/normal.ts lib/tools/semak-ains/tahap.ts lib/tools/semak-ains/normal.test.ts lib/tools/semak-ains/tahap.test.ts
git commit -m "feat(semak-ains): jenis, normalisasi teks & hurai tahap + skrip test:tools"
```
Before `git add package.json`, run `git diff package.json`: if it shows any change other than the new `test:tools` line, stop and ask the user (interactive staging is unavailable).

---

### Task 2: Language detection and length

**Files:**
- Create: `lib/tools/semak-ains/bahasa.ts`, `lib/tools/semak-ains/panjang.ts`
- Test: `lib/tools/semak-ains/bahasa.test.ts`

**Interfaces:**
- Consumes: `Bahasa`, `Ukuran` from `jenis.ts`.
- Produces: `kiraHan(s): number`, `kiraTamil(s): number`, `adaHan(s): boolean`, `adaTamil(s): boolean`, `pecahPerkataan(s): string[]`, `kesanBahasa(teks): Bahasa`; `ukuranUntuk(b: Bahasa): Ukuran`, `ukurPanjang(s: string, b: Bahasa): number`.

- [ ] **Step 1: Write the failing test `lib/tools/semak-ains/bahasa.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { adaHan, adaTamil, kesanBahasa, pecahPerkataan } from "./bahasa";
import { ukuranUntuk, ukurPanjang } from "./panjang";

test("kesanBahasa", () => {
  assert.equal(kesanBahasa("这个故事告诉我们要孝顺父母。"), "zh");
  assert.equal(kesanBahasa("ஒரு குரங்கு தன் அம்மாவுடன் வாழ்ந்தது"), "ta");
  assert.equal(kesanBahasa("Kita hendaklah membantu orang yang susah dan jangan sombong."), "bm");
  assert.equal(kesanBahasa("The boy learns that he should help his friends."), "en");
  assert.equal(kesanBahasa("okey okey"), "campur");
  assert.equal(kesanBahasa("12345 ...."), "lain");
});

test("adaHan / adaTamil", () => {
  assert.equal(adaHan("《小王子》"), true);
  assert.equal(adaHan("THE LITTLE PRINCE"), false);
  assert.equal(adaTamil("சிண்ட்ரெல்லா"), true);
});

test("pecahPerkataan abaikan token tanda baca sahaja", () => {
  assert.deepEqual(pecahPerkataan("  Kita perlu  rajin . "), ["Kita", "perlu", "rajin"]);
});

test("ukurPanjang: aksara Han untuk Cina, perkataan untuk lain", () => {
  assert.equal(ukurPanjang("我们不能轻敌。", "zh"), 6);
  assert.equal(ukurPanjang("Kita perlu rajin membaca.", "bm"), 4);
  assert.equal(ukuranUntuk("zh"), "zh");
  assert.equal(ukuranUntuk("ta"), "kata");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./bahasa`.

- [ ] **Step 3: Implement `lib/tools/semak-ains/bahasa.ts`**

```ts
import type { Bahasa } from "./jenis";

const KATA_BM = new Set(
  "dan yang di ini itu untuk dengan dalam tidak ada saya kita mereka adalah akan telah ke dari pada oleh juga atau kerana boleh perlu kepada seorang buku cerita bahawa sangat lebih mesti jangan kami ia dia".split(
    " ",
  ),
);
const KATA_EN = new Set(
  "the and is are was were to of in a an that this it he she they we i you for with on not be have has had his her their my our story book about from will can should must when".split(
    " ",
  ),
);

export function kiraHan(s: string): number {
  return (s.match(/[一-鿿]/g) ?? []).length;
}

export function kiraTamil(s: string): number {
  return (s.match(/[஀-௿]/g) ?? []).length;
}

export function adaHan(s: string): boolean {
  return /[一-鿿]/.test(s);
}

export function adaTamil(s: string): boolean {
  return /[஀-௿]/.test(s);
}

/** Pecah kepada perkataan (dipisah ruang; mesti ada huruf/angka). */
export function pecahPerkataan(s: string): string[] {
  return s
    .trim()
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));
}

/** Kesan bahasa utama teks (Rumusan + Pengajaran). */
export function kesanBahasa(teks: string): Bahasa {
  const han = kiraHan(teks);
  if (han > 0 && han > pecahPerkataan(teks).length) return "zh";
  const tamil = kiraTamil(teks);
  const latin = (teks.match(/[A-Za-z]/g) ?? []).length;
  if (tamil > 0 && tamil > latin) return "ta";
  const lw = teks.toLowerCase().match(/[a-z']+/g) ?? [];
  if (lw.length === 0) return "lain";
  const bm = lw.filter((w) => KATA_BM.has(w)).length;
  const en = lw.filter((w) => KATA_EN.has(w)).length;
  if (bm > en) return "bm";
  if (en > bm) return "en";
  return "campur";
}
```

- [ ] **Step 4: Implement `lib/tools/semak-ains/panjang.ts`**

```ts
import { kiraHan, pecahPerkataan } from "./bahasa";
import type { Bahasa, Ukuran } from "./jenis";

export function ukuranUntuk(bahasa: Bahasa): Ukuran {
  return bahasa === "zh" ? "zh" : "kata";
}

/** Panjang dalam aksara Han (Cina) atau perkataan (lain-lain). */
export function ukurPanjang(s: string, bahasa: Bahasa): number {
  return bahasa === "zh" ? kiraHan(s) : pecahPerkataan(s).length;
}
```

- [ ] **Step 5: Run tests**

Run: `npm run test:tools`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/tools/semak-ains/bahasa.ts lib/tools/semak-ains/panjang.ts lib/tools/semak-ains/bahasa.test.ts
git commit -m "feat(semak-ains): kesan bahasa & ukur panjang"
```

---

### Task 3: Gibberish / repetition detection

**Files:**
- Create: `lib/tools/semak-ains/rawak.ts`
- Test: `lib/tools/semak-ains/rawak.test.ts`

**Interfaces:**
- Consumes: `Bahasa`.
- Produces: `type JenisRawak = "ulang" | "papan-kekunci" | "bukan-perkataan" | "ime" | "huruf-dijarakkan"`; `kesanRawak(teks: string, bahasa: Bahasa): JenisRawak | null`; `adaSimbolPengisi(teks: string): boolean`.

- [ ] **Step 1: Write the failing test `lib/tools/semak-ains/rawak.test.ts`** (synthetic text only)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { adaSimbolPengisi, kesanRawak } from "./rawak";

test("ulang: perkataan sama ≥ 6 kali berturut", () => {
  assert.equal(kesanRawak("today today today today today today is mala", "en"), "ulang");
});

test("ulang: teks gelung (perkataan unik < 35%)", () => {
  assert.equal(
    kesanRawak("I I see I see the I see the rabbit I see the rabbit I see the rabbit", "en"),
    "ulang",
  );
});

test("ulang: aksara Cina berulang", () => {
  assert.equal(kesanRawak("哈".repeat(50), "zh"), "ulang");
});

test("papan kekunci", () => {
  assert.equal(kesanRawak("asdfgh jkl saya suka", "bm"), "papan-kekunci");
});

test("bukan perkataan (tiada vokal / konsonan panjang)", () => {
  assert.equal(kesanRawak("RNFRK WRFWRQNV BCDFG KLMNP TRSPL cerita", "campur"), "bukan-perkataan");
});

test("sisa IME dalam teks Cina", () => {
  assert.equal(kesanRawak("甲a乙丙b丁戊c己庚d辛壬e癸", "zh"), "ime");
});

test("huruf dijarakkan", () => {
  assert.equal(
    kesanRawak("K i n i ,  m e r e k a   h i d u p   s e l e s a", "campur"),
    "huruf-dijarakkan",
  );
});

test("teks biasa (termasuk kata ganda & huruf panjang) bukan rawak", () => {
  assert.equal(
    kesanRawak(
      "Kita hendaklah membantu labah labah itu kerana ia kesayangannyaaaaa dan comel sekali",
      "bm",
    ),
    null,
  );
  assert.equal(
    kesanRawak(
      "这个故事讲述沉香为了寻找被困住的母亲，勇敢地踏上艰难的旅程，最终成功救出母亲。我们应该孝顺父母。",
      "zh",
    ),
    null,
  );
  assert.equal(
    kesanRawak("The beetle fell into the fountain and a kind dragonfly saved it from drowning.", "en"),
    null,
  );
});

test("simbol pengisi", () => {
  assert.equal(adaSimbolPengisi("sangat bijak......................"), true);
  assert.equal(adaSimbolPengisi("()()()()()()()()()"), true);
  assert.equal(adaSimbolPengisi("Hebat!!! Terima kasih."), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./rawak`.

- [ ] **Step 3: Implement `lib/tools/semak-ains/rawak.ts`**

```ts
import type { Bahasa } from "./jenis";

export type JenisRawak = "ulang" | "papan-kekunci" | "bukan-perkataan" | "ime" | "huruf-dijarakkan";

/**
 * Kesan teks rawak / berulang (spesifikasi §6 R6). Pulangkan jenis pertama yang
 * dikesan, atau null. Kata ganda BM ("labah labah") dan huruf panjang
 * ("sayangnyaaaa") sengaja TIDAK dikira rawak.
 */
export function kesanRawak(teks: string, bahasa: Bahasa): JenisRawak | null {
  const toks = teks.toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? [];
  let run = 1;
  let maks = 1;
  for (let i = 1; i < toks.length; i++) {
    run = toks[i] === toks[i - 1] ? run + 1 : 1;
    if (run > maks) maks = run;
  }
  if (maks >= 6) return "ulang";

  if (bahasa === "zh") {
    const cs = teks.match(/[一-鿿]/g) ?? [];
    if (cs.length >= 40) {
      const bigram = new Set<string>();
      for (let i = 1; i < cs.length; i++) bigram.add(`${cs[i - 1] ?? ""}${cs[i] ?? ""}`);
      if (bigram.size / (cs.length - 1) < 0.4) return "ulang";
    }
  } else if (toks.length >= 8 && new Set(toks).size / toks.length < 0.35) {
    return "ulang";
  }

  if (/(asdf|qwer|zxcv|hjkl)/i.test(teks)) return "papan-kekunci";

  const latin = teks.match(/[A-Za-z]{4,}/g) ?? [];
  if (latin.length >= 4) {
    const buruk = latin.filter((w) => !/[aeiouy]/i.test(w) || /[b-df-hj-np-tv-xz]{5,}/i.test(w)).length;
    if (buruk / latin.length >= 0.3) return "bukan-perkataan";
  }

  if ((teks.match(/[一-鿿][A-Za-z0-9][一-鿿]/g) ?? []).length >= 5) return "ime";

  if (/(?<![A-Za-z])[A-Za-z](?:\s+[A-Za-z](?![A-Za-z])){7,}/.test(teks)) return "huruf-dijarakkan";

  return null;
}

/** Tanda baca/simbol sama berulang ≥ 8 kali (cth. "........", ",,,,,,,,", "()()()()()()()()"). */
export function adaSimbolPengisi(teks: string): boolean {
  return /([^\p{L}\p{N}\s]{1,3})\1{7,}/u.test(teks);
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:tools`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tools/semak-ains/rawak.ts lib/tools/semak-ains/rawak.test.ts
git commit -m "feat(semak-ains): pengesan teks rawak, berulang & simbol pengisi"
```

---

### Task 4: District standard and GPM settings

**Files:**
- Create: `lib/tools/semak-ains/standard.ts`
- Test: `lib/tools/semak-ains/standard.test.ts`

**Interfaces:**
- Consumes: `Jalur`, `KodSebab`, `Ukuran`.
- Produces: `type Ambang = { merah: number; kuning: number; panjang: number }`; `type ModPeraturan = "merah" | "kuning" | "abai"`; `type Standard`; `STANDARD_DAERAH: Standard`; `type TetapanGpm`; `gabungStandard(t: TetapanGpm | null | undefined, asas?: Standard): Standard`; `tetapanBeza(s: Standard, asas?: Standard): TetapanGpm`; `bezaStandard(s: Standard, asas?: Standard): Record<string, string | number | boolean>` (flattened, excludes `komen`).

- [ ] **Step 1: Write the failing test `lib/tools/semak-ains/standard.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { STANDARD_DAERAH, bezaStandard, gabungStandard, tetapanBeza } from "./standard";

test("tanpa tetapan = standard daerah", () => {
  assert.deepEqual(gabungStandard(null), STANDARD_DAERAH);
  assert.deepEqual(bezaStandard(gabungStandard(undefined)), {});
});

test("tetapan GPM menggantikan nilai berkaitan sahaja", () => {
  const s = gabungStandard({ ambang: { kata: { "D5-6": { merah: 8 } } }, aktivitiKelas: "kuning" });
  assert.equal(s.ambang.kata["D5-6"].merah, 8);
  assert.equal(s.ambang.kata["D5-6"].kuning, 20);
  assert.equal(s.aktivitiKelas, "kuning");
  assert.deepEqual(bezaStandard(s), { "ambang.kata.D5-6.merah": 8, aktivitiKelas: "kuning" });
});

test("nilai tidak sah diabaikan atau dihadkan", () => {
  const s = gabungStandard({
    jedaMs: 50,
    hantarSemulaSama: "salah" as never,
    ambang: { zh: { M: { merah: 200, kuning: 100 } } },
  });
  assert.equal(s.jedaMs, 300);
  assert.equal(s.hantarSemulaSama, "merah");
  assert.equal(s.ambang.zh.M.merah, 200);
  assert.equal(s.ambang.zh.M.kuning, 200);
});

test("tetapanBeza simpan medan berubah sahaja (termasuk komen); bezaStandard abaikan komen", () => {
  const s = gabungStandard({ bahasaTakSepadan: false, komen: { templat: "Tulis sendiri." } });
  assert.deepEqual(tetapanBeza(s), { bahasaTakSepadan: false, komen: { templat: "Tulis sendiri." } });
  assert.deepEqual(bezaStandard(s), { bahasaTakSepadan: false });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./standard`.

- [ ] **Step 3: Implement `lib/tools/semak-ains/standard.ts`**

```ts
import type { Jalur, KodSebab, Ukuran } from "./jenis";

export type Ambang = { merah: number; kuning: number; panjang: number };
export type ModPeraturan = "merah" | "kuning" | "abai";

export type Standard = {
  /** Jumlah panjang Rumusan + Pengajaran: < merah = R2; < kuning = Y1; > panjang = Y2. */
  ambang: Record<Ukuran, Record<Jalur, Ambang>>;
  /** Minimum setiap ruangan (R1). */
  minRuangan: Record<Ukuran, number>;
  hantarSemulaSama: ModPeraturan;
  bukuSamaBerulang: ModPeraturan;
  aktivitiKelas: "benar" | "kuning";
  bahasaTakSepadan: boolean;
  semakUnsurPengajaran: boolean;
  ambangMuridLuarBiasa: number;
  jedaMs: number;
  /** Ganti komen lalai kepada murid (kosong = guna KOMEN_LALAI). */
  komen: Partial<Record<KodSebab, string>>;
};

/**
 * Standard lalai daerah (spesifikasi §7.1), dikalibrasi pada 6 sekolah 2026-11-25.
 * Mengubah nilai di sini = naikkan VERSI_ENJIN dalam versi.ts.
 */
export const STANDARD_DAERAH: Standard = {
  ambang: {
    kata: {
      "D1-2": { merah: 6, kuning: 12, panjang: 250 },
      "D3-4": { merah: 10, kuning: 20, panjang: 250 },
      "D5-6": { merah: 10, kuning: 20, panjang: 250 },
      M: { merah: 15, kuning: 25, panjang: 400 },
    },
    zh: {
      "D1-2": { merah: 40, kuning: 60, panjang: 500 },
      "D3-4": { merah: 60, kuning: 100, panjang: 500 },
      "D5-6": { merah: 80, kuning: 120, panjang: 500 },
      M: { merah: 60, kuning: 150, panjang: 800 },
    },
  },
  minRuangan: { kata: 3, zh: 5 },
  hantarSemulaSama: "merah",
  bukuSamaBerulang: "kuning",
  aktivitiKelas: "benar",
  bahasaTakSepadan: true,
  semakUnsurPengajaran: false,
  ambangMuridLuarBiasa: 50,
  jedaMs: 500,
  komen: {},
};

/** Tetapan GPM: subset separa Standard (disimpan dalam localStorage). */
export type TetapanGpm = {
  ambang?: Partial<Record<Ukuran, Partial<Record<Jalur, Partial<Ambang>>>>>;
  minRuangan?: Partial<Record<Ukuran, number>>;
  hantarSemulaSama?: ModPeraturan;
  bukuSamaBerulang?: ModPeraturan;
  aktivitiKelas?: "benar" | "kuning";
  bahasaTakSepadan?: boolean;
  semakUnsurPengajaran?: boolean;
  ambangMuridLuarBiasa?: number;
  jedaMs?: number;
  komen?: Partial<Record<KodSebab, string>>;
};

const UKURAN: Ukuran[] = ["kata", "zh"];
const JALUR: Jalur[] = ["D1-2", "D3-4", "D5-6", "M"];
const MOD: ModPeraturan[] = ["merah", "kuning", "abai"];

function nomborSah(v: unknown, lalai: number, min: number, maks: number): number {
  return typeof v === "number" && Number.isFinite(v)
    ? Math.min(maks, Math.max(min, Math.round(v)))
    : lalai;
}

/** Gabung tetapan GPM (boleh separa / tidak sah) dengan standard daerah. */
export function gabungStandard(
  t: TetapanGpm | null | undefined,
  asas: Standard = STANDARD_DAERAH,
): Standard {
  const s: Standard = structuredClone(asas);
  if (!t || typeof t !== "object") return s;
  for (const u of UKURAN) {
    for (const j of JALUR) {
      const a = t.ambang?.[u]?.[j];
      if (!a) continue;
      const cur = s.ambang[u][j];
      cur.merah = nomborSah(a.merah, cur.merah, 0, 5000);
      cur.kuning = Math.max(cur.merah, nomborSah(a.kuning, cur.kuning, 0, 5000));
      cur.panjang = Math.max(cur.kuning, nomborSah(a.panjang, cur.panjang, 1, 20000));
    }
    s.minRuangan[u] = nomborSah(t.minRuangan?.[u], s.minRuangan[u], 0, 100);
  }
  if (t.hantarSemulaSama && MOD.includes(t.hantarSemulaSama)) s.hantarSemulaSama = t.hantarSemulaSama;
  if (t.bukuSamaBerulang && MOD.includes(t.bukuSamaBerulang)) s.bukuSamaBerulang = t.bukuSamaBerulang;
  if (t.aktivitiKelas === "benar" || t.aktivitiKelas === "kuning") s.aktivitiKelas = t.aktivitiKelas;
  if (typeof t.bahasaTakSepadan === "boolean") s.bahasaTakSepadan = t.bahasaTakSepadan;
  if (typeof t.semakUnsurPengajaran === "boolean") s.semakUnsurPengajaran = t.semakUnsurPengajaran;
  s.ambangMuridLuarBiasa = nomborSah(t.ambangMuridLuarBiasa, s.ambangMuridLuarBiasa, 1, 100000);
  s.jedaMs = nomborSah(t.jedaMs, s.jedaMs, 300, 2000);
  if (t.komen && typeof t.komen === "object") {
    for (const [k, v] of Object.entries(t.komen)) {
      if (typeof v === "string" && v.trim()) s.komen[k as KodSebab] = v.trim().slice(0, 500);
    }
  }
  return s;
}

/** Tetapan bersarang minimum (hanya medan yang berbeza daripada asas) — untuk disimpan. */
export function tetapanBeza(s: Standard, asas: Standard = STANDARD_DAERAH): TetapanGpm {
  const beza = (a: unknown, b: unknown): unknown => {
    if (a !== null && typeof a === "object") {
      const ao = a as Record<string, unknown>;
      const bo = (b ?? {}) as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(ao)) {
        const v = beza(ao[k], bo[k]);
        if (v !== undefined) out[k] = v;
      }
      return Object.keys(out).length ? out : undefined;
    }
    return a === b ? undefined : a;
  };
  return (beza(s, asas) as TetapanGpm | undefined) ?? {};
}

/** Perbezaan dirata untuk log pemantauan, cth. { "ambang.kata.D5-6.merah": 8 }. Komen dikecualikan. */
export function bezaStandard(
  s: Standard,
  asas: Standard = STANDARD_DAERAH,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const jalan = (a: unknown, b: unknown, laluan: string): void => {
    if (laluan === "komen") return;
    if (a !== null && typeof a === "object") {
      const ao = a as Record<string, unknown>;
      const bo = (b ?? {}) as Record<string, unknown>;
      for (const k of Object.keys(ao)) jalan(ao[k], bo[k], laluan ? `${laluan}.${k}` : k);
      return;
    }
    if (a !== b && (typeof a === "string" || typeof a === "number" || typeof a === "boolean")) {
      out[laluan] = a;
    }
  };
  jalan(s, asas, "");
  return out;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:tools`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tools/semak-ains/standard.ts lib/tools/semak-ains/standard.test.ts
git commit -m "feat(semak-ains): standard lalai daerah & gabung tetapan GPM"
```

---

### Task 5: Duplicate / template detection

**Files:**
- Create: `lib/tools/semak-ains/pendua.ts`
- Test: `lib/tools/semak-ains/pendua.test.ts`

**Interfaces:**
- Consumes: `bukuSama`, `normalTeks` (tests).
- Produces: `type InputPendua = { id: string; murid: string; kelas: string; tarikh: string; tajukN: string; rumusanN: string }`; `type HasilPendua = { templat; sama2Buku; samaMuridLain; aktivitiKelas; hantarSemulaSama; bukuSamaBerulang: boolean }`; `kesanPendua(rekod: InputPendua[]): Map<string, HasilPendua>`.

- [ ] **Step 1: Write the failing test `lib/tools/semak-ains/pendua.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalTeks } from "./normal";
import { kesanPendua, type InputPendua } from "./pendua";

const PANJANG =
  "Cerita ini mengisahkan seekor kancil yang cerdik menyeberang sungai dengan menipu buaya.";

function rek(
  id: string,
  murid: string,
  tajuk: string,
  rumusan = PANJANG,
  kelas = "TAHUN 5 5A",
  tarikh = "25 Nov 2026",
): InputPendua {
  return { id, murid, kelas, tarikh, tajukN: normalTeks(tajuk), rumusanN: normalTeks(rumusan) };
}

test("templat: rumusan sama untuk ≥ 3 buku", () => {
  const h = kesanPendua([rek("1", "ALI", "Buku Satu"), rek("2", "ABU", "Buku Dua"), rek("3", "AHMAD", "Buku Tiga")]);
  assert.equal(h.get("1")?.templat, true);
  assert.equal(h.get("3")?.templat, true);
});

test("rumusan sama untuk 2 buku", () => {
  const h = kesanPendua([rek("1", "ALI", "Buku Satu"), rek("2", "ALI", "Buku Dua")]);
  assert.equal(h.get("1")?.sama2Buku, true);
  assert.equal(h.get("1")?.templat, false);
});

test("aktiviti kelas: murid lain, buku, kelas & hari sama", () => {
  const h = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ABU", "SANG KANCIL")]);
  assert.equal(h.get("1")?.aktivitiKelas, true);
  assert.equal(h.get("1")?.samaMuridLain, false);
});

test("sama dengan murid lain dari kelas berbeza", () => {
  const h = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ABU", "Sang Kancil", PANJANG, "TAHUN 5 5B")]);
  assert.equal(h.get("1")?.samaMuridLain, true);
});

test("hantar semula sama vs buku sama berulang", () => {
  const a = kesanPendua([rek("1", "ALI", "Sang Kancil"), rek("2", "ALI", "Sang Kancil")]);
  assert.equal(a.get("1")?.hantarSemulaSama, true);
  const b = kesanPendua([
    rek("1", "ALI", "Sang Kancil"),
    rek("2", "ALI", "Sang Kancil", "Kancil menipu buaya untuk menyeberang sungai yang luas dan dalam itu."),
  ]);
  assert.equal(b.get("1")?.bukuSamaBerulang, true);
  assert.equal(b.get("1")?.hantarSemulaSama, false);
});

test("rumusan pendek (< 40 aksara) tidak dikira pendua", () => {
  const h = kesanPendua([
    rek("1", "ALI", "A1 Buku", "Bagus."),
    rek("2", "ABU", "B2 Buku", "Bagus."),
    rek("3", "AHMAD", "C3 Buku", "Bagus."),
  ]);
  assert.equal(h.get("1")?.templat, false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./pendua`.

- [ ] **Step 3: Implement `lib/tools/semak-ains/pendua.ts`**

```ts
import { bukuSama } from "./normal";

export type InputPendua = {
  id: string;
  murid: string;
  kelas: string;
  tarikh: string;
  /** Tajuk dinormalkan (normalTeks). */
  tajukN: string;
  /** Rumusan dinormalkan (normalTeks). */
  rumusanN: string;
};

export type HasilPendua = {
  templat: boolean;
  sama2Buku: boolean;
  samaMuridLain: boolean;
  aktivitiKelas: boolean;
  hantarSemulaSama: boolean;
  bukuSamaBerulang: boolean;
};

const MIN_RUMUSAN_PENDUA = 40;

function bilanganBuku(kumpulan: InputPendua[]): number {
  const wakil: string[] = [];
  for (const r of kumpulan) if (!wakil.some((w) => bukuSama(w, r.tajukN))) wakil.push(r.tajukN);
  return wakil.length;
}

/** Kesan templat, pendua merentas murid, aktiviti kelas dan hantaran semula (spesifikasi §6). */
export function kesanPendua(rekod: InputPendua[]): Map<string, HasilPendua> {
  const hasil = new Map<string, HasilPendua>(
    rekod.map((r) => [
      r.id,
      {
        templat: false,
        sama2Buku: false,
        samaMuridLain: false,
        aktivitiKelas: false,
        hantarSemulaSama: false,
        bukuSamaBerulang: false,
      },
    ]),
  );

  const ikutRumusan = new Map<string, InputPendua[]>();
  for (const r of rekod) {
    if (r.rumusanN.length < MIN_RUMUSAN_PENDUA) continue;
    const g = ikutRumusan.get(r.rumusanN);
    if (g) g.push(r);
    else ikutRumusan.set(r.rumusanN, [r]);
  }
  for (const g of ikutRumusan.values()) {
    if (g.length < 2) continue;
    const buku = bilanganBuku(g);
    for (const r of g) {
      const h = hasil.get(r.id)!;
      if (buku >= 3) {
        h.templat = true;
        continue;
      }
      if (buku === 2) {
        h.sama2Buku = true;
        continue;
      }
      const lain = g.filter((x) => x !== r && x.murid !== r.murid);
      if (lain.length === 0) continue;
      if (lain.every((x) => x.kelas === r.kelas && x.tarikh === r.tarikh)) h.aktivitiKelas = true;
      else h.samaMuridLain = true;
    }
  }

  const ikutMurid = new Map<string, InputPendua[]>();
  for (const r of rekod) {
    const g = ikutMurid.get(r.murid);
    if (g) g.push(r);
    else ikutMurid.set(r.murid, [r]);
  }
  for (const g of ikutMurid.values()) {
    if (g.length < 2) continue;
    for (const r of g) {
      const sama = g.filter((x) => x !== r && bukuSama(x.tajukN, r.tajukN));
      if (sama.length === 0) continue;
      const h = hasil.get(r.id)!;
      if (r.rumusanN && sama.some((x) => x.rumusanN === r.rumusanN)) h.hantarSemulaSama = true;
      else h.bukuSamaBerulang = true;
    }
  }
  return hasil;
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:tools`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/tools/semak-ains/pendua.ts lib/tools/semak-ains/pendua.test.ts
git commit -m "feat(semak-ains): kesan templat, pendua, aktiviti kelas & hantar semula"
```

---

### Task 6: Comments and the rules orchestrator

**Files:**
- Create: `lib/tools/semak-ains/komen.ts`, `lib/tools/semak-ains/peraturan.ts`
- Test: `lib/tools/semak-ains/peraturan.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces: `LABEL_SEBAB: Record<KodSebab, string>`, `LABEL_MAKLUMAT: Record<KodMaklumat, string>`, `KOMEN_LALAI: Record<KodSebab, string>`, `janaKomen(merah: KodSebab[], kuning: KodSebab[], standard: Standard, ganti?: Partial<Record<KodSebab, string>>): string`; `semak(rekod: RekodAins[], standard: Standard): Keputusan[]`; `type Ringkasan = { jumlah; hijau; kuning; merah: number }`; `ringkaskan(k: Keputusan[]): Ringkasan`.

- [ ] **Step 1: Create `lib/tools/semak-ains/komen.ts`**

```ts
import type { KodMaklumat, KodSebab } from "./jenis";
import type { Standard } from "./standard";

export const LABEL_SEBAB: Record<KodSebab, string> = {
  "ruangan-kosong": "Rumusan/Pengajaran tidak lengkap",
  "terlalu-pendek": "Terlalu pendek",
  templat: "Templat (rumusan sama untuk ≥ 3 buku)",
  "rumusan-sama-pengajaran": "Rumusan sama dengan Pengajaran",
  "hantar-semula-sama": "Dihantar semula tanpa pindaan",
  "teks-rawak": "Teks rawak / berulang",
  "bahasa-tak-sepadan": "Bahasa tidak sepadan dengan buku",
  "agak-pendek": "Agak pendek",
  "terlalu-panjang": "Luar biasa panjang",
  "rumusan-sama-2-buku": "Rumusan sama untuk 2 buku",
  "sama-murid-lain": "Sama dengan murid lain",
  "buku-sama-berulang": "Buku sama direkod semula",
  "simbol-pengisi": "Simbol/tanda baca pengisi",
  "tiada-unsur-pengajaran": "Pengajaran tiada unsur pengajaran",
};

export const LABEL_MAKLUMAT: Record<KodMaklumat, string> = {
  "murid-luar-biasa": "Murid dengan rekod luar biasa banyak",
  "frasa-ai": "Frasa lazim AI/terjemahan",
};

export const KOMEN_LALAI: Record<KodSebab, string> = {
  "ruangan-kosong": "Rumusan/Pengajaran tidak lengkap. Sila tulis semula dengan lengkap.",
  "terlalu-pendek": "Rumusan dan pengajaran terlalu pendek. Sila huraikan isi buku dengan ayat sendiri.",
  templat: "Rumusan ini sama dengan rekod buku lain. Sila tulis rumusan khusus untuk buku ini.",
  "rumusan-sama-pengajaran": "Rumusan dan pengajaran tidak boleh sama.",
  "hantar-semula-sama": "Rekod ini telah dihantar sebelum ini.",
  "teks-rawak": "Teks tidak dapat difahami. Sila tulis semula rumusan dan pengajaran.",
  "bahasa-tak-sepadan": "Rumusan hendaklah dalam bahasa buku yang dibaca.",
  "agak-pendek": "Rumusan dan pengajaran agak pendek. Sila huraikan dengan lebih lengkap.",
  "terlalu-panjang": "Sila tulis rumusan dengan ayat sendiri secara ringkas.",
  "rumusan-sama-2-buku": "Rumusan ini sama dengan rekod buku lain. Sila tulis rumusan khusus untuk buku ini.",
  "sama-murid-lain": "Rumusan ini sama dengan murid lain. Sila tulis dengan ayat sendiri.",
  "buku-sama-berulang": "Buku ini telah direkodkan sebelum ini.",
  "simbol-pengisi": "Jangan gunakan tanda baca berulang untuk memanjangkan teks.",
  "tiada-unsur-pengajaran": "Pengajaran hendaklah menyatakan nilai atau pengajaran daripada buku.",
};

/**
 * Komen penolakan satu rekod: gabungan komen unik bagi sebab merah (atau kuning
 * jika tiada merah). Keutamaan teks: `ganti` (suntingan dialog) → tetapan GPM → lalai.
 */
export function janaKomen(
  merah: KodSebab[],
  kuning: KodSebab[],
  standard: Standard,
  ganti: Partial<Record<KodSebab, string>> = {},
): string {
  const sebab = merah.length ? merah : kuning;
  const teks = sebab.map((k) => (ganti[k] ?? standard.komen[k] ?? KOMEN_LALAI[k]).trim()).filter(Boolean);
  return [...new Set(teks)].join(" ").slice(0, 500);
}
```

- [ ] **Step 2: Write the failing test `lib/tools/semak-ains/peraturan.test.ts`**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { RekodAins } from "./jenis";
import { janaKomen } from "./komen";
import { ringkaskan, semak } from "./peraturan";
import { STANDARD_DAERAH, gabungStandard } from "./standard";

const RUMUSAN =
  "Cerita ini mengisahkan seekor kancil yang cerdik menyeberang sungai dengan menipu sekumpulan buaya yang lapar di tebing sungai.";
const PENGAJARAN = "Kita hendaklah menggunakan akal fikiran untuk menyelesaikan masalah dengan tenang.";

let n = 0;
function r(p: Partial<RekodAins> = {}): RekodAins {
  n += 1;
  return {
    id: `id-${n}`,
    tajuk: `Buku ${n}`,
    meta: "Buku / e-Buku · Dihantar 25 Nov 2026, 9:31 pm",
    rumusan: RUMUSAN,
    pengajaran: PENGAJARAN,
    murid: `MURID ${n}`,
    kelas: "TAHUN 5 5A",
    ...p,
  };
}
const satu = (rek: RekodAins, s = STANDARD_DAERAH) => semak([rek], s)[0]!;

test("rekod baik → hijau", () => {
  const k = satu(r());
  assert.equal(k.warna, "hijau");
  assert.deepEqual(k.merah, []);
  assert.deepEqual(k.kuning, []);
  assert.equal(k.bahasa, "bm");
  assert.equal(k.kodTahap, "D5");
});

test("terlalu pendek → merah", () => {
  const k = satu(r({ rumusan: "Kancil menipu buaya.", pengajaran: "Jangan menipu." }));
  assert.equal(k.warna, "merah");
  assert.ok(k.merah.includes("terlalu-pendek"));
});

test("agak pendek → kuning", () => {
  const k = satu(
    r({
      rumusan: "Kancil menipu buaya untuk menyeberang sungai yang luas.",
      pengajaran: "Kita jangan menipu orang lain.",
    }),
  );
  assert.equal(k.warna, "kuning");
  assert.deepEqual(k.kuning, ["agak-pendek"]);
});

test("Pengajaran kosong → merah ruangan-kosong", () => {
  assert.ok(satu(r({ pengajaran: "." })).merah.includes("ruangan-kosong"));
});

test("Pengajaran Cina satu ayat (≥ 5 aksara) bukan ruangan kosong", () => {
  const k = satu(
    r({
      tajuk: "《小王子》",
      rumusan:
        "小王子离开自己的星球，到处旅行，认识了很多不同的人，也明白了什么是真正的友谊和责任。他和狐狸成为朋友，学会了珍惜。最后他回到了自己的星球照顾玫瑰花。",
      pengajaran: "我们要珍惜朋友。",
    }),
  );
  assert.equal(k.bahasa, "zh");
  assert.ok(!k.merah.includes("ruangan-kosong"));
  assert.ok(!k.merah.includes("bahasa-tak-sepadan"));
});

test("tajuk Cina + teks BI → bahasa tidak sepadan; boleh dimatikan", () => {
  const rek = r({
    tajuk: "逃家小兔",
    rumusan: "A little bunny tells his mother that he wants to run away and become a fish in the river.",
    pengajaran: "We should appreciate the love of our parents every day.",
  });
  assert.ok(satu(rek).merah.includes("bahasa-tak-sepadan"));
  assert.ok(!satu(rek, gabungStandard({ bahasaTakSepadan: false })).merah.includes("bahasa-tak-sepadan"));
});

test("templat merentas 3 buku → merah", () => {
  const k = semak([r(), r(), r()], STANDARD_DAERAH);
  assert.ok(k.every((x) => x.merah.includes("templat")));
});

test("aktiviti kelas dibenarkan secara lalai; kuning jika ditetapkan", () => {
  const a = r({ tajuk: "Sang Kancil", murid: "ALI" });
  const b = r({ tajuk: "Sang Kancil", murid: "ABU" });
  assert.equal(semak([a, b], STANDARD_DAERAH)[0]!.warna, "hijau");
  assert.ok(semak([a, b], gabungStandard({ aktivitiKelas: "kuning" }))[0]!.kuning.includes("sama-murid-lain"));
});

test("hantar semula sama: merah secara lalai, boleh diabaikan", () => {
  const a = r({ tajuk: "Sang Kancil", murid: "ALI" });
  const b = r({ tajuk: "Sang Kancil", murid: "ALI" });
  assert.ok(semak([a, b], STANDARD_DAERAH)[0]!.merah.includes("hantar-semula-sama"));
  assert.equal(semak([a, b], gabungStandard({ hantarSemulaSama: "abai" }))[0]!.warna, "hijau");
});

test("murid luar biasa → maklumat sahaja, warna tidak berubah", () => {
  const s = gabungStandard({ ambangMuridLuarBiasa: 1 });
  const k = semak([r({ murid: "ALI", rumusan: `${RUMUSAN} Satu.` }), r({ murid: "ALI", rumusan: `${RUMUSAN} Dua.` })], s);
  assert.ok(k[0]!.maklumat.includes("murid-luar-biasa"));
  assert.equal(k[0]!.warna, "hijau");
});

test("ringkaskan", () => {
  const k = semak([r(), r({ rumusan: "Pendek.", pengajaran: "." })], STANDARD_DAERAH);
  assert.deepEqual(ringkaskan(k), { jumlah: 2, hijau: 1, kuning: 0, merah: 1 });
});

test("janaKomen: sebab merah diutamakan, unik, boleh diganti", () => {
  const teks = janaKomen(["terlalu-pendek", "ruangan-kosong"], ["agak-pendek"], STANDARD_DAERAH, {
    "ruangan-kosong": "Lengkapkan.",
  });
  assert.ok(teks.includes("terlalu pendek"));
  assert.ok(teks.endsWith("Lengkapkan."));
  assert.ok(!teks.includes("agak pendek"));
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm run test:tools`
Expected: FAIL — cannot find module `./peraturan`.

- [ ] **Step 4: Implement `lib/tools/semak-ains/peraturan.ts`**

```ts
import { adaHan, adaTamil, kesanBahasa } from "./bahasa";
import type { Keputusan, KodMaklumat, KodSebab, RekodAins, Warna } from "./jenis";
import { normalTeks, tarikhHantar } from "./normal";
import { ukuranUntuk, ukurPanjang } from "./panjang";
import { kesanPendua } from "./pendua";
import { adaSimbolPengisi, kesanRawak } from "./rawak";
import type { ModPeraturan, Standard } from "./standard";
import { huraiKelas } from "./tahap";

const UNSUR_PENGAJARAN =
  /(should|must|learn|lesson|teach|important|never|always|don't|do not|we can|kita|jangan|pengajaran|mengajar|perlulah|hendaklah|mestilah|应该|要|不要|不能|学会|学习|教导|明白|懂得|告诉我们|让我|வேண்டும்|கூடாது)/i;
const FRASA_AI =
  /(delves?|tapestry|thought-provoking|profound|masterful|underscores?|poignant|resonates?|serves as a (?:powerful )?reminder|testament to|intricate|captivating|颠覆传统|生动地展现|发人深省|淋漓尽致)/i;

function ikutMod(mod: ModPeraturan, kod: KodSebab, merah: KodSebab[], kuning: KodSebab[]): void {
  if (mod === "merah") merah.push(kod);
  else if (mod === "kuning") kuning.push(kod);
}

/** Semak semua rekod dalam satu kelompok dan kelaskan kepada hijau/kuning/merah (spesifikasi §6). */
export function semak(rekod: RekodAins[], standard: Standard): Keputusan[] {
  const pendua = kesanPendua(
    rekod.map((r) => ({
      id: r.id,
      murid: r.murid,
      kelas: r.kelas,
      tarikh: tarikhHantar(r.meta),
      tajukN: normalTeks(r.tajuk),
      rumusanN: normalTeks(r.rumusan),
    })),
  );
  const bilMurid = new Map<string, number>();
  for (const r of rekod) bilMurid.set(r.murid, (bilMurid.get(r.murid) ?? 0) + 1);

  return rekod.map((r) => {
    const teks = `${r.rumusan} ${r.pengajaran}`;
    const bahasa = kesanBahasa(teks);
    const ukuran = ukuranUntuk(bahasa);
    const tahap = huraiKelas(r.kelas);
    const ambang = standard.ambang[ukuran][tahap.jalur];
    const panjang = ukurPanjang(teks, bahasa);
    const merah: KodSebab[] = [];
    const kuning: KodSebab[] = [];
    const maklumat: KodMaklumat[] = [];

    const min = standard.minRuangan[ukuran];
    if (ukurPanjang(r.rumusan, bahasa) < min || ukurPanjang(r.pengajaran, bahasa) < min) {
      merah.push("ruangan-kosong");
    }
    if (panjang < ambang.merah) merah.push("terlalu-pendek");
    else if (panjang < ambang.kuning) kuning.push("agak-pendek");
    if (panjang > ambang.panjang) kuning.push("terlalu-panjang");

    const p = pendua.get(r.id)!;
    if (p.templat) merah.push("templat");
    if (p.sama2Buku) kuning.push("rumusan-sama-2-buku");
    if (p.samaMuridLain || (p.aktivitiKelas && standard.aktivitiKelas === "kuning")) {
      kuning.push("sama-murid-lain");
    }
    const rumusanN = normalTeks(r.rumusan);
    if (rumusanN && rumusanN === normalTeks(r.pengajaran)) merah.push("rumusan-sama-pengajaran");
    if (p.hantarSemulaSama) ikutMod(standard.hantarSemulaSama, "hantar-semula-sama", merah, kuning);
    if (p.bukuSamaBerulang) ikutMod(standard.bukuSamaBerulang, "buku-sama-berulang", merah, kuning);

    if (kesanRawak(teks, bahasa)) merah.push("teks-rawak");
    if (adaSimbolPengisi(teks)) kuning.push("simbol-pengisi");
    if (
      standard.bahasaTakSepadan &&
      ((adaHan(r.tajuk) && bahasa !== "zh") || (adaTamil(r.tajuk) && !adaTamil(teks)))
    ) {
      merah.push("bahasa-tak-sepadan");
    }
    if (standard.semakUnsurPengajaran && !UNSUR_PENGAJARAN.test(r.pengajaran)) {
      kuning.push("tiada-unsur-pengajaran");
    }

    if ((bilMurid.get(r.murid) ?? 0) > standard.ambangMuridLuarBiasa) maklumat.push("murid-luar-biasa");
    if (FRASA_AI.test(teks)) maklumat.push("frasa-ai");

    const warna: Warna = merah.length ? "merah" : kuning.length ? "kuning" : "hijau";
    return { id: r.id, warna, merah, kuning, maklumat, bahasa, jalur: tahap.jalur, kodTahap: tahap.kod, panjang };
  });
}

export type Ringkasan = { jumlah: number; hijau: number; kuning: number; merah: number };

export function ringkaskan(k: Keputusan[]): Ringkasan {
  const r: Ringkasan = { jumlah: k.length, hijau: 0, kuning: 0, merah: 0 };
  for (const x of k) r[x.warna] += 1;
  return r;
}
```

- [ ] **Step 5: Run tests**

Run: `npm run test:tools`
Expected: PASS (all suites).

- [ ] **Step 6: Commit**

```bash
git add lib/tools/semak-ains/komen.ts lib/tools/semak-ains/peraturan.ts lib/tools/semak-ains/peraturan.test.ts
git commit -m "feat(semak-ains): enjin peraturan hijau/kuning/merah & komen penolakan BM"
```

---

### Task 7: CSV, message protocol, versions and the bookmarklet

**Files:**
- Create: `lib/tools/semak-ains/csv.ts`, `lib/tools/semak-ains/mesej.ts`, `lib/tools/semak-ains/versi.ts`, `public/tools/semak-ains/penanda.js`
- Test: `lib/tools/semak-ains/csv.test.ts`, `lib/tools/semak-ains/mesej.test.ts`

**Interfaces:**
- Produces: `janaCsv(baris: BarisCsv[], versi: string): string`; `type BarisCsv = { rekod: RekodAins; keputusan: Keputusan; tindakan: string; hasil: string; masa: string }`; `SUMBER = "semak-ains"`, `ASAL_AINS = "https://ains.moe.gov.my"`, `JENIS_MESEJ`, `type Tapisan = { tahun?: string; kelas?: string }`, `type MesejDariAins`, `type MesejKeAins`, `type TanpaSumber<T>`, `mesejAinsSah(data: unknown): data is MesejDariAins`; `VERSI_ENJIN = "1.0.0"`, `VERSI_PENANDA_MIN = 1`.
- Bookmarklet protocol (must match `mesej.ts`): receives `sedia`, `mula`, `laksana`, `henti` from `__NEXA_ORIGIN__`; sends `sekolah`, `rekod`, `selesai-baca`, `kemajuan`, `selesai-laksana`.

- [ ] **Step 1: Write the failing tests**

`lib/tools/semak-ains/csv.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { janaCsv } from "./csv";
import type { Keputusan, RekodAins } from "./jenis";

const keputusan: Keputusan = {
  id: "abc",
  warna: "merah",
  merah: ["terlalu-pendek"],
  kuning: [],
  maklumat: [],
  bahasa: "bm",
  jalur: "D5-6",
  kodTahap: "D5",
  panjang: 3,
};

test("janaCsv: BOM, kepala, petikan sel", () => {
  const rekod: RekodAins = { id: "abc", tajuk: 'Buku "Hebat", Jilid 1', meta: "", rumusan: "", pengajaran: "", murid: "ALI", kelas: "TAHUN 5 5A" };
  const csv = janaCsv([{ rekod, keputusan, tindakan: "tolak", hasil: "berjaya", masa: "2026-11-25T10:00:00Z" }], "1.0.0");
  assert.ok(csv.startsWith("﻿id,murid,kelas,tajuk,warna,sebab,tindakan,hasil,masa,versi_standard\r\n"));
  assert.ok(csv.includes('"Buku ""Hebat"", Jilid 1"'));
  assert.ok(csv.includes("Terlalu pendek"));
});

test("janaCsv: halang suntikan formula", () => {
  const rekod: RekodAins = { id: "x", tajuk: "=HYPERLINK(1)", meta: "", rumusan: "", pengajaran: "", murid: "+ALI", kelas: "T" };
  const csv = janaCsv([{ rekod, keputusan: { ...keputusan, id: "x" }, tindakan: "", hasil: "", masa: "" }], "1.0.0");
  assert.ok(csv.includes("'=HYPERLINK(1)"));
  assert.ok(csv.includes("'+ALI"));
});
```

`lib/tools/semak-ains/mesej.test.ts`:
```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JENIS_MESEJ, SUMBER, mesejAinsSah } from "./mesej";
import { VERSI_PENANDA_MIN } from "./versi";

const penanda = readFileSync(join(process.cwd(), "public", "tools", "semak-ains", "penanda.js"), "utf8");

test("penanda.js mengandungi semua jenis mesej dan pemalar asas", () => {
  for (const j of JENIS_MESEJ) assert.ok(penanda.includes(`"${j}"`), `jenis "${j}" tiada dalam penanda.js`);
  assert.ok(penanda.includes(`"${SUMBER}"`));
  assert.ok(penanda.includes("__NEXA_ORIGIN__"));
  assert.ok(penanda.includes('"ains.moe.gov.my"'));
  const v = Number(penanda.match(/VERSI_PENANDA\s*=\s*(\d+)/)?.[1]);
  assert.ok(v >= VERSI_PENANDA_MIN);
});

test("mesejAinsSah", () => {
  assert.equal(mesejAinsSah({ sumber: SUMBER, jenis: "rekod", rekod: [], halaman: 1, jumlahHalaman: 1 }), true);
  assert.equal(mesejAinsSah({ sumber: "lain", jenis: "rekod" }), false);
  assert.equal(mesejAinsSah({ sumber: SUMBER, jenis: "laksana" }), false);
  assert.equal(mesejAinsSah(null), false);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:tools`
Expected: FAIL — missing `./csv`, `./mesej`, `./versi`, `penanda.js`.

- [ ] **Step 3: Implement `lib/tools/semak-ains/csv.ts`**

```ts
import type { Keputusan, RekodAins } from "./jenis";
import { LABEL_SEBAB } from "./komen";

export type BarisCsv = {
  rekod: RekodAins;
  keputusan: Keputusan;
  tindakan: string;
  hasil: string;
  masa: string;
};

function sel(v: string): string {
  let s = v.replace(/\r?\n/g, " ");
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV UTF-8 dengan BOM (untuk Excel) — disimpan pada komputer GPM sahaja. */
export function janaCsv(baris: BarisCsv[], versi: string): string {
  const kepala = ["id", "murid", "kelas", "tajuk", "warna", "sebab", "tindakan", "hasil", "masa", "versi_standard"];
  const isi = baris.map((b) =>
    [
      b.rekod.id,
      b.rekod.murid,
      b.rekod.kelas,
      b.rekod.tajuk,
      b.keputusan.warna,
      [...b.keputusan.merah, ...b.keputusan.kuning].map((k) => LABEL_SEBAB[k]).join(" | "),
      b.tindakan,
      b.hasil,
      b.masa,
      versi,
    ]
      .map(sel)
      .join(","),
  );
  return `﻿${[kepala.join(","), ...isi].join("\r\n")}`;
}
```

- [ ] **Step 4: Implement `lib/tools/semak-ains/versi.ts`**

```ts
/** Naikkan apabila standard.ts / peraturan berubah. */
export const VERSI_ENJIN = "1.0.0";

/** Versi penanda minimum yang serasi (sama dengan VERSI_PENANDA dalam public/tools/semak-ains/penanda.js). */
export const VERSI_PENANDA_MIN = 1;
```

- [ ] **Step 5: Implement `lib/tools/semak-ains/mesej.ts`**

```ts
import type { RekodAins } from "./jenis";

export const SUMBER = "semak-ains";
export const ASAL_AINS = "https://ains.moe.gov.my";

/** Semua jenis mesej (ujian memastikan penanda.js menggunakan rentetan yang sama). */
export const JENIS_MESEJ = [
  "sedia",
  "sekolah",
  "mula",
  "rekod",
  "selesai-baca",
  "laksana",
  "kemajuan",
  "henti",
  "selesai-laksana",
] as const;
export type JenisMesej = (typeof JENIS_MESEJ)[number];

export type Tapisan = { tahun?: string; kelas?: string };

type S = { sumber: typeof SUMBER };

export type MesejDariAins =
  | (S & { jenis: "sekolah"; nama: string; kod: string | null; versiPenanda: number })
  | (S & { jenis: "rekod"; rekod: RekodAins[]; halaman: number; jumlahHalaman: number })
  | (S & { jenis: "selesai-baca"; bilangan: number; ralat: string | null; halamanGagal: number[] })
  | (S & { jenis: "kemajuan"; id: string; berjaya: boolean; jawapan: string | null })
  | (S & {
      jenis: "selesai-laksana";
      berjaya: number;
      gagal: number;
      masihMenunggu: string[];
      dihentikan: boolean;
      ralat: string | null;
    });

export type MesejKeAins =
  | (S & { jenis: "sedia"; versiEnjin: string })
  | (S & { jenis: "mula"; tapisan: Tapisan })
  | (S & {
      jenis: "laksana";
      tindakan: "approved" | "rejected";
      item: { id: string; komen: string }[];
      jedaMs: number;
    })
  | (S & { jenis: "henti" });

export type TanpaSumber<T> = T extends unknown ? Omit<T, "sumber"> : never;

const DARI_AINS: string[] = ["sekolah", "rekod", "selesai-baca", "kemajuan", "selesai-laksana"];

/** Semak bentuk asas mesej daripada tab AINS (asal & sumber disemak oleh pemanggil). */
export function mesejAinsSah(data: unknown): data is MesejDariAins {
  if (!data || typeof data !== "object") return false;
  const d = data as { sumber?: unknown; jenis?: unknown };
  return d.sumber === SUMBER && typeof d.jenis === "string" && DARI_AINS.includes(d.jenis);
}
```

- [ ] **Step 6: Create `public/tools/semak-ains/penanda.js`** (plain JS, no imports, block comments only)

```js
/* eslint-disable */
/* Semak Rekod AINS — penanda (bookmarklet).
 * Fail ini dijana menjadi pautan javascript: oleh /tools/semak-ains/pasang
 * (__NEXA_ORIGIN__ diganti dengan asal NEXa). Kendiri: tidak memuat skrip luar.
 * Hanya menerima arahan daripada __NEXA_ORIGIN__ dan hanya untuk ID rekod yang
 * dibaca dalam sesi ini. Ubah fail ini = naikkan VERSI_PENANDA. */
(function () {
  "use strict";
  var VERSI_PENANDA = 1;
  var NEXA = "__NEXA_ORIGIN__";
  var SUMBER = "semak-ains";
  var J = {
    sedia: "sedia",
    sekolah: "sekolah",
    mula: "mula",
    rekod: "rekod",
    selesaiBaca: "selesai-baca",
    laksana: "laksana",
    kemajuan: "kemajuan",
    henti: "henti",
    selesaiLaksana: "selesai-laksana"
  };

  if (location.hostname !== "ains.moe.gov.my") {
    alert("Semak Rekod AINS: sila klik penanda ini semasa berada di laman AINS (ains.moe.gov.my) selepas log masuk sebagai guru.");
    return;
  }
  if (window.__semakAins && window.__semakAins.tetingkap && !window.__semakAins.tetingkap.closed) {
    window.__semakAins.tetingkap.focus();
    return;
  }

  var baris = (document.body.innerText || "")
    .split("\n")
    .map(function (s) { return s.trim(); })
    .filter(Boolean);
  var iPortal = baris.indexOf("PORTAL GURU");
  if (iPortal < 0) {
    alert("Semak Rekod AINS: sila buka Papan Pemuka guru AINS (Portal Guru) dahulu, kemudian klik penanda ini sekali lagi.");
    return;
  }
  var namaSekolah = baris[iPortal + 1] || "";
  var idPengguna = baris.find(function (s) { return /^[\w.-]+@[\w.-]+$/.test(s); }) || "";
  var calonKod = (idPengguna.split("@")[1] || "").toUpperCase();
  var kodSekolah = /^[A-Z]{3}\d{4}$/.test(calonKod) ? calonKod : null;

  var keadaan = { tetingkap: null, idDibaca: new Set(), henti: false, sibuk: false, tapisan: {} };
  window.__semakAins = keadaan;

  function tidur(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hantar(mesej) {
    if (!keadaan.tetingkap || keadaan.tetingkap.closed) return false;
    mesej.sumber = SUMBER;
    keadaan.tetingkap.postMessage(mesej, NEXA);
    return true;
  }
  async function ambilDokumen(url) {
    var res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return new DOMParser().parseFromString(await res.text(), "text/html");
  }
  function teks(el, pemilih) {
    var x = el.querySelector(pemilih);
    return x ? (x.textContent || "").trim() : "";
  }
  function huraiSenarai(doc) {
    var senarai = doc.querySelector("#rsList");
    if (!senarai) return null;
    var hasil = [];
    senarai.querySelectorAll("[data-key] a.rec").forEach(function (a) {
      var m = (a.getAttribute("href") || "").match(/[?&]id=([^&#]+)/);
      if (!m) return;
      var r = {
        id: decodeURIComponent(m[1]),
        tajuk: teks(a, ".rec-title"),
        meta: teks(a, ".rec-meta").replace(/\s+/g, " "),
        rumusan: "",
        pengajaran: "",
        murid: teks(a, ".rec-murid b"),
        kelas: teks(a, ".rec-murid small")
      };
      a.querySelectorAll("p.rec-sum").forEach(function (p) {
        var b = p.querySelector("b");
        var label = b ? (b.textContent || "").trim().toLowerCase() : "";
        var c = p.cloneNode(true);
        var cb = c.querySelector("b");
        if (cb) cb.remove();
        var isi = (c.textContent || "").trim();
        if (label === "rumusan") r.rumusan = isi;
        else if (label === "pengajaran") r.pengajaran = isi;
      });
      hasil.push(r);
    });
    return hasil;
  }
  function jumlahHalaman(doc) {
    var maks = 1;
    doc.querySelectorAll('a[href*="page="]').forEach(function (a) {
      var m = (a.getAttribute("href") || "").match(/[?&]page=(\d+)/);
      if (m) maks = Math.max(maks, Number(m[1]));
    });
    return maks;
  }
  function urlSenarai(halaman) {
    var q = new URLSearchParams({ search_status: "pending", page: String(halaman) });
    if (keadaan.tapisan.tahun) q.set("search_class_year", keadaan.tapisan.tahun);
    if (keadaan.tapisan.kelas) q.set("search_class_name", keadaan.tapisan.kelas);
    return "/web/teacher-record-list?" + q.toString();
  }
  async function bacaSemua(lapor) {
    var pertama = await ambilDokumen(urlSenarai(1));
    var rekod1 = huraiSenarai(pertama);
    if (!rekod1) throw new Error("Sesi AINS tamat atau halaman berubah. Sila log masuk semula.");
    var jumlah = rekod1.length ? jumlahHalaman(pertama) : 0;
    var semua = rekod1.slice();
    var gagal = [];
    if (lapor) lapor(rekod1, 1, jumlah);
    for (var h = 2; h <= jumlah && !keadaan.henti; h++) {
      await tidur(100);
      var rekod = null;
      for (var cuba = 0; cuba < 3 && !rekod; cuba++) {
        try { rekod = huraiSenarai(await ambilDokumen(urlSenarai(h))); } catch (e) { rekod = null; }
        if (!rekod && cuba < 2) await tidur(1000);
      }
      if (!rekod) { gagal.push(h); continue; }
      semua = semua.concat(rekod);
      if (lapor) lapor(rekod, h, jumlah);
    }
    return { rekod: semua, gagal: gagal };
  }
  function tolakLaksana(ralat) {
    hantar({ jenis: J.selesaiLaksana, berjaya: 0, gagal: 0, masihMenunggu: [], dihentikan: true, ralat: ralat });
  }
  async function mula(tapisan) {
    if (keadaan.sibuk) {
      hantar({ jenis: J.selesaiBaca, bilangan: 0, ralat: "Penanda sedang sibuk. Tunggu proses semasa selesai.", halamanGagal: [] });
      return;
    }
    keadaan.sibuk = true;
    keadaan.henti = false;
    keadaan.tapisan = {
      tahun: tapisan && tapisan.tahun ? String(tapisan.tahun) : "",
      kelas: tapisan && tapisan.kelas ? String(tapisan.kelas) : ""
    };
    keadaan.idDibaca = new Set();
    try {
      var hasil = await bacaSemua(function (rekod, h, jumlah) {
        rekod.forEach(function (r) { keadaan.idDibaca.add(r.id); });
        hantar({ jenis: J.rekod, rekod: rekod, halaman: h, jumlahHalaman: jumlah });
      });
      hantar({ jenis: J.selesaiBaca, bilangan: hasil.rekod.length, ralat: null, halamanGagal: hasil.gagal });
    } catch (e) {
      hantar({ jenis: J.selesaiBaca, bilangan: keadaan.idDibaca.size, ralat: String((e && e.message) || e), halamanGagal: [] });
    } finally {
      keadaan.sibuk = false;
    }
  }
  async function laksana(arahan) {
    if (keadaan.sibuk) { tolakLaksana("Penanda sedang sibuk."); return; }
    var tindakan = arahan.tindakan;
    if (tindakan !== "approved" && tindakan !== "rejected") { tolakLaksana("Tindakan tidak sah."); return; }
    var item = (Array.isArray(arahan.item) ? arahan.item : []).filter(function (x) {
      return x && typeof x.id === "string" && keadaan.idDibaca.has(x.id);
    });
    if (!item.length) { tolakLaksana("Tiada rekod sah untuk tindakan. Baca semula senarai."); return; }
    var label = tindakan === "approved" ? "MELULUSKAN" : "MENOLAK";
    if (!confirm("Semak Rekod AINS\n\nAnda akan " + label + " " + item.length + " rekod bacaan murid atas nama akaun anda.\n\nTeruskan?")) {
      tolakLaksana("Dibatalkan oleh pengguna.");
      return;
    }
    keadaan.sibuk = true;
    keadaan.henti = false;
    var jeda = Math.min(2000, Math.max(300, Number(arahan.jedaMs) || 500));
    var berjaya = 0, gagal = 0, gagalBerturut = 0, ralat = null, selesai = [];
    for (var i = 0; i < item.length; i++) {
      if (keadaan.henti || !keadaan.tetingkap || keadaan.tetingkap.closed) break;
      var x = item[i];
      var ok = false, jawapan = null;
      try {
        var q = new URLSearchParams({ id: x.id, comment: String(x.komen || "").slice(0, 500), status: tindakan });
        var res = await fetch("/reading-record/updatestatus?" + q.toString(), {
          credentials: "same-origin",
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });
        jawapan = (await res.text()).trim().slice(0, 80);
        ok = res.ok && jawapan === "success";
      } catch (e) {
        jawapan = String((e && e.message) || e).slice(0, 80);
      }
      if (ok) { berjaya++; gagalBerturut = 0; selesai.push(x.id); keadaan.idDibaca.delete(x.id); }
      else { gagal++; gagalBerturut++; }
      hantar({ jenis: J.kemajuan, id: x.id, berjaya: ok, jawapan: ok ? null : jawapan });
      if (gagalBerturut >= 3) { ralat = "3 kegagalan berturut-turut — dihentikan. Sesi AINS mungkin tamat."; break; }
      await tidur(jeda);
    }
    var dihentikan = keadaan.henti || ralat !== null || berjaya + gagal < item.length;
    var masihMenunggu = [];
    try {
      if (selesai.length) {
        var semakan = await bacaSemua(null);
        var ada = new Set(semakan.rekod.map(function (r) { return r.id; }));
        masihMenunggu = selesai.filter(function (id) { return ada.has(id); });
      }
    } catch (e) {
      /* pengesahan selepas tindakan tidak wajib */
    }
    keadaan.sibuk = false;
    hantar({ jenis: J.selesaiLaksana, berjaya: berjaya, gagal: gagal, masihMenunggu: masihMenunggu, dihentikan: dihentikan, ralat: ralat });
  }

  window.addEventListener("message", function (e) {
    if (e.origin !== NEXA || !e.data || e.data.sumber !== SUMBER) return;
    if (!keadaan.tetingkap || e.source !== keadaan.tetingkap) return;
    var d = e.data;
    if (d.jenis === J.sedia) {
      hantar({ jenis: J.sekolah, nama: namaSekolah, kod: kodSekolah, versiPenanda: VERSI_PENANDA });
    } else if (d.jenis === J.mula) {
      mula(d.tapisan || {});
    } else if (d.jenis === J.laksana) {
      laksana(d);
    } else if (d.jenis === J.henti) {
      keadaan.henti = true;
    }
  });

  keadaan.tetingkap = window.open(NEXA + "/tools/semak-ains", "semak-ains");
  if (!keadaan.tetingkap) {
    alert("Semak Rekod AINS: tetingkap baharu disekat. Sila benarkan pop-up untuk ains.moe.gov.my dan cuba lagi.");
    window.__semakAins = null;
  }
})();
```

- [ ] **Step 7: Run tests**

Run: `npm run test:tools`
Expected: PASS (all suites incl. csv & mesej).

- [ ] **Step 8: Commit**

```bash
git add lib/tools/semak-ains/csv.ts lib/tools/semak-ains/csv.test.ts lib/tools/semak-ains/mesej.ts lib/tools/semak-ains/mesej.test.ts lib/tools/semak-ains/versi.ts public/tools/semak-ains/penanda.js
git commit -m "feat(semak-ains): protokol mesej, eksport CSV & penanda AINS kendiri"
```

---

### Task 8: Client helpers — settings storage, count logging, connection hook

**Files:**
- Create: `lib/tools/semak-ains/storan.ts`, `lib/tools/semak-ains/log-klien.ts`, `components/tools/semak-ains/useSambunganAins.ts`, `components/tools/semak-ains/warna.ts`

**Interfaces:**
- Consumes: `TetapanGpm`, `Standard`, `bezaStandard`, `VERSI_ENJIN`, `mesej.ts` exports, `RekodAins`.
- Produces: `bacaTetapan(kunci: string): TetapanGpm | null`, `simpanTetapan(kunci: string, t: TetapanGpm): void`, `padamTetapan(kunci: string): void`; `type DataLog`, `hantarLog(d: DataLog, standard: Standard): void`; hook `useSambunganAins()` returning `{ fasa, sekolah, rekod, bacaan, bacaanKe, ralat, halamanGagal, status, kira, hasilLaksana, mula, bacaSemula, laksana, henti }`; types `Fasa`, `InfoSekolah`, `Tindakan`, `StatusTindakan`, `HasilLaksana`, `KiraLaksana`; `WARNA_STATUS`.

- [ ] **Step 1: Create `lib/tools/semak-ains/storan.ts`**

```ts
import type { TetapanGpm } from "./standard";

const AWALAN = "semak-ains:tetapan:";

/** Tetapan GPM disimpan dalam localStorage pelayar sahaja (spesifikasi §7.2). */
export function bacaTetapan(kunci: string): TetapanGpm | null {
  try {
    const t = window.localStorage.getItem(AWALAN + kunci);
    return t ? (JSON.parse(t) as TetapanGpm) : null;
  } catch {
    return null;
  }
}

export function simpanTetapan(kunci: string, t: TetapanGpm): void {
  try {
    if (Object.keys(t).length === 0) window.localStorage.removeItem(AWALAN + kunci);
    else window.localStorage.setItem(AWALAN + kunci, JSON.stringify(t));
  } catch {
    /* storan disekat atau penuh — tetapan kekal untuk sesi ini sahaja */
  }
}

export function padamTetapan(kunci: string): void {
  try {
    window.localStorage.removeItem(AWALAN + kunci);
  } catch {
    /* abaikan */
  }
}
```

- [ ] **Step 2: Create `lib/tools/semak-ains/log-klien.ts`**

```ts
import { bezaStandard, type Standard } from "./standard";
import { VERSI_ENJIN } from "./versi";

export type DataLog = {
  namaSekolah: string;
  kodSekolah: string | null;
  jenis: "semak" | "lulus" | "tolak";
  bilRekod: number;
  bilHijau?: number;
  bilKuning?: number;
  bilMerah?: number;
  bilBerjaya?: number;
  bilGagal?: number;
  versiPenanda: number;
};

/** Hantar bilangan sahaja ke NEXa (tiada nama murid, tajuk, teks atau ID rekod). Gagal = senyap. */
export function hantarLog(d: DataLog, standard: Standard): void {
  const beza = bezaStandard(standard);
  const badan = {
    namaSekolah: d.namaSekolah.slice(0, 200),
    kodSekolah: d.kodSekolah,
    jenis: d.jenis,
    bilRekod: d.bilRekod,
    bilHijau: d.bilHijau ?? null,
    bilKuning: d.bilKuning ?? null,
    bilMerah: d.bilMerah ?? null,
    bilBerjaya: d.bilBerjaya ?? null,
    bilGagal: d.bilGagal ?? null,
    tetapan: Object.keys(beza).length ? beza : null,
    versiEnjin: VERSI_ENJIN,
    versiPenanda: String(d.versiPenanda),
  };
  void fetch("/api/semak-ains/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(badan),
    keepalive: true,
  }).catch(() => undefined);
}
```

- [ ] **Step 3: Create `components/tools/semak-ains/warna.ts`**

```ts
/** Pengecualian reka bentuk terhad (spesifikasi §4.2): warna status pada titik/lencana sahaja. */
export const WARNA_STATUS = {
  hijau: { label: "Lulus", warna: "#16A34A" },
  kuning: { label: "Perlu semak", warna: "#CA8A04" },
  merah: { label: "Cadang tolak", warna: "#DC2626" },
} as const;
```

- [ ] **Step 4: Create `components/tools/semak-ains/useSambunganAins.ts`**

```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RekodAins } from "@/lib/tools/semak-ains/jenis";
import {
  ASAL_AINS,
  SUMBER,
  mesejAinsSah,
  type MesejKeAins,
  type TanpaSumber,
  type Tapisan,
} from "@/lib/tools/semak-ains/mesej";
import { VERSI_ENJIN } from "@/lib/tools/semak-ains/versi";

export type Fasa =
  | "semak-sambungan"
  | "tiada-penanda"
  | "menunggu"
  | "sedia"
  | "membaca"
  | "keputusan"
  | "melaksana";
export type InfoSekolah = { nama: string; kod: string | null; versiPenanda: number };
export type Tindakan = "approved" | "rejected";
export type StatusTindakan = { tindakan: Tindakan; berjaya: boolean; jawapan: string | null; masa: string };
export type HasilLaksana = {
  tindakan: Tindakan;
  berjaya: number;
  gagal: number;
  masihMenunggu: string[];
  dihentikan: boolean;
  ralat: string | null;
};
export type KiraLaksana = { jumlah: number; diproses: number; berjaya: number; gagal: number };

/** Sambungan postMessage dengan penanda dalam tab AINS (window.opener). */
export function useSambunganAins() {
  const [fasa, setFasa] = useState<Fasa>("semak-sambungan");
  const [sekolah, setSekolah] = useState<InfoSekolah | null>(null);
  const [rekod, setRekod] = useState<RekodAins[]>([]);
  const [bacaan, setBacaan] = useState({ halaman: 0, jumlahHalaman: 0 });
  const [bacaanKe, setBacaanKe] = useState(0);
  const [ralat, setRalat] = useState<string | null>(null);
  const [halamanGagal, setHalamanGagal] = useState<number[]>([]);
  const [status, setStatus] = useState<Map<string, StatusTindakan>>(() => new Map());
  const [kira, setKira] = useState<KiraLaksana>({ jumlah: 0, diproses: 0, berjaya: 0, gagal: 0 });
  const [hasilLaksana, setHasilLaksana] = useState<HasilLaksana | null>(null);
  const tindakanSemasa = useRef<Tindakan>("approved");
  const tapisanAkhir = useRef<Tapisan>({});

  const hantar = useCallback((m: TanpaSumber<MesejKeAins>) => {
    window.opener?.postMessage({ ...m, sumber: SUMBER }, ASAL_AINS);
  }, []);

  useEffect(() => {
    if (!window.opener) {
      setFasa("tiada-penanda");
      return;
    }
    setFasa("menunggu");
    const dengar = (e: MessageEvent) => {
      if (e.origin !== ASAL_AINS || e.source !== window.opener || !mesejAinsSah(e.data)) return;
      const d = e.data;
      switch (d.jenis) {
        case "sekolah":
          setSekolah({ nama: d.nama, kod: d.kod, versiPenanda: d.versiPenanda });
          setFasa((f) => (f === "menunggu" ? "sedia" : f));
          break;
        case "rekod":
          setRekod((lama) => {
            const ada = new Set(lama.map((r) => r.id));
            return [...lama, ...d.rekod.filter((r) => !ada.has(r.id))];
          });
          setBacaan({ halaman: d.halaman, jumlahHalaman: d.jumlahHalaman });
          break;
        case "selesai-baca":
          setRalat(d.ralat);
          setHalamanGagal(d.halamanGagal);
          setBacaanKe((n) => n + 1);
          setFasa("keputusan");
          break;
        case "kemajuan":
          setStatus((lama) =>
            new Map(lama).set(d.id, {
              tindakan: tindakanSemasa.current,
              berjaya: d.berjaya,
              jawapan: d.jawapan,
              masa: new Date().toISOString(),
            }),
          );
          setKira((k) => ({
            ...k,
            diproses: k.diproses + 1,
            berjaya: k.berjaya + (d.berjaya ? 1 : 0),
            gagal: k.gagal + (d.berjaya ? 0 : 1),
          }));
          break;
        case "selesai-laksana":
          setHasilLaksana({
            tindakan: tindakanSemasa.current,
            berjaya: d.berjaya,
            gagal: d.gagal,
            masihMenunggu: d.masihMenunggu,
            dihentikan: d.dihentikan,
            ralat: d.ralat,
          });
          setFasa("keputusan");
          break;
      }
    };
    window.addEventListener("message", dengar);
    window.opener.postMessage({ sumber: SUMBER, jenis: "sedia", versiEnjin: VERSI_ENJIN }, ASAL_AINS);
    return () => window.removeEventListener("message", dengar);
  }, []);

  const mula = useCallback(
    (tapisan: Tapisan) => {
      tapisanAkhir.current = tapisan;
      setRekod([]);
      setStatus(new Map());
      setHasilLaksana(null);
      setRalat(null);
      setHalamanGagal([]);
      setBacaan({ halaman: 0, jumlahHalaman: 0 });
      setFasa("membaca");
      hantar({ jenis: "mula", tapisan });
    },
    [hantar],
  );

  const bacaSemula = useCallback(() => mula(tapisanAkhir.current), [mula]);

  const laksana = useCallback(
    (tindakan: Tindakan, item: { id: string; komen: string }[], jedaMs: number) => {
      if (item.length === 0) return;
      tindakanSemasa.current = tindakan;
      setHasilLaksana(null);
      setKira({ jumlah: item.length, diproses: 0, berjaya: 0, gagal: 0 });
      setFasa("melaksana");
      hantar({ jenis: "laksana", tindakan, item, jedaMs });
    },
    [hantar],
  );

  const henti = useCallback(() => hantar({ jenis: "henti" }), [hantar]);

  return {
    fasa,
    sekolah,
    rekod,
    bacaan,
    bacaanKe,
    ralat,
    halamanGagal,
    status,
    kira,
    hasilLaksana,
    mula,
    bacaSemula,
    laksana,
    henti,
  };
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors from the new files (pre-existing errors elsewhere, if any, must be noted, not fixed).

- [ ] **Step 6: Commit**

```bash
git add lib/tools/semak-ains/storan.ts lib/tools/semak-ains/log-klien.ts components/tools/semak-ains/warna.ts components/tools/semak-ains/useSambunganAins.ts
git commit -m "feat(semak-ains): storan tetapan, log bilangan & hook sambungan AINS"
```

---

### Task 9: Checker page UI `/tools/semak-ains`

**Files:**
- Create: `components/tools/semak-ains/PanelTapisan.tsx`, `RingkasanWarna.tsx`, `SenaraiRekod.tsx`, `PanelTindakan.tsx`, `LaciTetapan.tsx`, `SemakAinsApp.tsx`
- Create: `app/(public)/tools/semak-ains/page.tsx`

**Interfaces:**
- Consumes: engine (`semak`, `ringkaskan`, `Ringkasan`, `gabungStandard`, `tetapanBeza`, `bezaStandard`, `janaKomen`, `KOMEN_LALAI`, `LABEL_SEBAB`, `LABEL_MAKLUMAT`, `janaCsv`, `normalTeks`, `ASAL_AINS`, `VERSI_ENJIN`, `VERSI_PENANDA_MIN`), `bacaTetapan/simpanTetapan/padamTetapan`, `hantarLog`, `useSambunganAins`, `WARNA_STATUS`.
- Produces: default export `SemakAinsApp` (client component, no props).

- [ ] **Step 1: Create `components/tools/semak-ains/PanelTapisan.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Tapisan } from "@/lib/tools/semak-ains/mesej";

const TAHUN: [string, string][] = [
  ["", "Semua"],
  ["D1", "Tahun 1"],
  ["D2", "Tahun 2"],
  ["D3", "Tahun 3"],
  ["D4", "Tahun 4"],
  ["D5", "Tahun 5"],
  ["D6", "Tahun 6"],
  ["T1", "Tingkatan 1"],
  ["T2", "Tingkatan 2"],
  ["T3", "Tingkatan 3"],
  ["T4", "Tingkatan 4"],
  ["T5", "Tingkatan 5"],
  ["P", "Peralihan"],
];

export default function PanelTapisan({ onMula }: { onMula: (t: Tapisan) => void }) {
  const [tahun, setTahun] = useState("");
  const [kelas, setKelas] = useState("");
  return (
    <section className="card p-6">
      <h2 className="text-lg font-semibold text-ink">Baca rekod menunggu pengesahan</h2>
      <p className="mt-1 text-sm text-graphite">
        Pilih tahap atau kelas jika rekod terlalu banyak. Bacaan dibuat dalam tab AINS anda
        (lebih kurang 1 minit bagi 1,500 rekod).
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Tahun / Tingkatan</span>
          <select className="input mt-1" value={tahun} onChange={(e) => setTahun(e.target.value)}>
            {TAHUN.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Nama kelas (pilihan)</span>
          <input
            className="input mt-1"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            placeholder="cth. 4D"
          />
        </label>
      </div>
      <button
        type="button"
        className="btn-primary mt-6"
        onClick={() => onMula({ tahun: tahun || undefined, kelas: kelas.trim() || undefined })}
      >
        Mula baca
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/tools/semak-ains/RingkasanWarna.tsx`**

```tsx
import type { Ringkasan } from "@/lib/tools/semak-ains/peraturan";
import { WARNA_STATUS } from "./warna";

export default function RingkasanWarna({ ringkasan }: { ringkasan: Ringkasan }) {
  const pct = (n: number) => (ringkasan.jumlah ? Math.round((n / ringkasan.jumlah) * 100) : 0);
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {(["hijau", "kuning", "merah"] as const).map((w) => (
        <div key={w} className="card p-4">
          <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: WARNA_STATUS[w].warna }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: WARNA_STATUS[w].warna }} aria-hidden />
            {WARNA_STATUS[w].label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">
            {ringkasan[w].toLocaleString("ms-MY")}
          </p>
          <p className="text-xs text-graphite">
            {pct(ringkasan[w])}% daripada {ringkasan.jumlah.toLocaleString("ms-MY")} rekod
          </p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Create `components/tools/semak-ains/SenaraiRekod.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Bahasa, Keputusan, KodSebab, RekodAins, Warna } from "@/lib/tools/semak-ains/jenis";
import { LABEL_MAKLUMAT, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import { ASAL_AINS } from "@/lib/tools/semak-ains/mesej";
import type { StatusTindakan } from "./useSambunganAins";
import { WARNA_STATUS } from "./warna";

const LANGKAH = 100;
const LABEL_BAHASA: Record<Bahasa, string> = {
  zh: "Cina",
  ta: "Tamil",
  bm: "BM",
  en: "BI",
  campur: "Campuran",
  lain: "Lain",
};

type Props = {
  rekodIkutId: Map<string, RekodAins>;
  keputusan: Keputusan[];
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  onTogolPilih: (id: string) => void;
  dilihat: Set<string>;
  onTandaDilihat: (id: string) => void;
};

export function pautanAins(id: string): string {
  return `${ASAL_AINS}/web/teacher-record-details?id=${encodeURIComponent(id)}`;
}

export default function SenaraiRekod({
  rekodIkutId,
  keputusan,
  status,
  dipilih,
  onTogolPilih,
  dilihat,
  onTandaDilihat,
}: Props) {
  const [warna, setWarna] = useState<Warna | "semua">("semua");
  const [sebab, setSebab] = useState<KodSebab | "semua">("semua");
  const [tahap, setTahap] = useState("semua");
  const [cari, setCari] = useState("");
  const [had, setHad] = useState(LANGKAH);

  const sebabAda = useMemo(
    () => [...new Set(keputusan.flatMap((k) => [...k.merah, ...k.kuning]))],
    [keputusan],
  );
  const tahapAda = useMemo(() => [...new Set(keputusan.map((k) => k.kodTahap))].sort(), [keputusan]);
  const tapis = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return keputusan.filter((k) => {
      if (warna !== "semua" && k.warna !== warna) return false;
      if (sebab !== "semua" && !k.merah.includes(sebab) && !k.kuning.includes(sebab)) return false;
      if (tahap !== "semua" && k.kodTahap !== tahap) return false;
      if (q) {
        const r = rekodIkutId.get(k.id);
        if (!r || !`${r.murid} ${r.tajuk} ${r.kelas}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [keputusan, warna, sebab, tahap, cari, rekodIkutId]);

  const ubah = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setHad(LANGKAH);
  };

  return (
    <section className="card p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="label">Status</span>
          <select className="input mt-1" value={warna} onChange={(e) => ubah(setWarna)(e.target.value as Warna | "semua")}>
            <option value="semua">Semua</option>
            <option value="hijau">{WARNA_STATUS.hijau.label}</option>
            <option value="kuning">{WARNA_STATUS.kuning.label}</option>
            <option value="merah">{WARNA_STATUS.merah.label}</option>
          </select>
        </label>
        <label className="block">
          <span className="label">Sebab</span>
          <select className="input mt-1" value={sebab} onChange={(e) => ubah(setSebab)(e.target.value as KodSebab | "semua")}>
            <option value="semua">Semua</option>
            {sebabAda.map((s) => (
              <option key={s} value={s}>
                {LABEL_SEBAB[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Tahap</span>
          <select className="input mt-1" value={tahap} onChange={(e) => ubah(setTahap)(e.target.value)}>
            <option value="semua">Semua</option>
            {tahapAda.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Cari murid / tajuk</span>
          <input className="input mt-1" value={cari} onChange={(e) => ubah(setCari)(e.target.value)} />
        </label>
      </div>

      <p className="mt-4 text-sm text-graphite">{tapis.length.toLocaleString("ms-MY")} rekod dipaparkan</p>
      <ul className="mt-3 divide-y divide-cloud">
        {tapis.slice(0, had).map((k) => {
          const r = rekodIkutId.get(k.id);
          if (!r) return null;
          const st = status.get(k.id);
          const siap = st?.berjaya === true;
          const bolehPilih = !siap && (k.warna !== "kuning" || dilihat.has(k.id));
          const w = WARNA_STATUS[k.warna];
          return (
            <li key={k.id} className="py-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={dipilih.has(k.id)}
                  disabled={!bolehPilih}
                  onChange={() => onTogolPilih(k.id)}
                  aria-label={`Pilih ${r.tajuk}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: w.warna }}>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: w.warna }} aria-hidden />
                      {w.label}
                    </span>
                    {st ? (
                      <span className="status-badge">
                        {st.berjaya
                          ? st.tindakan === "approved"
                            ? "Diluluskan"
                            : "Ditolak"
                          : `Gagal: ${st.jawapan ?? "ralat"}`}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-semibold text-ink">{r.tajuk}</p>
                  <p className="text-xs text-graphite">
                    {r.murid} · {r.kelas} · {LABEL_BAHASA[k.bahasa]} · {k.panjang}{" "}
                    {k.bahasa === "zh" ? "aksara" : "perkataan"}
                  </p>
                  {k.merah.length + k.kuning.length + k.maklumat.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {k.merah.map((s) => (
                        <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${WARNA_STATUS.merah.warna}14`, color: WARNA_STATUS.merah.warna }}>
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.kuning.map((s) => (
                        <span key={s} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${WARNA_STATUS.kuning.warna}14`, color: WARNA_STATUS.kuning.warna }}>
                          {LABEL_SEBAB[s]}
                        </span>
                      ))}
                      {k.maklumat.map((m) => (
                        <span key={m} className="rounded bg-cloud px-2 py-0.5 text-xs text-graphite">
                          {LABEL_MAKLUMAT[m]}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-sm text-graphite">
                    <b>Rumusan:</b> {r.rumusan}
                  </p>
                  <p className="line-clamp-2 text-sm text-graphite">
                    <b>Pengajaran:</b> {r.pengajaran}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <a
                      className="text-ink underline"
                      href={pautanAins(k.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onTandaDilihat(k.id)}
                    >
                      Buka dalam AINS
                    </a>
                    {k.warna === "kuning" && !dilihat.has(k.id) ? (
                      <button type="button" className="text-graphite underline" onClick={() => onTandaDilihat(k.id)}>
                        Tanda sudah dilihat
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {tapis.length > had ? (
        <button type="button" className="btn-outline-ink mt-4" onClick={() => setHad((h) => h + LANGKAH)}>
          Tunjuk {Math.min(LANGKAH, tapis.length - had)} lagi
        </button>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Create `components/tools/semak-ains/PanelTindakan.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import type { Keputusan, KodSebab, RekodAins } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB, janaKomen } from "@/lib/tools/semak-ains/komen";
import type { Standard } from "@/lib/tools/semak-ains/standard";
import { pautanAins } from "./SenaraiRekod";
import type { HasilLaksana, KiraLaksana, StatusTindakan, Tindakan } from "./useSambunganAins";

type Item = { id: string; komen: string };
type Dialog =
  | { jenis: "lulus"; senarai: Keputusan[]; contoh: Keputusan[] }
  | { jenis: "tolak"; senarai: Keputusan[] }
  | null;

type Props = {
  keputusan: Keputusan[];
  rekodIkutId: Map<string, RekodAins>;
  status: Map<string, StatusTindakan>;
  dipilih: Set<string>;
  standard: Standard;
  melaksana: boolean;
  kira: KiraLaksana;
  hasil: HasilLaksana | null;
  dilarang: boolean;
  onLaksana: (tindakan: Tindakan, item: Item[]) => void;
  onHenti: () => void;
  onCsv: () => void;
  onBacaSemula: () => void;
};

function rawak<T>(arr: T[], n: number): T[] {
  const salin = [...arr];
  for (let i = salin.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = salin[i] as T;
    salin[i] = salin[j] as T;
    salin[j] = t;
  }
  return salin.slice(0, n);
}

function belumSiap(status: Map<string, StatusTindakan>, k: Keputusan): boolean {
  return status.get(k.id)?.berjaya !== true;
}

export default function PanelTindakan(p: Props) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [ganti, setGanti] = useState<Partial<Record<KodSebab, string>>>({});
  const { keputusan, status, dipilih } = p;

  const hijau = useMemo(
    () => keputusan.filter((k) => k.warna === "hijau" && belumSiap(status, k)),
    [keputusan, status],
  );
  const merah = useMemo(
    () => keputusan.filter((k) => k.warna === "merah" && belumSiap(status, k)),
    [keputusan, status],
  );
  const pilihLulus = useMemo(
    () => keputusan.filter((k) => dipilih.has(k.id) && k.warna !== "merah" && belumSiap(status, k)),
    [keputusan, dipilih, status],
  );
  const pilihTolak = useMemo(
    () => keputusan.filter((k) => dipilih.has(k.id) && k.warna !== "hijau" && belumSiap(status, k)),
    [keputusan, dipilih, status],
  );

  const bukaLulus = (senarai: Keputusan[]) => setDialog({ jenis: "lulus", senarai, contoh: rawak(senarai, 5) });
  const bukaTolak = (senarai: Keputusan[]) => {
    setGanti({});
    setDialog({ jenis: "tolak", senarai });
  };
  const sebabTolak = (senarai: Keputusan[]) => [
    ...new Set(senarai.flatMap((k) => (k.merah.length ? k.merah : k.kuning))),
  ];

  const sahkan = () => {
    if (!dialog) return;
    if (dialog.jenis === "lulus") {
      p.onLaksana("approved", dialog.senarai.map((k) => ({ id: k.id, komen: "" })));
    } else {
      p.onLaksana(
        "rejected",
        dialog.senarai.map((k) => ({ id: k.id, komen: janaKomen(k.merah, k.kuning, p.standard, ganti) })),
      );
    }
    setDialog(null);
  };

  if (p.melaksana) {
    const pct = p.kira.jumlah ? Math.round((p.kira.diproses / p.kira.jumlah) * 100) : 0;
    return (
      <section className="card p-6">
        <p className="font-semibold text-ink">Sedang dilaksanakan dalam tab AINS…</p>
        <p className="mt-1 text-sm text-graphite">
          Diproses {p.kira.diproses} / {p.kira.jumlah} · berjaya {p.kira.berjaya} · gagal {p.kira.gagal}
        </p>
        <div className="mt-3 h-2 rounded bg-cloud">
          <div className="h-2 rounded bg-ink" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs text-graphite">
          Jangan tutup tab AINS atau tab ini. Jika tetingkap pengesahan muncul dalam tab AINS, jawab di sana.
        </p>
        <button type="button" className="btn-outline-ink mt-4" onClick={p.onHenti}>
          Henti
        </button>
      </section>
    );
  }

  return (
    <section className="card p-4 sm:p-6">
      {p.hasil ? (
        <div className="mb-4 rounded border border-cloud p-3 text-sm">
          <p className="font-semibold text-ink">
            {p.hasil.tindakan === "approved" ? "Kelulusan" : "Penolakan"} selesai: {p.hasil.berjaya} berjaya,{" "}
            {p.hasil.gagal} gagal{p.hasil.dihentikan ? " (dihentikan)" : ""}.
          </p>
          {p.hasil.ralat ? <p className="mt-1 text-graphite">{p.hasil.ralat}</p> : null}
          {p.hasil.masihMenunggu.length ? (
            <p className="mt-1 text-graphite">
              {p.hasil.masihMenunggu.length} rekod masih &quot;Menunggu Pengesahan&quot; dalam AINS — semak secara manual.
            </p>
          ) : null}
        </div>
      ) : null}

      {p.dilarang ? (
        <p className="text-sm text-graphite">Tindakan dimatikan sehingga penanda dipasang semula.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={hijau.length === 0} onClick={() => bukaLulus(hijau)}>
            Luluskan semua hijau ({hijau.length})
          </button>
          <button type="button" className="btn-ink" disabled={merah.length === 0} onClick={() => bukaTolak(merah)}>
            Tolak semua merah ({merah.length})
          </button>
          <button type="button" className="btn-outline-ink" disabled={pilihLulus.length === 0} onClick={() => bukaLulus(pilihLulus)}>
            Luluskan terpilih ({pilihLulus.length})
          </button>
          <button type="button" className="btn-outline-ink" disabled={pilihTolak.length === 0} onClick={() => bukaTolak(pilihTolak)}>
            Tolak terpilih ({pilihTolak.length})
          </button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-outline-ink" onClick={p.onCsv}>
          Muat turun CSV
        </button>
        <button type="button" className="btn-outline-ink" onClick={p.onBacaSemula}>
          Baca semula
        </button>
      </div>

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-white p-6">
            {dialog.jenis === "lulus" ? (
              <>
                <h2 className="text-lg font-semibold text-ink">Luluskan {dialog.senarai.length} rekod?</h2>
                <p className="mt-1 text-sm text-graphite">
                  Semak rawak 5 rekod di bawah sebelum meneruskan. Kelulusan dibuat atas nama akaun AINS anda.
                </p>
                <ul className="mt-4 space-y-3">
                  {dialog.contoh.map((k) => {
                    const r = p.rekodIkutId.get(k.id);
                    return r ? (
                      <li key={k.id} className="rounded border border-cloud p-3 text-sm">
                        <p className="font-semibold text-ink">{r.tajuk}</p>
                        <p className="text-xs text-graphite">
                          {r.murid} · {r.kelas}
                        </p>
                        <p className="mt-1 line-clamp-3 text-graphite">{r.rumusan}</p>
                        <a className="mt-1 inline-block text-ink underline" href={pautanAins(k.id)} target="_blank" rel="noopener noreferrer">
                          Buka dalam AINS
                        </a>
                      </li>
                    ) : null;
                  })}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-ink">Tolak {dialog.senarai.length} rekod?</h2>
                <p className="mt-1 text-sm text-graphite">
                  Komen berikut dihantar kepada murid mengikut sebab. Anda boleh menyuntingnya.
                </p>
                <div className="mt-4 space-y-4">
                  {sebabTolak(dialog.senarai).map((kod) => (
                    <label key={kod} className="block">
                      <span className="label">{LABEL_SEBAB[kod]}</span>
                      <textarea
                        className="textarea mt-1"
                        rows={2}
                        value={ganti[kod] ?? p.standard.komen[kod] ?? KOMEN_LALAI[kod]}
                        onChange={(e) => setGanti((g) => ({ ...g, [kod]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-outline-ink" onClick={() => setDialog(null)}>
                Batal
              </button>
              <button type="button" className="btn-ink" onClick={sahkan}>
                {dialog.jenis === "lulus" ? "Teruskan lulus" : "Teruskan tolak"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 5: Create `components/tools/semak-ains/LaciTetapan.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Jalur, KodSebab, Ukuran } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI, LABEL_SEBAB } from "@/lib/tools/semak-ains/komen";
import type { Ambang, ModPeraturan, Standard } from "@/lib/tools/semak-ains/standard";

const JALUR: { kod: Jalur; label: string }[] = [
  { kod: "D1-2", label: "Tahun 1–2" },
  { kod: "D3-4", label: "Tahun 3–4" },
  { kod: "D5-6", label: "Tahun 5–6" },
  { kod: "M", label: "Menengah / Peralihan" },
];
const UKURAN: { kod: Ukuran; label: string }[] = [
  { kod: "kata", label: "BM / BI / Tamil (perkataan)" },
  { kod: "zh", label: "Cina (aksara)" },
];
const MEDAN: { kod: keyof Ambang; label: string }[] = [
  { kod: "merah", label: "Merah di bawah" },
  { kod: "kuning", label: "Kuning di bawah" },
  { kod: "panjang", label: "Kuning melebihi" },
];
const KOMEN_MERAH: KodSebab[] = [
  "ruangan-kosong",
  "terlalu-pendek",
  "templat",
  "rumusan-sama-pengajaran",
  "hantar-semula-sama",
  "teks-rawak",
  "bahasa-tak-sepadan",
];
const MOD_LABEL: Record<ModPeraturan, string> = {
  merah: "Cadang tolak (merah)",
  kuning: "Perlu semak (kuning)",
  abai: "Benarkan",
};

type Props = {
  standard: Standard;
  diubah: boolean;
  onSimpan: (s: Standard) => void;
  onReset: () => void;
  onTutup: () => void;
};

export default function LaciTetapan({ standard, diubah, onSimpan, onReset, onTutup }: Props) {
  const [s, setS] = useState<Standard>(() => structuredClone(standard));
  const setAmbang = (u: Ukuran, j: Jalur, m: keyof Ambang, v: number) =>
    setS((x) => {
      const y = structuredClone(x);
      y.ambang[u][j][m] = v;
      return y;
    });
  const pilihMod = (nilai: ModPeraturan, ubah: (m: ModPeraturan) => void) => (
    <select className="input mt-1" value={nilai} onChange={(e) => ubah(e.target.value as ModPeraturan)}>
      {(Object.keys(MOD_LABEL) as ModPeraturan[]).map((m) => (
        <option key={m} value={m}>
          {MOD_LABEL[m]}
        </option>
      ))}
    </select>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">Tetapan semakan</h2>
        <p className="mt-1 text-sm text-graphite">
          Disimpan dalam pelayar ini sahaja. Perbezaan daripada standard daerah dilaporkan kepada USTP
          (nilai tetapan sahaja, tiada data murid).
        </p>

        {UKURAN.map((u) => (
          <fieldset key={u.kod} className="mt-6">
            <legend className="font-semibold text-ink">{u.label}</legend>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-graphite">
                    <th className="py-1 pr-2">Tahap</th>
                    {MEDAN.map((m) => (
                      <th key={m.kod} className="py-1 pr-2">
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {JALUR.map((j) => (
                    <tr key={j.kod}>
                      <td className="py-1 pr-2">{j.label}</td>
                      {MEDAN.map((m) => (
                        <td key={m.kod} className="py-1 pr-2">
                          <input
                            type="number"
                            min={0}
                            className="input w-24"
                            value={s.ambang[u.kod][j.kod][m.kod]}
                            onChange={(e) => setAmbang(u.kod, j.kod, m.kod, Number(e.target.value))}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
        ))}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Hantar semula teks sama (buku sama)</span>
            {pilihMod(s.hantarSemulaSama, (m) => setS({ ...s, hantarSemulaSama: m }))}
          </label>
          <label className="block">
            <span className="label">Buku sama direkod semula (teks berbeza)</span>
            {pilihMod(s.bukuSamaBerulang, (m) => setS({ ...s, bukuSamaBerulang: m }))}
          </label>
          <label className="block">
            <span className="label">Teks sama rakan sekelas (buku & hari sama)</span>
            <select
              className="input mt-1"
              value={s.aktivitiKelas}
              onChange={(e) => setS({ ...s, aktivitiKelas: e.target.value as "benar" | "kuning" })}
            >
              <option value="benar">Benarkan (aktiviti kelas)</option>
              <option value="kuning">Perlu semak (kuning)</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Ambang murid luar biasa (bilangan rekod)</span>
            <input type="number" min={1} className="input mt-1" value={s.ambangMuridLuarBiasa} onChange={(e) => setS({ ...s, ambangMuridLuarBiasa: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="label">Jeda antara tindakan (ms, 300–2000)</span>
            <input type="number" min={300} max={2000} className="input mt-1" value={s.jedaMs} onChange={(e) => setS({ ...s, jedaMs: Number(e.target.value) })} />
          </label>
          <label className="block">
            <span className="label">Minimum setiap ruangan — perkataan</span>
            <input type="number" min={0} className="input mt-1" value={s.minRuangan.kata} onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, kata: Number(e.target.value) } })} />
          </label>
          <label className="block">
            <span className="label">Minimum setiap ruangan — aksara Cina</span>
            <input type="number" min={0} className="input mt-1" value={s.minRuangan.zh} onChange={(e) => setS({ ...s, minRuangan: { ...s.minRuangan, zh: Number(e.target.value) } })} />
          </label>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.bahasaTakSepadan} onChange={(e) => setS({ ...s, bahasaTakSepadan: e.target.checked })} />
            Cadang tolak jika tajuk Cina/Tamil tetapi rumusan dalam bahasa lain
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.semakUnsurPengajaran} onChange={(e) => setS({ ...s, semakUnsurPengajaran: e.target.checked })} />
            Tanda kuning jika Pengajaran tiada unsur pengajaran
          </label>
        </div>

        <fieldset className="mt-6">
          <legend className="font-semibold text-ink">Komen penolakan kepada murid</legend>
          {KOMEN_MERAH.map((k) => (
            <label key={k} className="mt-3 block">
              <span className="label">{LABEL_SEBAB[k]}</span>
              <textarea
                className="textarea mt-1"
                rows={2}
                value={s.komen[k] ?? KOMEN_LALAI[k]}
                onChange={(e) => setS({ ...s, komen: { ...s.komen, [k]: e.target.value } })}
              />
            </label>
          ))}
        </fieldset>

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <button type="button" className="btn-outline-ink" disabled={!diubah} onClick={onReset}>
            Kembali ke standard daerah
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-outline-ink" onClick={onTutup}>
              Batal
            </button>
            <button type="button" className="btn-ink" onClick={() => onSimpan(s)}>
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create `components/tools/semak-ains/SemakAinsApp.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { janaCsv } from "@/lib/tools/semak-ains/csv";
import type { KodSebab } from "@/lib/tools/semak-ains/jenis";
import { KOMEN_LALAI } from "@/lib/tools/semak-ains/komen";
import { hantarLog } from "@/lib/tools/semak-ains/log-klien";
import { normalTeks } from "@/lib/tools/semak-ains/normal";
import { ringkaskan, semak } from "@/lib/tools/semak-ains/peraturan";
import { gabungStandard, tetapanBeza, type Standard, type TetapanGpm } from "@/lib/tools/semak-ains/standard";
import { bacaTetapan, padamTetapan, simpanTetapan } from "@/lib/tools/semak-ains/storan";
import { VERSI_ENJIN, VERSI_PENANDA_MIN } from "@/lib/tools/semak-ains/versi";
import LaciTetapan from "./LaciTetapan";
import PanelTapisan from "./PanelTapisan";
import PanelTindakan from "./PanelTindakan";
import RingkasanWarna from "./RingkasanWarna";
import SenaraiRekod from "./SenaraiRekod";
import { useSambunganAins } from "./useSambunganAins";

export default function SemakAinsApp() {
  const s = useSambunganAins();
  const kunci = s.sekolah ? (s.sekolah.kod ?? normalTeks(s.sekolah.nama)) : "umum";
  const [tetapan, setTetapan] = useState<TetapanGpm | null>(null);
  const [bukaTetapan, setBukaTetapan] = useState(false);
  const [dipilih, setDipilih] = useState<Set<string>>(() => new Set());
  const [dilihat, setDilihat] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTetapan(bacaTetapan(kunci));
  }, [kunci]);
  useEffect(() => {
    setDipilih(new Set());
    setDilihat(new Set());
  }, [s.bacaanKe]);

  const standard = useMemo(() => gabungStandard(tetapan), [tetapan]);
  const diubah = useMemo(() => Object.keys(tetapanBeza(standard)).length > 0, [standard]);
  const adaKeputusan = s.fasa === "keputusan" || s.fasa === "melaksana";
  const keputusan = useMemo(() => (adaKeputusan ? semak(s.rekod, standard) : []), [adaKeputusan, s.rekod, standard]);
  const ringkasan = useMemo(() => ringkaskan(keputusan), [keputusan]);
  const rekodIkutId = useMemo(() => new Map(s.rekod.map((r) => [r.id, r])), [s.rekod]);
  const penandaLama = !!s.sekolah && s.sekolah.versiPenanda < VERSI_PENANDA_MIN;
  const muridLuarBiasa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of s.rekod) m.set(r.murid, (m.get(r.murid) ?? 0) + 1);
    return [...m].filter(([, n]) => n > standard.ambangMuridLuarBiasa).sort((a, b) => b[1] - a[1]);
  }, [s.rekod, standard.ambangMuridLuarBiasa]);

  const dilogBacaan = useRef(0);
  useEffect(() => {
    if (!s.sekolah || s.bacaanKe === 0 || dilogBacaan.current === s.bacaanKe || keputusan.length === 0) return;
    dilogBacaan.current = s.bacaanKe;
    hantarLog(
      {
        namaSekolah: s.sekolah.nama,
        kodSekolah: s.sekolah.kod,
        jenis: "semak",
        bilRekod: ringkasan.jumlah,
        bilHijau: ringkasan.hijau,
        bilKuning: ringkasan.kuning,
        bilMerah: ringkasan.merah,
        versiPenanda: s.sekolah.versiPenanda,
      },
      standard,
    );
  }, [s.bacaanKe, s.sekolah, keputusan.length, ringkasan, standard]);

  const dilogLaksana = useRef<object | null>(null);
  useEffect(() => {
    const h = s.hasilLaksana;
    if (!h || !s.sekolah || dilogLaksana.current === h || h.berjaya + h.gagal === 0) return;
    dilogLaksana.current = h;
    hantarLog(
      {
        namaSekolah: s.sekolah.nama,
        kodSekolah: s.sekolah.kod,
        jenis: h.tindakan === "approved" ? "lulus" : "tolak",
        bilRekod: h.berjaya + h.gagal,
        bilBerjaya: h.berjaya,
        bilGagal: h.gagal,
        versiPenanda: s.sekolah.versiPenanda,
      },
      standard,
    );
  }, [s.hasilLaksana, s.sekolah, standard]);

  const simpan = (baru: Standard) => {
    const komen = Object.fromEntries(
      Object.entries(baru.komen).filter(([k, v]) => v && v.trim() !== KOMEN_LALAI[k as KodSebab]),
    );
    const t = tetapanBeza(gabungStandard(tetapanBeza({ ...baru, komen })));
    simpanTetapan(kunci, t);
    setTetapan(t);
    setBukaTetapan(false);
  };
  const reset = () => {
    padamTetapan(kunci);
    setTetapan(null);
    setBukaTetapan(false);
  };

  const muatCsv = () => {
    const baris = keputusan.flatMap((k) => {
      const r = rekodIkutId.get(k.id);
      if (!r) return [];
      const st = s.status.get(k.id);
      return [
        {
          rekod: r,
          keputusan: k,
          tindakan: st ? (st.tindakan === "approved" ? "lulus" : "tolak") : "",
          hasil: st ? (st.berjaya ? "berjaya" : `gagal: ${st.jawapan ?? ""}`) : "",
          masa: st?.masa ?? "",
        },
      ];
    });
    const csv = janaCsv(baris, `${VERSI_ENJIN}${diubah ? " (tetapan diubah)" : ""}`);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `semak-ains-${s.sekolah?.kod ?? "sekolah"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const togol = (set: (f: (x: Set<string>) => Set<string>) => void) => (id: string) =>
    set((x) => {
      const y = new Set(x);
      if (y.has(id)) y.delete(id);
      else y.add(id);
      return y;
    });
  const tanda = (id: string) => setDilihat((x) => new Set(x).add(id));

  if (s.fasa === "semak-sambungan") return <p className="mt-8 text-sm text-graphite">Memuatkan…</p>;

  if (s.fasa === "tiada-penanda") {
    return (
      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-ink">Buka halaman ini melalui penanda AINS</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-graphite">
          <li>Pasang penanda &quot;Semak AINS&quot; pada bar penanda pelayar (sekali sahaja).</li>
          <li>Log masuk AINS sebagai guru dan buka Papan Pemuka.</li>
          <li>Klik penanda &quot;Semak AINS&quot; — halaman ini akan dibuka secara automatik.</li>
        </ol>
        <Link href="/tools/semak-ains/pasang" className="btn-primary mt-6 inline-flex">
          Cara pasang penanda
        </Link>
      </section>
    );
  }

  if (s.fasa === "menunggu") {
    return (
      <section className="card mt-8 p-6 text-sm text-graphite">
        Menyambung ke tab AINS… Jika tiada respons, klik penanda &quot;Semak AINS&quot; sekali lagi dalam tab AINS.
      </section>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="label">Sekolah</p>
          <p className="font-semibold text-ink">{s.sekolah?.nama}</p>
          {s.sekolah?.kod ? <p className="text-xs text-graphite">{s.sekolah.kod}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {diubah ? <span className="status-badge">Tetapan diubah</span> : null}
          <button type="button" className="btn-outline-ink" onClick={() => setBukaTetapan(true)}>
            Tetapan
          </button>
        </div>
      </div>

      {penandaLama ? (
        <div className="card p-4 text-sm text-ink">
          Penanda anda versi lama.{" "}
          <Link href="/tools/semak-ains/pasang" className="underline">
            Pasang semula
          </Link>{" "}
          sebelum meluluskan atau menolak rekod.
        </div>
      ) : null}

      {s.fasa === "sedia" ? <PanelTapisan onMula={s.mula} /> : null}

      {s.fasa === "membaca" ? (
        <section className="card p-6">
          <p className="font-semibold text-ink">Membaca rekod daripada AINS…</p>
          <p className="mt-1 text-sm text-graphite">
            Halaman {s.bacaan.halaman} / {s.bacaan.jumlahHalaman || "?"} · {s.rekod.length.toLocaleString("ms-MY")} rekod
          </p>
          <div className="mt-3 h-2 rounded bg-cloud">
            <div
              className="h-2 rounded bg-ink"
              style={{ width: `${s.bacaan.jumlahHalaman ? Math.round((s.bacaan.halaman / s.bacaan.jumlahHalaman) * 100) : 0}%` }}
            />
          </div>
          <button type="button" className="btn-outline-ink mt-4" onClick={s.henti}>
            Henti
          </button>
        </section>
      ) : null}

      {adaKeputusan ? (
        <>
          {s.ralat ? <div className="card p-4 text-sm text-ink">{s.ralat}</div> : null}
          {s.halamanGagal.length ? (
            <div className="card p-4 text-sm text-ink">
              Halaman tidak dapat dibaca: {s.halamanGagal.join(", ")}. Rekod pada halaman ini tidak disemak.
            </div>
          ) : null}
          <RingkasanWarna ringkasan={ringkasan} />
          {muridLuarBiasa.length ? (
            <section className="card p-4 text-sm">
              <p className="font-semibold text-ink">
                Murid dengan rekod luar biasa banyak (lebih {standard.ambangMuridLuarBiasa} rekod)
              </p>
              <p className="mt-1 text-graphite">{muridLuarBiasa.map(([m, n]) => `${m} (${n})`).join(" · ")}</p>
              <p className="mt-1 text-xs text-graphite">
                Cadangan: semak rawak rekod murid ini sebelum meluluskan secara pukal.
              </p>
            </section>
          ) : null}
          <PanelTindakan
            keputusan={keputusan}
            rekodIkutId={rekodIkutId}
            status={s.status}
            dipilih={dipilih}
            standard={standard}
            melaksana={s.fasa === "melaksana"}
            kira={s.kira}
            hasil={s.hasilLaksana}
            dilarang={penandaLama}
            onLaksana={(tindakan, item) => s.laksana(tindakan, item, standard.jedaMs)}
            onHenti={s.henti}
            onCsv={muatCsv}
            onBacaSemula={s.bacaSemula}
          />
          <SenaraiRekod
            rekodIkutId={rekodIkutId}
            keputusan={keputusan}
            status={s.status}
            dipilih={dipilih}
            onTogolPilih={togol(setDipilih)}
            dilihat={dilihat}
            onTandaDilihat={tanda}
          />
        </>
      ) : null}

      {bukaTetapan ? (
        <LaciTetapan standard={standard} diubah={diubah} onSimpan={simpan} onReset={reset} onTutup={() => setBukaTetapan(false)} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 7: Create `app/(public)/tools/semak-ains/page.tsx`**

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import SemakAinsApp from "@/components/tools/semak-ains/SemakAinsApp";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Semak Rekod AINS — NEXa Manjung",
  description:
    "Alat GPM untuk menyemak rekod bacaan AINS murid secara automatik dan mengesahkannya secara pukal. Data murid tidak disimpan oleh NEXa.",
};

export default function SemakAinsPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title="Semak Rekod AINS"
        accent={getModuleAccent("/tools")}
        description="Semak rekod bacaan murid yang menunggu pengesahan: lulus, perlu semak atau cadang tolak. Semakan berlaku dalam pelayar anda — data murid tidak dihantar ke NEXa."
      />
      <SemakAinsApp />
    </PublicPageShell>
  );
}
```
(`getModuleAccent("/tools")` returns the default blue until Task 13 adds `TOOLS_HUB`; that is expected.)

- [ ] **Step 8: Typecheck and lint the new files**

Run: `npm run typecheck`
Expected: no errors in `components/tools/**` or `app/(public)/tools/**`.
Run: `npx eslint components/tools "app/(public)/tools"`
Expected: no errors or warnings.

- [ ] **Step 9: Smoke the "no bookmarklet" state**

Start the dev server (create `.claude/launch.json` if missing with `{"version":"0.0.1","configurations":[{"name":"dev","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":3000}]}`), open `http://localhost:3000/tools/semak-ains` via `preview_start {name: "dev"}` and check with `read_page`:
Expected: heading "Semak Rekod AINS" and the card "Buka halaman ini melalui penanda AINS" with button "Cara pasang penanda". No console errors (`read_console_messages`).

- [ ] **Step 10: Commit**

```bash
git add components/tools/semak-ains/PanelTapisan.tsx components/tools/semak-ains/RingkasanWarna.tsx components/tools/semak-ains/SenaraiRekod.tsx components/tools/semak-ains/PanelTindakan.tsx components/tools/semak-ains/LaciTetapan.tsx components/tools/semak-ains/SemakAinsApp.tsx "app/(public)/tools/semak-ains/page.tsx"
git commit -m "feat(semak-ains): halaman semakan — ringkasan, senarai, tindakan pukal, tetapan, CSV"
```

---

### Task 10: Install page `/tools/semak-ains/pasang`

**Files:**
- Create: `components/tools/semak-ains/PasangPenanda.tsx`, `app/(public)/tools/semak-ains/pasang/page.tsx`

**Interfaces:**
- Consumes: static file `/tools/semak-ains/penanda.js` (Task 7).
- Produces: a draggable `javascript:` link built at runtime (React 19 blocks `javascript:` hrefs passed as props, so the href is set with `setAttribute` on a ref).

- [ ] **Step 1: Create `components/tools/semak-ains/PasangPenanda.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

export default function PasangPenanda() {
  const pautan = useRef<HTMLAnchorElement>(null);
  const [kod, setKod] = useState<string | null>(null);
  const [versi, setVersi] = useState("");
  const [ralat, setRalat] = useState(false);
  const [disalin, setDisalin] = useState(false);

  useEffect(() => {
    let batal = false;
    fetch("/tools/semak-ains/penanda.js", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      })
      .then((sumber) => {
        if (batal) return;
        const js = sumber.replace(/__NEXA_ORIGIN__/g, window.location.origin);
        const url = `javascript:${encodeURIComponent(js)}`;
        pautan.current?.setAttribute("href", url);
        setKod(url);
        setVersi(sumber.match(/VERSI_PENANDA\s*=\s*(\d+)/)?.[1] ?? "");
      })
      .catch(() => {
        if (!batal) setRalat(true);
      });
    return () => {
      batal = true;
    };
  }, []);

  const salin = async () => {
    if (!kod) return;
    try {
      await navigator.clipboard.writeText(kod);
      setDisalin(true);
    } catch {
      setDisalin(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">1. Seret butang ini ke bar penanda</h2>
        <p className="mt-1 text-sm text-graphite">
          Tunjukkan bar penanda dengan <b>Ctrl+Shift+B</b> (Chrome/Edge), kemudian seret butang di bawah ke
          bar itu. Jangan klik butang di halaman ini.
        </p>
        {ralat ? (
          <p className="mt-4 text-sm text-ink">Penanda tidak dapat dimuatkan. Sila muat semula halaman.</p>
        ) : (
          <a
            ref={pautan}
            draggable
            onClick={(e) => e.preventDefault()}
            className="btn-primary mt-4 inline-flex cursor-grab"
            aria-disabled={!kod}
          >
            Semak AINS
          </a>
        )}
        {versi ? <p className="mt-2 text-xs text-graphite">Versi penanda: {versi}</p> : null}
        <details className="mt-4 text-sm text-graphite">
          <summary className="cursor-pointer">Tidak boleh seret? Tambah secara manual</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Klik kanan bar penanda → Tambah halaman / Add page.</li>
            <li>Nama: Semak AINS. URL: tampal kod yang disalin.</li>
          </ol>
          <button type="button" className="btn-outline-ink mt-3" disabled={!kod} onClick={salin}>
            {disalin ? "Disalin" : "Salin kod penanda"}
          </button>
        </details>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink">2. Gunakan di AINS</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-graphite">
          <li>Log masuk ains.moe.gov.my sebagai guru dan buka Papan Pemuka.</li>
          <li>Klik penanda &quot;Semak AINS&quot;. Benarkan pop-up jika diminta.</li>
          <li>Tab Semak Rekod AINS dibuka — pilih tahap/kelas dan tekan Mula baca.</li>
        </ol>
        <p className="mt-3 text-xs text-graphite">
          Berfungsi pada Chrome/Edge komputer. Tidak disokong pada telefon. Kelulusan dan penolakan dibuat
          atas nama akaun AINS anda; tanggungjawab pengesahan kekal pada GPM.
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/(public)/tools/semak-ains/pasang/page.tsx`**

```tsx
import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import PasangPenanda from "@/components/tools/semak-ains/PasangPenanda";
import { getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "Pasang penanda Semak AINS — NEXa Manjung",
  description: "Panduan memasang penanda Semak AINS pada pelayar Chrome/Edge.",
};

export default function PasangPenandaPage() {
  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title="Pasang penanda Semak AINS"
        accent={getModuleAccent("/tools")}
        description="Sekali sahaja bagi setiap pelayar. Selepas dipasang, klik penanda semasa berada di Papan Pemuka guru AINS."
      />
      <PasangPenanda />
    </PublicPageShell>
  );
}
```

- [ ] **Step 3: Smoke**

With the dev server running, open `http://localhost:3000/tools/semak-ains/pasang`.
Run `javascript_tool`: `document.querySelector('a[draggable]')?.getAttribute('href')?.slice(0, 40)`
Expected: starts with `javascript:%2F*%20eslint-disable` and contains no `__NEXA_ORIGIN__` (check `decodeURIComponent(href).includes('http://localhost:3000')` → `true`).

- [ ] **Step 4: Commit**

```bash
git add components/tools/semak-ains/PasangPenanda.tsx "app/(public)/tools/semak-ains/pasang/page.tsx"
git commit -m "feat(semak-ains): halaman pasang penanda"
```

---

### Task 11: Monitoring table, migration and log API

**Files:**
- Modify: `lib/schema.ts` (append)
- Create: `drizzle/0063_semak_ains_log.sql` (generated, then edited) + `drizzle/meta/*` (generated)
- Create: `app/api/semak-ains/log/route.ts`

**Interfaces:**
- Consumes: `schools` table, `listSchoolOptions()` (`lib/direktori/queries.ts`, returns `{ code, name, zone }[]`, cached), `normalTeks`.
- Produces: table `semakAinsLog` (columns per spec §4.5); `POST /api/semak-ains/log` accepting the body built by `hantarLog` → `{ ok: true }` (200), 400 invalid, 413 > 4 KB, 429 > 200 rows/school/24 h.

- [ ] **Step 1: Append to `lib/schema.ts`**

```ts
/* ============================== CoE Tools: Semak Rekod AINS ============================== */

/** Log penggunaan alat Semak Rekod AINS — bilangan sahaja, tiada data murid. */
export const semakAinsLog = pgTable(
  "semak_ains_log",
  {
    id: serial("id").primaryKey(),
    diciptaPada: timestamp("dicipta_pada", { withTimezone: true }).defaultNow().notNull(),
    kodSekolah: text("kod_sekolah").references(() => schools.code, { onDelete: "set null" }),
    namaSekolah: text("nama_sekolah").notNull(),
    /** 'semak' | 'lulus' | 'tolak' */
    jenis: text("jenis").notNull(),
    bilRekod: integer("bil_rekod").notNull(),
    bilHijau: integer("bil_hijau"),
    bilKuning: integer("bil_kuning"),
    bilMerah: integer("bil_merah"),
    bilBerjaya: integer("bil_berjaya"),
    bilGagal: integer("bil_gagal"),
    tetapanDiubah: boolean("tetapan_diubah").notNull().default(false),
    /** Perbezaan tetapan GPM daripada standard daerah (dirata, kecil). */
    tetapan: jsonb("tetapan"),
    versiEnjin: text("versi_enjin").notNull(),
    versiPenanda: text("versi_penanda").notNull(),
  },
  (t) => ({
    kodMasaIdx: index("semak_ains_log_kod_masa_idx").on(t.kodSekolah, t.diciptaPada),
  }),
);
```

- [ ] **Step 2: Generate the migration**

Run: `npx drizzle-kit generate --name semak_ains_log`
Expected: creates `drizzle/0063_semak_ains_log.sql` + `drizzle/meta/0063_snapshot.json` and updates `_journal.json`. Open the SQL: it must contain ONLY `CREATE TABLE "semak_ains_log"`, its FK to `schools`, and the index. If it contains anything else (schema drift), stop and ask the user.

- [ ] **Step 3: Append RLS to `drizzle/0063_semak_ains_log.sql`**

```sql
--> statement-breakpoint
ALTER TABLE "public"."semak_ains_log" ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 4: Create `app/api/semak-ains/log/route.ts`**

```ts
import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { listSchoolOptions } from "@/lib/direktori/queries";
import { semakAinsLog } from "@/lib/schema";
import { normalTeks } from "@/lib/tools/semak-ains/normal";

/**
 * Log bilangan penggunaan Semak Rekod AINS (awam, tanpa log masuk).
 * Tiada data murid. Data ialah petunjuk sahaja (boleh dipalsukan).
 */
export const dynamic = "force-dynamic";

const nombor = z.number().int().min(0).max(100000);
const Skema = z.object({
  namaSekolah: z.string().trim().min(1).max(200),
  kodSekolah: z.string().trim().regex(/^[A-Z]{3}\d{4}$/).nullable(),
  jenis: z.enum(["semak", "lulus", "tolak"]),
  bilRekod: nombor,
  bilHijau: nombor.nullable(),
  bilKuning: nombor.nullable(),
  bilMerah: nombor.nullable(),
  bilBerjaya: nombor.nullable(),
  bilGagal: nombor.nullable(),
  tetapan: z.record(z.string().max(100), z.union([z.string().max(100), z.number(), z.boolean()])).nullable(),
  versiEnjin: z.string().max(20),
  versiPenanda: z.string().max(20),
});
const HAD_SEHARI = 200;

export async function POST(request: Request) {
  const mentah = await request.text();
  if (mentah.length > 4096) return NextResponse.json({ ok: false }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(mentah);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const p = Skema.safeParse(json);
  if (!p.success) return NextResponse.json({ ok: false }, { status: 400 });
  const d = p.data;

  const sekolah = await listSchoolOptions();
  const namaN = normalTeks(d.namaSekolah);
  const padan =
    (d.kodSekolah ? sekolah.find((s) => s.code === d.kodSekolah) : undefined) ??
    sekolah.find((s) => normalTeks(s.name) === namaN);
  const kod = padan?.code ?? null;

  const [kiraan] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(semakAinsLog)
    .where(
      and(
        kod ? eq(semakAinsLog.kodSekolah, kod) : eq(semakAinsLog.namaSekolah, d.namaSekolah),
        gte(semakAinsLog.diciptaPada, sql`now() - interval '1 day'`),
      ),
    );
  if ((kiraan?.n ?? 0) >= HAD_SEHARI) return NextResponse.json({ ok: false }, { status: 429 });

  await db.insert(semakAinsLog).values({
    kodSekolah: kod,
    namaSekolah: d.namaSekolah,
    jenis: d.jenis,
    bilRekod: d.bilRekod,
    bilHijau: d.bilHijau,
    bilKuning: d.bilKuning,
    bilMerah: d.bilMerah,
    bilBerjaya: d.bilBerjaya,
    bilGagal: d.bilGagal,
    tetapanDiubah: d.tetapan !== null && Object.keys(d.tetapan).length > 0,
    tetapan: d.tetapan,
    versiEnjin: d.versiEnjin,
    versiPenanda: d.versiPenanda,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no new errors.

- [ ] **Step 6: Apply the migration — ASK THE USER FIRST**

`.env.local` points at the shared Supabase database. Ask the user for explicit permission, then run:
`npm run db:migrate`
Expected: migration `0063_semak_ains_log` applied, no errors.

- [ ] **Step 7: Smoke the API (after migration, dev server running)**

```bash
curl -s -X POST http://localhost:3000/api/semak-ains/log -H "Content-Type: application/json" --data '{"namaSekolah":"UJIAN SEMAK AINS","kodSekolah":null,"jenis":"semak","bilRekod":3,"bilHijau":1,"bilKuning":1,"bilMerah":1,"bilBerjaya":null,"bilGagal":null,"tetapan":null,"versiEnjin":"1.0.0","versiPenanda":"1"}'
```
Expected: `{"ok":true}`. Then `curl … --data '{"jenis":"x"}'` → `{"ok":false}` (400).
Then delete the test row (ask the user first — it modifies shared data):
`DELETE FROM semak_ains_log WHERE nama_sekolah = 'UJIAN SEMAK AINS';` (Supabase SQL editor or a one-off `tsx` script using `db.delete(semakAinsLog).where(eq(semakAinsLog.namaSekolah, "UJIAN SEMAK AINS"))`).

- [ ] **Step 8: Commit**

```bash
git add lib/schema.ts drizzle/0063_semak_ains_log.sql drizzle/meta/0063_snapshot.json drizzle/meta/_journal.json app/api/semak-ains/log/route.ts
git commit -m "feat(semak-ains): jadual semak_ains_log (RLS) & API log bilangan"
```

---

### Task 12: Admin usage page

**Files:**
- Create: `lib/tools/semak-ains/queries.ts`, `app/(admin)/admin/semak-ains/page.tsx`
- Modify: `app/(admin)/admin/pelaporan/page.tsx` (add card to `CARDS`), `lib/admin/desktop-navigation.ts` (add path)

**Interfaces:**
- Consumes: `semakAinsLog`, `db`, `withDbTimeout(promise, ms?)`, `requireKandunganAccess()`.
- Produces: `ringkasanIkutSekolah(): Promise<RingkasanSekolahSemakAins[]>`.

- [ ] **Step 1: Create `lib/tools/semak-ains/queries.ts`**

```ts
import { desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { semakAinsLog } from "@/lib/schema";

export type RingkasanSekolahSemakAins = {
  kodSekolah: string | null;
  namaSekolah: string;
  terakhir: string;
  bilSemakan: number;
  bilDisemak: number;
  bilMerah: number;
  bilDiluluskan: number;
  bilDitolak: number;
  tetapanDiubah: boolean;
  tetapanTerkini: Record<string, string | number | boolean> | null;
};

/** Agregat per sekolah dalam SQL (tiada select penuh). */
export async function ringkasanIkutSekolah(): Promise<RingkasanSekolahSemakAins[]> {
  const L = semakAinsLog;
  return db
    .select({
      kodSekolah: L.kodSekolah,
      namaSekolah: sql<string>`max(${L.namaSekolah})`,
      terakhir: sql<string>`max(${L.diciptaPada})`,
      bilSemakan: sql<number>`(count(*) filter (where ${L.jenis} = 'semak'))::int`,
      bilDisemak: sql<number>`coalesce(sum(${L.bilRekod}) filter (where ${L.jenis} = 'semak'), 0)::int`,
      bilMerah: sql<number>`coalesce(sum(${L.bilMerah}) filter (where ${L.jenis} = 'semak'), 0)::int`,
      bilDiluluskan: sql<number>`coalesce(sum(${L.bilBerjaya}) filter (where ${L.jenis} = 'lulus'), 0)::int`,
      bilDitolak: sql<number>`coalesce(sum(${L.bilBerjaya}) filter (where ${L.jenis} = 'tolak'), 0)::int`,
      tetapanDiubah: sql<boolean>`bool_or(${L.tetapanDiubah})`,
      tetapanTerkini: sql<Record<string, string | number | boolean> | null>`(array_agg(${L.tetapan} order by ${L.diciptaPada} desc))[1]`,
    })
    .from(L)
    .groupBy(L.kodSekolah, sql`case when ${L.kodSekolah} is null then ${L.namaSekolah} else '' end`)
    .orderBy(desc(sql`max(${L.diciptaPada})`));
}
```

- [ ] **Step 2: Create `app/(admin)/admin/semak-ains/page.tsx`**

```tsx
import Link from "next/link";
import { withDbTimeout } from "@/lib/db";
import { requireKandunganAccess } from "@/lib/rbac";
import { ringkasanIkutSekolah, type RingkasanSekolahSemakAins } from "@/lib/tools/semak-ains/queries";

export const dynamic = "force-dynamic";

function tarikh(s: string): string {
  return new Date(s).toLocaleString("ms-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export default async function AdminSemakAinsPage() {
  await requireKandunganAccess();
  let baris: RingkasanSekolahSemakAins[];
  try {
    baris = await withDbTimeout(ringkasanIkutSekolah());
  } catch {
    return <p className="card p-6 text-sm text-graphite">Pangkalan data perlahan. Sila muat semula halaman ini.</p>;
  }

  return (
    <>
      <Link href="/admin/pelaporan" className="text-sm text-graphite hover:text-ink">
        ← CoE Reports
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Semak Rekod AINS</h1>
      <p className="mt-1 text-sm text-graphite">
        Penggunaan alat mengikut sekolah — bilangan sahaja, tiada data murid. Data dihantar dari halaman awam
        tanpa log masuk; anggap sebagai petunjuk, bukan statistik rasmi.
      </p>

      {baris.length === 0 ? (
        <p className="card mt-8 p-6 text-sm text-graphite">Belum ada penggunaan direkodkan.</p>
      ) : (
        <div className="card mt-8 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-graphite">
                <th className="p-3">Sekolah</th>
                <th className="p-3">Terakhir guna</th>
                <th className="p-3 text-right">Semakan</th>
                <th className="p-3 text-right">Rekod disemak</th>
                <th className="p-3 text-right">% merah</th>
                <th className="p-3 text-right">Diluluskan</th>
                <th className="p-3 text-right">Ditolak</th>
                <th className="p-3">Tetapan</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={`${b.kodSekolah ?? ""}|${b.namaSekolah}`} className="border-t border-cloud">
                  <td className="p-3">
                    <span className="font-semibold text-ink">{b.namaSekolah}</span>
                    {b.kodSekolah ? <span className="block text-xs text-graphite">{b.kodSekolah}</span> : null}
                  </td>
                  <td className="p-3">{tarikh(b.terakhir)}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilSemakan}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilDisemak.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-right tabular-nums">
                    {b.bilDisemak ? Math.round((b.bilMerah / b.bilDisemak) * 100) : 0}%
                  </td>
                  <td className="p-3 text-right tabular-nums">{b.bilDiluluskan.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-right tabular-nums">{b.bilDitolak.toLocaleString("ms-MY")}</td>
                  <td className="p-3 text-xs text-graphite">
                    {b.tetapanDiubah
                      ? b.tetapanTerkini
                        ? Object.entries(b.tetapanTerkini).map(([k, v]) => `${k}: ${String(v)}`).join("; ")
                        : "Diubah"
                      : "Standard daerah"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Add the admin card** — in `app/(admin)/admin/pelaporan/page.tsx`, append this object to the `CARDS: AdminCard[]` array (the kandungan-only list that already holds Kunjung Bantu):

```ts
  {
    href: "/admin/semak-ains",
    title: "Semak Rekod AINS",
    description: "Penggunaan alat semakan AINS oleh GPM mengikut sekolah (bilangan sahaja).",
  },
```

- [ ] **Step 4: Highlight "Papan Admin"** — in `lib/admin/desktop-navigation.ts`, add `"/admin/semak-ains",` to `ADMIN_PAPAN_NESTED_PATHS` after `"/admin/kunjung-bantu",`.

- [ ] **Step 5: Typecheck + smoke**

Run: `npm run typecheck` → no new errors.
Log in as an admin in the preview browser (the user signs in), open `http://localhost:3000/admin/semak-ains`.
Expected: heading "Semak Rekod AINS"; table or "Belum ada penggunaan direkodkan."; `/admin/pelaporan` shows the new card.

- [ ] **Step 6: Commit**

```bash
git add lib/tools/semak-ains/queries.ts "app/(admin)/admin/semak-ains/page.tsx" "app/(admin)/admin/pelaporan/page.tsx" lib/admin/desktop-navigation.ts
git commit -m "feat(semak-ains): halaman admin penggunaan mengikut sekolah"
```

---

### Task 13: CoE Tools hub, navigation and home card

**Files:**
- Modify: `lib/module-theme.ts`, `lib/home-modules.ts`, `lib/public-navigation.ts`, `components/home/HomeModuleIcon.tsx`, `components/PublicNavIcon.tsx`, `CLAUDE.md`
- Create: `app/(public)/tools/page.tsx`

**Interfaces:**
- Produces: `TOOLS_HUB`, `TOOLS_SECTIONS` (exported from `lib/module-theme.ts` and re-exported from `lib/home-modules.ts`); iconKeys `"tools"`, `"semakAins"`; `PublicNavId` gains `"tools"`.

- [ ] **Step 1: `lib/module-theme.ts` — add the hub constant** (after `MEDIA_HUB`)

```ts
/** Hub CoE Tools — alat bantuan guru (Semak Rekod AINS dan alat akan datang). */
export const TOOLS_HUB = {
  href: "/tools",
  internalHref: "/tools",
  external: false,
  title: "CoE Tools",
  description:
    "Alat bantuan untuk guru dan sekolah — semakan dan pengurusan yang lebih pantas.",
  accent: "#4F46E5",
  iconKey: "tools" as const,
} as const;
```

- [ ] **Step 2: `lib/module-theme.ts` — register hub + tool in `MODULES`** (insert right after `TEMPAHAN_HUB,` inside the array)

```ts
  TOOLS_HUB,
  {
    href: "/tools/semak-ains",
    internalHref: "/tools/semak-ains",
    external: false,
    title: "Semak Rekod AINS",
    description: "Semak dan sahkan rekod bacaan AINS murid secara pukal untuk GPM.",
    accent: "#4F46E5",
    iconKey: "semakAins" as const,
  },
```

- [ ] **Step 3: `lib/module-theme.ts` — add `TOOLS_SECTIONS`** (after `TEMPAHAN_SECTIONS`)

```ts
/** Alat di bawah hub /tools — dipapar dalam halaman CoE Tools dan kad Tools halaman utama. Alat baharu: tambah modul dalam MODULES + href di sini. */
export const TOOLS_SECTIONS = MODULES.filter((m) =>
  ["/tools/semak-ains"].includes(m.internalHref),
);
```

- [ ] **Step 4: `components/home/HomeModuleIcon.tsx` — add two cases** (before the closing `}` of the `switch`)

```tsx
    case "tools":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
        </svg>
      );
    case "semakAins":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={iconClass}>
          <rect x="6" y="4" width="12" height="17" rx="2" />
          <path d="M9 4h6v3H9z" />
          <path d="m9 13 2 2 4-4" />
        </svg>
      );
```

- [ ] **Step 5: `lib/home-modules.ts` — re-export and add the 6th card**

Add `TOOLS_HUB, TOOLS_SECTIONS,` to both the `export { … } from "./module-theme";` list and the `import { … } from "./module-theme";` list, then append to `HOME_MODULES` (after the Media card object):

```ts
  {
    href: TOOLS_HUB.href,
    internalHref: TOOLS_HUB.internalHref,
    title: TOOLS_HUB.title,
    accent: TOOLS_HUB.accent,
    iconKey: TOOLS_HUB.iconKey,
    cta: "Lihat Tools",
    items: TOOLS_SECTIONS.map((s) => ({ label: s.title, href: s.href })),
  },
```

- [ ] **Step 6: `lib/public-navigation.ts`** — add `| "tools"` to `PublicNavId`, and insert after the `services` item in `PUBLIC_NAV`:

```ts
  {
    id: "tools",
    href: "/tools",
    label: "CoE Tools",
    shortLabel: "Tools",
    mobile: "more",
  },
```

- [ ] **Step 7: `components/PublicNavIcon.tsx`** — add before the `media` case:

```tsx
    case "tools":
      return (
        <svg {...iconProps}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
        </svg>
      );
```

- [ ] **Step 8: Create `app/(public)/tools/page.tsx`**

```tsx
import type { Metadata } from "next";
import AccentCard from "@/components/AccentCard";
import PageHeader from "@/components/PageHeader";
import PublicPageShell from "@/components/PublicPageShell";
import { HomeModuleIcon } from "@/components/home/HomeModuleIcon";
import { TOOLS_SECTIONS, getModuleAccent } from "@/lib/module-theme";

export const metadata: Metadata = {
  title: "CoE Tools — NEXa Manjung",
  description: "Alat bantuan untuk guru dan sekolah daerah Manjung.",
};

const SECTION_TAG: Record<string, string> = {
  "/tools/semak-ains": "GPM · AINS · Semakan pukal",
};

export default function ToolsHubPage() {
  const accent = getModuleAccent("/tools");

  return (
    <PublicPageShell>
      <PageHeader
        eyebrow="CoE Tools"
        title="Pilih Alat"
        accent={accent}
        description="Alat bantuan untuk guru dan sekolah. Alat baharu akan ditambah dari semasa ke semasa."
      />

      <div className="mt-8 grid gap-4">
        {TOOLS_SECTIONS.map((s) => (
          <AccentCard key={s.internalHref} href={s.href} accent={s.accent} className="flex items-start gap-4 p-6">
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${s.accent}14`, color: s.accent }}
              aria-hidden
            >
              <HomeModuleIcon iconKey={s.iconKey} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{s.title}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={s.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0 transition group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: s.accent }}>
                {SECTION_TAG[s.internalHref]}
              </span>
              <span className="mt-1.5 block text-sm leading-relaxed text-graphite">{s.description}</span>
            </span>
          </AccentCard>
        ))}
      </div>
    </PublicPageShell>
  );
}
```

- [ ] **Step 9: Update `CLAUDE.md`**

Replace:
```
  Halaman utama papar jalur **CoE Analytics** (bukan kad) + 5 kad
  `HOME_MODULES` (Reports, Resources, Direktori, Services, Media). Menu
```
with:
```
  Halaman utama papar jalur **CoE Analytics** (bukan kad) + 6 kad
  `HOME_MODULES` (Reports, Resources, Direktori, Services, Media, Tools). Menu
```
and add this bullet under `## Struktur` (after the Kunjung Bantu bullet):
```
- **CoE Tools** `/tools` — hub alat bantuan guru (`TOOLS_SECTIONS` dalam `lib/module-theme.ts`;
  alat baharu = modul dalam `MODULES` + href dalam senarai). Alat pertama **Semak Rekod AINS**
  `/tools/semak-ains`: penanda kendiri `public/tools/semak-ains/penanda.js` dalam tab AINS +
  enjin peraturan `lib/tools/semak-ains/` dalam pelayar (tiada data murid ke pelayan, tiada AI).
  Ubah standard lalai (`standard.ts`) = naikkan `VERSI_ENJIN`; ubah `penanda.js` = naikkan
  `VERSI_PENANDA` (+ `VERSI_PENANDA_MIN` jika tidak serasi). Pemantauan bilangan sahaja
  `semak_ains_log` → `/admin/semak-ains`. Ujian `npm run test:tools`. Fixture mesti sintetik
  (jangan komit teks/nama murid sebenar). Spesifikasi
  `docs/superpowers/specs/2026-11-25-semak-rekod-ains-design.md`.
```

- [ ] **Step 10: Typecheck + smoke**

Run: `npm run typecheck` → no errors.
Open `http://localhost:3000/` → 6 module cards, the 6th "CoE Tools" with an indigo head listing "Semak Rekod AINS". Open `/tools` → one card linking to `/tools/semak-ains`. Desktop sidebar shows "CoE Tools"; resize to mobile → "Tools" appears in the Lagi sheet, bottom tabs unchanged. Screenshot the home page for the user.

- [ ] **Step 11: Commit**

```bash
git add lib/module-theme.ts lib/home-modules.ts lib/public-navigation.ts components/home/HomeModuleIcon.tsx components/PublicNavIcon.tsx "app/(public)/tools/page.tsx" CLAUDE.md
git commit -m "feat(coe-tools): hub CoE Tools, kad ke-6 halaman utama & navigasi"
```

---

### Task 14: End-to-end pilot verification and wrap-up

**Files:** none new (fixes only if issues are found)

- [ ] **Step 1: Full checks**

Run: `npm run test:tools` → all PASS.
Run: `npm run typecheck` → no errors.
Run: `npm run build` → success; routes `/tools`, `/tools/semak-ains`, `/tools/semak-ains/pasang`, `/api/semak-ains/log`, `/admin/semak-ains` listed.

- [ ] **Step 2: Run the bookmarklet in the AINS tab**

Bookmarks cannot be created programmatically, so run the same code directly:
1. Ask the user to log in to AINS as a GPM in the built-in browser and open the Papan Pemuka (Claude never enters passwords).
2. With the dev server running, in the AINS tab run via `javascript_tool`:
```js
const src = await (await fetch("http://localhost:3000/tools/semak-ains/penanda.js")).text();
(0, eval)(src.replaceAll("__NEXA_ORIGIN__", "http://localhost:3000"));
"ok"
```
Expected: a new tab opens at `http://localhost:3000/tools/semak-ains` showing the school name and the "Baca rekod menunggu pengesahan" panel. (If the AINS CSP blocks the localhost fetch, paste the file content into the call instead of fetching it.)

- [ ] **Step 3: Read-only verification (no approvals yet)**

In the opened NEXa tab: verify the school name/code, pick a small filter (one class), press "Mula baca". Expected: records arrive, counts match AINS for that filter, fields (tajuk, murid, kelas, rumusan, pengajaran) are filled for a sample of rows (spot-check 5 against AINS detail pages), colours and reasons look plausible, CSV downloads and opens in Excel with correct characters (Chinese/Tamil). Check `/admin/semak-ains` shows one 'semak' row with counts only.

- [ ] **Step 4: Approval test — ONLY with the GPM/user's explicit consent**

Ask the user to choose 1 green record that they would approve anyway. Select only that record → "Luluskan terpilih (1)" → confirm in the AINS tab. Expected: status "Diluluskan", AINS shows the record as "Disahkan", admin shows a 'lulus' row. Do not test rejection on real records unless the user names a record they want rejected.

- [ ] **Step 5: Log the phase**

Append an entry to `AI_CONTEXT_LOG.md` (implementation done, tests/build results, pilot results, remaining items: report AINS security issue to KPM, confirm with JPN/KPM that tool-assisted approval is allowed, phase-2 list). Ask the user before committing it because the file also contains their unrelated uncommitted edits.

- [ ] **Step 6: Final commit of any fixes**

```bash
git status --short
```
Commit only files changed by fixes in this task, with explicit paths.
