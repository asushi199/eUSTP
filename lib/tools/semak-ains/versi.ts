/** Naikkan apabila standard.ts / peraturan berubah. */
export const VERSI_ENJIN = "1.1.0";

/**
 * Versi penanda minimum yang serasi (VERSI_PENANDA dalam public/tools/semak-ains/penanda.js).
 * Penanda di bawah versi ini dipaksa pasang semula kerana lulus/tolaknya gagal secara senyap:
 * - v1–3: confirm() dalam tab AINS latar belakang disekat Chrome → tindakan tidak pernah berjalan.
 * - v4: updatestatus dihantar dengan UUID pautan; AINS menjawab "success" tetapi rekod tidak
 *   berubah (ID yang betul = data-key berangka baris senarai / #data_id halaman butiran).
 */
export const VERSI_PENANDA_MIN = 5;
