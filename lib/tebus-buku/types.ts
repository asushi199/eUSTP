export type TebusBukuSchool = {
  code: string;
  name: string;
  total: number;
  tebusCount: number;
  gunaCount: number;
};

export type TebusBukuSchoolPage = {
  school: TebusBukuSchool;
  sourcedAt: string | null;
};
