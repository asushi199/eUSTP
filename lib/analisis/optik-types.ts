export type OptikSchoolPublicRow = {
  schoolCode: string;
  schoolName: string;
  selesaiBil: number;
  totalBil: number;
  pctAi: number;
  plcStatus: string;
};

export type OptikSnapshotSummary = {
  id: number;
  capturedOn: string;
  chartLabel: string;
  sourceFilename: string;
  sourceFormat: string;
  selesaiPct: number;
  selesaiBil: number;
  totalBil: number;
  belumPct: number;
  belumBil: number;
  sekolahSelesai: number;
  sekolahBelum: number;
  sekolahCount: number;
  isCurrent: boolean;
  includeChart: boolean;
  createdAt: Date;
};
