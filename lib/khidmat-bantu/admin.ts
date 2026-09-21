import type { BookingStatus } from "@/lib/tempahan/booking-rules";
import type { KhidmatBantuDetails, KhidmatMcpDetails, KhidmatProgramDetails } from "@/lib/schema";
import { isMcpService } from "@/lib/khidmat-bantu/config";

export type KhidmatActivityPatch = {
  tajuk: string;
  tarikh: string;
  masa: string;
  lokasi: string;
};

export function canEditKhidmatFromAdmin(status: BookingStatus) {
  return status === "pending" || status === "approved";
}

export function canDeleteKhidmatFromAdmin(_status: BookingStatus) {
  return true;
}

/** Bina semula `details` selepas admin mengubah jadual/tajuk (kekalkan surat). */
export function rebuildKhidmatDetails(
  serviceType: string,
  previous: KhidmatBantuDetails,
  patch: KhidmatActivityPatch,
): KhidmatBantuDetails {
  const suratPermohonan = (previous as KhidmatProgramDetails | KhidmatMcpDetails)
    .suratPermohonan;
  const wasMcp = "tarikh" in previous && !("tarikhCadangan" in previous);
  const nextIsMcp = isMcpService(serviceType);

  if (nextIsMcp) {
    return {
      ...(wasMcp ? (previous as KhidmatMcpDetails) : {}),
      tarikh: patch.tarikh,
      masa: patch.masa,
      lokasi: patch.lokasi,
      suratPermohonan,
      tajukProgram: patch.tajuk,
    };
  }

  return {
    ...(!wasMcp ? (previous as KhidmatProgramDetails) : {}),
    tarikhCadangan: patch.tarikh,
    masaCadangan: patch.masa,
    lokasi: patch.lokasi,
    suratPermohonan,
    tajuk: patch.tajuk,
  };
}
