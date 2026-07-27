import assert from "node:assert/strict";
import test from "node:test";
import {
  loadEquipmentAdminPageData,
  type EquipmentAdminPageLoaders,
} from "../../lib/peralatan/admin-page-data";

test("loads equipment admin data one query group at a time", async () => {
  const started: string[] = [];
  const loaders: EquipmentAdminPageLoaders<string[], string[], string[], string[]> = {
    listPkgs: async () => {
      started.push("pkgs");
      return ["beruas"];
    },
    listCatalog: async () => {
      assert.deepEqual(started, ["pkgs"]);
      started.push("catalog");
      return ["projector"];
    },
    listUnits: async (pkgId) => {
      assert.equal(pkgId, "beruas");
      assert.deepEqual(started, ["pkgs", "catalog"]);
      started.push("units");
      return ["unit-1"];
    },
    listLoans: async (pkgId) => {
      assert.equal(pkgId, "beruas");
      assert.deepEqual(started, ["pkgs", "catalog", "units"]);
      started.push("loans");
      return ["loan-1"];
    },
  };

  const result = await loadEquipmentAdminPageData("beruas", loaders);

  assert.deepEqual(started, ["pkgs", "catalog", "units", "loans"]);
  assert.deepEqual(result, {
    pkgs: ["beruas"],
    catalog: ["projector"],
    units: ["unit-1"],
    loans: ["loan-1"],
  });
});
