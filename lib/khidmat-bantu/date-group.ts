import { getServiceGroup, getServiceTypeLabel } from "@/lib/khidmat-bantu/config";
import type { KhidmatBantuRow } from "@/lib/khidmat-bantu/queries";
import type { KhidmatMcpDetails, KhidmatProgramDetails } from "@/lib/schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function asProgram(row: KhidmatBantuRow) {
  return row.details as KhidmatProgramDetails;
}
function asMcp(row: KhidmatBantuRow) {
  return row.details as KhidmatMcpDetails;
}
function isMcp(row: KhidmatBantuRow) {
  return getServiceGroup(row.serviceType) === "mcp";
}

/** Tarikh aktiviti (yyyy-MM-dd) ikut kumpulan servis; null jika hilang/tak sah. */
export function getServiceDate(row: KhidmatBantuRow): string | null {
  const raw = isMcp(row) ? asMcp(row).tarikh : asProgram(row).tarikhCadangan;
  return raw && ISO_DATE.test(raw) ? raw : null;
}

export function getServiceTitle(row: KhidmatBantuRow): string {
  if (isMcp(row)) {
    const legacy = asMcp(row).tajukProgram?.trim();
    if (legacy) return legacy;
  } else {
    const legacy = asProgram(row).tajuk?.trim();
    if (legacy) return legacy;
  }
  return getServiceTypeLabel(row.serviceType);
}

export function getServiceTime(row: KhidmatBantuRow): string {
  return (isMcp(row) ? asMcp(row).masa : asProgram(row).masaCadangan) ?? "";
}

export function getServiceLokasi(row: KhidmatBantuRow): string {
  return (row.details as KhidmatProgramDetails | KhidmatMcpDetails).lokasi ?? "";
}

export function getSuratPermohonan(row: KhidmatBantuRow) {
  return (row.details as KhidmatProgramDetails | KhidmatMcpDetails).suratPermohonan ?? null;
}
