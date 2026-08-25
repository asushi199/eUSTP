import type { EquipmentLoanListItem, EquipmentLoanStatus } from "./types";

export type EquipmentLoanListRow = Omit<EquipmentLoanListItem, "createdAt"> & {
  createdAt: string;
};

export const EQUIPMENT_LOAN_WORKFLOW_ORDER: EquipmentLoanStatus[] = [
  "pending",
  "approved",
  "handed_over",
  "cancelled",
  "returned",
  "rejected",
];

export const ADMIN_LOAN_PAGE_SIZE = 25;

export function equipmentLoanListHref(
  pkgId: string,
  filters: {
    month?: string;
    status?: string;
    search?: string;
    page?: number;
  },
) {
  const values = new URLSearchParams();
  values.set("bulan", filters.month ?? "");
  if (filters.status) values.set("status", filters.status);
  const search = filters.search?.trim();
  if (search) values.set("cari", search);
  if (filters.page && filters.page > 1) values.set("page", String(filters.page));
  return `/admin/peralatan/${pkgId}/permohonan?${values.toString()}`;
}

export function currentMonthInMalaysia(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return `${year}-${month}`;
}

export function equipmentLoanWorkflowRank(status: EquipmentLoanStatus) {
  const index = EQUIPMENT_LOAN_WORKFLOW_ORDER.indexOf(status);
  return index === -1 ? EQUIPMENT_LOAN_WORKFLOW_ORDER.length : index;
}

export function serializeEquipmentLoanListItem(
  loan: EquipmentLoanListItem,
): EquipmentLoanListRow {
  return {
    ...loan,
    createdAt:
      loan.createdAt instanceof Date
        ? loan.createdAt.toISOString()
        : new Date(loan.createdAt).toISOString(),
  };
}

function createdAtTime(value: Date | string) {
  return new Date(value).getTime();
}

export function compareEquipmentLoansByWorkflow<
  T extends { status: EquipmentLoanStatus; createdAt: Date | string },
>(a: T, b: T) {
  const rank =
    equipmentLoanWorkflowRank(a.status) - equipmentLoanWorkflowRank(b.status);
  if (rank !== 0) return rank;
  return createdAtTime(b.createdAt) - createdAtTime(a.createdAt);
}

export function loanMatchesMonth(
  borrowDate: string,
  month: string | undefined,
) {
  if (!month) return true;
  return borrowDate.startsWith(`${month}-`) || borrowDate === month;
}

export function loanMatchesSearch<
  T extends {
    referenceNo: string;
    applicantName: string;
    orgName: string;
    schoolCode?: string | null;
  },
>(loan: T, search: string | undefined) {
  const keyword = search?.trim().toLocaleLowerCase() ?? "";
  if (!keyword) return true;
  return [loan.referenceNo, loan.applicantName, loan.orgName, loan.schoolCode ?? ""]
    .join(" ")
    .toLocaleLowerCase()
    .includes(keyword);
}

export function filterEquipmentLoans<
  T extends {
    status: EquipmentLoanStatus;
    borrowDate: string;
    createdAt: Date | string;
    referenceNo: string;
    applicantName: string;
    orgName: string;
    schoolCode?: string | null;
  },
>(
  loans: T[],
  filters: {
    month?: string;
    status?: EquipmentLoanStatus | "";
    search?: string;
  } = {},
): T[] {
  const status = filters.status || undefined;
  return loans
    .filter((loan) => loanMatchesMonth(loan.borrowDate, filters.month))
    .filter((loan) => (status ? loan.status === status : true))
    .filter((loan) => loanMatchesSearch(loan, filters.search))
    .slice()
    .sort(compareEquipmentLoansByWorkflow);
}
