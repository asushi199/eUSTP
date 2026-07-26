import type { EquipmentSchool } from "./types";

export function filterEquipmentSchools(
  schools: EquipmentSchool[],
  query: string,
): EquipmentSchool[] {
  const keyword = query.trim().toLocaleLowerCase();

  return [...schools]
    .sort((a, b) => a.code.localeCompare(b.code))
    .filter((school) =>
      !keyword
        ? true
        : [school.code, school.name]
            .join(" ")
            .toLocaleLowerCase()
            .includes(keyword),
    );
}
