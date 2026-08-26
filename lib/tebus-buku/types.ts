export type TebusBukuSchool = {
  code: string;
  name: string;
  total: number;
  tebusCount: number;
  gunaCount: number;
};

export type TebusBukuStudent = {
  nama: string;
  tingkatan: string;
  sudahTebus: boolean;
  sudahGuna: boolean;
};

export type TebusBukuSchoolPage = {
  school: TebusBukuSchool;
  students: TebusBukuStudent[];
  sourcedAt: string | null;
  tingkatan: string[];
};
