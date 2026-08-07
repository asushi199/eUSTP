import { buildEquipmentRequestWhatsAppUrl } from "./whatsapp";
import type { EquipmentLoanStatus } from "./types";

type EquipmentLookupWhatsAppRequest = {
  id: string;
  pkgId: string;
  managerPhone: string;
  referenceNo: string;
  applicantName: string;
  orgName: string;
  borrowDate: string;
  expectedReturnDate: string;
  status: EquipmentLoanStatus;
};

export function buildEquipmentLookupWhatsAppUrl(
  request: EquipmentLookupWhatsAppRequest,
  baseUrl: string,
): string | undefined {
  if (request.status !== "pending" || !request.managerPhone) return undefined;

  return (
    buildEquipmentRequestWhatsAppUrl(request.managerPhone, {
      referenceNo: request.referenceNo,
      applicantName: request.applicantName,
      orgName: request.orgName,
      borrowDate: request.borrowDate,
      expectedReturnDate: request.expectedReturnDate,
      approvalUrl: `${baseUrl}/admin/peralatan/${request.pkgId}/permohonan/${request.id}`,
    }) || undefined
  );
}
