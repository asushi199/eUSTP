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
  createdAt: Date;
  items: EquipmentLoanDetailItem[];
};
