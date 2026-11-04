export type OptikSchoolPublicRow = {
  schoolCode: string;
  schoolName: string;
  selesaiBil: number;
  totalBil: number;
  pctAi: number;
  plcStatus: string;
  guruBelumLogin: number;
  muridAi: number;
  muridJumlah: number;
};

export type OptikTeacherPublicRow = {
  name: string;
  plcStatus: string;
  hariAktif: number | null;
};

export type OptikGuruTeratasRow = {
  name: string;
  schoolCode: string;
  schoolName: string;
  hariAktif: number;
};

export type OptikKedalamanRow = { label: string; bil: number; pct: number };

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
  guruBelumLogin: number;
  muridAi: number;
  muridJumlah: number;
  muridPct: number;
  isCurrent: boolean;
  includeChart: boolean;
  createdAt: Date;
};
