import assert from "node:assert/strict";
import test from "node:test";
import {
  BELUM_LOGIN_DIKIRA_SELESAI,
  binaSnapshotOptik,
  chartLabelFromDate,
  kedalamanGuru,
  plcStatusFromPct,
  serializeOptikSchoolsCsv,
} from "../../lib/analisis/optik-parse";

const g = (email: string, kod: string, nama: string) => ({ email, kod, nama });

function contoh() {
  return binaSnapshotOptik({
    aktif: [
      g("a@x", "ABA1001", "ALI"),
      g("b@x", "ABA1001", "SITI"),
      g("c@x", "ABA1002", "AHMAD"),
      g("d@x", "ABA1002", "MINAH"),
      g("e@x", "ABA1002", "KAMAL"),
    ],
    ai: [
      { ...g("a@x", "ABA1001", "ALI"), hari: 12 },
      { ...g("c@x", "ABA1002", "AHMAD"), hari: 3 },
      { ...g("d@x", "ABA1002", "MINAH"), hari: 40 },
      { ...g("e@x", "ABA1002", "KAMAL"), hari: 1 },
    ],
    belumAi: [g("b@x", "ABA1001", "SITI")],
    belumLogin: [g("f@x", "ABA1001", "RAMLI")],
    muridAi: new Map([["ABA1001", 30]]),
    muridBelum: new Map([["ABA1001", 20]]),
    muridRujukan: new Map([
      ["ABA1001", 100],
      ["ABA1002", 50],
    ]),
    namaSekolah: new Map([["ABA1001", "SK DENDANG"]]),
  });
}

test("guru: belum log masuk dikira dalam jumlah dan (buat masa ini) sebagai selesai", () => {
  assert.equal(BELUM_LOGIN_DIKIRA_SELESAI, true);
  const r = contoh();
  assert.equal(r.totalBil, 6);
  assert.equal(r.selesaiBil, 5);
  assert.equal(r.belumBil, 1);
  assert.equal(r.guruBelumLogin, 1);
  assert.equal(r.selesaiPct, 83.33);
  const dendang = r.schools.find((s) => s.schoolCode === "ABA1001");
  assert.equal(dendang?.totalBil, 3);
  assert.equal(dendang?.selesaiBil, 2);
  assert.equal(dendang?.guruBelumLogin, 1);
  assert.equal(dendang?.plcStatus, "Belum");
  assert.equal(dendang?.schoolName, "SK DENDANG");
  const beruas = r.schools.find((s) => s.schoolCode === "ABA1002");
  assert.equal(beruas?.plcStatus, "Selesai");
  assert.equal(beruas?.schoolName, "ABA1002");
  assert.equal(r.sekolahSelesai, 1);
  assert.equal(r.sekolahBelum, 1);
});

test("status guru: ai menang, kemudian belum log masuk, kemudian belum", () => {
  const r = contoh();
  const status = new Map(r.teachers.map((t) => [t.name, t.plcStatus]));
  assert.equal(status.get("ALI"), "Selesai");
  assert.equal(status.get("SITI"), "Belum");
  assert.equal(status.get("RAMLI"), "Belum log masuk");
  // guru aktif DELIMa yang tiada dalam mana-mana senarai AI = Belum
  const lain = binaSnapshotOptik({
    aktif: [g("z@x", "ABA1001", "ZAKI")],
    ai: [],
    belumAi: [],
    belumLogin: [],
    muridAi: new Map(),
    muridBelum: new Map(),
    muridRujukan: new Map(),
  });
  assert.equal(lain.teachers[0]?.plcStatus, "Belum");
});

test("guru disusun: Belum, Belum log masuk, kemudian Selesai ikut hari aktif", () => {
  const r = contoh();
  const dendang = r.teachers.filter((t) => t.schoolCode === "ABA1001").map((t) => t.name);
  assert.deepEqual(dendang, ["SITI", "RAMLI", "ALI"]);
  const beruas = r.teachers.filter((t) => t.schoolCode === "ABA1002").map((t) => t.name);
  assert.deepEqual(beruas, ["MINAH", "AHMAD", "KAMAL"]);
});

test("murid: penyebut ialah rujukan, naik jika guna+belum melebihinya", () => {
  const r = contoh();
  assert.equal(r.muridAi, 30);
  assert.equal(r.muridJumlah, 150);
  assert.equal(r.muridPct, 20);
  const lebih = binaSnapshotOptik({
    aktif: [g("a@x", "ABA1001", "ALI")],
    ai: [],
    belumAi: [],
    belumLogin: [],
    muridAi: new Map([["ABA1001", 10]]),
    muridBelum: new Map([["ABA1001", 20]]),
    muridRujukan: new Map([["ABA1001", 25]]),
  });
  assert.equal(lain(lebih), 30);
});

function lain(r: ReturnType<typeof binaSnapshotOptik>) {
  return r.schools[0]?.muridJumlah;
}

test("e-mel tidak bocor ke CSV ringkasan", () => {
  const csv = contoh().csv;
  assert.ok(!csv.includes("@"));
  assert.ok(csv.startsWith("Sekolah,✓,∑,% AI,☑ PLC,Belum log masuk,Murid AI,Murid ∑"));
});

test("kedalaman guru ikut selang hari aktif", () => {
  const rows = kedalamanGuru([1, 2, 3, 9, 10, 29, 30, 200, null]);
  assert.deepEqual(
    rows.map((r) => r.bil),
    [2, 2, 2, 2],
  );
  assert.equal(rows[0]?.pct, 25);
});

test("label carta, PLC ambang 80%, tiada guru -> ralat", () => {
  assert.equal(chartLabelFromDate("2026-10-31"), "Okt 2026");
  assert.equal(plcStatusFromPct(80), "Selesai");
  assert.equal(plcStatusFromPct(79.99), "Belum");
  assert.ok(serializeOptikSchoolsCsv([]).startsWith("Sekolah"));
  assert.throws(() =>
    binaSnapshotOptik({
      aktif: [],
      ai: [],
      belumAi: [],
      belumLogin: [],
      muridAi: new Map(),
      muridBelum: new Map(),
      muridRujukan: new Map(),
    }),
  );
});
