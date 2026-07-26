import assert from "node:assert/strict";
import test from "node:test";
import { filterEquipmentSchools } from "../../lib/peralatan/school-search";

const schools = [
  { code: "ABA1002", name: "SK Seri Manjung" },
  { code: "ABA1001", name: "SK Ayer Tawar" },
  { code: "AEB2001", name: "SMK Sitiawan" },
];

test("orders equipment school choices by school code", () => {
  assert.deepEqual(
    filterEquipmentSchools(schools, "").map((school) => school.code),
    ["ABA1001", "ABA1002", "AEB2001"],
  );
});

test("finds equipment school choices by code or name", () => {
  assert.deepEqual(
    filterEquipmentSchools(schools, "aba1002").map((school) => school.name),
    ["SK Seri Manjung"],
  );
  assert.deepEqual(
    filterEquipmentSchools(schools, "sitiawan").map((school) => school.code),
    ["AEB2001"],
  );
});
