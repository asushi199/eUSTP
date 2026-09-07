/** Debounce nama unit (taip) supaya tidak muat naik setiap kekunci. */
export const SURAT_UPLOAD_META_DEBOUNCE_MS = 800;

export function isSuratUploadMetaReady(orgName: string, activityDate: string): boolean {
  return Boolean(orgName.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(activityDate);
}

/** Petunjuk semasa fail sudah dipilih tetapi nama/tarikh belum lengkap. */
export function suratUploadWaitHint(orgName: string, activityDate: string): string | null {
  const needOrg = !orgName.trim();
  const needDate = !/^\d{4}-\d{2}-\d{2}$/.test(activityDate);
  if (!needOrg && !needDate) return null;
  if (needOrg && needDate) {
    return "Fail dipilih. Isi nama sekolah/unit dan tarikh cadangan untuk memuat naik.";
  }
  if (needOrg) return "Fail dipilih. Isi nama sekolah/unit untuk memuat naik.";
  return "Fail dipilih. Isi tarikh cadangan untuk memuat naik.";
}
