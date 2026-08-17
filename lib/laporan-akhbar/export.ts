import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import {
  AKHBAR_PPD,
  AKHBAR_YEAR,
  resolveAkhbarPegawaiPpd,
} from "@/lib/laporan-akhbar/enums";
import { listAkhbarAdminRows } from "@/lib/laporan-akhbar/queries";

const TEMPLATE_CANDIDATES = [
  path.join(process.cwd(), "public", "templates", "laporan-akhbar-2026.xlsx"),
  path.join(process.cwd(), "docs", "fixed template penyelarasan akhbar.xlsx"),
];

function cell(ws: Record<string, unknown>, addr: string, value: string | number | null) {
  if (value == null || value === "") {
    delete ws[addr];
    return;
  }
  ws[addr] = { t: typeof value === "number" ? "n" : "s", v: value };
}

function colLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

export async function buildLaporanAkhbarWorkbook(): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const XLSX = await import("xlsx");
  let templateBuf: Buffer | null = null;
  for (const p of TEMPLATE_CANDIDATES) {
    try {
      templateBuf = await readFile(p);
      break;
    } catch {
      /* try next */
    }
  }
  if (!templateBuf) {
    throw new Error("Template Excel Laporan Akhbar tidak dijumpai.");
  }

  const wb = XLSX.read(templateBuf, { type: "buffer", cellDates: true });
  const rows = await listAkhbarAdminRows(AKHBAR_YEAR);

  const dataWs = wb.Sheets["Data Sekolah"];
  const checkWs = wb.Sheets["Checklist Sekolah"];
  const semakWs = wb.Sheets["Semakan PPD"];
  if (!dataWs || !checkWs || !semakWs) {
    throw new Error("Template Excel rosak: sheet wajib tiada.");
  }

  rows.forEach((item, i) => {
    const r = i + 2; // row 1 = header
    const rec = item.record;
    const bil = i + 1;

    // Data Sekolah A–Q (template 2026 + terimaan/baki 2024–2025)
    cell(dataWs, `A${r}`, bil);
    cell(dataWs, `B${r}`, item.schoolCode);
    cell(dataWs, `C${r}`, item.schoolName);
    cell(dataWs, `D${r}`, AKHBAR_PPD);
    if (rec) {
      cell(dataWs, `E${r}`, rec.kategoriSekolah);
      cell(dataWs, `F${r}`, rec.liputanPkb);
      cell(dataWs, `G${r}`, rec.peruntukanDiterimaRm);
      cell(dataWs, `H${r}`, rec.perbelanjaanDigunakanRm);
      cell(dataWs, `I${r}`, rec.bayaranTertunggakRm);
      cell(dataWs, `J${r}`, rec.bakiPeruntukanRm);
      cell(dataWs, `K${r}`, rec.dipulangkanJpnRm);
      cell(dataWs, `L${r}`, rec.tambahanDipohonRm);
      cell(dataWs, `M${r}`, rec.terimaanTahun20242025Rm);
      cell(dataWs, `N${r}`, rec.bakiPeruntukan20242025Rm);
      cell(dataWs, `O${r}`, rec.statusSekolah);
      cell(
        dataWs,
        `P${r}`,
        rec.tarikhHantar
          ? new Date(rec.tarikhHantar).toISOString().slice(0, 10)
          : null,
      );
      cell(dataWs, `Q${r}`, rec.catatan || null);
    }

    // Checklist Sekolah A–I
    cell(checkWs, `A${r}`, bil);
    cell(checkWs, `B${r}`, item.schoolCode);
    cell(checkWs, `C${r}`, item.schoolName);
    if (rec) {
      cell(checkWs, `D${r}`, rec.bayaranTertunggakSelesai);
      cell(checkWs, `E${r}`, rec.bakiDipulangkan);
      cell(checkWs, `F${r}`, rec.tiadaBakiKwk);
      cell(checkWs, `G${r}`, rec.mohonTambahan);
      cell(checkWs, `H${r}`, rec.dokumenLengkap);
      cell(checkWs, `I${r}`, rec.statusSekolah);
    }

    // Semakan PPD A–I
    cell(semakWs, `A${r}`, bil);
    cell(semakWs, `B${r}`, AKHBAR_PPD);
    cell(semakWs, `C${r}`, item.schoolCode);
    cell(semakWs, `D${r}`, item.schoolName);
    if (rec) {
      cell(semakWs, `E${r}`, rec.semakanLengkap);
      cell(semakWs, `F${r}`, rec.disahkan);
      cell(semakWs, `G${r}`, rec.perluPembetulan);
      cell(semakWs, `H${r}`, resolveAkhbarPegawaiPpd(rec.pegawaiPpd));
      cell(semakWs, `I${r}`, rec.tarikhSemakan);
    }
  });

  const last = rows.length + 1;
  dataWs["!ref"] = `A1:${colLetter(17)}${Math.max(last, 2)}`;
  for (const ws of [checkWs, semakWs]) {
    ws["!ref"] = `A1:${colLetter(9)}${Math.max(last, 2)}`;
  }

  // Biarkan Tindakan JPN kosong (JPN isi sendiri).

  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return {
    buffer: Buffer.from(out),
    filename: `Laporan-Akhbar-Manjung-${AKHBAR_YEAR}-${stamp}.xlsx`,
  };
}
