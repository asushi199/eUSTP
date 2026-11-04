/**
 * AI Tools (OPTIK) — pembinaan snapshot daripada sumber DELIMa (tulen, tanpa I/O).
 *
 * Sumber (Perak, ditapis ke PPD Manjung oleh skrip `import-optik`):
 *  - xlsx "Paling Aktif Guru dan Murid" → semua guru aktif DELIMa (1 Jan → 31 Okt)
 *  - xlsx "Paling Aktif AI Tools"       → guru & murid yang pernah guna AI Tools + hari aktif
 *  - CSV belum-ai-tools (guru / murid)  → sudah log masuk tetapi belum guna AI Tools
 *  - CSV belum-login-guru               → guru yang tidak pernah log masuk DELIMa
 *
 * Takrif: guru "Selesai" = pernah guna AI Tools. "Belum" = log masuk tetapi tidak guna.
 * "Belum log masuk" = tidak pernah log masuk (kira sebagai belum selesai).
 */

export const OPTIK_PLC_SELESAI_MIN_PCT = 80;

export type OptikPlcStatus = "Selesai" | "Belum";
export type OptikGuruStatus = "Selesai" | "Belum" | "Belum log masuk";

export type OptikSchoolRow = {
  schoolCode: string;
  schoolName: string;
  selesaiBil: number;
  totalBil: number;
  pctAi: number;
  plcStatus: OptikPlcStatus;
  guruBelumLogin: number;
  muridAi: number;
  muridJumlah: number;
};

export type OptikTeacherRow = {
  schoolCode: string;
  name: string;
  plcStatus: OptikGuruStatus;
  hariAktif: number | null;
};

export type OptikParseResult = {
  format: string;
  schools: OptikSchoolRow[];
  teachers: OptikTeacherRow[];
  selesaiBil: number;
  totalBil: number;
  selesaiPct: number;
  belumBil: number;
  belumPct: number;
  guruBelumLogin: number;
  sekolahSelesai: number;
  sekolahBelum: number;
  muridAi: number;
  muridJumlah: number;
  muridPct: number;
  csv: string;
};

const MS_MONTHS = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

export function roundPct(n: number): number {
  return Math.round(n * 100) / 100;
}

export function chartLabelFromDate(ymd: string): string {
  const parts = ymd.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return ymd;
  return `${MS_MONTHS[month - 1]} ${year}`;
}

export function plcStatusFromPct(pct: number): OptikPlcStatus {
  return pct >= OPTIK_PLC_SELESAI_MIN_PCT ? "Selesai" : "Belum";
}

/** Nama untuk paparan: ruang tunggal, tanpa ruang hujung/awal. */
export function bersihNama(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export type OptikGuruSumber = { email: string; kod: string; nama: string };

export type OptikBinaInput = {
  /** Semua guru aktif DELIMa (jumlah penyebut). */
  aktif: OptikGuruSumber[];
  /** Guru yang pernah guna AI Tools + hari aktif (kunci = e-mel huruf kecil). */
  ai: (OptikGuruSumber & { hari: number })[];
  /** Guru log masuk tetapi belum guna AI Tools. */
  belumAi: OptikGuruSumber[];
  /** Guru tidak pernah log masuk DELIMa. */
  belumLogin: OptikGuruSumber[];
  /** Bilangan murid pernah guna AI Tools / belum, ikut kod sekolah. */
  muridAi: Map<string, number>;
  muridBelum: Map<string, number>;
  /** Jumlah murid rujukan (DELIMa d3) ikut kod sekolah — penyebut peratus murid. */
  muridRujukan: Map<string, number>;
  /** Nama sekolah rujukan ikut kod (pilihan; jika tiada guna nama daripada sumber). */
  namaSekolah?: Map<string, string>;
};

const STATUS_URUTAN: Record<OptikGuruStatus, number> = {
  Belum: 0,
  "Belum log masuk": 1,
  Selesai: 2,
};

export function binaSnapshotOptik(input: OptikBinaInput): OptikParseResult {
  type Guru = { kod: string; nama: string; status: OptikGuruStatus; hari: number | null };
  const guru = new Map<string, Guru>();
  const tambah = (g: OptikGuruSumber) => {
    const key = g.email.trim().toLowerCase();
    const kod = g.kod.trim().toUpperCase();
    const nama = bersihNama(g.nama);
    if (!key || !kod || !nama) return null;
    let cur = guru.get(key);
    if (!cur) {
      cur = { kod, nama, status: "Belum", hari: null };
      guru.set(key, cur);
    }
    return cur;
  };
  for (const g of input.aktif) tambah(g);
  for (const g of input.belumAi) tambah(g);
  for (const g of input.belumLogin) {
    const cur = tambah(g);
    if (cur) cur.status = "Belum log masuk";
  }
  for (const g of input.ai) {
    const cur = tambah(g);
    if (cur) {
      cur.status = "Selesai";
      cur.hari = Math.max(0, Math.round(g.hari));
    }
  }

  const nama = new Map<string, string>(input.namaSekolah ?? []);
  for (const g of [...input.aktif, ...input.belumAi, ...input.belumLogin, ...input.ai]) {
    const kod = g.kod.trim().toUpperCase();
    if (kod && !nama.has(kod)) nama.set(kod, kod);
  }

  const bySchool = new Map<string, { done: number; total: number; login: number }>();
  for (const g of guru.values()) {
    const s = bySchool.get(g.kod) ?? { done: 0, total: 0, login: 0 };
    s.total += 1;
    if (g.status === "Selesai") s.done += 1;
    if (g.status === "Belum log masuk") s.login += 1;
    bySchool.set(g.kod, s);
  }
  const kodMurid = new Set<string>([
    ...input.muridAi.keys(),
    ...input.muridBelum.keys(),
  ]);

  const schools: OptikSchoolRow[] = [...bySchool.entries()].map(([kod, s]) => {
    const ai = input.muridAi.get(kod) ?? 0;
    const belum = input.muridBelum.get(kod) ?? 0;
    const pctAi = roundPct((100 * s.done) / s.total);
    return {
      schoolCode: kod,
      schoolName: nama.get(kod) ?? kod,
      selesaiBil: s.done,
      totalBil: s.total,
      pctAi,
      plcStatus: plcStatusFromPct(pctAi),
      guruBelumLogin: s.login,
      muridAi: ai,
      muridJumlah: Math.max(input.muridRujukan.get(kod) ?? 0, ai + belum),
    };
  });
  // Sekolah yang ada murid tetapi tiada guru dalam sumber (jarang) tetap dikira dalam jumlah murid.
  for (const kod of kodMurid) {
    if (bySchool.has(kod)) continue;
    const ai = input.muridAi.get(kod) ?? 0;
    const belum = input.muridBelum.get(kod) ?? 0;
    schools.push({
      schoolCode: kod,
      schoolName: nama.get(kod) ?? kod,
      selesaiBil: 0,
      totalBil: 0,
      pctAi: 0,
      plcStatus: "Belum",
      guruBelumLogin: 0,
      muridAi: ai,
      muridJumlah: Math.max(input.muridRujukan.get(kod) ?? 0, ai + belum),
    });
  }
  const guruSchools = schools.filter((s) => s.totalBil > 0);
  if (guruSchools.length === 0) throw new Error("Tiada guru dalam sumber.");
  const sorted = guruSchools.sort((a, b) => {
    if (b.selesaiBil !== a.selesaiBil) return b.selesaiBil - a.selesaiBil;
    return a.schoolCode.localeCompare(b.schoolCode);
  });

  const selesaiBil = sorted.reduce((n, s) => n + s.selesaiBil, 0);
  const totalBil = sorted.reduce((n, s) => n + s.totalBil, 0);
  const guruBelumLogin = sorted.reduce((n, s) => n + s.guruBelumLogin, 0);
  const muridAi = schools.reduce((n, s) => n + s.muridAi, 0);
  const muridJumlah = schools.reduce((n, s) => n + s.muridJumlah, 0);
  const sekolahSelesai = sorted.filter((s) => s.plcStatus === "Selesai").length;

  const teachers: OptikTeacherRow[] = [...guru.values()]
    .map((g) => ({
      schoolCode: g.kod,
      name: g.nama,
      plcStatus: g.status,
      hariAktif: g.hari,
    }))
    .sort((a, b) => {
      if (a.schoolCode !== b.schoolCode) return a.schoolCode.localeCompare(b.schoolCode);
      if (a.plcStatus !== b.plcStatus) return STATUS_URUTAN[a.plcStatus] - STATUS_URUTAN[b.plcStatus];
      if ((b.hariAktif ?? 0) !== (a.hariAktif ?? 0)) return (b.hariAktif ?? 0) - (a.hariAktif ?? 0);
      return a.name.localeCompare(b.name, "ms");
    });

  return {
    format: "gabungan_delima",
    schools: sorted,
    teachers,
    selesaiBil,
    totalBil,
    selesaiPct: roundPct((100 * selesaiBil) / totalBil),
    belumBil: totalBil - selesaiBil,
    belumPct: roundPct((100 * (totalBil - selesaiBil)) / totalBil),
    guruBelumLogin,
    sekolahSelesai,
    sekolahBelum: sorted.length - sekolahSelesai,
    muridAi,
    muridJumlah,
    muridPct: muridJumlah > 0 ? roundPct((100 * muridAi) / muridJumlah) : 0,
    csv: serializeOptikSchoolsCsv(sorted),
  };
}

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV ringkasan sekolah (tiada nama individu) — selamat disimpan dalam git. */
export function serializeOptikSchoolsCsv(schools: OptikSchoolRow[]): string {
  const lines = ["Sekolah,✓,∑,% AI,☑ PLC,Belum log masuk,Murid AI,Murid ∑"];
  for (const row of schools) {
    lines.push(
      [
        csvCell(`${row.schoolCode}-${row.schoolName}`),
        row.selesaiBil,
        row.totalBil,
        row.pctAi,
        csvCell(row.plcStatus),
        row.guruBelumLogin,
        row.muridAi,
        row.muridJumlah,
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Selang hari aktif guru yang pernah guna AI Tools (kedalaman penggunaan). */
export const OPTIK_KEDALAMAN = [
  { label: "1–2 hari", min: 1, max: 2 },
  { label: "3–9 hari", min: 3, max: 9 },
  { label: "10–29 hari", min: 10, max: 29 },
  { label: "30+ hari", min: 30, max: Infinity },
] as const;

export function kedalamanGuru(
  hari: (number | null)[],
): { label: string; bil: number; pct: number }[] {
  const aktif = hari.filter((h): h is number => h != null && h >= 1);
  return OPTIK_KEDALAMAN.map((b) => {
    const bil = aktif.filter((h) => h >= b.min && h <= b.max).length;
    return { label: b.label, bil, pct: aktif.length > 0 ? roundPct((100 * bil) / aktif.length) : 0 };
  });
}
