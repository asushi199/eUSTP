import assert from "node:assert/strict";
import test from "node:test";
import {
  compareEquipmentLoansByWorkflow,
  filterEquipmentLoans,
  loanMatchesMonth,
  loanMatchesSearch,
} from "../../lib/peralatan/loan-list";
import type { EquipmentLoanStatus } from "../../lib/peralatan/types";

function loan(partial: {
  id: string;
  status: EquipmentLoanStatus;
  borrowDate: string;
  createdAt: string;
  orgName?: string;
  schoolCode?: string | null;
  applicantName?: string;
  referenceNo?: string;
}) {
  return {
    referenceNo: partial.referenceNo ?? `REF-${partial.id}`,
    applicantName: partial.applicantName ?? "Pemohon",
    orgName: partial.orgName ?? "SK Contoh",
    schoolCode: partial.schoolCode ?? "ABA1001",
    ...partial,
  };
}

test("sorts loans by workflow then newest first", () => {
  const rows = [
    loan({
      id: "returned-old",
      status: "returned",
      borrowDate: "2026-07-01",
      createdAt: "2026-06-01T00:00:00.000Z",
    }),
    loan({
      id: "pending-new",
      status: "pending",
      borrowDate: "2026-08-01",
      createdAt: "2026-08-10T00:00:00.000Z",
    }),
    loan({
      id: "handed",
      status: "handed_over",
      borrowDate: "2026-07-12",
      createdAt: "2026-07-12T00:00:00.000Z",
    }),
    loan({
      id: "pending-old",
      status: "pending",
      borrowDate: "2026-07-02",
      createdAt: "2026-07-02T00:00:00.000Z",
    }),
    loan({
      id: "approved",
      status: "approved",
      borrowDate: "2026-07-08",
      createdAt: "2026-07-08T00:00:00.000Z",
    }),
    loan({
      id: "rejected",
      status: "rejected",
      borrowDate: "2026-07-09",
      createdAt: "2026-07-09T00:00:00.000Z",
    }),
    loan({
      id: "cancelled",
      status: "cancelled",
      borrowDate: "2026-07-11",
      createdAt: "2026-07-11T00:00:00.000Z",
    }),
  ];

  assert.deepEqual(
    [...rows].sort(compareEquipmentLoansByWorkflow).map((row) => row.id),
    [
      "pending-new",
      "pending-old",
      "approved",
      "handed",
      "cancelled",
      "returned-old",
      "rejected",
    ],
  );
});

test("filters loans by month, status and school search without extra queries", () => {
  const rows = [
    loan({
      id: "july-pending",
      status: "pending",
      borrowDate: "2026-07-03",
      createdAt: "2026-07-01T00:00:00.000Z",
      orgName: "SK Seri Manjung",
      schoolCode: "ABA1002",
    }),
    loan({
      id: "july-returned",
      status: "returned",
      borrowDate: "2026-07-20",
      createdAt: "2026-07-10T00:00:00.000Z",
      orgName: "SK Ayer Tawar",
      schoolCode: "ABA1001",
    }),
    loan({
      id: "august-approved",
      status: "approved",
      borrowDate: "2026-08-04",
      createdAt: "2026-08-01T00:00:00.000Z",
      orgName: "SMK Sitiawan",
      schoolCode: "AEB2001",
    }),
  ];

  assert.deepEqual(
    filterEquipmentLoans(rows, { month: "2026-07" }).map((row) => row.id),
    ["july-pending", "july-returned"],
  );
  assert.deepEqual(
    filterEquipmentLoans(rows, { month: "2026-07", status: "returned" }).map(
      (row) => row.id,
    ),
    ["july-returned"],
  );
  assert.deepEqual(
    filterEquipmentLoans(rows, { search: "sitiawan" }).map((row) => row.id),
    ["august-approved"],
  );
  assert.deepEqual(
    filterEquipmentLoans(rows, { search: "aba1002" }).map((row) => row.orgName),
    ["SK Seri Manjung"],
  );
});

test("matches school search like direktori code or name", () => {
  const row = loan({
    id: "1",
    status: "pending",
    borrowDate: "2026-07-01",
    createdAt: "2026-07-01T00:00:00.000Z",
    orgName: "SK PANGKALAN TLDM II",
    schoolCode: "ABA1031",
  });
  assert.equal(loanMatchesSearch(row, "tldm"), true);
  assert.equal(loanMatchesSearch(row, "ABA1031"), true);
  assert.equal(loanMatchesSearch(row, "beruas"), false);
  assert.equal(loanMatchesMonth("2026-07-15", "2026-07"), true);
  assert.equal(loanMatchesMonth("2026-08-01", "2026-07"), false);
});
