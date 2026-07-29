export type EquipmentPkg = {
  id: string;
  name: string;
  managerName: string;
  managerPosition: string;
  managerPhone: string;
};

export type EquipmentCatalogStock = {
  pkgId: string;
  total: number;
  available: number;
};

export type EquipmentCatalogItem = {
  id: string;
  code: string;
  name: string;
  model: string;
  description: string;
  searchAliases: string[];
  components: string[];
  stocks: EquipmentCatalogStock[];
};

export type EquipmentSchool = {
  code: string;
  name: string;
};

export type EquipmentUnitListItem = {
  id: string;
  equipmentTypeId: string;
  typeCode: string;
  typeName: string;
  serialNo: string;
  governmentAssetNo: string;
  status:
    | "available"
    | "reserved"
    | "borrowed"
    | "maintenance"
    | "retired"
    | "lost";
  notes: string;
};

export type EquipmentLoanListItem = {
  id: string;
  referenceNo: string;
  orgName: string;
  applicantName: string;
  borrowDate: string;
  expectedReturnDate: string;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "cancelled"
    | "handed_over"
    | "returned";
  createdAt: Date;
  totalQuantity: number;
};

export type EquipmentLoanDetailItem = {
  id: string;
  equipmentTypeId: string;
  typeCode: string;
  typeName: string;
  model: string;
  quantity: number;
  availableUnits: Array<{
    id: string;
    serialNo: string;
    governmentAssetNo: string;
  }>;
  allocatedUnits: Array<{
    id: string;
    serialNo: string;
    governmentAssetNo: string;
  }>;
};

export type EquipmentLoanDetail = {
  id: string;
  referenceNo: string;
  pkgId: string;
  applicantType: string;
  schoolCode: string | null;
  orgName: string;
  applicantName: string;
  position: string;
  contact: string;
  purpose: string;
  usageLocation: string;
  borrowDate: string;
  expectedReturnDate: string;
  status: EquipmentLoanListItem["status"];
  decisionNote: string;
  approvedAt: Date | null;
  handedOverAt: Date | null;
  returnedAt: Date | null;
  createdAt: Date;
  items: EquipmentLoanDetailItem[];
  signatures: EquipmentLoanSignature[];
  documents: EquipmentLoanDocument[];
};

export type EquipmentSignatureRole =
  | "borrower"
  | "approver"
  | "returner"
  | "receiver";

export type EquipmentSignatureStroke = Array<{ x: number; y: number }>;

export type EquipmentLoanSignature = {
  role: EquipmentSignatureRole;
  signerName: string;
  signerPosition: string;
  strokes: EquipmentSignatureStroke[];
  signedAt: Date;
};

export type EquipmentDocumentStage = "handover" | "final";

export type EquipmentLoanDocument = {
  stage: EquipmentDocumentStage;
  status: "generating" | "ready" | "failed";
  fileName: string;
  storagePath: string | null;
  publicUrl: string | null;
  sha256: string | null;
  errorMessage: string;
  generatedAt: Date | null;
};
