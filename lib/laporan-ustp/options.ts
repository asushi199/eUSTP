export const USTP_PKGS = [
  { code: "AQA1001", name: "PKG SITIAWAN", pkgId: "sitiawan" },
  { code: "AQA1002", name: "PKG PANTAI REMIS", pkgId: "pantai-remis" },
  { code: "AQA1003", name: "PKG AYER TAWAR", pkgId: "ayer-tawar" },
  { code: "AQA1004", name: "PKG BERUAS", pkgId: "beruas" },
  { code: "AQA1005", name: "PKG SERI MANJUNG", pkgId: "seri-manjung" },
] as const;

export const USTP_CLUSTERS = [
  "PROGRAM DASAR PENDIDIKAN DIGITAL",
  "PROGRAM PENSIJILAN",
  "PROGRAM PENGINTEGRASIAN TEKNOLOGI DIGITAL",
  "PROGRAM KHIDMAT BIMBINGAN DAN KEPAKARAN PENGINTEGRASIAN TEKNOLOGI DIGITAL DALAM PDP",
  "PROGRAM GALAKAN TABIAT MEMBACA",
  "PROGRAM KHIDMAT BIMBINGAN DAN KEPAKARAN PUSAT SUMBER SEKOLAH",
  "PROGRAM PEMERKASAAN PENDIDIKAN DIGITAL MURID",
  "PROGRAM PEMBELAJARAN PELANTAR DELIMA",
  "PENGHASILAN BAHAN DALAM PELBAGAI MEDIA",
  "PROGRAM PENGGUNAAN STUDIO DIGITAL",
  "PROGRAM DIGITAL MAKER HUB",
] as const;

export const USTP_TERAS = ["TERAS 1", "TERAS 2", "TERAS 3", "TERAS 4", "TERAS 5", "TERAS 6"] as const;

export const USTP_EQUIPMENT = [
  "SET KAMERA PTZ",
  "MONITOR 21 INCI",
  "TELEPROMPTER DISPLAY UNIT",
  "MIKROFON WAYARLES PROFESIONAL",
  "TRIPOD KAMERA",
  "SET LAYAR HIJAU",
  "CABLING CONNECTORS",
  "SET KIT ROBOTIK",
  "SET MICRO CONTROLLERS",
  "SET VR BOXES",
  "PENCETAK 3D",
  "NETWORK SWITCH POE 1GB PORTS",
  "KOMPUTER RIBA SPESIFIKASI SEDERHANA (CORE i5)",
  "KOMPUTER RIBA SPESIFIKASI TINGGI (CORE i7)",
  "PERISIAN VIDEO STREAMING (VMIX)",
  "TV HD 65 INCI",
  "DRON",
  "DRON PENGEKODAN",
  "PICO VR GOGGLES",
] as const;

export const USTP_PHOTO_COUNT = 2;
export const USTP_PHOTO_MAX_BYTES = 3 * 1024 * 1024;

export function ustpPkgLabel(code: string) {
  const pkg = USTP_PKGS.find((item) => item.code === code);
  return pkg ? `${pkg.code} ${pkg.name}` : code;
}

export function formatUstpDate(value: string) {
  return value.split("-").reverse().join("/");
}

export function formatUstpMoney(sen: number) {
  return (sen / 100).toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
