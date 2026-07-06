export const KHIDMAT_BANTU_WHATSAPP_KEY = "khidmat_bantu_whatsapp_admin";

export const APPLICANT_TYPES = [
  { id: "sekolah", label: "Sekolah" },
  { id: "pegawai_ppd", label: "Pegawai PPD" },
  { id: "lain", label: "Lain-lain" },
] as const;

export type ApplicantType = (typeof APPLICANT_TYPES)[number]["id"];

export const SERVICE_TYPES = [
  { id: "ceramah", label: "Ceramah", group: "program" as const },
  { id: "bengkel", label: "Bengkel", group: "program" as const },
  { id: "mcp_siaran", label: "MCP — Siaran Langsung", group: "mcp" as const },
  { id: "mcp_rakaman", label: "MCP — Rakaman Video", group: "mcp" as const },
  { id: "lain_lain", label: "Lain-lain", group: "program" as const },
] as const;

/** Label rekod lama (mcp_lain diganti lain_lain dalam borang baharu). */
const LEGACY_SERVICE_LABELS: Record<string, string> = {
  mcp_lain: "MCP — Lain-lain",
};

export type ServiceType = (typeof SERVICE_TYPES)[number]["id"];
export type ServiceGroup = (typeof SERVICE_TYPES)[number]["group"];

export function getServiceTypeMeta(id: string) {
  return SERVICE_TYPES.find((s) => s.id === id);
}

export function getServiceGroup(id: string): ServiceGroup | null {
  return getServiceTypeMeta(id)?.group ?? (id === "mcp_lain" ? "mcp" : null);
}

export function getServiceTypeLabel(id: string): string {
  return getServiceTypeMeta(id)?.label ?? LEGACY_SERVICE_LABELS[id] ?? id;
}

export function getApplicantTypeLabel(id: string): string {
  return APPLICANT_TYPES.find((a) => a.id === id)?.label ?? id;
}

export function isProgramService(id: string): boolean {
  return getServiceGroup(id) === "program";
}

export function isMcpService(id: string): boolean {
  return getServiceGroup(id) === "mcp";
}
