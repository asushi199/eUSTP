import assert from "node:assert/strict";
import test from "node:test";
import {
  loadEquipmentLoanFormData,
  type EquipmentLoanFormLoaders,
} from "../../lib/peralatan/loan-form-data";

test("loads equipment loan form data one query group at a time", async () => {
  const started: string[] = [];
  const loaders: EquipmentLoanFormLoaders<string[], string[], string[]> = {
    listCatalog: async () => {
      started.push("catalog");
      return ["laptop"];
    },
    listPkgs: async () => {
      assert.deepEqual(started, ["catalog"]);
      started.push("pkgs");
      return ["sitiawan"];
    },
    listSchools: async () => {
      assert.deepEqual(started, ["catalog", "pkgs"]);
      started.push("schools");
      return ["ABA1001"];
    },
  };

  const result = await loadEquipmentLoanFormData(loaders);

  assert.deepEqual(started, ["catalog", "pkgs", "schools"]);
  assert.deepEqual(result, {
    items: ["laptop"],
    pkgs: ["sitiawan"],
    schools: ["ABA1001"],
  });
});
