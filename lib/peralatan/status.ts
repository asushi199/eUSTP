import type {
  EquipmentLoanListItem,
  EquipmentUnitListItem,
} from "./types";

export const EQUIPMENT_UNIT_STATUS_LABEL: Record<
  EquipmentUnitListItem["status"],
  string
> = {
  available: "Tersedia",
  reserved: "Ditempah",
  borrowed: "Dipinjam",
  maintenance: "Penyelenggaraan",
  retired: "Dilupuskan",
  lost: "Hilang",
};

export const EQUIPMENT_LOAN_STATUS_LABEL: Record<
  EquipmentLoanListItem["status"],
  string
> = {
  pending: "Menunggu kelulusan",
  approved: "Diluluskan",
  rejected: "Ditolak",
  cancelled: "Dibatalkan",
  handed_over: "Telah diserahkan",
  returned: "Dipulangkan",
};
