import assert from "node:assert/strict";
import test from "node:test";
import {
  isSchoolListQuery,
  matchSchoolLines,
  parseSchoolListQuery,
} from "../../lib/direktori/school-name-match";

const schools = [
  { code: "ABA1040", name: "SK BERUAS" },
  { code: "ABA1041", name: "SK PANCHOR" },
  { code: "ABA1042", name: "SK SUNGAI WANGI" },
  { code: "ABA1043", name: "SK LUMUT" },
  { code: "ABA1044", name: "SK KG LUMUT" },
  { code: "ABA1050", name: "SK SERI PANGKOR" },
  { code: "ABA1051", name: "SK SERI SITIAWAN" },
  { code: "ABA1052", name: "SK SERI SAMUDERA" },
  { code: "ABA1053", name: "SK SERI SERDANG" },
  { code: "ABC1061", name: "SJKC HWA LIAN 1" },
  { code: "ABC1062", name: "SJKC HWA LIAN 2" },
  { code: "ABC1063", name: "SJKC SIMPANG LIMA" },
  { code: "AEA1070", name: "SMK CONVENT" },
  { code: "AEA1071", name: "SMK TOK PERDANA" },
  { code: "AEA1072", name: "SMK RAJA SHAHRIMAN" },
  { code: "AEA1073", name: "SMK AMBROSE" },
  { code: "AFT1080", name: "SABK MAAHAD ISLAHIAH ADDINIAH" },
  { code: "ABA1031", name: "SK PANGKALAN TLDM II" },
];

function codes(queries: string[]) {
  return matchSchoolLines(queries, schools).map((row) =>
    row.status === "matched" ? row.school.code : row.status,
  );
}

test("splits pasted school names and ignores blank lines", () => {
  assert.deepEqual(parseSchoolListQuery("SK BERUAS\n\n  SK LUMUT  \n"), ["SK BERUAS", "SK LUMUT"]);
  assert.equal(isSchoolListQuery("SK BERUAS"), false);
  assert.equal(isSchoolListQuery("SK BERUAS\nSK LUMUT"), true);
});

test("matches short names, long prefixes, and school codes", () => {
  assert.deepEqual(codes(["HWA LIAN 1", "SJK (C) HWA LIAN 2", "AEA1071", "Sekolah Kebangsaan Beruas"]), [
    "ABC1061",
    "ABC1062",
    "AEA1071",
    "ABA1040",
  ]);
});

test("keeps similar school names distinct", () => {
  assert.deepEqual(codes(["SK SERI SITIAWAN", "SK SERI SAMUDERA", "SK LUMUT"]), [
    "ABA1051",
    "ABA1052",
    "ABA1043",
  ]);
});

test("asks for a choice when the short name hits more than one school", () => {
  const [hwaLian, seri] = matchSchoolLines(["HWA LIAN", "SERI"], schools);
  assert.equal(hwaLian.status, "ambiguous");
  if (hwaLian.status === "ambiguous") {
    assert.deepEqual(
      hwaLian.schools.map((school) => school.code).sort(),
      ["ABC1061", "ABC1062"],
    );
  }
  assert.equal(seri.status, "ambiguous");
});

test("matches a mixed short-and-long pasted reminder list uniquely", () => {
  assert.deepEqual(
    codes([
      "SK BERUAS",
      "SK PANCHOR",
      "SK SUNGAI WANGI",
      "SK LUMUT",
      "SK SERI PANGKOR",
      "SK SERI SITIAWAN",
      "SK SERI SAMUDERA",
      "SK SERI SERDANG",
      "SJKC HWA LIAN 1",
      "SJKC HWA LIAN 2",
      "SJKC SIMPANG LIMA",
      "SMK CONVENT",
      "SMK TOK PERDANA",
      "SMK RAJA SHAHRIMAN",
      "SMK AMBROSE",
      "SABK MAAHAD ISLAHIAH ADDINIAH",
    ]),
    [
      "ABA1040",
      "ABA1041",
      "ABA1042",
      "ABA1043",
      "ABA1050",
      "ABA1051",
      "ABA1052",
      "ABA1053",
      "ABC1061",
      "ABC1062",
      "ABC1063",
      "AEA1070",
      "AEA1071",
      "AEA1072",
      "AEA1073",
      "AFT1080",
    ],
  );
});

test("marks unknown names unmatched and keeps TLDM II as roman numerals", () => {
  assert.deepEqual(codes(["SK TIDAK WUJUD", "SK PANGKALAN TLDM II"]), ["unmatched", "ABA1031"]);
});
